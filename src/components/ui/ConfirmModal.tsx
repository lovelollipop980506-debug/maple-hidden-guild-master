"use client";
import * as React from "react";
import { Button, Panel } from "@/components/ds";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  body?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** 확인 모달 — 위험 액션(반려 등) 확인용. */
export function ConfirmModal({
  open,
  title,
  body,
  confirmLabel = "확인",
  cancelLabel = "취소",
  danger,
  busy,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "rgba(0,0,0,0.55)",
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: 420, maxWidth: "100%" }}>
        <Panel title={title}>
          {body && <div style={{ color: "var(--gray-300)", fontSize: "var(--text-base)", lineHeight: 1.6 }}>{body}</div>}
          <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button variant="quiet" onClick={onCancel} disabled={busy}>
              {cancelLabel}
            </Button>
            <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} disabled={busy}>
              {busy ? "처리 중…" : confirmLabel}
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
