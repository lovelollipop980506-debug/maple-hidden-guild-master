import type { DefaultSession } from "next-auth";
import type { Tier } from "@/lib/rbac";

declare module "next-auth" {
  interface Session {
    user: {
      discordId: string;
      tier: Tier;
      roles: string[];
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    discordId?: string;
    tier?: Tier;
    roles?: string[];
  }
}
