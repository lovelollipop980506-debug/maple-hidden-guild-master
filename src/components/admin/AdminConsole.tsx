"use client";
import { useMe } from "@/lib/client/useMe";
import { tierAtLeast } from "@/lib/client/types";
import { Applications } from "./Applications";
import { Directory } from "./Directory";
import { Pending } from "./Pending";
import { Logs } from "./Logs";
import { Weekly } from "./Weekly";
import { NoticesAdmin } from "./NoticesAdmin";
import { SetupPanel } from "./SetupPanel";
import { Loading } from "@/components/Loading";

// 탭 전환은 사이드바가 담당한다(중복 상단바/탭 없음). 여기선 현재 탭만 렌더.
export function AdminConsole({ tab }: { tab: string }) {
  const { me, loading } = useMe();

  if (loading && !me) return <Loading />;
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
      {tab === "applications" && <Applications />}
      {tab === "directory" && <Directory />}
      {tab === "pending" && <Pending />}
      {tab === "logs" && <Logs />}
      {tab === "weekly" && <Weekly />}
      {tab === "notices" && <NoticesAdmin />}
      {tab === "setup" && <SetupPanel />}
    </div>
  );
}
