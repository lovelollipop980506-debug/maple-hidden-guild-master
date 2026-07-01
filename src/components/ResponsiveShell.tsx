"use client";
import { useIsMobile } from "@/lib/client/useIsMobile";
import { Shell } from "@/components/Shell";
import { MobileShell } from "@/components/mobile/MobileShell";
import { Loading } from "@/components/Loading";

/** 뷰포트에 따라 데스크톱 셸/모바일 셸을 통째로 분기(반응형 리플로우 아님). */
export function ResponsiveShell({ children }: { children: React.ReactNode }) {
  const mobile = useIsMobile();
  if (mobile === null) return <Loading />; // 확정 전엔 스피너(하이드레이션 안전)
  return mobile ? <MobileShell>{children}</MobileShell> : <Shell>{children}</Shell>;
}
