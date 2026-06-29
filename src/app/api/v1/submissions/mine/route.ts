import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/respond";
import { listMySubmissions } from "@/lib/services/submissions";

export const GET = withAuth(
  async (_req, { session }) => ok(await listMySubmissions(session.user.discordId)),
  { capability: "submissions.mine" },
);
