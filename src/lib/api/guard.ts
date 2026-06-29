import type { Session } from "next-auth";
import { auth } from "@/auth";
import { can, type Capability, type Tier } from "@/lib/rbac";
import { ApiError, fail } from "@/lib/api/respond";

export type ApiContext = {
  session: Session;
  params: Record<string, string>;
  url: URL;
};

type ApiHandler = (req: Request, ctx: ApiContext) => Promise<Response> | Response;

type RouteCtx = { params?: Promise<Record<string, string>> | Record<string, string> };

/**
 * Wrap a route handler with auth + capability checks and uniform error handling.
 *
 *   export const GET = withAuth(async (req, { session, params }) => ok(...), {
 *     capability: "members.view",
 *   });
 *
 * - No session         -> 401
 * - Missing capability -> 403
 * - ApiError thrown    -> its (code, message, status)
 * - Anything else      -> 500
 */
export function withAuth(handler: ApiHandler, opts: { capability?: Capability } = {}) {
  return async (req: Request, routeCtx?: RouteCtx): Promise<Response> => {
    const session = await auth();
    if (!session?.user?.discordId) {
      return fail("unauthorized", "로그인이 필요합니다.", 401);
    }
    if (opts.capability && !can(session.user.tier as Tier, opts.capability)) {
      return fail("forbidden", "권한이 없습니다.", 403);
    }

    const params = routeCtx?.params ? await routeCtx.params : {};

    try {
      return await handler(req, { session, params, url: new URL(req.url) });
    } catch (e) {
      if (e instanceof ApiError) return fail(e.code, e.message, e.status);
      console.error("[api] unhandled error:", e);
      return fail("internal", "서버 오류가 발생했습니다.", 500);
    }
  };
}
