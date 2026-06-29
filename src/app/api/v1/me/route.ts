import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/respond";
import { getMe } from "@/lib/services/me";

export const GET = withAuth(async (_req, { session }) => ok(await getMe(session)), {
  capability: "me.read",
});
