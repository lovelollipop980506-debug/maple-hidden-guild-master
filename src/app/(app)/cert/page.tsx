"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPostForm, ApiError } from "@/lib/client/api";
import { toast } from "@/lib/client/toast";
import { SKILL_KEYS, SKILL_LABELS } from "@/lib/client/maple";

export default function CertPage() {
  const router = useRouter();
  const [nick, setNick] = useState("");
  const [skill, setSkill] = useState<string>("boss");
  const [count, setCount] = useState("1");
  const [file, setFile] = useState<File | null>(null);
  const [memo, setMemo] = useState("");
  const [busy, setBusy] = useState(false);

  function onFile(f: File | null) {
    if (f && f.size > 5 * 1024 * 1024) {
      toast("5MB 이하 이미지를 선택하세요");
      return;
    }
    setFile(f);
  }

  async function submit() {
    if (!nick.trim()) return toast("캐릭터 닉네임을 입력하세요");
    if (!file) return toast("스크린샷을 첨부하세요");
    const c = Math.max(1, Math.min(20, Number(count) || 1));
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("nick", nick.trim());
      fd.append("skill", skill);
      fd.append("count", String(c));
      fd.append("memo", memo);
      fd.append("evidence", file);
      await apiPostForm("/api/v1/forms/skill_cert/submissions", fd);
      toast("인증이 제출되었습니다. 운영진 승인 후 반영됩니다.");
      setFile(null);
      setMemo("");
      setCount("1");
    } catch (e) {
      toast((e as ApiError).message || "제출에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="certPage active">
      <div className="page-head">
        <div>
          <h2>길드 스킬업 인증</h2>
          <p>스킬과 횟수를 선택하고 인증 이미지를 제출하세요. 누적은 본인 계정 기준으로 집계됩니다.</p>
        </div>
        <button className="more" onClick={() => router.push("/")}>
          ← 홈으로
        </button>
      </div>

      <div className="cert-shell">
        <div className="card">
          <div className="form-row">
            <label>닉네임</label>
            <input
              className="input"
              placeholder="캐릭터 닉네임 (참고용)"
              value={nick}
              onChange={(e) => setNick(e.target.value)}
            />
          </div>

          <div className="form-row">
            <label>스킬 종류</label>
            <select className="select" value={skill} onChange={(e) => setSkill(e.target.value)}>
              {SKILL_KEYS.map((k) => (
                <option key={k} value={k}>
                  {SKILL_LABELS[k]}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label>스킬업 횟수</label>
            <input className="input" type="number" min={1} max={20} value={count} onChange={(e) => setCount(e.target.value)} />
          </div>

          <div className="form-row">
            <label>스크린샷</label>
            <div>
              <input className="input" type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
              <div className="tiny">이미지 파일만 가능합니다. 최대 5MB</div>
            </div>
          </div>

          <div className="form-row">
            <label>메모</label>
            <textarea className="textarea" placeholder="어떤 길드 스킬에 얼마를 올렸는지 적어주세요" value={memo} onChange={(e) => setMemo(e.target.value)} />
          </div>

          <button className="submit" onClick={submit} disabled={busy}>
            {busy ? "제출 중…" : "인증 제출하기"}
          </button>
        </div>
      </div>
    </section>
  );
}
