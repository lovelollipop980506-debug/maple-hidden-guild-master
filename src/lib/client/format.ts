import type { Tier } from "./types";

/** 폼 키 → 한국어 제목(백엔드 forms.title 이 없을 때의 폴백). */
export const FORM_TITLE: Record<string, string> = {
  join: "가입 신청",
  skill_points: "스킬 포인트 인증",
};

export function formKeyLabel(key: string, title?: string): string {
  return title || FORM_TITLE[key] || key;
}

/** ISO 문자열 → "2024.03.14 21:42" */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** "방금 전 / N분 전 / N시간 전 / N일 전" */
export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return String(iso);
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day}일 전`;
  return formatDate(iso).slice(0, 10);
}

export function pointsText(n: number): string {
  return n.toLocaleString("ko-KR") + "p";
}

/** 가입 신청 폼 필드 라벨. */
export const JOIN_FIELD_LABEL: Record<string, string> = {
  character_name: "캐릭터명",
  playtime: "플레이 시간대",
  referral: "가입 경로",
  introduction: "자기소개",
};

export const TIER_ORDER: Tier[] = ["admin", "reviewer", "member", "guest"];
