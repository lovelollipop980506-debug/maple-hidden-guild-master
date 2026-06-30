import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

export const metadata: Metadata = {
  title: "HIDDEN 길드",
  description: "메이플스토리 월드 · 히든 길드 운영 시스템",
};

// 최소 수정: SessionProvider + ToastProvider 만 추가. 기존 globals.css 는 유지.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
