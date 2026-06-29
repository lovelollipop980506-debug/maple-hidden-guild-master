"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function submitApplication(formData: FormData) {
  const session = await requireUser();
  const discordId = session.user.discordId;

  const form = {
    character_name: String(formData.get("character_name") ?? "").trim(),
    introduction: String(formData.get("introduction") ?? "").trim(),
    playtime: String(formData.get("playtime") ?? "").trim(),
    referral: String(formData.get("referral") ?? "").trim(),
  };

  if (!form.character_name) {
    return { ok: false, error: "캐릭터명을 입력해주세요." };
  }

  const db = supabaseAdmin();

  // Prevent duplicate pending applications.
  const { data: existing } = await db
    .from("applications")
    .select("id")
    .eq("applicant_id", discordId)
    .eq("status", "pending")
    .maybeSingle();
  if (existing) {
    return { ok: false, error: "이미 검토 대기 중인 신청서가 있습니다." };
  }

  const { error } = await db.from("applications").insert({
    applicant_id: discordId,
    form,
    status: "pending",
  });
  if (error) return { ok: false, error: "제출에 실패했습니다. 잠시 후 다시 시도해주세요." };

  await db.from("users").update({ member_status: "applied" }).eq("discord_id", discordId);
  await db.from("audit_log").insert({
    actor_id: discordId,
    action: "application.submit",
    target_type: "application",
  });

  revalidatePath("/apply");
  return { ok: true };
}
