"use client";
import * as React from "react";

// 디자인 시스템 라인 아이콘(2px stroke / 24px / 둥근 캡). currentColor 사용.
const ICON_PATHS = {
  home: "M3 11.5 12 4l9 7.5M5 10v9h5v-5h4v5h5v-9",
  scroll:
    "M5 4h11a2 2 0 0 1 2 2v12a2 2 0 0 0 2 2H8a3 3 0 0 1-3-3V4ZM5 4a2 2 0 0 0-2 2v1h2M9 9h6M9 13h6",
  star: "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8L3.5 9.7l5.9-.9L12 3.5Z",
  users:
    "M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M10 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM20 19v-1.5a3.5 3.5 0 0 0-2.6-3.4M15 4.7a3 3 0 0 1 0 5.8",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  chat: "M20 11.5a7.5 7.5 0 0 1-10.8 6.7L4 19l1-4.2A7.5 7.5 0 1 1 20 11.5Z",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 13a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H7a1.6 1.6 0 0 0 1-1.5V1a2 2 0 1 1 4 0v.1A1.6 1.6 0 0 0 17 2.6a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V7a1.6 1.6 0 0 0 1.5 1H23a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z",
  check: "M5 12.5l4.5 4.5L19 6.5",
  x: "M6 6l12 12M18 6 6 18",
  crown: "M4 18h16M4 18l-1.5-9 5 4L12 5l4.5 8 5-4L20 18",
  bell: "M18 9a6 6 0 1 0-12 0c0 6-2 8-2 8h16s-2-2-2-8M10.5 20a2 2 0 0 0 3 0",
  logout: "M9 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3M16 16l4-4-4-4M20 12H9",
  plus: "M12 5v14M5 12h14",
  trophy:
    "M7 4h10v4a5 5 0 0 1-10 0V4ZM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 0-3 3M9 17h6M8 20h8M12 13v4",
  image: "M4 5h16v14H4zM4 15l4.5-4.5L13 15M14 13l2.5-2.5L20 14M9 9.5a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0Z",
  upload: "M12 16V4M8 8l4-4 4 4M5 16v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3",
} as const;

export type IconName = keyof typeof ICON_PATHS;

export function Icon({
  name,
  size = 20,
  color = "currentColor",
  strokeWidth = 2,
  style = {},
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}) {
  const d = ICON_PATHS[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", ...style }}
      aria-hidden="true"
    >
      {d
        .split("M")
        .filter(Boolean)
        .map((seg, i) => (
          <path key={i} d={"M" + seg} />
        ))}
    </svg>
  );
}

// 디스코드 글리프(로그인 버튼 전용).
export function DiscordIcon({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true" style={{ display: "block" }}>
      <path
        d="M19.5 5.3A17 17 0 0 0 15.3 4l-.2.4a13 13 0 0 1 3.7 1.9 12 12 0 0 0-9.6 0A13 13 0 0 1 12.9 4.4L12.7 4a17 17 0 0 0-4.2 1.3C5.6 9.6 4.8 13.8 5.2 18a17 17 0 0 0 5.2 2.6l.7-1.2a11 11 0 0 1-1.8-.9l.4-.3a12 12 0 0 0 10.2 0l.4.3a11 11 0 0 1-1.8.9l.7 1.2A17 17 0 0 0 24.8 18l-.04-.4c.5-4.6-.7-8.8-3.3-12.3ZM9.7 15.3c-.8 0-1.5-.8-1.5-1.7s.7-1.7 1.5-1.7 1.5.8 1.5 1.7-.7 1.7-1.5 1.7Zm5.6 0c-.8 0-1.5-.8-1.5-1.7s.7-1.7 1.5-1.7 1.5.8 1.5 1.7-.7 1.7-1.5 1.7Z"
        transform="translate(-2.5 0)"
      />
    </svg>
  );
}
