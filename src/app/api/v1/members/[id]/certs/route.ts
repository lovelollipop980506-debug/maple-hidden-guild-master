import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/respond";
import { addManualCert } from "@/lib/services/members";

// 특정 멤버에 스킬업 인증 수기 등록. body: { skill, count, memo? }. 운영진 이상.
export const POST = withAuth(
  async (req, { session, params }) => {
    const body = await req.json().catch(() => ({}));
    return ok(await addManualCert(session.user.discordId, params.id, body));
  },
  { capability: "members.manage" },
);
