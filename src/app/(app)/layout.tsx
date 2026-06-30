import { Shell } from "@/components/Shell";

/**
 * 공통 셸 레이아웃. 사이드바는 여기서 한 번만 마운트되고, 네비게이션 시
 * children(콘텐츠 영역)만 교체된다 → 사이드바 재로딩 없음.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
