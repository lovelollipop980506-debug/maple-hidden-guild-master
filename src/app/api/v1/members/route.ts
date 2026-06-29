import { withAuth } from "@/lib/api/guard";
import { ok, pagination } from "@/lib/api/respond";
import { listMembers } from "@/lib/services/members";

export const GET = withAuth(
  async (_req, { url }) => {
    const { limit, offset } = pagination(url);
    const sort = url.searchParams.get("sort") ?? "points";
    return ok(await listMembers({ limit, offset, sort }));
  },
  { capability: "members.view" },
);
