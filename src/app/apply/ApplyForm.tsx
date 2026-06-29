"use client";

import { useState, useTransition } from "react";
import { submitApplication } from "./actions";

export default function ApplyForm() {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function onSubmit(formData: FormData) {
    setMsg(null);
    startTransition(async () => {
      const res = await submitApplication(formData);
      if (res.ok) setMsg({ ok: true, text: "신청서가 제출되었습니다." });
      else setMsg({ ok: false, text: res.error ?? "오류가 발생했습니다." });
    });
  }

  return (
    <form action={onSubmit} className="card space-y-4">
      <div>
        <label className="mb-1 block text-sm text-zinc-300">캐릭터명 *</label>
        <input name="character_name" className="input" required />
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-300">플레이 시간대</label>
        <input name="playtime" className="input" placeholder="예: 평일 저녁 / 주말" />
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-300">가입 경로</label>
        <input name="referral" className="input" placeholder="예: 지인 추천, 커뮤니티" />
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-300">자기소개</label>
        <textarea name="introduction" className="input min-h-24" />
      </div>

      {msg && (
        <p className={`text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</p>
      )}

      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "제출 중..." : "신청서 제출"}
      </button>
    </form>
  );
}
