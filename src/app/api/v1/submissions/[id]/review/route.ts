import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/respond";
import { reviewSubmission } from "@/lib/services/submissions";

export const POST = withAuth(
  async (req, { session, params }) => {
    const body = await req.json().catch(() => ({}));
    return ok(await reviewSubmission(params.id, session.user.discordId, body.decision, body.note ?? ""));
  },
  { capability: "submissions.review" },
);
