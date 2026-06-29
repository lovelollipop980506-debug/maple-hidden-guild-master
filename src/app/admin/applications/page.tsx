import { requireCapability } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import ReviewControls from "@/components/ReviewControls";
import { reviewApplication } from "./actions";

export default async function ApplicationsReviewPage() {
  await requireCapability("applications.review");
  const { data: apps } = await supabaseAdmin()
    .from("applications")
    .select("id, applicant_id, form, created_at, users:applicant_id(username, global_name)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">가입 신청서 검토</h1>
      {!apps?.length && <p className="text-sm text-zinc-500">검토 대기 중인 신청서가 없습니다.</p>}

      <div className="space-y-4">
        {apps?.map((a) => {
          const form = (a.form ?? {}) as Record<string, string>;
          const user = (a.users ?? {}) as { username?: string; global_name?: string };
          return (
            <div key={a.id} className="card">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white">
                  {form.character_name || "(캐릭터명 없음)"}
                </h2>
                <span className="text-xs text-zinc-500">
                  {user.global_name || user.username} · {new Date(a.created_at).toLocaleString("ko-KR")}
                </span>
              </div>
              <dl className="mt-2 space-y-1 text-sm text-zinc-300">
                {form.playtime && <div>플레이 시간대: {form.playtime}</div>}
                {form.referral && <div>가입 경로: {form.referral}</div>}
                {form.introduction && <div className="text-zinc-400">소개: {form.introduction}</div>}
              </dl>
              <ReviewControls action={reviewApplication.bind(null, a.id)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
