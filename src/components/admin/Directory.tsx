"use client";
import { Fragment, useState } from "react";
import { useApi } from "@/lib/client/useApi";
import { SKILL_KEYS, SKILL_LABELS, RANKS } from "@/lib/client/maple";
import type { ListResult, Member } from "@/lib/client/types";

function rankDot(rank?: string) {
  const c = rank === "길드마스터" ? "#e0a32e" : rank === "부마스터" ? "#2f85ef" : "#9aa6b2";
  return <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: c }} />;
}

export function Directory() {
  const [q, setQ] = useState("");
  const [rank, setRank] = useState("");
  const [cert, setCert] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (rank) params.set("rank", rank);
  if (cert) params.set("cert", cert);
  const { data, loading } = useApi<ListResult<Member>>(`/api/v1/members?${params.toString()}`);
  const rows = data?.items ?? [];

  return (
    <div className="panel active">
      <div className="panel-head">
        <div>
          <h2>길드원 조회</h2>
          <p>길드원 행을 클릭하면 보공·방무·스공과 길드 스킬 현황이 펼쳐집니다.</p>
        </div>
      </div>

      <div className="filters">
        <div className="search">
          <input className="input" placeholder="닉네임·직업 검색" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="select" value={rank} onChange={(e) => setRank(e.target.value)}>
          <option value="">전체 직급</option>
          {RANKS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
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
              <th>직급</th>
              <th>닉네임</th>
              <th>레벨</th>
              <th>직업</th>
              <th>이번 주 인증</th>
              <th>누적 스킬업</th>
              <th>가입 일자</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="empty">
                  불러오는 중…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty">
                  검색 결과가 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((m) => {
                const a = m.attributes || {};
                const isOpen = open === m.id;
                return (
                  <Fragment key={m.id}>
                    <tr className="member-main-row" onClick={() => setOpen(isOpen ? null : m.id)}>
                      <td className="rank-icon">{rankDot(a.rank)}</td>
                      <td className="nick">
                        <b>{m.nick}</b>
                        <span>{a.rank || ""}</span>
                      </td>
                      <td>
                        <b>{a.level ?? "-"}</b>
                      </td>
                      <td>{a.job || "-"}</td>
                      <td>
                        {m.weekCount > 0 ? (
                          <span className="badge ok">인증 완료</span>
                        ) : (
                          <span className="badge no">미인증</span>
                        )}
                      </td>
                      <td>
                        <b>{m.totalSkills}회</b>
                      </td>
                      <td className="join-date">{a.joinDate || "-"}</td>
                    </tr>
                    {isOpen && (
                      <tr className="member-detail-row">
                        <td colSpan={7}>
                          <div className="member-detail">
                            <div>
                              <div className="detail-title">능력치</div>
                              <div className="ability-list">
                                <div className="ability-line">
                                  <span>보스 공격력</span>
                                  <b>{a.boss ?? 0}%</b>
                                </div>
                                <div className="ability-line">
                                  <span>방어율 무시</span>
                                  <b>{a.ignore ?? 0}%</b>
                                </div>
                                <div className="ability-line">
                                  <span>스공</span>
                                  <b>{a.power ? a.power.toLocaleString() + "만" : "-"}</b>
                                </div>
                              </div>
                            </div>
                            <div>
                              <div className="detail-title">길드 스킬</div>
                              <div className="guild-skill-list">
                                {SKILL_KEYS.map((k) => {
                                  const v = Math.max(0, Math.min(20, Number(a.skills?.[k] || 0)));
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
