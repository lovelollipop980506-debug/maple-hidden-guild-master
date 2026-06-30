import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/respond";
import { syncFromDiscord } from "@/lib/services/members";

// 디스코드 길드 멤버를 로스터로 동기화.
export const POST = withAuth(async (_req, { session }) => ok(await syncFromDiscord(session.user.discordId)), {
  capability: "members.manage",
});
