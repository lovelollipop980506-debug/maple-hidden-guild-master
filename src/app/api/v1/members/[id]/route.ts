import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/respond";
import { getMember, updateMember, deleteMember } from "@/lib/services/members";

export const GET = withAuth(async (_req, { params }) => ok(await getMember(params.id)), {
  capability: "members.view",
});

export const PUT = withAuth(
  async (req, { session, params }) => {
    const body = await req.json().catch(() => ({}));
    return ok(await updateMember(params.id, { nick: body.nick, attributes: body.attributes }, session.user.discordId));
  },
  { capability: "members.manage" },
);

export const DELETE = withAuth(async (_req, { params }) => ok(await deleteMember(params.id)), {
  capability: "members.manage",
});
