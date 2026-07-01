import { ResponsiveShell } from "@/components/ResponsiveShell";
import { BootstrapGate } from "@/components/BootstrapGate";

/**
 * 공통 셸 레이아웃. 데스크톱은 사이드바 셸, 모바일은 하단 탭 셸로 분기(ResponsiveShell).
 * BootstrapGate: 봇이 운영 길드에 없으면 셸 대신 "봇 초대" 화면을 띄운다.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <BootstrapGate>
      <ResponsiveShell>{children}</ResponsiveShell>
    </BootstrapGate>
  );
}
