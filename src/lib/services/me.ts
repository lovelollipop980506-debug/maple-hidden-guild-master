import type { Session } from "next-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ApiError } from "@/lib/api/respond";

/** Current user's profile + tier, merged with stored member status/points/character. */
export async function getMe(session: Session) {
  const u = session.user;
  const { data } = await supabaseAdmin()
    .from("users")
    .select("member_status, total_points, character_name, level, job")
    .eq("discord_id", u.discordId)
    .maybeSingle();

  return {
    discordId: u.discordId,
    name: u.name ?? null,
    avatar: u.image ?? null,
    tier: u.tier,
    isAdmin: u.tier === "admin",
    roles: u.roles ?? [],
    memberStatus: data?.member_status ?? "none",
    totalPoints: data?.total_points ?? 0,
    characterName: data?.character_name ?? null,
    level: data?.level ?? null,
    job: data?.job ?? null,
  };
}

/** Update the current user's Maple character profile. */
export async function updateProfile(
  discordId: string,
  input: { characterName?: unknown; level?: unknown; job?: unknown },
) {
  const patch: Record<string, unknown> = {};
  if (input.characterName !== undefined) patch.character_name = String(input.characterName).trim() || null;
  if (input.job !== undefined) patch.job = String(input.job).trim() || null;
  if (input.level !== undefined) {
    const empty = input.level === null || input.level === "";
    const lv = Number(input.level);
    if (!empty && (!Number.isFinite(lv) || lv < 0)) {
      throw new ApiError("invalid", "레벨은 0 이상의 숫자여야 합니다.");
    }
    patch.level = empty ? null : lv;
  }
  if (Object.keys(patch).length === 0) return { ok: true };

  const { error } = await supabaseAdmin().from("users").update(patch).eq("discord_id", discordId);
  if (error) throw new ApiError("db", "프로필 저장에 실패했습니다.", 500);
  return { ok: true };
}
