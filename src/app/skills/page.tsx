import { requireCapability } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import SkillForm from "./SkillForm";
import { StatusBadge } from "@/components/StatusBadge";

export default async function SkillsPage() {
  const session = await requireCapability("skills.submit");
  const db = supabaseAdmin();

  const [{ data: subs }, { data: user }] = await Promise.all([
    db
      .from("skill_verifications")
      .select("id, skill, points, status, review_note, evidence_url, created_at")
      .eq("user_id", session.user.discordId)
      .order("created_at", { ascending: false }),
    db.from("users").select("total_points").eq("discord_id", session.user.discordId).maybeSingle(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">스킬 포인트 인증</h1>
        <span className="badge bg-discord-blurple text-white">
          내 포인트: {user?.total_points ?? 0}
        </span>
      </div>

      <SkillForm />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">내 인증 내역</h2>
        {!subs?.length && <p className="text-sm text-zinc-500">아직 인증 내역이 없습니다.</p>}
        {subs?.map((s) => (
          <div key={s.id} className="card flex items-center justify-between">
            <div>
              <span className="font-medium text-white">{s.skill}</span>
              <span className="ml-2 text-sm text-zinc-400">+{s.points}p</span>
              <span className="ml-3 text-xs text-zinc-500">
                {new Date(s.created_at).toLocaleString("ko-KR")}
              </span>
              {s.review_note && <p className="mt-1 text-sm text-zinc-400">사유: {s.review_note}</p>}
            </div>
            <div className="flex items-center gap-3">
              {s.evidence_url && (
                <a href={s.evidence_url} target="_blank" className="text-xs text-discord-blurple hover:underline">
                  증빙
                </a>
              )}
              <StatusBadge status={s.status} />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
