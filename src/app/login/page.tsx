"use client";
import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button, Panel, Icon, DiscordIcon } from "@/components/ds";

function LoginCard() {
  const params = useSearchParams();
  const next = params.get("next") || "/";
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Panel style={{ width: 440, maxWidth: "100%", textAlign: "center" }} bodyStyle={{ padding: "44px 36px" }}>
        <div
          style={{
            width: 76,
            height: 76,
            margin: "0 auto 22px",
            borderRadius: "var(--radius-panel)",
            background: "var(--teal-500)",
            boxShadow: "var(--gloss-strong), var(--shadow-md)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="crown" size={40} color="#fff" />
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 40, color: "var(--text-label)", margin: 0 }}>
          HIDDEN
        </h1>
        <p style={{ marginTop: 12, color: "var(--gray-300)", fontSize: "var(--text-base)", lineHeight: 1.6 }}>
          메이플스토리 월드 · 메이플 플래닛
          <br />
          히든 길드 운영 시스템
        </p>
        <div style={{ marginTop: 30 }}>
          <Button block size="lg" onClick={() => signIn("discord", { callbackUrl: next })} icon={<DiscordIcon size={20} color="#fff" />}>
            Discord로 로그인
          </Button>
        </div>
        <p style={{ marginTop: 18, color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
          로그인은 누구나 가능하며, 디스코드 역할에 따라 기능이 열립니다.
        </p>
      </Panel>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginCard />
    </Suspense>
  );
}
