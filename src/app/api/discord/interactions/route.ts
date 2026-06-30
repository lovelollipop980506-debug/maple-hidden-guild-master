import { env } from "@/lib/env";
import { ApiError } from "@/lib/api/respond";
import { getForm } from "@/lib/services/forms";
import { submitDiscordForm } from "@/lib/services/submissions";
import {
  InteractionType,
  CallbackType,
  OPEN_PREFIX,
  SUBMIT_PREFIX,
  verifyInteraction,
  ephemeralReply,
  buildModal,
  collectSubmitted,
} from "@/lib/discord-interactions";

// Discord requires the raw body for signature verification, so this must run on
// the Node runtime (not edge) and never be statically cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Interaction = {
  type: number;
  data?: { custom_id?: string };
  member?: { user?: { id: string; username: string; global_name?: string | null } };
  user?: { id: string; username: string; global_name?: string | null };
};

export async function POST(req: Request) {
  const raw = await req.text();
  const ok = verifyInteraction(
    env.discord.publicKey,
    req.headers.get("x-signature-ed25519"),
    req.headers.get("x-signature-timestamp"),
    raw,
  );
  if (!ok) return new Response("invalid request signature", { status: 401 });

  const body = JSON.parse(raw) as Interaction;

  // 1) PING → PONG (endpoint health check from Discord).
  if (body.type === InteractionType.PING) {
    return Response.json({ type: CallbackType.PONG });
  }

  // 2) Button click → open the form's modal.
  if (body.type === InteractionType.MESSAGE_COMPONENT) {
    const cid = body.data?.custom_id ?? "";
    if (cid.startsWith(OPEN_PREFIX)) {
      const form = await getForm(cid.slice(OPEN_PREFIX.length)).catch(() => null);
      if (!form || !form.active) return Response.json(ephemeralReply("이 양식은 현재 사용할 수 없어요."));
      return Response.json(buildModal(form));
    }
  }

  // 3) Modal submit → store as a submission for review.
  if (body.type === InteractionType.MODAL_SUBMIT) {
    const cid = body.data?.custom_id ?? "";
    if (cid.startsWith(SUBMIT_PREFIX)) {
      const author = body.member?.user ?? body.user;
      if (!author) return Response.json(ephemeralReply("제출자를 확인할 수 없어요."));
      const authorName = author.global_name || author.username;
      try {
        await submitDiscordForm(cid.slice(SUBMIT_PREFIX.length), author.id, authorName, collectSubmitted(body.data));
        return Response.json(ephemeralReply("✅ 제출됐어요. 검토 후 반영됩니다."));
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : "제출 처리 중 오류가 발생했어요.";
        return Response.json(ephemeralReply(msg));
      }
    }
  }

  return Response.json(ephemeralReply("처리할 수 없는 요청이에요."));
}
