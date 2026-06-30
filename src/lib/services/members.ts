import { supabaseAdmin } from "@/lib/supabase/server";
import { getConfig, setWeeklyResetAt } from "@/lib/config";
import { ApiError } from "@/lib/api/respond";

/**
 * 길드 로스터(members). 메이플 특정 필드는 attributes(jsonb)에 둔다.
 * - attributes 예: { rank, job, level, boss, ignore, power, skills:{boss,ignore,attack,exp,accuracy}, joinDate }
 * 주간 인증 현황은 approved skill_cert 제출에서 파생한다(별도 컬럼 없음).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/** 이번 주 시작(월요일 00:00). weekly_reset_at 이 더 나중이면 그걸 사용. */
function weekStart(weeklyResetAt: string | null): Date {
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // 월=0
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - day);
  if (weeklyResetAt) {
    const r = new Date(weeklyResetAt);
    if (r > monday) return r;
  }
  return monday;
}

/** 닉별 이번 주 승인된 인증 횟수 합. */
async function weekCountsByNick(weeklyResetAt: string | null): Promise<Record<string, number>> {
  const since = weekStart(weeklyResetAt).toISOString();
  const { data } = await supabaseAdmin()
    .from("form_submissions")
    .select("answers, created_at")
    .eq("form_key", "skill_cert")
    .eq("status", "approved")
    .gte("created_at", since);
  const map: Record<string, number> = {};
  for (const r of data ?? []) {
    const a = (r.answers ?? {}) as any;
    const nick = a.nick;
    if (!nick) continue;
    map[nick] = (map[nick] ?? 0) + (Number(a.count) || 0);
  }
  return map;
}

function totalSkills(attributes: any): number {
  const s = attributes?.skills ?? {};
  return Object.values(s).reduce((a: number, v: any) => a + (Number(v) || 0), 0);
}

export async function listMembers(opts: { q?: string; rank?: string; cert?: string } = {}) {
  const config = await getConfig();
  const [{ data: rows }, weekCounts] = await Promise.all([
    supabaseAdmin().from("members").select("*").order("created_at", { ascending: true }),
    weekCountsByNick(config.weeklyResetAt),
  ]);
  let items = (rows ?? []).map((m: any) => ({
    ...m,
    weekCount: weekCounts[m.nick] ?? 0,
    totalSkills: totalSkills(m.attributes),
  }));

  const q = opts.q?.trim().toLowerCase();
  if (q) items = items.filter((m) => m.nick.toLowerCase().includes(q) || String(m.attributes?.job ?? "").toLowerCase().includes(q));
  if (opts.rank) items = items.filter((m) => m.attributes?.rank === opts.rank);
  if (opts.cert === "done") items = items.filter((m) => m.weekCount > 0);
  else if (opts.cert === "none") items = items.filter((m) => m.weekCount === 0);

  return { items, total: items.length };
}

export async function getMember(id: string) {
  const { data } = await supabaseAdmin().from("members").select("*").eq("id", id).maybeSingle();
  if (!data) throw new ApiError("not_found", "멤버를 찾을 수 없습니다.", 404);
  const config = await getConfig();
  const counts = await weekCountsByNick(config.weeklyResetAt);
  return { ...data, weekCount: counts[(data as any).nick] ?? 0, totalSkills: totalSkills((data as any).attributes) };
}

export async function createMember(input: { nick: string; attributes?: any }, by: string) {
  const nick = (input.nick ?? "").trim();
  if (!nick) throw new ApiError("invalid", "닉네임을 입력하세요.");
  const { data, error } = await supabaseAdmin()
    .from("members")
    .insert({ nick, attributes: input.attributes ?? {}, created_by: by })
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505") throw new ApiError("conflict", "이미 등록된 닉네임입니다.", 409);
    throw new ApiError("db", "추가에 실패했습니다.", 500);
  }
  return data;
}

export async function updateMember(id: string, input: { nick?: string; attributes?: any }, _by: string) {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.nick !== undefined) patch.nick = String(input.nick).trim();
  if (input.attributes !== undefined) patch.attributes = input.attributes;
  const { data, error } = await supabaseAdmin().from("members").update(patch).eq("id", id).select("*").maybeSingle();
  if (error) {
    if (error.code === "23505") throw new ApiError("conflict", "이미 등록된 닉네임입니다.", 409);
    throw new ApiError("db", "수정에 실패했습니다.", 500);
  }
  if (!data) throw new ApiError("not_found", "멤버를 찾을 수 없습니다.", 404);
  return data;
}

export async function deleteMember(id: string) {
  const { error } = await supabaseAdmin().from("members").delete().eq("id", id);
  if (error) throw new ApiError("db", "삭제에 실패했습니다.", 500);
  return { ok: true };
}

/** 이번 주 인증 상태만 초기화(누적 스킬·로그는 보존). */
export async function resetWeekly(by: string) {
  await setWeeklyResetAt(new Date().toISOString(), by);
  return { ok: true };
}

/** 모든 멤버의 길드 스킬 누적을 0으로 + 주간 초기화. */
export async function resetAllProgress(by: string) {
  const db = supabaseAdmin();
  const { data: rows } = await db.from("members").select("id, attributes");
  for (const m of rows ?? []) {
    const attrs = ((m as any).attributes ?? {}) as any;
    attrs.skills = { boss: 0, ignore: 0, attack: 0, exp: 0, accuracy: 0 };
    await db.from("members").update({ attributes: attrs, updated_at: new Date().toISOString() }).eq("id", (m as any).id);
  }
  await setWeeklyResetAt(new Date().toISOString(), by);
  return { ok: true };
}

// ---- on_approve 효과에서 사용 ----

/** 가입 승인 시 멤버 등록(이미 있으면 무시). */
export async function registerMember(nick: string, attributes: any) {
  const db = supabaseAdmin();
  const { data: existing } = await db.from("members").select("id").eq("nick", nick).maybeSingle();
  if (existing) return;
  await db.from("members").insert({ nick, attributes });
}

/** 인증 승인 시 멤버 길드 스킬 증가. */
export async function incrementMemberSkill(nick: string, skillKey: string, count: number, max = 20) {
  const db = supabaseAdmin();
  const { data: m } = await db.from("members").select("id, attributes").eq("nick", nick).maybeSingle();
  if (!m) return;
  const attrs = ((m as any).attributes ?? {}) as any;
  attrs.skills = attrs.skills ?? {};
  const cur = Number(attrs.skills[skillKey] ?? 0);
  attrs.skills[skillKey] = Math.min(max, cur + (Number(count) || 0));
  await db.from("members").update({ attributes: attrs, updated_at: new Date().toISOString() }).eq("id", (m as any).id);
}
