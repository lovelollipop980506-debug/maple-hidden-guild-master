import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { env } from "@/lib/env";
import { getGuildMemberRoles } from "@/lib/discord";
import { resolveTier, type Tier } from "@/lib/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";

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
        const roles = await getGuildMemberRoles(account.access_token);
        const tier = resolveTier(roles);

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
      }
      return token;
    },
    async session({ session, token }) {
      session.user.discordId = (token.discordId as string) ?? "";
      session.user.tier = (token.tier as Tier) ?? "guest";
      session.user.roles = (token.roles as string[]) ?? [];
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
