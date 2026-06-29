import { requireCapability } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";

type Attachment = { url: string; filename: string };

export default async function MessagesPage() {
  await requireCapability("messages.view");
  const { data: messages } = await supabaseAdmin()
    .from("messages")
    .select("id, channel_id, author_name, content, attachments, image_url, discord_created_at")
    .order("discord_created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">채팅 로그</h1>
      <p className="text-sm text-zinc-500">
        디스코드 채널에서 5분마다 수집된 최근 메시지입니다 (최대 200건).
      </p>

      {!messages?.length && (
        <p className="text-sm text-zinc-500">
          아직 수집된 메시지가 없습니다. (봇 토큰/채널 설정과 예약 함수 동작을 확인하세요.)
        </p>
      )}

      <div className="space-y-2">
        {messages?.map((m) => {
          const atts = (m.attachments ?? []) as Attachment[];
          return (
            <div key={m.id} className="card">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span className="font-medium text-zinc-300">{m.author_name}</span>
                <span>{new Date(m.discord_created_at).toLocaleString("ko-KR")}</span>
              </div>
              {m.content && <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-100">{m.content}</p>}
              {m.image_url && (
                <a href={m.image_url} target="_blank" className="mt-2 inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.image_url}
                    alt="첨부 이미지"
                    className="max-h-64 rounded border border-zinc-700"
                  />
                </a>
              )}
              {atts.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {atts.map((a, i) => (
                    <a
                      key={i}
                      href={a.url}
                      target="_blank"
                      className="text-xs text-discord-blurple hover:underline"
                    >
                      📎 {a.filename}
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
