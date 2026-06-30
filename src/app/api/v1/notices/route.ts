import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/respond";
import { can } from "@/lib/rbac";
import { listNotices, createNotice } from "@/lib/services/notices";

// 공지 목록. 운영자는 ?all=1 로 비활성 포함.
export const GET = withAuth(
  async (_req, { session, url }) => {
    const includeInactive = url.searchParams.get("all") === "1" && can(session.user.tier, "notices.manage");
    return ok(await listNotices({ includeInactive }));
  },
  { capability: "notices.view" },
);

export const POST = withAuth(
  async (req, { session }) => {
    const body = await req.json().catch(() => ({}));
    return ok(
      await createNotice({ title: body.title, body: body.body, noticeDate: body.noticeDate }, session.user.discordId),
      { status: 201 },
    );
  },
  { capability: "notices.manage" },
);
