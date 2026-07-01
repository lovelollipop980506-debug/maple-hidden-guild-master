import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/respond";
import { postCertPanel } from "@/lib/services/setup";

// 인증 채널에 "스킬업 인증하기" 버튼 메시지 게시. body: { channelId?: string }
// 권한(서버 관리)은 서비스에서 확인.
export const POST = withAuth(async (req, { session }) => {
  const body = await req.json().catch(() => ({}));
  return ok(await postCertPanel(session.user.discordId, body.channelId));
});
