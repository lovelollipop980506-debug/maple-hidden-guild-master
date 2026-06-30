import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/respond";
import { setUserBlocked } from "@/lib/services/submissions";

// 디스코드 계정 차단/해제. body: { blocked: boolean, reason?: string }
export const POST = withAuth(
  async (req, { session, params }) => {
    const body = await req.json().catch(() => ({}));
    return ok(await setUserBlocked(params.id, session.user.discordId, !!body.blocked, body.reason ?? ""));
  },
  { capability: "members.manage" },
);
