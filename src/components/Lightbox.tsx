"use client";
import { useEffect } from "react";

/** 공통 이미지 라이트박스(크게보기). src가 있으면 전체화면 오버레이로 표시, 탭/ESC로 닫기. */
export function Lightbox({ src, onClose }: { src: string | null; onClose: () => void }) {
  useEffect(() => {
    if (!src) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [src, onClose]);

  if (!src) return null;
  return (
    <div className="lightbox" onClick={onClose} role="dialog" aria-modal="true">
      <button className="lightbox-close" onClick={onClose} aria-label="닫기">
        ✕
      </button>
      {/* 이미지 자체 클릭은 닫힘 방지 */}
      <img src={src} alt="크게보기" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}
