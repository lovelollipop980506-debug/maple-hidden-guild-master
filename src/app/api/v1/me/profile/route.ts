import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/respond";
import { updateProfile } from "@/lib/services/me";

// Update own Maple character profile (character name / level / job).
export const PUT = withAuth(
  async (req, { session }) => {
    const body = await req.json().catch(() => ({}));
    return ok(
      await updateProfile(session.user.discordId, {
        characterName: body.characterName,
        level: body.level,
        job: body.job,
      }),
    );
  },
  { capability: "me.update" },
);
