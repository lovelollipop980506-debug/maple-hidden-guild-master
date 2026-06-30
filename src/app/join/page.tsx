"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useMe } from "@/lib/client/useMe";
import { apiPostForm, ApiError } from "@/lib/client/api";
import { toast } from "@/lib/client/toast";
import { ROUTE_LABELS } from "@/lib/client/maple";
import { tierAtLeast } from "@/lib/client/types";
import { Loading } from "@/components/Loading";

const ROUTES = Object.entries(ROUTE_LABELS);

export default function JoinPage() {
  const router = useRouter();
  const { me } = useMe();
  const [done, setDone] = useState(false);
  const [nick, setNick] = useState("");
  const [job, setJob] = useState("");
  const [level, setLevel] = useState("");
  const [route, setRoute] = useState(ROUTES[0][0]);
  const [intro, setIntro] = useState("");
  const [busy, setBusy] = useState(false);

  // 이미 길드원(역할 보유)이면 가입 신청 불필요 → 홈으로.
  useEffect(() => {
    if (me && tierAtLeast(me.tier, "member")) router.replace("/");
  }, [me, router]);

  if (!me || tierAtLeast(me.tier, "member")) return <Loading />;

  async function submit() {
    if (!nick.trim()) return toast("닉네임을 입력하세요");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("discord", me!.name ?? "");
      fd.append("nick", nick.trim());
      fd.append("job", job.trim());
      fd.append("level", level);
      fd.append("route", route);
      fd.append("intro", intro);
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
          <button className="more" onClick={() => signOut({ callbackUrl: "/login" })}>
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
              <label>직업</label>
              <input className="input" placeholder="직업" value={job} onChange={(e) => setJob(e.target.value)} />
            </div>
            <div className="form-row">
              <label>레벨</label>
              <input className="input" type="number" min={1} value={level} onChange={(e) => setLevel(e.target.value)} />
            </div>
            <div className="form-row">
              <label>가입 경로</label>
              <select className="select" value={route} onChange={(e) => setRoute(e.target.value)}>
                {ROUTES.map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label>각오 한마디</label>
              <textarea className="textarea" placeholder="간단한 자기소개나 각오를 적어주세요" value={intro} onChange={(e) => setIntro(e.target.value)} />
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
