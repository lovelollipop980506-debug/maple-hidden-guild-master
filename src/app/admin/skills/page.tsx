import { requireCapability } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import ReviewControls from "@/components/ReviewControls";
import { reviewSkill } from "./actions";

export default async function SkillsReviewPage() {
  await requireCapability("skills.review");
  const { data: subs } = await supabaseAdmin()
    .from("skill_verifications")
    .select("id, user_id, skill, points, note, evidence_url, created_at, users:user_id(username, global_name)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">스킬 인증 검토</h1>
      {!subs?.length && <p className="text-sm text-zinc-500">검토 대기 중인 인증이 없습니다.</p>}

      <div className="space-y-4">
        {subs?.map((s) => {
          const user = (s.users ?? {}) as { username?: string; global_name?: string };
          return (
            <div key={s.id} className="card">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white">
                  {s.skill} <span className="text-discord-blurple">+{s.points}p</span>
                </h2>
                <span className="text-xs text-zinc-500">
                  {user.global_name || user.username} · {new Date(s.created_at).toLocaleString("ko-KR")}
                </span>
              </div>
              {s.note && <p className="mt-1 text-sm text-zinc-400">{s.note}</p>}
              {s.evidence_url && (
                <a href={s.evidence_url} target="_blank" className="mt-2 inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.evidence_url}
                    alt="증빙"
                    className="max-h-48 rounded border border-zinc-700"
                  />
                </a>
              )}
              <ReviewControls action={reviewSkill.bind(null, s.id)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
