"use client";
import { Fragment, useState } from "react";
import { useApi } from "@/lib/client/useApi";
import { SKILL_KEYS, SKILL_LABELS, TIER_LABELS } from "@/lib/client/maple";
import type { ListResult, GuildMember } from "@/lib/client/types";
import { Loading } from "@/components/Loading";

export function Directory() {
  const [q, setQ] = useState("");
  const [cert, setCert] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (cert) params.set("cert", cert);
  const { data, loading } = useApi<ListResult<GuildMember>>(`/api/v1/members?${params.toString()}`);
  const rows = data?.items ?? [];

  if (loading && !data) return <Loading />;

  return (
    <div className="panel active">
      <div className="panel-head">
        <div>
          <h2>길드원</h2>
          <p>디스코드 역할을 가진 로그인 길드원입니다. 누적·이번 주 인증은 승인된 제출에서 자동 계산됩니다.</p>
        </div>
      </div>

      <div className="filters">
        <div className="search">
          <input className="input" placeholder="닉네임·직업 검색" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="select" value={cert} onChange={(e) => setCert(e.target.value)}>
          <option value="">전체 인증 상태</option>
          <option value="done">인증 완료</option>
          <option value="none">미인증</option>
        </select>
      </div>

      <div className="card table-card admin-table-wrap" style={{ marginTop: 14 }}>
        <table className="table admin-member-table">
          <thead>
            <tr>
              <th>닉네임</th>
              <th>등급</th>
              <th>레벨</th>
              <th>직업</th>
              <th>이번 주 인증</th>
              <th>누적 스킬업</th>
              <th>가입 일자</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty">
                  길드원이 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((m) => {
                const isOpen = open === m.discordId;
                return (
                  <Fragment key={m.discordId}>
                    <tr className="member-main-row" onClick={() => setOpen(isOpen ? null : m.discordId)}>
                      <td className="nick">
                        <b>{m.nick}</b>
                      </td>
                      <td>
                        <span className="badge role">{TIER_LABELS[m.tier] ?? m.tier}</span>
                      </td>
                      <td>
                        <b>{m.level ?? "-"}</b>
                      </td>
                      <td>{m.job || "-"}</td>
                      <td>
                        {m.weekCount > 0 ? (
                          <span className="badge ok">인증 완료 {m.weekCount}회</span>
                        ) : (
                          <span className="badge no">미인증</span>
                        )}
                      </td>
                      <td>
                        <b>{m.totalSkills}회</b>
                      </td>
                      <td className="join-date">{m.joinedAt ? m.joinedAt.slice(0, 10) : "-"}</td>
                    </tr>
                    {isOpen && (
                      <tr className="member-detail-row">
                        <td colSpan={7}>
                          <div className="member-detail" style={{ gridTemplateColumns: "1fr" }}>
                            <div>
                              <div className="detail-title">길드 스킬</div>
                              <div className="guild-skill-list">
                                {SKILL_KEYS.map((k) => {
                                  const v = Math.max(0, Math.min(20, Number(m.skills?.[k] || 0)));
                                  return (
                                    <div key={k} className="guild-skill-line">
                                      <span>{SKILL_LABELS[k]}</span>
                                      <div className="skill-track">
                                        <div className="skill-fill" style={{ width: v * 5 + "%" }} />
                                      </div>
                                      <b>{v}/20</b>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
