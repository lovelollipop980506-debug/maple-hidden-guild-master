import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/respond";
import { getDiscordMeta } from "@/lib/services/setup";

// Guild channels + roles, for the form builder (discord-intake channel, grant role).
export const GET = withAuth(async () => ok(await getDiscordMeta()), { capability: "discord.meta" });
