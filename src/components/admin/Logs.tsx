"use client";
import { useApi } from "@/lib/client/useApi";
import { SKILL_LABELS } from "@/lib/client/maple";
import type { ListResult, ReviewSubmission } from "@/lib/client/types";

function fmt(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function Logs() {
  const { data, loading } = useApi<ListResult<ReviewSubmission>>(
    "/api/v1/submissions?formKey=skill_cert&status=approved",
  );
  const rows = data?.items ?? [];

  return (
    <div className="panel active">
      <div className="panel-head">
        <div>
          <h2>승인 로그</h2>
          <p>승인된 길드 스킬 인증 기록입니다.</p>
        </div>
      </div>
      <div className="card table-card">
        <table className="table">
          <thead>
            <tr>
              <th>날짜</th>
              <th>닉네임</th>
              <th>스킬</th>
              <th>횟수</th>
              <th>메모</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="empty">
                  불러오는 중…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty">
                  로그 없음
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const a = r.answers as Record<string, any>;
                return (
                  <tr key={r.id}>
                    <td>{fmt(r.created_at)}</td>
                    <td>
                      <b>{a.nick || a.author_name || "-"}</b>
                    </td>
                    <td>{SKILL_LABELS[a.skill] || a.skill || "-"}</td>
                    <td>{a.count ?? "-"}회</td>
                    <td>{a.memo || ""}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
