"use client";
import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useMe } from "@/lib/client/useMe";
import { useApi } from "@/lib/client/useApi";
import { apiPostForm, ApiError } from "@/lib/client/api";
import { toast } from "@/lib/client/toast";
import { STATUS_LABELS } from "@/lib/client/maple";
import { tierAtLeast, type MySubmission } from "@/lib/client/types";
import { Loading } from "@/components/Loading";
import { BootstrapGate } from "@/components/BootstrapGate";

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

const JOB_GROUPS: { group: string; jobs: string[] }[] = [
  { group: "전사", jobs: ["히어로", "다크나이트", "팔라딘", "아란"] },
  { group: "궁수", jobs: ["보우마스터", "신궁"] },
  { group: "법사", jobs: ["비숍", "아크메이지 (썬콜)", "아크메이지 (불독)", "에반"] },
  { group: "도적", jobs: ["나이트로드", "섀도어", "듀얼블레이드"] },
  { group: "해적", jobs: ["바이퍼", "캡틴"] },
];

const DAYS = ["평일", "주말"];
const TIMES = [
  { key: "새벽", hint: "0-6시" },
  { key: "오전", hint: "6-12시" },
  { key: "오후", hint: "12-18시" },
  { key: "저녁", hint: "18-24시" },
];

export default function JoinPage() {
  const router = useRouter();
  const { me } = useMe();
  // 내 제출 이력 (검토 중 여부 + 지난 신청 표시용)
  const { data: mine, reload: reloadMine } = useApi<MySubmission[]>(me ? "/api/v1/submissions/mine" : null);
  const [nick, setNick] = useState("");
  const [level, setLevel] = useState("");
  const [job, setJob] = useState("");
  const [statAttack, setStatAttack] = useState("");
  const [boss, setBoss] = useState("");
  const [ignore, setIgnore] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  // 이미 길드원(역할 보유)이면 가입 신청 불필요 → 홈으로.
  useEffect(() => {
    if (me && tierAtLeast(me.tier, "member")) router.replace("/");
  }, [me, router]);

  if (!me || tierAtLeast(me.tier, "member")) return <Loading />;

  const joinSubs = (mine ?? []).filter((s) => s.form_key === "join");
  const pending = joinSubs.some((s) => s.status === "pending");

  // 숫자만 + 최대 자릿수 제한 (HTML max 속성은 직접 입력을 못 막음)
  const onlyDigits = (v: string, maxLen: number) => v.replace(/\D/g, "").slice(0, maxLen);

  function toggleSlot(key: string) {
    setSlots((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
  }

  async function submit() {
    if (!nick.trim()) return toast("닉네임을 입력하세요");
    if (level) {
      const n = Number(level);
      if (!Number.isInteger(n) || n < 1 || n > 200) return toast("레벨은 1~200 사이로 입력하세요");
    }
    setBusy(true);
    try {
      // 선택 순서가 아닌 정의 순서(평일→주말, 새벽→저녁)로 정렬해 저장
      const ordered = DAYS.flatMap((d) => TIMES.map((t) => `${d} ${t.key}`)).filter((s) => slots.includes(s));
      const fd = new FormData();
      fd.append("nick", nick.trim());
      fd.append("level", level);
      fd.append("job", job.trim());
      fd.append("stat_attack", statAttack);
      fd.append("boss", boss);
      fd.append("ignore", ignore);
      fd.append("playtime", ordered.join(", "));
      await apiPostForm("/api/v1/forms/join/submissions", fd);
      await reloadMine(); // 검토 중 화면으로 전환
    } catch (e) {
      toast((e as ApiError).message || "신청에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <BootstrapGate>
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "var(--bg)" }}>
      <div className="card" style={{ width: "100%", maxWidth: 560, padding: 28 }}>
        <div className="page-head" style={{ marginBottom: 18 }}>
          <div>
            <h2>가입 신청</h2>
            <p>아직 길드원이 아니에요. 신청서를 제출하면 운영진 승인 후 입장할 수 있습니다.</p>
          </div>
          <button
            className="more"
            style={{ flexShrink: 0, whiteSpace: "nowrap" }}
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            로그아웃
          </button>
        </div>

        {me.blocked ? (
          <div className="empty" style={{ height: "auto", padding: "30px 0", lineHeight: 1.7 }}>
            🚫 차단된 계정입니다.
            <br />
            가입 신청이 제한되어 있어요. 운영진에게 문의해 주세요.
          </div>
        ) : pending ? (
          <div className="empty" style={{ height: "auto", padding: "30px 0", lineHeight: 1.7 }}>
            ⏳ 가입 신청을 검토 중입니다.
            <br />
            운영진 승인 후 디스코드 역할이 부여되면, 다시 로그인 시 입장됩니다.
          </div>
        ) : (
          <>
            <div className="form-row">
              <label>닉네임</label>
              <input className="input" placeholder="캐릭터 닉네임" value={nick} onChange={(e) => setNick(e.target.value)} />
            </div>
            <div className="form-row">
              <label>레벨</label>
              <input
                className="input"
                type="text"
                inputMode="numeric"
                placeholder="1 ~ 200"
                value={level}
                onChange={(e) => setLevel(onlyDigits(e.target.value, 3))}
              />
            </div>
            <div className="form-row">
              <label>직업</label>
              <select className="select" value={job} onChange={(e) => setJob(e.target.value)}>
                <option value="">직업 선택</option>
                {JOB_GROUPS.map((g) => (
                  <optgroup key={g.group} label={g.group}>
                    {g.jobs.map((j) => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label>스공</label>
              <input className="input" type="number" min={0} placeholder="숫자만" value={statAttack} onChange={(e) => setStatAttack(e.target.value)} />
            </div>
            <div className="form-row">
              <label>보공</label>
              <input className="input" type="text" inputMode="numeric" placeholder="숫자만 (최대 3자리)" value={boss} onChange={(e) => setBoss(onlyDigits(e.target.value, 3))} />
            </div>
            <div className="form-row">
              <label>방무</label>
              <input className="input" type="text" inputMode="numeric" placeholder="숫자만 (최대 3자리)" value={ignore} onChange={(e) => setIgnore(onlyDigits(e.target.value, 3))} />
            </div>
            <div className="form-row" style={{ alignItems: "start" }}>
              <label style={{ paddingTop: 6 }}>접속 시간대</label>
              <div className="slot-grid">
                <div className="slot-head" />
                {TIMES.map((t) => (
                  <div key={t.key} className="slot-head">
                    {t.key}
                    <span>{t.hint}</span>
                  </div>
                ))}
                {DAYS.map((day) => (
                  <Fragment key={day}>
                    <div className="slot-day">{day}</div>
                    {TIMES.map((t) => {
                      const key = `${day} ${t.key}`;
                      const on = slots.includes(key);
                      return (
                        <label key={key} className={`slot-cell${on ? " on" : ""}`}>
                          <input type="checkbox" checked={on} onChange={() => toggleSlot(key)} />
                        </label>
                      );
                    })}
                  </Fragment>
                ))}
              </div>
            </div>
            <button className="submit" onClick={submit} disabled={busy}>
              {busy ? "제출 중…" : "가입 신청하기"}
            </button>
          </>
        )}

        {joinSubs.length > 0 && (
          <div className="join-history">
            <div className="join-history-title">지난 신청 이력</div>
            {joinSubs.map((h) => (
              <div key={h.id} className="join-history-item">
                <span className="join-history-date">{fmtDate(h.created_at)}</span>
                <span className={`badge ${h.status === "approved" ? "ok" : h.status === "rejected" ? "no" : "wait"}`}>
                  {STATUS_LABELS[h.status] ?? h.status}
                </span>
                {h.status === "rejected" && h.review_note && (
                  <span className="join-history-note">사유: {h.review_note}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </BootstrapGate>
  );
}
