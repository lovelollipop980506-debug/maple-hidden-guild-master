"use client";
import { useEffect, useState } from "react";

/**
 * 모바일 여부(뷰포트 폭 기준). SSR/최초 페인트에는 null → 셸이 스피너를 띄운 뒤 확정.
 * 반응형 리플로우가 아니라, 이 값으로 데스크톱/모바일 컴포넌트 자체를 분기한다.
 */
export function useIsMobile(query = "(max-width: 767px)"): boolean | null {
  const [mobile, setMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);
  return mobile;
}
