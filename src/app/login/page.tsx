"use client";
import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { AsyncButton } from "@/components/AsyncButton";

function LoginInner() {
  const next = useSearchParams().get("next") || "/";
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "var(--bg)" }}>
      <div className="card auth-box" style={{ textAlign: "center" }}>
        <div className="auth-icon discord" style={{ margin: "0 auto 18px" }}>
          <span style={{ fontWeight: 800 }}>H</span>
        </div>
        <div className="auth-title">히든 길드 관리 시스템</div>
        <p className="auth-desc">
          메이플스토리 월드 · 메이플 플래닛
          <br />
          디스코드 계정으로 로그인하세요.
        </p>
        <AsyncButton className="discord-btn" onClick={() => signIn("discord", { callbackUrl: next })}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" aria-hidden>
            <path d="M20.3 4.4A19 19 0 0015.6 3l-.2.5a17 17 0 014.2 1.3 16 16 0 00-12.2 0A17 17 0 0111.6 3.5L11.4 3a19 19 0 00-4.7 1.4C2.9 9.9 2 15.2 2.4 20.4A19 19 0 008.2 23l.6-1a13 13 0 01-2-1l.5-.3a13 13 0 0011.4 0l.5.3-2 1 .6 1a19 19 0 005.8-2.6c.5-6-.9-11.3-3.3-15.6zM9 16c-1 0-1.9-1-1.9-2.2 0-1.3.8-2.3 1.9-2.3s2 1 1.9 2.3C10.9 15 10 16 9 16zm6 0c-1 0-1.9-1-1.9-2.2 0-1.3.8-2.3 1.9-2.3s2 1 1.9 2.3C16.9 15 16 16 15 16z" />
          </svg>
          Discord로 로그인
        </AsyncButton>
        <p style={{ marginTop: 14, fontSize: 12, color: "var(--muted)" }}>
          로그인 후 디스코드 역할에 따라 기능이 열립니다.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
