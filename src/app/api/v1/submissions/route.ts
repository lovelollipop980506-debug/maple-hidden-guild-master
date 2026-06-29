import { withAuth } from "@/lib/api/guard";
import { ok, pagination } from "@/lib/api/respond";
import { listSubmissionsForReview } from "@/lib/services/submissions";

// All submissions for review, with optional filters (?formKey=&status=&source=).
// source=discord gives the ingested-chat review queue.
export const GET = withAuth(
  async (_req, { url }) => {
    const { limit, offset } = pagination(url);
    return ok(
      await listSubmissionsForReview({
        formKey: url.searchParams.get("formKey") ?? undefined,
        status: url.searchParams.get("status") ?? undefined,
        source: url.searchParams.get("source") ?? undefined,
        limit,
        offset,
      }),
    );
  },
  { capability: "submissions.review" },
);
