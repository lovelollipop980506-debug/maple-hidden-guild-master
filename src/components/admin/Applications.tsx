"use client";
import { useApi } from "@/lib/client/useApi";
import { apiPost, ApiError } from "@/lib/client/api";
import { toast } from "@/lib/client/toast";
import { Loading } from "@/components/Loading";
import { AsyncButton } from "@/components/AsyncButton";
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
      reload(); // 사이드바 stats 는 api 클라이언트가 공통 재검증
    } catch (e) {
      const err = e as ApiError;
      toast(err.message);
      if (err.status === 404) reload(); // 이미 처리된 항목 → 목록 새로고침으로 자기보정
    }
  }

  async function toggleBlock(userId: string, name: string, blocked: boolean) {
    if (blocked && !confirm(`${name} 계정의 가입 신청을 차단할까요? (대기 중인 신청은 반려 처리됩니다)`)) return;
    const reason = blocked ? prompt("차단 사유 (선택)") ?? "" : "";
    try {
      await apiPost(`/api/v1/users/${userId}/block`, { blocked, reason });
      toast(blocked ? "계정을 차단했습니다" : "차단을 해제했습니다");
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
              <th>레벨</th>
              <th>직업</th>
              <th>스공</th>
              <th>보공</th>
              <th>방무</th>
              <th>접속 시간대</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="empty">
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
                      <span className="discord-tag">{r.user?.guild_nick || r.user?.global_name || r.user?.username || "-"}</span>
                      {r.user?.blocked && <span className="badge no" style={{ marginLeft: 6 }}>차단됨</span>}
                    </td>
                    <td>
                      <b>{a.nick}</b>
                    </td>
                    <td>{a.level ?? "-"}</td>
                    <td>{a.job || "-"}</td>
                    <td>{a.stat_attack ?? "-"}</td>
                    <td>{a.boss ?? "-"}</td>
                    <td>{a.ignore ?? "-"}</td>
                    <td>{a.playtime || "-"}</td>
                    <td>
                      <div className="admin-actions">
                        {r.status === "pending" ? (
                          <>
                            <AsyncButton className="small-btn approve" onClick={() => decide(r.id, "approved")}>
                              승인
                            </AsyncButton>
                            <AsyncButton className="small-btn reject" onClick={() => decide(r.id, "rejected")}>
                              반려
                            </AsyncButton>
                          </>
                        ) : r.status === "approved" ? (
                          <span className="badge ok">승인</span>
                        ) : (
                          <span className="badge no" title={r.review_note || undefined}>
                            반려{r.review_note ? ` · ${r.review_note}` : ""}
                          </span>
                        )}
                        {r.user_id && (
                          <AsyncButton
                            className="small-btn block"
                            onClick={() =>
                              toggleBlock(
                                r.user_id!,
                                r.user?.guild_nick || r.user?.global_name || r.user?.username || "이 계정",
                                !r.user?.blocked,
                              )
                            }
                          >
                            {r.user?.blocked ? "차단 해제" : "차단"}
                          </AsyncButton>
                        )}
                      </div>
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
