"use client";
import { useRouter } from "next/navigation";
import { useMe } from "@/lib/client/useMe";
import { useIsMobile } from "@/lib/client/useIsMobile";
import { tierAtLeast } from "@/lib/client/types";
import { Applications } from "./Applications";
import { Directory } from "./Directory";
import { Pending } from "./Pending";
import { Logs } from "./Logs";
import { NoticesAdmin } from "./NoticesAdmin";
import { SetupPanel } from "./SetupPanel";
import { Loading } from "@/components/Loading";

// 모바일 관리자 섹션 전환 탭(데스크톱은 사이드바가 담당).
const SUBTABS = [
  { key: "applications", label: "가입 신청" },
  { key: "pending", label: "인증 대기" },
  { key: "directory", label: "길드원" },
  { key: "logs", label: "운영 로그" },
  { key: "notices", label: "공지" },
  { key: "setup", label: "설정", adminOnly: true },
];

export function AdminConsole({ tab }: { tab: string }) {
  const { me, loading } = useMe();
  const mobile = useIsMobile();
  const router = useRouter();

  if (loading && !me) return <Loading />;
  if (!tierAtLeast(me?.tier, "reviewer")) {
    return (
      <div className="card" style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 34, marginBottom: 10 }}>🔒</div>
        <h2>부마스터 전용</h2>
        <p style={{ color: "var(--muted)", marginTop: 8 }}>부마스터 또는 길드 마스터만 접근할 수 있습니다.</p>
      </div>
    );
  }

  const isAdmin = tierAtLeast(me?.tier, "admin");

  return (
    <div className="adminPage active">
      {mobile && (
        <nav className="m-subnav">
          {SUBTABS.filter((t) => isAdmin || !t.adminOnly).map((t) => (
            <button
              key={t.key}
              className={tab === t.key ? "active" : ""}
              onClick={() => router.push(`/admin/${t.key}`)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      )}
      {tab === "applications" && <Applications />}
      {tab === "directory" && <Directory />}
      {tab === "pending" && <Pending />}
      {tab === "logs" && <Logs />}
      {tab === "notices" && <NoticesAdmin />}
      {tab === "setup" && <SetupPanel />}
    </div>
  );
}
