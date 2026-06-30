"use client";
import { useState } from "react";
import { useApi } from "@/lib/client/useApi";
import { apiPost, apiPut, apiDelete, ApiError } from "@/lib/client/api";
import { toast } from "@/lib/client/toast";
import { SKILL_KEYS, SKILL_LABELS, RANKS } from "@/lib/client/maple";
import type { ListResult, Member, MemberAttributes } from "@/lib/client/types";

const num = (v: string) => Number(v) || 0;
const clamp = (v: string) => Math.max(0, Math.min(20, Number(v) || 0));

type Draft = {
  id?: string;
  nick: string;
  rank: string;
  job: string;
  level: string;
  joinDate: string;
  boss: string;
  ignore: string;
  power: string;
  skills: Record<string, string>;
};

function toDraft(m?: Member): Draft {
  const a = (m?.attributes || {}) as MemberAttributes;
  const s = a.skills || {};
  return {
    id: m?.id,
    nick: m?.nick || "",
    rank: a.rank || "일반길드원",
    job: a.job || "",
    level: String(a.level ?? ""),
    joinDate: a.joinDate || new Date().toISOString().slice(0, 10),
    boss: String(a.boss ?? ""),
    ignore: String(a.ignore ?? ""),
    power: String(a.power ?? ""),
    skills: Object.fromEntries(SKILL_KEYS.map((k) => [k, String(s[k] ?? 0)])),
  };
}

export function Members() {
  const { data, loading, reload } = useApi<ListResult<Member>>("/api/v1/members");
  const rows = data?.items ?? [];
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);

  async function reset(scope: "weekly" | "all") {
    const msg =
      scope === "weekly"
        ? "이번 주 인증 상태를 모든 멤버 미인증으로 초기화할까요? (승인 로그는 보존)"
        : "모든 멤버의 누적 길드 스킬과 이번 주 인증 상태를 0으로 초기화할까요?";
    if (!window.confirm(msg)) return;
    try {
      await apiPost("/api/v1/members/reset", { scope });
      toast("초기화했습니다");
      reload();
    } catch (e) {
      toast((e as ApiError).message);
    }
  }

  async function del(m: Member) {
    if (!window.confirm(`"${m.nick}" 멤버를 삭제할까요?`)) return;
    try {
      await apiDelete(`/api/v1/members/${m.id}`);
      toast("멤버를 삭제했습니다");
      reload();
    } catch (e) {
      toast((e as ApiError).message);
    }
  }

  async function save() {
    if (!draft) return;
    if (!draft.nick.trim()) return toast("닉네임을 입력하세요");
    const attributes: MemberAttributes = {
      rank: draft.rank,
      job: draft.job.trim(),
      level: num(draft.level),
      joinDate: draft.joinDate,
      boss: num(draft.boss),
      ignore: num(draft.ignore),
      power: num(draft.power),
      skills: Object.fromEntries(SKILL_KEYS.map((k) => [k, clamp(draft.skills[k])])) as MemberAttributes["skills"],
    };
    setBusy(true);
    try {
      if (draft.id) await apiPut(`/api/v1/members/${draft.id}`, { nick: draft.nick.trim(), attributes });
      else await apiPost("/api/v1/members", { nick: draft.nick.trim(), attributes });
      toast(draft.id ? "멤버 정보를 수정했습니다" : "멤버를 추가했습니다");
      setDraft(null);
      reload();
    } catch (e) {
      toast((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel active">
      <div className="panel-head">
        <div>
          <h2>멤버 관리</h2>
          <p>멤버 정보와 길드 스킬을 수정하고 인증 현황을 초기화할 수 있습니다.</p>
        </div>
        <div className="reset-actions">
          <button className="reset-btn week" onClick={() => reset("weekly")}>
            이번 주 인증 초기화
          </button>
          <button className="reset-btn" onClick={() => reset("all")}>
            누적·인증 전체 초기화
          </button>
          <button className="add-btn" onClick={() => setDraft(toDraft())}>
            ＋ 멤버 추가
          </button>
        </div>
      </div>

      <div className="card table-card admin-table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>닉네임</th>
              <th>직급</th>
              <th>직업</th>
              <th>레벨</th>
              <th>가입일</th>
              <th>누적 스킬업</th>
              <th>관리</th>
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
                  <td>{m.attributes?.job || "-"}</td>
                  <td>{m.attributes?.level ?? "-"}</td>
                  <td>{m.attributes?.joinDate || "-"}</td>
                  <td>
                    <span className="skill-total">총 {m.totalSkills}회</span>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button className="small-btn edit" onClick={() => setDraft(toDraft(m))}>
                        수정
                      </button>
                      <button className="small-btn reject" onClick={() => del(m)}>
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {draft && (
        <div className="modal active" onClick={() => setDraft(null)}>
          <div className="modal-box member-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <b>{draft.id ? "멤버 수정" : "멤버 추가"}</b>
              <button className="x" onClick={() => setDraft(null)}>
                ×
              </button>
            </div>

            <div className="form-section">
              <div className="form-section-title">기본 정보</div>
              <div className="form-section-grid">
                <div className="field">
                  <label>닉네임 *</label>
                  <input value={draft.nick} onChange={(e) => setDraft({ ...draft, nick: e.target.value })} />
                </div>
                <div className="field">
                  <label>직급</label>
                  <select value={draft.rank} onChange={(e) => setDraft({ ...draft, rank: e.target.value })}>
                    {RANKS.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>직업</label>
                  <input value={draft.job} onChange={(e) => setDraft({ ...draft, job: e.target.value })} />
                </div>
                <div className="field">
                  <label>레벨</label>
                  <input type="number" value={draft.level} onChange={(e) => setDraft({ ...draft, level: e.target.value })} />
                </div>
                <div className="field">
                  <label>가입일</label>
                  <input type="date" value={draft.joinDate} onChange={(e) => setDraft({ ...draft, joinDate: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">전투 정보</div>
              <div className="form-section-grid combat">
                <div className="field">
                  <label>보공 (%)</label>
                  <input type="number" value={draft.boss} onChange={(e) => setDraft({ ...draft, boss: e.target.value })} />
                </div>
                <div className="field">
                  <label>방무 (%)</label>
                  <input type="number" value={draft.ignore} onChange={(e) => setDraft({ ...draft, ignore: e.target.value })} />
                </div>
                <div className="field">
                  <label>스공 (만)</label>
                  <input type="number" value={draft.power} onChange={(e) => setDraft({ ...draft, power: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">길드 스킬 (각 0~20)</div>
              <div className="skill-editor">
                {SKILL_KEYS.map((k) => (
                  <div className="field" key={k}>
                    <label>{SKILL_LABELS[k]}</label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={draft.skills[k]}
                      onChange={(e) => setDraft({ ...draft, skills: { ...draft.skills, [k]: e.target.value } })}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-light" onClick={() => setDraft(null)}>
                취소
              </button>
              <button className="btn-save" onClick={save} disabled={busy}>
                {busy ? "저장 중…" : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
