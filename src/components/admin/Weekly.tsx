"use client";
import { useApi } from "@/lib/client/useApi";
import { TIER_LABELS } from "@/lib/client/maple";
import type { ListResult, GuildMember } from "@/lib/client/types";
import { Loading } from "@/components/Loading";

export function Weekly() {
  const { data, loading } = useApi<ListResult<GuildMember>>("/api/v1/members");
  const rows = data?.items ?? [];

  if (loading && !data) return <Loading />;

  return (
    <div className="panel active">
      <div className="panel-head">
        <div>
          <h2>주간 현황</h2>
          <p>이번 주(월요일 0시 기준) 길드 스킬 인증 현황입니다. 자동 계산.</p>
        </div>
      </div>
      <div className="card table-card">
        <table className="table">
          <thead>
            <tr>
              <th>닉네임</th>
              <th>등급</th>
              <th>상태</th>
              <th>이번 주 횟수</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty">
                  길드원이 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((m) => (
                <tr key={m.discordId}>
                  <td>
                    <b>{m.nick}</b>
                  </td>
                  <td>{TIER_LABELS[m.tier] ?? m.tier}</td>
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
