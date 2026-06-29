import { withAuth } from "@/lib/api/guard";
import { ok, pagination } from "@/lib/api/respond";
import { submitForm, listSubmissionsForReview } from "@/lib/services/submissions";

// Submit a web form (multipart/form-data). Login required; per-form min tier
// is enforced inside the service.
export const POST = withAuth(
  async (req, { session, params }) => {
    const form = await req.formData();
    return ok(await submitForm(params.key, session.user.discordId, session.user.tier, form), { status: 201 });
  },
  { capability: "submissions.submit" },
);

// List this form's submissions for review.
export const GET = withAuth(
  async (_req, { url, params }) => {
    const { limit, offset } = pagination(url);
    const status = url.searchParams.get("status") ?? undefined;
    const source = url.searchParams.get("source") ?? undefined;
    return ok(await listSubmissionsForReview({ formKey: params.key, status, source, limit, offset }));
  },
  { capability: "submissions.review" },
);
