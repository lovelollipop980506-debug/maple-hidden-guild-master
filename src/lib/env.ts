/**
 * Centralized, server-side environment access.
 * Throws early (in dev) when a required value is missing so misconfiguration
 * surfaces immediately rather than as a confusing runtime error later.
 */

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    // Don't hard-crash the whole build in CI where some secrets may be absent;
    // log loudly and return empty so pages still render with a clear error.
    if (process.env.NODE_ENV === "production") {
      console.error(`[env] Missing required env var: ${name}`);
    }
    return "";
  }
  return v;
}

function list(name: string): string[] {
  return (process.env[name] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const env = {
  discord: {
    clientId: required("DISCORD_CLIENT_ID"),
    clientSecret: required("DISCORD_CLIENT_SECRET"),
    botToken: required("DISCORD_BOT_TOKEN"),
    guildId: required("DISCORD_GUILD_ID"),
    sourceChannelIds: list("DISCORD_SOURCE_CHANNEL_IDS"),
    notifyChannelId: process.env.DISCORD_NOTIFY_CHANNEL_ID ?? "",
    approvedMemberRoleId: process.env.DISCORD_APPROVED_MEMBER_ROLE_ID ?? "",
  },
  roles: {
    admin: list("DISCORD_ADMIN_ROLE_IDS"),
    reviewer: list("DISCORD_REVIEWER_ROLE_IDS"),
    member: list("DISCORD_MEMBER_ROLE_IDS"),
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    evidenceBucket: process.env.SUPABASE_EVIDENCE_BUCKET ?? "evidence",
  },
};
