"use client";
import { Badge } from "@/components/ds";
import type { SubmissionStatus } from "@/lib/client/types";

const LABEL: Record<SubmissionStatus, string> = {
  pending: "대기",
  approved: "승인",
  rejected: "반려",
};

/** 제출 상태 배지 — 대기(앰버)/승인(그린)/반려(레드). */
export function StatusBadge({ status }: { status: SubmissionStatus }) {
  return (
    <Badge tone={status} dot>
      {LABEL[status]}
    </Badge>
  );
}
