import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/respond";
import { getStats } from "@/lib/services/stats";

export const GET = withAuth(async () => ok(await getStats()), { capability: "stats.view" });
