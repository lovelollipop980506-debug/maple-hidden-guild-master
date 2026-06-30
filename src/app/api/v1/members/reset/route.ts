import { withAuth } from "@/lib/api/guard";
import { ok, ApiError } from "@/lib/api/respond";
import { resetWeekly, resetAllProgress } from "@/lib/services/members";

// 주간 인증 초기화 또는 전체 누적 초기화. body: { scope: "weekly" | "all" }
export const POST = withAuth(
  async (req, { session }) => {
    const body = await req.json().catch(() => ({}));
    if (body.scope === "all") return ok(await resetAllProgress(session.user.discordId));
    if (body.scope === "weekly") return ok(await resetWeekly(session.user.discordId));
    throw new ApiError("invalid", "scope는 weekly 또는 all 이어야 합니다.");
  },
  { capability: "members.manage" },
);
