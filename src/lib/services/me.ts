import type { Session } from "next-auth";
import { supabaseAdmin } from "@/lib/supabase/server";

/** Current user's profile + tier, merged with stored member status/points. */
export async function getMe(session: Session) {
  const u = session.user;
  const { data } = await supabaseAdmin()
    .from("users")
    .select("member_status, total_points")
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
  };
}
