import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/respond";
import { getBootstrapStatus } from "@/lib/services/setup";

// 부트스트랩 상태(봇 초대 여부 + 이 사용자의 초대 권한). 로그인만 필요 — 봇 초대 게이트용.
export const GET = withAuth(async (_req, { session }) => ok(await getBootstrapStatus(session.accessToken)));
