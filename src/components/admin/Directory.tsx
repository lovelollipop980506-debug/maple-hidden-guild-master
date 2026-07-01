"use client";
import { Fragment, useState } from "react";
import { useApi } from "@/lib/client/useApi";
import { useIsMobile } from "@/lib/client/useIsMobile";
import { apiPost, apiDelete, ApiError } from "@/lib/client/api";
import { toast } from "@/lib/client/toast";
import { SKILL_KEYS, SKILL_LABELS, TIER_LABELS } from "@/lib/client/maple";
import type { ListResult, GuildMember } from "@/lib/client/types";
import { Loading } from "@/components/Loading";
import { AsyncButton } from "@/components/AsyncButton";

export function Directory() {
  const [q, setQ] = useState("");
  const [cert, setCert] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  // 수기 인증 입력 (열린 멤버 기준)
  const [skill, setSkill] = useState<string>(SKILL_KEYS[0]);
  const [count, setCount] = useState("");
  const [memo, setMemo] = useState("");

  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (cert) params.set("cert", cert);
  const { data, loading, reload } = useApi<ListResult<GuildMember>>(`/api/v1/members?${params.toString()}`);
  const rows = data?.items ?? [];
  const mobile = useIsMobile();

  if (loading && !data) return <Loading />;

  function toggle(id: string) {
    setOpen((prev) => (prev === id ? null : id));
    setCount("");
    setMemo("");
    setSkill(SKILL_KEYS[0]);
  }

  async function addCert(discordId: string) {
    const c = Number(count);
    if (!Number.isInteger(c) || c < 1 || c > 20) return toast("스킬업 횟수는 1~20 사이로 입력하세요");
    try {
      await apiPost(`/api/v1/members/${discordId}/certs`, { skill, count: c, memo });
      toast("스킬업 인증을 등록했습니다");
      setCount("");
      setMemo("");
      reload();
    } catch (e) {
      toast((e as ApiError).message);
    }
  }

  async function removeMember(discordId: string, nick: string) {
    if (!confirm(`${nick} 님을 삭제할까요?\n제출 이력도 함께 삭제되며 되돌릴 수 없습니다.`)) return;
    try {
      await apiDelete(`/api/v1/members/${discordId}`);
      toast("멤버를 삭제했습니다");
      setOpen(null);
      reload();
    } catch (e) {
      toast((e as ApiError).message);
    }
  }

  // 멤버 상세(길드 스킬 + 수기 인증 + 삭제) — 표/카드 공용.
  function detail(m: GuildMember) {
    return (
      <div className="member-detail" style={{ gridTemplateColumns: "1fr", gap: 18 }}>
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

        <div>
          <div className="detail-title">스킬업 인증 수기 등록</div>
          <div className="manual-cert">
            <select className="select" value={skill} onChange={(e) => setSkill(e.target.value)}>
              {SKILL_KEYS.map((k) => (
                <option key={k} value={k}>
                  {SKILL_LABELS[k]}
                </option>
              ))}
            </select>
            <input
              className="input"
              type="text"
              inputMode="numeric"
              placeholder="횟수 1~20"
              value={count}
              onChange={(e) => setCount(e.target.value.replace(/\D/g, "").slice(0, 2))}
            />
            <input
              className="input"
              placeholder="메모 (선택)"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
            <AsyncButton className="small-btn approve" onClick={() => addCert(m.discordId)}>
              등록
            </AsyncButton>
          </div>
          <p className="tiny" style={{ marginTop: 6 }}>
            승인된 인증으로 즉시 누적·이번 주 현황에 반영됩니다. (증빙 불요)
          </p>
        </div>

        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
          <AsyncButton className="reset-btn" onClick={() => removeMember(m.discordId, m.nick)}>
            멤버 삭제
          </AsyncButton>
          <span className="tiny" style={{ marginLeft: 10 }}>
            로스터에서 제거하고 제출 이력도 삭제합니다. (되돌릴 수 없음)
          </span>
        </div>
      </div>
    );
  }

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

      {mobile ? (
        <div className="m-list" style={{ marginTop: 14 }}>
          {rows.length === 0 ? (
            <div className="card empty" style={{ padding: 24 }}>
              길드원이 없습니다.
            </div>
          ) : (
            rows.map((m) => {
              const isOpen = open === m.discordId;
              return (
                <div key={m.discordId} className="m-item">
                  <div className="m-item-head" onClick={() => toggle(m.discordId)}>
                    <div style={{ minWidth: 0 }}>
                      <div className="m-item-title">
                        {m.nick}
                        <span className="badge role" style={{ marginLeft: 6 }}>
                          {TIER_LABELS[m.tier] ?? m.tier}
                        </span>
                      </div>
                      <div className="m-item-sub">
                        Lv.{m.level ?? "-"} · {m.job || "-"} · 누적 {m.totalSkills}회
                      </div>
                    </div>
                    <span className="m-chip">
                      {m.weekCount > 0 ? `인증 ${m.weekCount}` : "미인증"} {isOpen ? "▲" : "▼"}
                    </span>
                  </div>
                  {isOpen && <div style={{ marginTop: 12 }}>{detail(m)}</div>}
                </div>
              );
            })
          )}
        </div>
      ) : (
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
                      <tr className="member-main-row" onClick={() => toggle(m.discordId)}>
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
                          <td colSpan={7}>{detail(m)}</td>
                        </tr>
                      )}
                    </Fragment>
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
