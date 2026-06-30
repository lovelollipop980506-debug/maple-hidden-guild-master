"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Avatar, Badge, PointTag, Icon, type IconName } from "@/components/ds";
import { useMe } from "@/lib/client/useMe";
import { useApi } from "@/lib/client/useApi";
import { apiGet } from "@/lib/client/api";
import { TIER_LABEL, TIER_RANK, tierAtLeast } from "@/lib/client/tier";
import type { AppConfig, Me, Tier } from "@/lib/client/types";
import type { ApiError } from "@/lib/client/api";

// 셸이 한 번 불러온 me 를 하위 페이지에서 재사용(중복 호출 방지).
interface MeCtx {
  me: Me | null;
  loading: boolean;
  error: ApiError | null;
  reload: () => void;
}
const MeContext = React.createContext<MeCtx | null>(null);
export function useCurrentMe(): MeCtx {
  const ctx = React.useContext(MeContext);
  if (!ctx) throw new Error("useCurrentMe must be used within <AppShell>");
  return ctx;
}

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  min: Tier;
}
const NAV: NavItem[] = [
  { href: "/", label: "홈", icon: "home", min: "member" },
  { href: "/join", label: "가입 신청", icon: "scroll", min: "guest" },
  { href: "/skills", label: "스킬 인증", icon: "star", min: "member" },
  { href: "/me/submissions", label: "내 제출내역", icon: "scroll", min: "member" },
  { href: "/review", label: "검토 큐", icon: "check", min: "reviewer" },
  { href: "/members", label: "멤버", icon: "users", min: "reviewer" },
  { href: "/stats", label: "통계", icon: "chart", min: "reviewer" },
  { href: "/setup", label: "설정", icon: "gear", min: "admin" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

/** 상단 내비 + 설정 배너 + 본문 컨테이너. member↑ 화면을 감싼다. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const { me, loading, error, reload } = useMe();
  const { data: config } = useApi<AppConfig>(() => apiGet<AppConfig>("/api/v1/config"), []);

  const tier = me?.tier ?? "guest";
  const items = NAV.filter((n) => TIER_RANK[tier] >= TIER_RANK[n.min]);
  const showSetupBanner = !!me?.isAdmin && config?.setupCompleted === false && pathname !== "/setup";

  return (
    <div style={{ minHeight: "100vh" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "var(--surface-panel)",
          boxShadow: "var(--gloss-soft), var(--shadow-md)",
          borderBottom: "1px solid var(--border-line)",
        }}
      >
        <nav
          style={{
            maxWidth: "var(--container-max)",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "12px 24px",
          }}
        >
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 34,
                height: 34,
                borderRadius: "var(--radius-sm)",
                background: "var(--teal-500)",
                boxShadow: "var(--gloss-strong)",
              }}
            >
              <Icon name="crown" size={18} color="#fff" />
            </span>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 22,
                color: "var(--text-label)",
                letterSpacing: ".02em",
              }}
            >
              HIDDEN
            </span>
          </Link>

          <div style={{ display: "flex", gap: 4, overflowX: "auto", flex: 1 }}>
            {items.map((n) => {
              const active = isActive(pathname, n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    height: 40,
                    padding: "0 14px",
                    whiteSpace: "nowrap",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 15,
                    textDecoration: "none",
                    color: active ? "#fff" : "var(--tan-400)",
                    background: active ? "var(--teal-500)" : "transparent",
                    borderRadius: "var(--radius-sm)",
                    boxShadow: active ? "var(--gloss-strong)" : "none",
                  }}
                >
                  <Icon name={n.icon} size={17} color={active ? "#fff" : "var(--tan-400)"} />
                  {n.label}
                </Link>
              );
            })}
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
            {me && <PointTag value={me.totalPoints} />}
            {me && (
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <Avatar name={me.name} src={me.avatar} tier={me.tier} size={36} online />
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "var(--white)" }}>{me.name}</div>
                  <div style={{ marginTop: 3 }}>
                    <Badge tone={me.tier} solid>
                      {TIER_LABEL[me.tier]}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              aria-label="로그아웃"
              style={{
                display: "inline-flex",
                width: 36,
                height: 36,
                alignItems: "center",
                justifyContent: "center",
                background: "var(--char-600)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                boxShadow: "var(--gloss-strong)",
                color: "var(--gray-300)",
                cursor: "pointer",
              }}
            >
              <Icon name="logout" size={17} color="var(--gray-300)" />
            </button>
          </div>
        </nav>
      </header>

      {showSetupBanner && <SetupBanner />}

      <main style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "26px 24px 64px" }}>
        <MeContext.Provider value={{ me, loading, error, reload }}>{children}</MeContext.Provider>
      </main>
    </div>
  );
}

function SetupBanner() {
  return (
    <div style={{ maxWidth: "var(--container-max)", margin: "16px auto 0", padding: "0 24px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 18px",
          background: "var(--surface-panel-raised)",
          borderRadius: "var(--radius-panel)",
          boxShadow: "var(--gloss-soft), var(--shadow-md)",
          borderLeft: "3px solid var(--amber-500)",
        }}
      >
        <Icon name="gear" size={20} color="var(--amber-500)" />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--white)", fontSize: 15 }}>
            초기 설정이 필요합니다
          </div>
          <div style={{ color: "var(--gray-300)", fontSize: "var(--text-sm)", marginTop: 2 }}>
            디스코드 서버 연동과 역할→등급 매핑을 완료해 주세요.
          </div>
        </div>
        <Link
          href="/setup"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 14,
            textDecoration: "none",
            color: "#fff",
            background: "var(--teal-500)",
            padding: "9px 16px",
            borderRadius: "var(--radius-btn)",
            boxShadow: "var(--gloss-strong)",
          }}
        >
          설정하기
        </Link>
      </div>
    </div>
  );
}

/** 페이지 제목 헤더. */
export function PageHead({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        marginBottom: 20,
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "var(--display-sm)",
            color: "var(--text-label)",
            margin: 0,
          }}
        >
          {title}
        </h1>
        {sub && <p style={{ marginTop: 8, color: "var(--text-muted)", fontSize: "var(--text-base)" }}>{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/** 권한 미달 안내(페이지 게이팅). */
export function TierGuard({ required, tier, children }: { required: Tier; tier: Tier | undefined; children: React.ReactNode }) {
  if (!tierAtLeast(tier, required)) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--text-label)", margin: 0 }}>권한이 없습니다</h2>
        <p style={{ color: "var(--text-muted)", marginTop: 8 }}>이 페이지는 {TIER_LABEL[required]} 이상만 접근할 수 있습니다.</p>
      </div>
    );
  }
  return <>{children}</>;
}
