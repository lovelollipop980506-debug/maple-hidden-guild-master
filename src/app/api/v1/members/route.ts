import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/respond";
import { listMembers, createMember } from "@/lib/services/members";

// 길드원 목록 (검색 q / 직급 rank / 인증상태 cert=done|none)
export const GET = withAuth(
  async (_req, { url }) => {
    return ok(
      await listMembers({
        q: url.searchParams.get("q") ?? undefined,
        rank: url.searchParams.get("rank") ?? undefined,
        cert: url.searchParams.get("cert") ?? undefined,
      }),
    );
  },
  { capability: "members.view" },
);

// 멤버 추가
export const POST = withAuth(
  async (req, { session }) => {
    const body = await req.json().catch(() => ({}));
    return ok(await createMember({ nick: body.nick, attributes: body.attributes }, session.user.discordId), {
      status: 201,
    });
  },
  { capability: "members.manage" },
);
