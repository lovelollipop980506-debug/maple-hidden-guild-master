"use client";
import { useApi } from "@/lib/client/useApi";
import { useIsMobile } from "@/lib/client/useIsMobile";
import { apiPost, ApiError } from "@/lib/client/api";
import { toast } from "@/lib/client/toast";
import { SKILL_LABELS } from "@/lib/client/maple";
import { Loading } from "@/components/Loading";
import { AsyncButton } from "@/components/AsyncButton";
import type { ListResult, ReviewSubmission } from "@/lib/client/types";

function fmt(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function Pending() {
  const { data, loading, reload } = useApi<ListResult<ReviewSubmission>>(
    "/api/v1/submissions?formKey=skill_cert&status=pending",
  );
  const rows = data?.items ?? [];
  const mobile = useIsMobile();

  if (loading && !data) return <Loading />;

  async function decide(id: string, decision: "approved" | "rejected") {
    try {
      await apiPost(`/api/v1/submissions/${id}/review`, { decision });
      toast(decision === "approved" ? "승인 완료" : "거절 처리 완료");
      await reload(); // 목록 갱신까지 기다려 스피너 타이밍 정확히
    } catch (e) {
      const err = e as ApiError;
      toast(err.message);
      if (err.status === 404) await reload();
    }
  }

  return (
    <div className="panel active">
      <div className="panel-head">
        <div>
          <h2>인증 대기</h2>
          <p>제출된 길드 스킬 인증을 검토합니다. 승인하면 해당 멤버의 길드 스킬에 반영됩니다.</p>
        </div>
      </div>

      {mobile ? (
        <div className="m-list">
          {rows.length === 0 ? (
            <div className="card empty" style={{ padding: 24 }}>
              승인 대기 없음
            </div>
          ) : (
            rows.map((r) => {
              const a = r.answers as Record<string, any>;
              const nick = a.nick || a.author_name || "-";
              const img = a.evidence || a.image_url;
              return (
                <div key={r.id} className="m-item">
                  <div className="m-item-head">
                    <div style={{ minWidth: 0 }}>
                      <div className="m-item-title">{nick}</div>
                      <div className="m-item-sub">
                        {SKILL_LABELS[a.skill] || a.skill || "-"} · {a.count ?? "-"}회 · {fmt(r.created_at)}
                      </div>
                    </div>
                    {img && <img className="shot" src={img} alt="증빙" onClick={() => window.open(img, "_blank")} />}
                  </div>
                  {a.memo && (
                    <div className="m-item-sub" style={{ marginTop: 8 }}>
                      메모: {a.memo}
                    </div>
                  )}
                  <div className="m-item-actions">
                    <AsyncButton className="small-btn approve" onClick={() => decide(r.id, "approved")}>
                      승인
                    </AsyncButton>
                    <AsyncButton className="small-btn reject" onClick={() => decide(r.id, "rejected")}>
                      거절
                    </AsyncButton>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
      <div className="card table-card">
        <table className="table">
          <thead>
            <tr>
              <th>닉네임</th>
              <th>스킬</th>
              <th>횟수</th>
              <th>날짜</th>
              <th>이미지</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty">
                  승인 대기 없음
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const a = r.answers as Record<string, any>;
                const nick = a.nick || a.author_name || "-";
                const img = a.evidence || a.image_url;
                return (
                  <tr key={r.id}>
                    <td>
                      <b>{nick}</b>
                      {a.memo && <div style={{ fontSize: 12, color: "#777" }}>{a.memo}</div>}
                    </td>
                    <td>{SKILL_LABELS[a.skill] || a.skill || "-"}</td>
                    <td>{a.count ?? "-"}회</td>
                    <td>{fmt(r.created_at)}</td>
                    <td>
                      {img ? (
                        <img className="shot" src={img} alt="증빙" onClick={() => window.open(img, "_blank")} />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      <div className="admin-actions">
                        <AsyncButton className="small-btn approve" onClick={() => decide(r.id, "approved")}>
                          승인
                        </AsyncButton>
                        <AsyncButton className="small-btn reject" onClick={() => decide(r.id, "rejected")}>
                          거절
                        </AsyncButton>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
