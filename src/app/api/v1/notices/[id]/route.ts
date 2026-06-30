import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/respond";
import { updateNotice, deleteNotice } from "@/lib/services/notices";

export const PUT = withAuth(
  async (req, { params }) => {
    const body = await req.json().catch(() => ({}));
    return ok(
      await updateNotice(params.id, {
        title: body.title,
        body: body.body,
        noticeDate: body.noticeDate,
        active: body.active,
        sort: body.sort,
      }),
    );
  },
  { capability: "notices.manage" },
);

export const DELETE = withAuth(async (_req, { params }) => ok(await deleteNotice(params.id)), {
  capability: "notices.manage",
});
