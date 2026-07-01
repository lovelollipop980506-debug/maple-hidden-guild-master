"use client";
import { useEffect, useState } from "react";

/**
 * 실제 모바일 기기 여부 — 뷰포트 폭이 아니라 User-Agent 기준.
 * → PC에서 창을 좁혀도 모바일로 안 바뀐다(데스크톱 유지, 모니터 반응형만). 진짜 폰에서만 모바일 UI.
 * SSR/최초 페인트에는 null → 셸이 스피너를 띄운 뒤 확정(하이드레이션 안전).
 */
export function useIsMobile(): boolean | null {
  const [mobile, setMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const ua = navigator.userAgent || "";
    setMobile(/Mobi|Android|iPhone|iPod|Windows Phone|BlackBerry|IEMobile/i.test(ua));
  }, []);
  return mobile;
}
