"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useMe } from "@/lib/client/useMe";
import { useApi } from "@/lib/client/useApi";
import { tierAtLeast, isGuildMember, type Stats } from "@/lib/client/types";
import { Loading } from "@/components/Loading";

type Tab = { href: string; label: string; ico: string; op?: boolean; badge?: number };

/** 모바일 전용 셸: 상단 브랜드바 + 하단 탭 내비. 데스크톱 사이드바와 완전 분리. */
export function MobileShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { me } = useMe();
  const { data: stats } = useApi<Stats>("/api/v1/stats");

  const isMember = isGuildMember(me);
  const isOp = tierAtLeast(me?.tier, "reviewer");
  const pending = (stats?.pendingApplications ?? 0) + (stats?.pendingCerts ?? 0);

  useEffect(() => {
    if (me && !isMember) router.replace("/join");
  }, [me, isMember, router]);

  if (!me || !isMember) return <Loading />;

  const tabs: Tab[] = [
    { href: "/", label: "홈", ico: "🏠" },
    { href: "/notices", label: "공지", ico: "📢" },
    ...(isOp ? [{ href: "/admin/applications", label: "운영", ico: "🛠️", op: true, badge: pending } as Tab] : []),
  ];
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <div className="m-shell">
      <header className="m-top">
        <div className="m-brand">
          히든 <span>HIDDEN</span>
        </div>
        <button className="m-logout" onClick={() => signOut({ callbackUrl: "/login" })}>
          로그아웃
        </button>
      </header>

      <main className="m-main">{children}</main>

      <nav className="m-nav">
        {tabs.map((t) => (
          <button key={t.href} className={active(t.href) ? "active" : ""} onClick={() => router.push(t.href)}>
            <span className="ico">{t.ico}</span>
            <span>{t.label}</span>
            {!!t.badge && <span className="m-nav-badge">{t.badge}</span>}
          </button>
        ))}
      </nav>
    </div>
  );
}
