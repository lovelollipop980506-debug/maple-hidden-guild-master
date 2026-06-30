/**
 * Centralized server-side SECRETS only.
 *
 * Discord integration *settings* (guild, channels, role mappings) are NOT here —
 * they live in the DB and are managed via the /setup bootstrap (see lib/config.ts).
 * Only values that must be provisioned out-of-band (API credentials) stay in env.
 */

function required(name: string): string {
  const v = process.env[name];
  if (!v && process.env.NODE_ENV === "production") {
    console.error(`[env] Missing required env var: ${name}`);
  }
  return v ?? "";
}

export const env = {
  discord: {
    clientId: required("DISCORD_CLIENT_ID"), // also the Application ID
    clientSecret: required("DISCORD_CLIENT_SECRET"),
    botToken: required("DISCORD_BOT_TOKEN"),
    // Ed25519 public key for verifying Interactions webhook requests.
    // Developer Portal → your app → General Information → Public Key.
    publicKey: required("DISCORD_PUBLIC_KEY"),
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    evidenceBucket: process.env.SUPABASE_EVIDENCE_BUCKET ?? "evidence",
  },
};
