import { withAuth } from "@/lib/api/guard";
import { ok, pagination } from "@/lib/api/respond";
import { listAuditLog } from "@/lib/services/audit";

// 운영 로그(감사 기록). 운영진 이상.
export const GET = withAuth(
  async (_req, { url }) => {
    const { limit, offset } = pagination(url);
    return ok(await listAuditLog({ limit, offset }));
  },
  { capability: "members.view" },
);
