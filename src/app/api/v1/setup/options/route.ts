import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/respond";
import { getSetupOptions } from "@/lib/services/setup";

// Auth required; the service performs the owner / Manage-Server check.
// ?guildId= 로 다른 (관리 가능한) 서버의 채널/역할을 조회.
export const GET = withAuth(async (_req, { session, url }) =>
  ok(await getSetupOptions(session.user.discordId, url.searchParams.get("guildId") ?? undefined)),
);
