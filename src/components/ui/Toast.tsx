"use client";
import * as React from "react";

export type ToastTone = "approved" | "rejected" | "pending" | "teal";
interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}
interface ToastApi {
  push: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = React.createContext<ToastApi | null>(null);

const TONE_COLOR: Record<ToastTone, string> = {
  approved: "var(--green-500)",
  rejected: "var(--red-500)",
  pending: "var(--amber-500)",
  teal: "var(--teal-300)",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const remove = React.useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = React.useCallback(
    (message: string, tone: ToastTone = "teal") => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, message, tone }]);
      window.setTimeout(() => remove(id), 4000);
    },
    [remove],
  );

  const api = React.useMemo<ToastApi>(
    () => ({
      push,
      success: (m) => push(m, "approved"),
      error: (m) => push(m, "rejected"),
      info: (m) => push(m, "teal"),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          maxWidth: "min(360px, calc(100vw - 32px))",
        }}
      >
        {toasts.map((t) => (
          <button
            key={t.id}
            onClick={() => remove(t.id)}
            style={{
              textAlign: "left",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 14px",
              border: "none",
              borderRadius: "var(--radius-panel)",
              background: "var(--surface-panel-raised)",
              boxShadow: "var(--gloss-soft), var(--shadow-md)",
              color: "var(--white)",
              fontSize: 14,
              fontFamily: "var(--font-body)",
              animation: "hd-toast-in 160ms ease-out",
            }}
          >
            <span
              style={{
                flexShrink: 0,
                width: 8,
                height: 8,
                borderRadius: 999,
                background: TONE_COLOR[t.tone],
                boxShadow: `0 0 8px ${TONE_COLOR[t.tone]}`,
              }}
            />
            {t.message}
          </button>
        ))}
      </div>
      <style>{`@keyframes hd-toast-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
