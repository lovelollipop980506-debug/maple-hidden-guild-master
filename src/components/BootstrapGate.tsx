"use client";
import { signOut } from "next-auth/react";
import { useApi } from "@/lib/client/useApi";
import { Loading } from "@/components/Loading";

type BootstrapStatus = { guildId: string; botReady: boolean; inviteUrl: string; locked: boolean };

/**
 * 봇이 운영 길드에 초대되기 전에는 어떤 로그인 사용자에게도 "봇 초대" 화면을 먼저 띄운다.
 * 봇이 없으면 소유자/관리자조차 admin 으로 식별되지 않으므로(권한 조회가 봇 토큰 기반),
 * 셋업에 진입할 수가 없다. 그래서 셸/가입 페이지보다 위에서 이 게이트로 막는다.
 * 설정 완료 후에는 botReady=true 라 평소엔 보이지 않는다.
 */
export function BootstrapGate({ children }: { children: React.ReactNode }) {
  const { data, loading } = useApi<BootstrapStatus>("/api/v1/setup/status");

  if (loading && !data) return <Loading />;

  if (data && !data.botReady) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "var(--bg)" }}>
        <div className="card" style={{ width: "100%", maxWidth: 480, padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 6 }}>🤖</div>
          <h2 style={{ fontSize: 22, letterSpacing: "-.03em" }}>봇을 먼저 초대해 주세요</h2>
          <p style={{ color: "var(--muted)", marginTop: 10, lineHeight: 1.7 }}>
            이 시스템을 시작하려면 디스코드 서버에 봇을 초대해야 합니다.
            <br />
            서버 관리 권한이 있는 분이 아래 버튼으로 봇을 초대한 뒤, 다시 로그인하면 설정을 진행할 수 있어요.
          </p>
          <a className="discord-btn" href={data.inviteUrl} target="_blank" rel="noreferrer" style={{ marginTop: 22 }}>
            봇 초대하기
          </a>
          <button className="auth-cancel full" onClick={() => window.location.reload()} style={{ marginTop: 10 }}>
            초대를 마쳤어요 — 새로고침
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            style={{ marginTop: 14, border: 0, background: "transparent", color: "#8995a1", fontWeight: 700 }}
          >
            로그아웃
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
