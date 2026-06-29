import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/respond";
import { getMember } from "@/lib/services/members";

export const GET = withAuth(
  async (_req, { params }) => ok(await getMember(params.discordId)),
  { capability: "members.view" },
);
