import { supabaseAdmin } from "@/lib/supabase/server";
import { SKILL_KEYS } from "@/lib/client/maple";
import { ApiError } from "@/lib/api/respond";

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
      .select(
        "discord_id, username, global_name, guild_nick, avatar, tier, roles, character_name, job, level, joined_at",
      )
      // 디스코드 역할 보유(member 이상) 또는 가입 승인(member_status=approved) 사용자
      .or(`tier.in.(${MEMBER_TIERS.join(",")}),member_status.eq.approved`),
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
      // 히든 서버 닉네임 우선 → 없으면 캐릭터명/글로벌/유저명.
      nick:
        (u.guild_nick as string) ||
        (u.character_name as string) ||
        (u.global_name as string) ||
        (u.username as string),
      job: (u.job as string) ?? null,
      level: (u.level as number) ?? null,
      avatar: (u.avatar as string) ?? null,
      // 승인 멤버지만 디스코드 역할이 없어 tier=guest인 경우 멤버로 표시
      tier: MEMBER_TIERS.includes(u.tier as string) ? (u.tier as string) : "member",
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

/** 대상 멤버의 표시 닉네임(서버 닉 우선). */
async function memberNick(db: ReturnType<typeof supabaseAdmin>, discordId: string): Promise<string | null> {
  const { data } = await db
    .from("users")
    .select("guild_nick, character_name, global_name, username")
    .eq("discord_id", discordId)
    .maybeSingle();
  if (!data) return null;
  return data.guild_nick || data.character_name || data.global_name || data.username || null;
}

/**
 * 운영자가 특정 멤버의 스킬업 인증을 수기 등록한다. 승인된 skill_cert 제출로 바로 적재되어
 * 누적/이번 주 집계에 반영된다(증빙 이미지 불요). source='manual'.
 */
export async function addManualCert(
  actorId: string,
  discordId: string,
  input: { skill: string; count: unknown; memo?: string },
) {
  const db = supabaseAdmin();
  if (!SKILL_KEYS.includes(input.skill as (typeof SKILL_KEYS)[number])) {
    throw new ApiError("invalid", "스킬 종류가 올바르지 않습니다.");
  }
  const count = Number(input.count);
  if (!Number.isInteger(count) || count < 1 || count > 20) {
    throw new ApiError("invalid", "스킬업 횟수는 1~20 사이의 정수여야 합니다.");
  }
  const nick = await memberNick(db, discordId);
  if (!nick) throw new ApiError("not_found", "대상 멤버를 찾을 수 없습니다.", 404);

  const { data: form } = await db.from("forms").select("id").eq("key", "skill_cert").maybeSingle();
  if (!form) throw new ApiError("db", "인증 폼을 찾을 수 없습니다.", 500);

  const answers = { nick, skill: input.skill, count, memo: input.memo?.trim() || null, author_name: nick, manual: true };
  const { error } = await db.from("form_submissions").insert({
    form_id: form.id,
    form_key: "skill_cert",
    user_id: discordId,
    answers,
    status: "approved",
    source: "manual",
    reviewer_id: actorId,
    reviewed_at: new Date().toISOString(),
  });
  if (error) throw new ApiError("db", "등록에 실패했습니다.", 500);

  await db.from("audit_log").insert({
    actor_id: actorId,
    action: "member.cert_add",
    target_type: "user",
    target_id: discordId,
    detail: { nick, skill: input.skill, count },
  });
  return { ok: true };
}

/** 멤버 삭제: 로스터(users)에서 제거 + 그 멤버의 제출 이력 삭제. 운영 로그엔 삭제 기록이 남는다. */
export async function deleteMember(actorId: string, discordId: string) {
  const db = supabaseAdmin();
  const nick = await memberNick(db, discordId);
  if (nick == null) throw new ApiError("not_found", "대상 멤버를 찾을 수 없습니다.", 404);

  await db.from("form_submissions").delete().eq("user_id", discordId);
  const { error } = await db.from("users").delete().eq("discord_id", discordId);
  if (error) throw new ApiError("db", "삭제에 실패했습니다.", 500);

  await db.from("audit_log").insert({
    actor_id: actorId,
    action: "member.delete",
    target_type: "user",
    target_id: discordId,
    detail: { nick },
  });
  return { ok: true };
}
