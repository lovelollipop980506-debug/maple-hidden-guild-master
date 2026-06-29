import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/respond";
import { adjustPoints } from "@/lib/services/members";

// Manual point adjustment — admin only.
export const POST = withAuth(
  async (req, { session, params }) => {
    const body = await req.json().catch(() => ({}));
    return ok(
      await adjustPoints(params.discordId, Number(body.delta), String(body.reason ?? ""), session.user.discordId),
    );
  },
  { capability: "members.adjustPoints" },
);
