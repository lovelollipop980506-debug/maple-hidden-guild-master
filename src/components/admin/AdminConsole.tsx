"use client";
import { useRouter } from "next/navigation";
import { useMe } from "@/lib/client/useMe";
import { tierAtLeast } from "@/lib/client/types";
import { Applications } from "./Applications";
import { Directory } from "./Directory";
import { Members } from "./Members";
import { Pending } from "./Pending";
import { Logs } from "./Logs";
import { Weekly } from "./Weekly";
import { NoticesAdmin } from "./NoticesAdmin";
import { SetupPanel } from "./SetupPanel";

const TABS: { key: string; label: string }[] = [
  { key: "applications", label: "가입 신청" },
  { key: "directory", label: "길드원 조회" },
  { key: "members", label: "멤버 관리" },
  { key: "pending", label: "인증 대기" },
  { key: "logs", label: "승인 로그" },
  { key: "weekly", label: "주간 현황" },
  { key: "notices", label: "공지 관리" },
  { key: "setup", label: "설정" },
];

export function AdminConsole({ tab }: { tab: string }) {
  const router = useRouter();
  const { me, loading } = useMe();

  if (loading && !me) return <div style={{ padding: 30, color: "var(--muted)" }}>불러오는 중…</div>;
  if (!tierAtLeast(me?.tier, "reviewer")) {
    return (
      <div className="card" style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 34, marginBottom: 10 }}>🔒</div>
        <h2>운영자 전용</h2>
        <p style={{ color: "var(--muted)", marginTop: 8 }}>운영진 권한이 있는 계정만 접근할 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="adminPage active">
      <div className="topbar">
        <b>히든 운영 콘솔</b>
        <span style={{ fontSize: 13, color: "#cbd5df" }}>{me?.name} 님</span>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.key} className={t.key === tab ? "active" : ""} onClick={() => router.push(`/admin/${t.key}`)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "applications" && <Applications />}
      {tab === "directory" && <Directory />}
      {tab === "members" && <Members />}
      {tab === "pending" && <Pending />}
      {tab === "logs" && <Logs />}
      {tab === "weekly" && <Weekly />}
      {tab === "notices" && <NoticesAdmin />}
      {tab === "setup" && <SetupPanel />}
    </div>
  );
}
