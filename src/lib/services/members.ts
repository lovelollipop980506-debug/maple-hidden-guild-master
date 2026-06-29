import { supabaseAdmin } from "@/lib/supabase/server";
import { ApiError } from "@/lib/api/respond";

export async function listMembers(opts: { limit: number; offset: number; sort?: string }) {
  const sort = opts.sort === "recent" ? "last_login" : "total_points";
  const { data, count } = await supabaseAdmin()
    .from("users")
    .select("discord_id, username, global_name, avatar, tier, total_points, member_status, last_login", {
      count: "exact",
    })
    .order(sort, { ascending: false })
    .range(opts.offset, opts.offset + opts.limit - 1);
  return { items: data ?? [], total: count ?? 0, limit: opts.limit, offset: opts.offset };
}

export async function getMember(discordId: string) {
  const db = supabaseAdmin();
  const { data: user } = await db
    .from("users")
    .select("discord_id, username, global_name, avatar, tier, roles, total_points, member_status, joined_at, last_login")
    .eq("discord_id", discordId)
    .maybeSingle();
  if (!user) throw new ApiError("not_found", "멤버를 찾을 수 없습니다.", 404);

  const { data: ledger } = await db
    .from("point_ledger")
    .select("delta, reason, created_at")
    .eq("user_id", discordId)
    .order("created_at", { ascending: false })
    .limit(100);
  return { ...user, pointHistory: ledger ?? [] };
}

export async function adjustPoints(
  discordId: string,
  delta: number,
  reason: string,
  byId: string,
) {
  if (!Number.isFinite(delta) || delta === 0) throw new ApiError("invalid", "변동 포인트가 올바르지 않습니다.");
  if (!reason?.trim()) throw new ApiError("invalid", "사유를 입력해주세요.");

  const db = supabaseAdmin();
  const { data: user } = await db.from("users").select("discord_id").eq("discord_id", discordId).maybeSingle();
  if (!user) throw new ApiError("not_found", "멤버를 찾을 수 없습니다.", 404);

  await db.from("point_ledger").insert({
    user_id: discordId,
    delta,
    reason: reason.trim(),
    source_type: "manual",
    created_by: byId,
  });
  const { data: rows } = await db.from("point_ledger").select("delta").eq("user_id", discordId);
  const total = (rows ?? []).reduce((s, r) => s + (r.delta as number), 0);
  await db.from("users").update({ total_points: total }).eq("discord_id", discordId);

  await db.from("audit_log").insert({
    actor_id: byId,
    action: "member.adjustPoints",
    target_type: "user",
    target_id: discordId,
    detail: { delta, reason },
  });
  return { discordId, totalPoints: total };
}
