"use client";
import * as React from "react";
import { Button, EmptyState } from "@/components/ds";
import type { ApiError } from "@/lib/client/api";

/** 로딩 스켈레톤 — 패널 내부 목록용. */
export function LoadingState({ rows = 3, label = "불러오는 중…" }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 64,
            borderRadius: "var(--radius-chip)",
            background:
              "linear-gradient(90deg, var(--surface-inset) 25%, var(--surface-panel-hover) 37%, var(--surface-inset) 63%)",
            backgroundSize: "400% 100%",
            boxShadow: "var(--gloss-press)",
            animation: "hd-shimmer 1.3s ease-in-out infinite",
          }}
        />
      ))}
      <style>{`@keyframes hd-shimmer{0%{background-position:100% 0}100%{background-position:0 0}}`}</style>
    </div>
  );
}

/** 에러 상태 — 메시지 + 재시도. */
export function ErrorState({ error, onRetry }: { error: ApiError | Error | null; onRetry?: () => void }) {
  const msg = error?.message || "데이터를 불러오지 못했습니다.";
  return (
    <EmptyState
      glyph="⚠️"
      title="문제가 발생했습니다"
      hint={msg}
      action={onRetry ? <Button variant="secondary" onClick={onRetry}>다시 시도</Button> : undefined}
    />
  );
}

export { EmptyState };
