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
  // 운영 길드 잠금(단일 테넌트 고정). 설정되면 부트스트랩 자동감지를 끄고 이 길드로만
  // 동작 → 다른 길드로 부트스트랩/셋업/탈취 불가. 길드 ID는 비-시크릿이라 납품 fail-safe
  // 기본값을 박아 둔다(누가 app_config를 비워도 잠금은 유지). env(GUILD_ID)로 덮어쓰기 가능.
  lockedGuildId: process.env.GUILD_ID ?? "1519043102512513124",
  // 슈퍼유저 디스코드 ID 목록(콤마 구분). 가입/역할 여부와 무관하게 항상 길드 마스터(admin).
  // env로만 관리(소스 하드코딩 X). 예: SUPERUSER_DISCORD_IDS=123,456
  superuserIds: (process.env.SUPERUSER_DISCORD_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
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
