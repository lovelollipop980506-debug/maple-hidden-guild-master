import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/respond";
import { can } from "@/lib/rbac";
import { listForms, createForm } from "@/lib/services/forms";

// List forms. Admins can include inactive with ?all=1.
export const GET = withAuth(
  async (_req, { session, url }) => {
    const includeInactive = url.searchParams.get("all") === "1" && can(session.user.tier, "forms.manage");
    return ok(await listForms({ includeInactive }));
  },
  { capability: "forms.view" },
);

// Create a form (form builder) — admin.
export const POST = withAuth(
  async (req, { session }) => {
    const body = await req.json().catch(() => ({}));
    return ok(await createForm(body, session.user.discordId), { status: 201 });
  },
  { capability: "forms.manage" },
);
