import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/respond";
import { getBootstrapStatus } from "@/lib/services/setup";

// 부트스트랩 상태(봇이 운영 길드에 있는지). 로그인만 필요 — 봇 초대 게이트용.
export const GET = withAuth(async () => ok(await getBootstrapStatus()));
