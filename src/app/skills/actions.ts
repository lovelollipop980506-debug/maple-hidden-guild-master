"use server";

import { revalidatePath } from "next/cache";
import { requireCapability } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export async function submitSkill(formData: FormData) {
  const session = await requireCapability("skills.submit");
  const discordId = session.user.discordId;

  const skill = String(formData.get("skill") ?? "").trim();
  const points = Number(formData.get("points") ?? 0);
  const note = String(formData.get("note") ?? "").trim();
  const file = formData.get("evidence");

  if (!skill) return { ok: false, error: "스킬/항목명을 입력해주세요." };
  if (!Number.isFinite(points) || points <= 0) {
    return { ok: false, error: "포인트는 1 이상의 숫자여야 합니다." };
  }

  const db = supabaseAdmin();
  let evidenceUrl: string | null = null;

  // Optional evidence image upload to Supabase Storage.
  if (file instanceof File && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) {
      return { ok: false, error: "이미지는 5MB 이하만 업로드할 수 있습니다." };
    }
    const ext = file.name.split(".").pop() || "png";
    const path = `${discordId}/${Date.now()}.${ext}`;
    const { error: upErr } = await db.storage
      .from(env.supabase.evidenceBucket)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) return { ok: false, error: "이미지 업로드에 실패했습니다." };
    evidenceUrl = db.storage.from(env.supabase.evidenceBucket).getPublicUrl(path).data.publicUrl;
  }

  const { error } = await db.from("skill_verifications").insert({
    user_id: discordId,
    skill,
    points,
    note,
    evidence_url: evidenceUrl,
    status: "pending",
  });
  if (error) return { ok: false, error: "제출에 실패했습니다." };

  await db.from("audit_log").insert({
    actor_id: discordId,
    action: "skill.submit",
    target_type: "skill_verification",
  });

  revalidatePath("/skills");
  return { ok: true };
}
