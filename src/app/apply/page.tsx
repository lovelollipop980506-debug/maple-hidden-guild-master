import { requireUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import ApplyForm from "./ApplyForm";

const STATUS_LABEL: Record<string, string> = {
  pending: "검토 대기",
  approved: "승인됨",
  rejected: "반려됨",
};

export default async function ApplyPage() {
  const session = await requireUser();
  const { data: apps } = await supabaseAdmin()
    .from("applications")
    .select("id, status, review_note, created_at, reviewed_at")
    .eq("applicant_id", session.user.discordId)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">가입 신청서</h1>

      <ApplyForm />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">내 신청 내역</h2>
        {!apps?.length && <p className="text-sm text-zinc-500">아직 신청 내역이 없습니다.</p>}
        {apps?.map((a) => (
          <div key={a.id} className="card flex items-center justify-between">
            <div>
              <span className="badge bg-zinc-700 text-zinc-200">{STATUS_LABEL[a.status] ?? a.status}</span>
              <span className="ml-3 text-sm text-zinc-400">
                {new Date(a.created_at).toLocaleString("ko-KR")}
              </span>
              {a.review_note && (
                <p className="mt-1 text-sm text-zinc-400">사유: {a.review_note}</p>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
