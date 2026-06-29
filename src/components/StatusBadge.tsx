const MAP: Record<string, { label: string; cls: string }> = {
  pending: { label: "대기", cls: "bg-amber-500/20 text-amber-300" },
  approved: { label: "승인", cls: "bg-emerald-500/20 text-emerald-300" },
  rejected: { label: "반려", cls: "bg-red-500/20 text-red-300" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = MAP[status] ?? { label: status, cls: "bg-zinc-700 text-zinc-200" };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}
