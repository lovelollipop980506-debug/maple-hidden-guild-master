"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useMe } from "@/lib/client/useMe";
import { useApi } from "@/lib/client/useApi";
import { tierAtLeast, type Stats } from "@/lib/client/types";
import { Loading } from "@/components/Loading";

const MAIN = [
  { href: "/", label: "홈" },
  { href: "/notices", label: "공지사항" },
];
const ADMIN = [
  { href: "/admin/applications", label: "가입 신청", badge: "apps" },
  { href: "/admin/directory", label: "길드원" },
  { href: "/admin/pending", label: "인증 대기", badge: "certs" },
  { href: "/admin/logs", label: "운영 로그" },
  { href: "/admin/notices", label: "공지 관리" },
  { href: "/admin/setup", label: "설정", adminOnly: true }, // 길드 마스터(소유자/관리자)만
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { me } = useMe();
  const { data: stats } = useApi<Stats>("/api/v1/stats");

  const isOp = tierAtLeast(me?.tier, "reviewer");
  const isAdmin = tierAtLeast(me?.tier, "admin");
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  // 길드원(역할 보유)이 아니면(=guest) 가입 신청 페이지로 보낸다.
  const isMember = tierAtLeast(me?.tier, "member");
  useEffect(() => {
    if (me && !isMember) router.replace("/join");
  }, [me, isMember, router]);

  function NavBtn({ href, label, badge }: { href: string; label: string; badge?: string }) {
    const count = badge === "apps" ? stats?.pendingApplications : badge === "certs" ? stats?.pendingCerts : 0;
    return (
      <button className={active(href) ? "active" : ""} onClick={() => router.push(href)}>
        {label}
        {!!count && <span className="count">{count}</span>}
      </button>
    );
  }

  // 인증 확정 전(로딩·미인증) 또는 비멤버(→가입 신청 리다이렉트 중)에는 쉘을 그리지
  // 않고 스피너만. 멤버 이상일 때만 쉘 렌더 → 깜빡임/비멤버 노출 방지.
  if (!me || !isMember) {
    return <Loading />;
  }

  return (
    <div className="layout">
      <aside className="side">
        <div className="logo-title">히든</div>
        <div className="logo-sub">길드 관리 시스템</div>

        <div className="nav-label">메인</div>
        <div className="nav">
          {MAIN.map((n) => (
            <NavBtn key={n.href} {...n} />
          ))}
        </div>

        {isOp && (
          <>
            <div className="side-line" />
            <div className="nav-label">운영</div>
            <div className="nav">
              {ADMIN.filter((n) => isAdmin || !n.adminOnly).map((n) => (
                <NavBtn key={n.href} {...n} />
              ))}
            </div>
          </>
        )}

        <div className="foot" style={{ marginTop: "auto" }}>
          {me && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <span style={{ color: "#cbd5df", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {me.name}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                style={{ border: 0, background: "rgba(255,255,255,.1)", color: "#cbd5df", borderRadius: 6, padding: "5px 9px" }}
              >
                로그아웃
              </button>
            </div>
          )}
          <div style={{ marginTop: 10 }}>© 2026 히든 길드</div>
        </div>
      </aside>

      <main className="main">{children}</main>
    </div>
  );
}
