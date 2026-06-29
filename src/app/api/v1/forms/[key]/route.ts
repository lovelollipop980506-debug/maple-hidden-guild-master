import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/respond";
import { getForm, updateForm, setFormActive } from "@/lib/services/forms";

export const GET = withAuth(async (_req, { params }) => ok(await getForm(params.key)), {
  capability: "forms.view",
});

export const PUT = withAuth(
  async (req, { session, params }) => {
    const body = await req.json().catch(() => ({}));
    return ok(await updateForm(params.key, body, session.user.discordId));
  },
  { capability: "forms.manage" },
);

// Soft-delete = deactivate.
export const DELETE = withAuth(
  async (_req, { session, params }) => ok(await setFormActive(params.key, false, session.user.discordId)),
  { capability: "forms.manage" },
);
