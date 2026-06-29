import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/respond";
import { getSetupOptions } from "@/lib/services/setup";

// Auth required; the service performs the owner / Manage-Server check.
export const GET = withAuth(async (_req, { session }) => ok(await getSetupOptions(session.user.discordId)));
