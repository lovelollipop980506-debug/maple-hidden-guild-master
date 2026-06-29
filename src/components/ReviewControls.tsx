"use client";

import { useState, useTransition } from "react";

type Action = (decision: "approved" | "rejected", note: string) => Promise<{ ok: boolean; error?: string }>;

export default function ReviewControls({ action }: { action: Action }) {
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function run(decision: "approved" | "rejected") {
    setErr(null);
    startTransition(async () => {
      const res = await action(decision, note);
      if (!res.ok) setErr(res.error ?? "오류가 발생했습니다.");
    });
  }

  return (
    <div className="mt-3 space-y-2">
      <input
        className="input"
        placeholder="검토 사유 (선택)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex gap-2">
        <button className="btn-success" disabled={pending} onClick={() => run("approved")}>
          승인
        </button>
        <button className="btn-danger" disabled={pending} onClick={() => run("rejected")}>
          반려
        </button>
      </div>
      {err && <p className="text-sm text-red-400">{err}</p>}
    </div>
  );
}
