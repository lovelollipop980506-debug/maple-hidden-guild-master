"use client";

import { useState, useTransition, useRef } from "react";
import { submitSkill } from "./actions";

export default function SkillForm() {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function onSubmit(formData: FormData) {
    setMsg(null);
    startTransition(async () => {
      const res = await submitSkill(formData);
      if (res.ok) {
        setMsg({ ok: true, text: "인증 요청이 제출되었습니다." });
        formRef.current?.reset();
      } else {
        setMsg({ ok: false, text: res.error ?? "오류가 발생했습니다." });
      }
    });
  }

  return (
    <form ref={formRef} action={onSubmit} className="card space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-zinc-300">스킬 / 항목 *</label>
          <input name="skill" className="input" required />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-300">청구 포인트 *</label>
          <input name="points" type="number" min={1} className="input" required />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-300">설명</label>
        <textarea name="note" className="input min-h-20" />
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-300">증빙 이미지 (선택, 5MB 이하)</label>
        <input name="evidence" type="file" accept="image/*" className="input" />
      </div>

      {msg && (
        <p className={`text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</p>
      )}

      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "제출 중..." : "인증 요청"}
      </button>
    </form>
  );
}
