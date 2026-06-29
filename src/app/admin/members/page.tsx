import { requireCapability } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";

const TIER_LABEL: Record<string, string> = {
  admin: "관리자",
  reviewer: "운영자",
  member: "멤버",
  guest: "게스트",
};
const STATUS_LABEL: Record<string, string> = {
  none: "-",
  applied: "신청함",
  approved: "가입됨",
  rejected: "반려됨",
};

export default async function MembersPage() {
  await requireCapability("members.manage");
  const { data: members } = await supabaseAdmin()
    .from("users")
    .select("discord_id, username, global_name, tier, total_points, member_status, last_login")
    .order("total_points", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">멤버 관리</h1>
        <span className="text-sm text-zinc-400">총 {members?.length ?? 0}명</span>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-700 text-zinc-400">
            <tr>
              <th className="px-4 py-3">멤버</th>
              <th className="px-4 py-3">등급</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3 text-right">포인트</th>
              <th className="px-4 py-3">최근 로그인</th>
            </tr>
          </thead>
          <tbody>
            {members?.map((m) => (
              <tr key={m.discord_id} className="border-b border-zinc-800 last:border-0">
                <td className="px-4 py-3 text-white">{m.global_name || m.username}</td>
                <td className="px-4 py-3">
                  <span className="badge bg-zinc-700 text-zinc-200">{TIER_LABEL[m.tier] ?? m.tier}</span>
                </td>
                <td className="px-4 py-3 text-zinc-300">{STATUS_LABEL[m.member_status] ?? m.member_status}</td>
                <td className="px-4 py-3 text-right font-medium text-discord-blurple">{m.total_points}</td>
                <td className="px-4 py-3 text-zinc-500">
                  {m.last_login ? new Date(m.last_login).toLocaleString("ko-KR") : "-"}
                </td>
              </tr>
            ))}
            {!members?.length && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                  아직 로그인한 멤버가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
