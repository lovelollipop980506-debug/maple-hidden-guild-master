import { Shell } from "@/components/Shell";
import { BootstrapGate } from "@/components/BootstrapGate";

/**
 * 공통 셸 레이아웃. 사이드바는 여기서 한 번만 마운트되고, 네비게이션 시
 * children(콘텐츠 영역)만 교체된다 → 사이드바 재로딩 없음.
 * BootstrapGate: 봇이 운영 길드에 없으면 셸 대신 "봇 초대" 화면을 띄운다.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <BootstrapGate>
      <Shell>{children}</Shell>
    </BootstrapGate>
  );
}
