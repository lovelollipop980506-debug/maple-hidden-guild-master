import type { DefaultSession } from "next-auth";
import type { Tier } from "@/lib/rbac";

declare module "next-auth" {
  interface Session {
    accessToken?: string; // Discord OAuth access token (server-side use: 봇 초대 대상 조회)
    user: {
      discordId: string;
      tier: Tier;
      roles: string[];
      isOwner: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    discordId?: string;
    tier?: Tier;
    roles?: string[];
    isOwner?: boolean;
    accessToken?: string;
  }
}
