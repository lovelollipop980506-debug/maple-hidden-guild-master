import { supabaseAdmin } from "@/lib/supabase/server";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Filter = (q: any) => any;

async function count(table: string, filter?: Filter) {
  let q = supabaseAdmin().from(table).select("*", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count } = await q;
  return count ?? 0;
}

export async function getStats() {
  const db = supabaseAdmin();
  const [
    totalMembers,
    approvedMembers,
    pendingSubmissions,
    totalSubmissions,
    subsApproved,
    subsRejected,
    activeForms,
    topRows,
    ledgerRows,
  ] = await Promise.all([
    count("users"),
    count("users", (q) => q.eq("member_status", "approved")),
    count("form_submissions", (q) => q.eq("status", "pending")),
    count("form_submissions"),
    count("form_submissions", (q) => q.eq("status", "approved")),
    count("form_submissions", (q) => q.eq("status", "rejected")),
    count("forms", (q) => q.eq("active", true)),
    db.from("users").select("username, global_name, total_points").order("total_points", { ascending: false }).limit(5),
    db.from("point_ledger").select("delta"),
  ]);

  const topPoints = (topRows.data ?? []).map((u) => ({
    name: u.global_name || u.username,
    points: u.total_points,
  }));
  const totalPointsAwarded = (ledgerRows.data ?? []).reduce((s, r) => s + (r.delta as number), 0);

  return {
    totalMembers,
    approvedMembers,
    activeForms,
    pendingSubmissions,
    totalSubmissions,
    totalPointsAwarded,
    topPoints,
    submissionStatus: { approved: subsApproved, rejected: subsRejected, pending: pendingSubmissions },
  };
}
