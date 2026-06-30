"use client";
import { useApi } from "@/lib/client/useApi";
import { apiPost, ApiError } from "@/lib/client/api";
import { toast } from "@/lib/client/toast";
import { ROUTE_LABELS } from "@/lib/client/maple";
import { Loading } from "@/components/Loading";
import type { ListResult, ReviewSubmission } from "@/lib/client/types";

function fmt(iso: string) {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

export function Applications() {
  const { data, loading, reload } = useApi<ListResult<ReviewSubmission>>("/api/v1/submissions?formKey=join");
  const rows = data?.items ?? [];

  if (loading && !data) return <Loading />;

  async function decide(id: string, decision: "approved" | "rejected") {
    try {
      await apiPost(`/api/v1/submissions/${id}/review`, { decision });
      toast(decision === "approved" ? "가입 승인했습니다" : "가입 신청을 반려했습니다");
      reload();
    } catch (e) {
      toast((e as ApiError).message);
    }
  }

  return (
    <div className="panel active">
      <div className="panel-head">
        <div>
          <h2>가입 신청</h2>
          <p>외부 가입 신청서로 접수된 신청을 검토합니다. 승인하면 멤버로 등록됩니다.</p>
        </div>
      </div>
      <div className="card table-card">
        <table className="table">
          <thead>
            <tr>
              <th>신청일</th>
              <th>디스코드</th>
              <th>닉네임</th>
              <th>직업</th>
              <th>레벨</th>
              <th>가입 경로</th>
              <th>각오</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty">
                  접수된 가입 신청이 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const a = r.answers as Record<string, any>;
                return (
                  <tr key={r.id}>
                    <td>{fmt(r.created_at)}</td>
                    <td>
                      <span className="discord-tag">{a.discord || "-"}</span>
                    </td>
                    <td>
                      <b>{a.nick}</b>
                    </td>
                    <td>{a.job || "-"}</td>
                    <td>{a.level ?? "-"}</td>
                    <td>{ROUTE_LABELS[a.route] || a.route || "-"}</td>
                    <td className="app-intro" title={a.intro || ""}>
                      {a.intro || "-"}
                    </td>
                    <td>
                      {r.status === "pending" ? (
                        <div className="admin-actions">
                          <button className="small-btn approve" onClick={() => decide(r.id, "approved")}>
                            승인
                          </button>
                          <button className="small-btn reject" onClick={() => decide(r.id, "rejected")}>
                            반려
                          </button>
                        </div>
                      ) : r.status === "approved" ? (
                        <span className="badge ok">승인</span>
                      ) : (
                        <span className="badge no">반려</span>
                      )}
                    </td>
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
