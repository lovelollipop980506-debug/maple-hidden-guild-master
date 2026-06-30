"use client";
import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useMe } from "@/lib/client/useMe";
import { apiPostForm, ApiError } from "@/lib/client/api";
import { toast } from "@/lib/client/toast";
import { tierAtLeast } from "@/lib/client/types";
import { Loading } from "@/components/Loading";

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
  const [done, setDone] = useState(false);
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
      setDone(true);
    } catch (e) {
      toast((e as ApiError).message || "신청에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
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

        {done ? (
          <div className="empty" style={{ height: "auto", padding: "30px 0", lineHeight: 1.7 }}>
            ✅ 가입 신청이 접수되었습니다.
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
                type="number"
                min={1}
                max={200}
                placeholder="1 ~ 200"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
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
              <input className="input" type="number" min={0} placeholder="숫자만" value={boss} onChange={(e) => setBoss(e.target.value)} />
            </div>
            <div className="form-row">
              <label>방무</label>
              <input className="input" type="number" min={0} placeholder="숫자만" value={ignore} onChange={(e) => setIgnore(e.target.value)} />
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
                        <button
                          type="button"
                          key={key}
                          className={`slot-cell${on ? " on" : ""}`}
                          aria-pressed={on}
                          onClick={() => toggleSlot(key)}
                        >
                          {on ? "✓" : ""}
                        </button>
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
      </div>
    </div>
  );
}
