import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/respond";
import { getConfig } from "@/lib/config";

export const GET = withAuth(
  async () => {
    const c = await getConfig();
    return ok({ setupCompleted: c.setupCompleted, guildId: c.guildId, guildName: c.guildName });
  },
  { capability: "config.read" },
);
