"use server";

import { revalidatePath } from "next/cache";
import { requireCapability } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { notifyUser, addRole } from "@/lib/discord";
import { getConfig } from "@/lib/config";

export async function reviewApplication(
  id: string,
  decision: "approved" | "rejected",
  note: string,
) {
  const session = await requireCapability("applications.review");
  const reviewerId = session.user.discordId;
  const db = supabaseAdmin();

  const { data: app, error } = await db
    .from("applications")
    .update({
      status: decision,
      reviewer_id: reviewerId,
      review_note: note || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending") // guard against double-processing
    .select("applicant_id")
    .maybeSingle();

  if (error || !app) return { ok: false, error: "이미 처리되었거나 찾을 수 없습니다." };

  const applicantId = app.applicant_id as string;
  const config = await getConfig();

  if (decision === "approved") {
    await db
      .from("users")
      .update({ member_status: "approved", joined_at: new Date().toISOString() })
      .eq("discord_id", applicantId);
    // Auto-grant the configured Discord role (no-op if unset).
    if (config.approvedMemberRoleId) {
      await addRole(config.guildId, applicantId, config.approvedMemberRoleId);
    }
    await notifyUser(
      applicantId,
      "🎉 길드 가입 신청이 **승인**되었습니다! 환영합니다.",
      config.notifyChannelId,
    );
  } else {
    await db.from("users").update({ member_status: "rejected" }).eq("discord_id", applicantId);
    await notifyUser(
      applicantId,
      `가입 신청이 반려되었습니다.${note ? ` 사유: ${note}` : ""}`,
      config.notifyChannelId,
    );
  }

  await db.from("audit_log").insert({
    actor_id: reviewerId,
    action: `application.${decision}`,
    target_type: "application",
    target_id: id,
    detail: { note },
  });

  revalidatePath("/admin/applications");
  return { ok: true };
}
