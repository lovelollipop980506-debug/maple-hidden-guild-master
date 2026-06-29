import { requireCapability } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { TopPointsChart, StatusPieChart } from "./StatsCharts";

async function count(table: string, filter?: (q: any) => any) {
  const db = supabaseAdmin();
  let q = db.from(table).select("*", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count } = await q;
  return count ?? 0;
}

export default async function StatsPage() {
  await requireCapability("stats.view");
  const db = supabaseAdmin();

  const [
    totalMembers,
    approvedMembers,
    pendingApps,
    pendingSkills,
    totalMessages,
    appsApproved,
    appsRejected,
    appsPending,
    topRows,
    ledgerRows,
  ] = await Promise.all([
    count("users"),
    count("users", (q) => q.eq("member_status", "approved")),
    count("applications", (q) => q.eq("status", "pending")),
    count("skill_verifications", (q) => q.eq("status", "pending")),
    count("messages"),
    count("applications", (q) => q.eq("status", "approved")),
    count("applications", (q) => q.eq("status", "rejected")),
    count("applications", (q) => q.eq("status", "pending")),
    db.from("users").select("username, global_name, total_points").order("total_points", { ascending: false }).limit(5),
    db.from("point_ledger").select("delta"),
  ]);

  const topPoints = (topRows.data ?? []).map((u) => ({
    name: u.global_name || u.username,
    points: u.total_points,
  }));
  const totalPointsAwarded = (ledgerRows.data ?? []).reduce((s, r) => s + (r.delta as number), 0);

  const appStatus = [
    { name: "승인", value: appsApproved },
    { name: "반려", value: appsRejected },
    { name: "대기", value: appsPending },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">통계</h1>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi label="전체 멤버" value={totalMembers} />
        <Kpi label="가입 멤버" value={approvedMembers} />
        <Kpi label="대기 신청" value={pendingApps} />
        <Kpi label="대기 인증" value={pendingSkills} />
        <Kpi label="누적 포인트" value={totalPointsAwarded} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 font-semibold text-white">포인트 상위 멤버</h2>
          <TopPointsChart data={topPoints} />
        </div>
        <div className="card">
          <h2 className="mb-4 font-semibold text-white">가입 신청 현황</h2>
          <StatusPieChart data={appStatus} />
        </div>
      </section>

      <p className="text-sm text-zinc-500">수집된 채팅 메시지: {totalMessages.toLocaleString()}건</p>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="card">
      <div className="text-sm text-zinc-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-white">{value.toLocaleString()}</div>
    </div>
  );
}
