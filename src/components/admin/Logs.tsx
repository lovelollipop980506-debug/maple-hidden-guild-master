"use client";
import { useApi } from "@/lib/client/useApi";
import { SKILL_LABELS } from "@/lib/client/maple";
import { Loading } from "@/components/Loading";
import type { ListResult, AuditEntry } from "@/lib/client/types";

function fmt(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 액션 키 → 사람이 읽는 라벨/색.
const ACTION: Record<string, { label: string; tone: "ok" | "no" | "info" }> = {
  "submission.approved": { label: "제출 승인", tone: "ok" },
  "submission.rejected": { label: "제출 반려", tone: "no" },
  "submission.create": { label: "제출 접수", tone: "info" },
  "member.cert_add": { label: "인증 수기 등록", tone: "ok" },
  "member.delete": { label: "멤버 삭제", tone: "no" },
  "user.block": { label: "계정 차단", tone: "no" },
  "user.unblock": { label: "차단 해제", tone: "info" },
  "setup.save": { label: "설정 저장", tone: "info" },
  "setup.cert_panel": { label: "인증 버튼 게시", tone: "info" },
};

/** audit_log의 detail을 한 줄 설명으로. */
function describe(e: AuditEntry): string {
  const d = e.detail ?? {};
  const nick = (d.nick as string) || (e.target_id ?? "");
  switch (e.action) {
    case "member.cert_add": {
      const skill = SKILL_LABELS[d.skill as string] || (d.skill as string) || "";
      return `${nick} · ${skill} ${d.count ?? ""}회`;
    }
    case "member.delete":
      return `${nick}`;
    case "user.block":
      return `${nick}${d.reason ? ` · ${d.reason}` : ""}`.trim() || (e.target_id ?? "");
    case "user.unblock":
      return nick || (e.target_id ?? "");
    case "submission.approved":
    case "submission.rejected":
      return `${(d.form as string) ?? ""}${d.note ? ` · ${d.note}` : ""}`.trim();
    case "setup.cert_panel":
      return "인증 채널에 버튼 게시";
    default:
      return e.target_id ?? "";
  }
}

export function Logs() {
  const { data, loading } = useApi<ListResult<AuditEntry>>("/api/v1/audit?limit=200");
  const rows = data?.items ?? [];

  if (loading && !data) return <Loading />;

  return (
    <div className="panel active">
      <div className="panel-head">
        <div>
          <h2>운영 로그</h2>
          <p>승인·반려·차단·멤버 삭제·수기 인증 등록·설정 변경 등 모든 운영 활동 기록입니다.</p>
        </div>
      </div>
      <div className="card table-card">
        <table className="table">
          <thead>
            <tr>
              <th>시각</th>
              <th>작업</th>
              <th>내용</th>
              <th>담당</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty">
                  로그 없음
                </td>
              </tr>
            ) : (
              rows.map((e) => {
                const meta = ACTION[e.action] ?? { label: e.action, tone: "info" as const };
                return (
                  <tr key={e.id}>
                    <td>{fmt(e.created_at)}</td>
                    <td>
                      <span className={`badge ${meta.tone === "info" ? "wait" : meta.tone}`}>{meta.label}</span>
                    </td>
                    <td>{describe(e) || "-"}</td>
                    <td>{e.actorNick || (e.actor_id ? "(삭제된 사용자)" : "시스템")}</td>
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
