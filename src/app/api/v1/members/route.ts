import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/respond";
import { listMembers } from "@/lib/services/members";

// 길드원 목록 (검색 q / 인증상태 cert=done|none). 계산값이라 읽기 전용.
export const GET = withAuth(
  async (_req, { url }) =>
    ok(
      await listMembers({
        q: url.searchParams.get("q") ?? undefined,
        cert: url.searchParams.get("cert") ?? undefined,
      }),
    ),
  { capability: "members.view" },
);
