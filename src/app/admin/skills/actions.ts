"use server";

import { revalidatePath } from "next/cache";
import { requireCapability } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { notifyUser } from "@/lib/discord";

export async function reviewSkill(
  id: string,
  decision: "approved" | "rejected",
  note: string,
) {
  const session = await requireCapability("skills.review");
  const reviewerId = session.user.discordId;
  const db = supabaseAdmin();

  const { data: sv, error } = await db
    .from("skill_verifications")
    .update({
      status: decision,
      reviewer_id: reviewerId,
      review_note: note || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending")
    .select("user_id, skill, points")
    .maybeSingle();

  if (error || !sv) return { ok: false, error: "이미 처리되었거나 찾을 수 없습니다." };

  if (decision === "approved") {
    const userId = sv.user_id as string;
    const points = sv.points as number;

    // Append to the ledger, then recompute the cached total.
    await db.from("point_ledger").insert({
      user_id: userId,
      delta: points,
      reason: `스킬 인증 승인: ${sv.skill}`,
      source_type: "skill_verification",
      source_id: id,
      created_by: reviewerId,
    });

    const { data: rows } = await db.from("point_ledger").select("delta").eq("user_id", userId);
    const total = (rows ?? []).reduce((sum, r) => sum + (r.delta as number), 0);
    await db.from("users").update({ total_points: total }).eq("discord_id", userId);

    await notifyUser(userId, `✅ 스킬 인증 "${sv.skill}"이(가) 승인되어 +${points}p 적립되었습니다.`);
  } else {
    await notifyUser(
      sv.user_id as string,
      `스킬 인증 "${sv.skill}"이(가) 반려되었습니다.${note ? ` 사유: ${note}` : ""}`,
    );
  }

  await db.from("audit_log").insert({
    actor_id: reviewerId,
    action: `skill.${decision}`,
    target_type: "skill_verification",
    target_id: id,
    detail: { note },
  });

  revalidatePath("/admin/skills");
  return { ok: true };
}
