import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/respond";
import { getInviteInfo } from "@/lib/services/invite";

// 봇 초대 대상(사용자가 관리하는 서버) + 초대 링크. 로그인하면 누구나.
export const GET = withAuth(async (_req, { session }) => ok(await getInviteInfo(session.accessToken)), {
  capability: "config.read",
});
