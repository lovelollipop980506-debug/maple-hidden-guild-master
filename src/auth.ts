import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { env } from "@/lib/env";
import {
  getGuildMemberRoles,
  getGuildOwnerId,
  getGuildRoles,
  getManageableGuilds,
  getMemberRoles,
  getBotGuilds,
} from "@/lib/discord";
import { getConfig } from "@/lib/config";
import { computePermissions, hasAdmin } from "@/lib/permissions";
import { resolveTier, type Tier } from "@/lib/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";

// 등급 재검증 주기(ms). 스테일 JWT(로그인 시점 등급)가 잠금 길드 기준과 어긋나면 보정.
const TIER_REVALIDATE_MS = 10 * 60 * 1000;

/**
 * Auth.js (NextAuth v5) configuration.
 *
 * Flow:
 *  - User signs in with Discord (scopes: identify, guilds, guilds.members.read).
 *  - On first sign-in we use their access token to read their roles in our guild,
 *    resolve an app `tier` via RBAC, and upsert the user row in Supabase.
 *  - tier/roles/discordId are persisted in the JWT and exposed on the session.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Discord({
      clientId: env.discord.clientId,
      clientSecret: env.discord.clientSecret,
      authorization:
        "https://discord.com/api/oauth2/authorize?scope=identify+guilds+guilds.members.read",
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Runs with `account` only on the initial sign-in.
      if (account?.access_token && profile) {
        const discordId = profile.id as string;
        const config = await getConfig();

        // 운영 길드 결정: 설정된 guildId. 설정 전(부트스트랩)이면 사용자가 소유/관리하는
        // 봇 길드를 자동 감지 → 소유자/Administrator 가 setup 없이도 admin 으로 진입.
        let guildId = config.guildId;
        if (!guildId) {
          const manageable = await getManageableGuilds(discordId);
          if (manageable.length) guildId = manageable[0].id;
        }

        let roles: string[] = [];
        let isAdminByDiscord = false; // owner or Administrator permission
        if (guildId) {
          roles = await getGuildMemberRoles(account.access_token, guildId);
          const ownerId = await getGuildOwnerId(guildId);
          const isOwner = !!ownerId && ownerId === discordId;
          const guildRoles = await getGuildRoles(guildId);
          isAdminByDiscord = hasAdmin(computePermissions(roles, guildRoles, guildId, isOwner));
        }
        const tier = resolveTier(
          roles,
          { admin: config.adminRoleIds, reviewer: config.reviewerRoleIds, member: config.memberRoleIds },
          isAdminByDiscord,
        );

        const username = (profile.username as string) ?? "unknown";
        const globalName = (profile.global_name as string | null) ?? null;
        const avatar = (profile.avatar as string | null) ?? null;

        // Upsert the user record (best-effort; auth still works if DB is down).
        try {
          await supabaseAdmin()
            .from("users")
            .upsert(
              {
                discord_id: discordId,
                username,
                global_name: globalName,
                avatar,
                roles,
                tier,
                last_login: new Date().toISOString(),
              },
              { onConflict: "discord_id" },
            );
        } catch (e) {
          console.error("[auth] failed to upsert user:", e);
        }

        token.discordId = discordId;
        token.tier = tier;
        token.roles = roles;
        token.isOwner = isAdminByDiscord;
        token.accessToken = account.access_token;
        token.tierCheckedAt = Date.now();
        return token;
      }

      // 리프레시 경로(account 없음): 잠금 길드 기준으로 등급을 주기적으로 재검증한다.
      // 봇 토큰으로 조회하므로 사용자 access token 만료와 무관. 봇이 길드에 없으면(부트스트랩
      // 전) 누구도 멤버로 식별될 수 없으니 guest 로 강등 → 스테일 admin 세션이 권한 유지 못함.
      const did = token.discordId as string | undefined;
      const checkedAt = (token.tierCheckedAt as number | undefined) ?? 0;
      if (did && Date.now() - checkedAt > TIER_REVALIDATE_MS) {
        try {
          const config = await getConfig();
          const guildId = config.guildId; // 잠금 설정 시 항상 운영 길드
          let tier: Tier = "guest";
          let roles: string[] = [];
          let isOwner = false;
          if (guildId) {
            const bots = await getBotGuilds();
            if (bots.some((g) => g.id === guildId)) {
              roles = (await getMemberRoles(guildId, did)) ?? [];
              const ownerId = await getGuildOwnerId(guildId);
              const guildRoles = await getGuildRoles(guildId);
              isOwner = hasAdmin(computePermissions(roles, guildRoles, guildId, !!ownerId && ownerId === did));
              tier = resolveTier(
                roles,
                { admin: config.adminRoleIds, reviewer: config.reviewerRoleIds, member: config.memberRoleIds },
                isOwner,
              );
            }
          }
          token.tier = tier;
          token.roles = roles;
          token.isOwner = isOwner;
          token.tierCheckedAt = Date.now();
        } catch (e) {
          console.error("[auth] tier revalidation failed:", e);
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.discordId = (token.discordId as string) ?? "";
      session.user.tier = (token.tier as Tier) ?? "guest";
      session.user.roles = (token.roles as string[]) ?? [];
      session.user.isOwner = (token.isOwner as boolean) ?? false;
      session.accessToken = token.accessToken as string | undefined;
      return session;
    },
  },
});
