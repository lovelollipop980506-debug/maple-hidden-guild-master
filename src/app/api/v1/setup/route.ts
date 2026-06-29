import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/respond";
import { saveSetup } from "@/lib/services/setup";

// Auth required; the service performs the owner / Manage-Server check.
export const PUT = withAuth(async (req, { session }) => {
  const body = await req.json().catch(() => ({}));
  return ok(await saveSetup(session.user.discordId, body));
});
