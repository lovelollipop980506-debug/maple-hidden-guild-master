import { supabaseAdmin } from "@/lib/supabase/server";
import { SKILL_KEYS } from "@/lib/client/maple";

/**
 * 길드원 = member 이상 등급(디스코드 역할 보유 + 사이트 로그인)인 `users`.
 * 스킬 누적/주간 인증은 별도로 저장하지 않고, 승인된 skill_cert 제출(append-only,
 * 타임스탬프 보유)에서 그때그때 계산한다. 저장/초기화/동기화 없음.
 */

const MEMBER_TIERS = ["member", "reviewer", "admin"];
const SKILL_CAP = 20;

/** 이번 주 시작(월요일 00:00). */
function weekStart(): Date {
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // 월=0
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - day);
  return monday;
}

type Agg = { skills: Record<string, number>; week: number };

/** 디코 계정(user_id)별 승인 인증 집계: 스킬별 누적합 + 이번 주 합. */
async function aggregateByUser(): Promise<Record<string, Agg>> {
  const since = weekStart().getTime();
  const { data } = await supabaseAdmin()
    .from("form_submissions")
    .select("user_id, answers, created_at")
    .eq("form_key", "skill_cert")
    .eq("status", "approved");

  const map: Record<string, Agg> = {};
  for (const r of data ?? []) {
    const uid = r.user_id as string | null;
    if (!uid) continue;
    const a = (r.answers ?? {}) as { skill?: string; count?: unknown };
    const cnt = Number(a.count) || 0;
    const g = (map[uid] ??= { skills: {}, week: 0 });
    if (a.skill) g.skills[a.skill] = (g.skills[a.skill] ?? 0) + cnt;
    if (new Date(r.created_at as string).getTime() >= since) g.week += cnt;
  }
  return map;
}

export type GuildMember = {
  discordId: string;
  nick: string;
  job: string | null;
  level: number | null;
  avatar: string | null;
  tier: string;
  roles: string[];
  joinedAt: string | null;
  skills: Record<string, number>;
  weekCount: number;
  totalSkills: number;
};

/** 길드원 목록(계산). 검색 q / 인증상태 cert=done|none. */
export async function listMembers(opts: { q?: string; cert?: string } = {}) {
  const db = supabaseAdmin();
  const [{ data: users }, agg] = await Promise.all([
    db
      .from("users")
      .select("discord_id, username, global_name, avatar, tier, roles, character_name, job, level, joined_at")
      .in("tier", MEMBER_TIERS),
    aggregateByUser(),
  ]);

  let items: GuildMember[] = (users ?? []).map((u: Record<string, unknown>) => {
    const g = agg[u.discord_id as string] ?? { skills: {}, week: 0 };
    const skills: Record<string, number> = {};
    let total = 0;
    for (const k of SKILL_KEYS) {
      const v = Math.min(SKILL_CAP, Number(g.skills[k] ?? 0));
      skills[k] = v;
      total += v;
    }
    return {
      discordId: u.discord_id as string,
      nick: (u.character_name as string) || (u.global_name as string) || (u.username as string),
      job: (u.job as string) ?? null,
      level: (u.level as number) ?? null,
      avatar: (u.avatar as string) ?? null,
      tier: u.tier as string,
      roles: (u.roles as string[]) ?? [],
      joinedAt: (u.joined_at as string) ?? null,
      skills,
      weekCount: g.week,
      totalSkills: total,
    };
  });

  const q = opts.q?.trim().toLowerCase();
  if (q) items = items.filter((m) => m.nick.toLowerCase().includes(q) || (m.job ?? "").toLowerCase().includes(q));
  if (opts.cert === "done") items = items.filter((m) => m.weekCount > 0);
  else if (opts.cert === "none") items = items.filter((m) => m.weekCount === 0);

  items.sort((a, b) => b.totalSkills - a.totalSkills || a.nick.localeCompare(b.nick));
  return { items, total: items.length };
}
