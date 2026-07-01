import { supabaseAdmin } from "@/lib/supabase/server";

export type AuditEntry = {
  id: string;
  actor_id: string | null;
  actorNick: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  detail: Record<string, unknown> | null;
  created_at: string;
};

/** 운영 로그: 모든 감사 기록(승인/반려/차단/삭제/수기등록/설정 등)을 최신순으로. actor 닉 병합. */
export async function listAuditLog(opts: { limit: number; offset: number }) {
  const db = supabaseAdmin();
  const { data, count } = await db
    .from("audit_log")
    .select("id, actor_id, action, target_type, target_id, detail, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(opts.offset, opts.offset + opts.limit - 1);
  const rows = data ?? [];

  const ids = [...new Set(rows.map((r) => r.actor_id as string | null).filter(Boolean) as string[])];
  let nickMap: Record<string, string> = {};
  if (ids.length) {
    const { data: users } = await db
      .from("users")
      .select("discord_id, guild_nick, character_name, global_name, username")
      .in("discord_id", ids);
    nickMap = Object.fromEntries(
      (users ?? []).map((u) => [
        u.discord_id,
        u.guild_nick || u.character_name || u.global_name || u.username,
      ]),
    );
  }

  const items: AuditEntry[] = rows.map((r) => ({
    id: r.id as string,
    actor_id: (r.actor_id as string) ?? null,
    actorNick: r.actor_id ? nickMap[r.actor_id as string] ?? null : null,
    action: r.action as string,
    target_type: (r.target_type as string) ?? null,
    target_id: (r.target_id as string) ?? null,
    detail: (r.detail as Record<string, unknown>) ?? null,
    created_at: r.created_at as string,
  }));
  return { items, total: count ?? 0 };
}
