import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "히든 길드 관리",
  description: "디스코드 연동 길드 관리 백엔드",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
