import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/respond";
import { listMemberNicks } from "@/lib/services/members";

// 닉네임 목록(인증 페이지 선택용). 상세 정보 없음.
export const GET = withAuth(async () => ok(await listMemberNicks()), { capability: "members.nicks" });
