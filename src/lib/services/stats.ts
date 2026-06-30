import { supabaseAdmin } from "@/lib/supabase/server";
import { listMembers } from "@/lib/services/members";

/* eslint-disable @typescript-eslint/no-explicit-any */
async function count(table: string, filter?: (q: any) => any) {
  let q = supabaseAdmin().from(table).select("*", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count } = await q;
  return count ?? 0;
}

/** 길드 요약 — 홈 + 관리자. 멤버 로스터/인증에서 파생. */
export async function getStats() {
  const [{ items: members }, pendingApplications, pendingCerts, activeNotices] = await Promise.all([
    listMembers(),
    count("form_submissions", (q) => q.eq("form_key", "join").eq("status", "pending")),
    count("form_submissions", (q) => q.eq("form_key", "skill_cert").eq("status", "pending")),
    count("notices", (q) => q.eq("active", true)),
  ]);

  const totalMembers = members.length;
  const totalSkillUps = members.reduce((a, m) => a + (m.totalSkills || 0), 0);
  const weeklyAdded = members.reduce((a, m) => a + (m.weekCount || 0), 0);
  const weeklyDone = members.filter((m) => (m.weekCount || 0) > 0).length;

  return {
    totalMembers,
    totalSkillUps,
    weeklyAdded,
    weeklyDone,
    weeklyTotal: totalMembers,
    weeklyPercent: totalMembers ? Math.round((weeklyDone / totalMembers) * 100) : 0,
    pendingApplications,
    pendingCerts,
    activeNotices,
  };
}
