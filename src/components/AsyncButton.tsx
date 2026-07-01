"use client";
import { useState } from "react";

type Props = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> & {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => unknown;
};

/**
 * API 호출 버튼 공통 컴포넌트. onClick이 Promise를 반환하면 처리되는 동안
 * 자동으로 로딩 스피너를 띄우고 버튼을 비활성화한다(중복 클릭 방지).
 * onClick이 동기(Promise 아님)면 일반 버튼처럼 동작. <button>의 드롭인 대체.
 */
export function AsyncButton({ onClick, children, disabled, ...rest }: Props) {
  const [busy, setBusy] = useState(false);

  async function handle(e: React.MouseEvent<HTMLButtonElement>) {
    if (busy || !onClick) return;
    const r = onClick(e);
    if (r && typeof (r as { then?: unknown }).then === "function") {
      setBusy(true);
      try {
        await r;
      } finally {
        setBusy(false);
      }
    }
  }

  return (
    <button {...rest} disabled={disabled || busy} onClick={handle}>
      {busy ? <span className="btn-spinner" /> : children}
    </button>
  );
}
