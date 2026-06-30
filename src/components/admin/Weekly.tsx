"use client";
import { useApi } from "@/lib/client/useApi";
import type { ListResult, Member } from "@/lib/client/types";

export function Weekly() {
  const { data, loading } = useApi<ListResult<Member>>("/api/v1/members");
  const rows = data?.items ?? [];

  return (
    <div className="panel active">
      <div className="panel-head">
        <div>
          <h2>주간 현황</h2>
          <p>이번 주 길드 스킬 인증 현황입니다.</p>
        </div>
      </div>
      <div className="card table-card">
        <table className="table">
          <thead>
            <tr>
              <th>닉네임</th>
              <th>직급</th>
              <th>상태</th>
              <th>이번 주 횟수</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="empty">
                  불러오는 중…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty">
                  등록된 멤버가 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((m) => (
                <tr key={m.id}>
                  <td>
                    <b>{m.nick}</b>
                  </td>
                  <td>{m.attributes?.rank || "-"}</td>
                  <td>
                    {m.weekCount > 0 ? (
                      <span className="badge ok">인증 완료</span>
                    ) : (
                      <span className="badge no">미인증</span>
                    )}
                  </td>
                  <td>{m.weekCount}회</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
