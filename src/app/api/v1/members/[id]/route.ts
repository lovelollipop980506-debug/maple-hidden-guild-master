import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/respond";
import { deleteMember } from "@/lib/services/members";

// 멤버 삭제(로스터 제거 + 제출 이력 삭제). 운영진 이상.
export const DELETE = withAuth(
  async (_req, { session, params }) => ok(await deleteMember(session.user.discordId, params.id)),
  { capability: "members.manage" },
);
