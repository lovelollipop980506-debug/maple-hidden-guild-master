import { supabaseAdmin } from "@/lib/supabase/server";
import { getConfig } from "@/lib/config";
import { notifyUser, addRole } from "@/lib/discord";
import { env } from "@/lib/env";
import { atLeast, type Tier } from "@/lib/rbac";
import { ApiError } from "@/lib/api/respond";
import { getForm, getFormById, type Form } from "@/lib/services/forms";

/** Run a form's on-approve side effects (grant role / award points). */
async function runOnApprove(form: Form, userId: string | null, answers: Record<string, unknown>, actorId: string) {
  if (!userId) return;
  const db = supabaseAdmin();
  const config = await getConfig();

  if (form.onApprove.grantRoleId) {
    await db
      .from("users")
      .update({ member_status: "approved", joined_at: new Date().toISOString() })
      .eq("discord_id", userId);
    await addRole(config.guildId, userId, form.onApprove.grantRoleId);
  }

  let points = 0;
  if (form.onApprove.awardPointsField) points += Number(answers[form.onApprove.awardPointsField] ?? 0);
  if (form.onApprove.awardPointsFixed) points += Number(form.onApprove.awardPointsFixed);
  if (Number.isFinite(points) && points > 0) {
    await db.from("point_ledger").insert({
      user_id: userId,
      delta: points,
      reason: `폼 승인: ${form.title}`,
      source_type: "form_submission",
      created_by: actorId,
    });
    const { data: rows } = await db.from("point_ledger").select("delta").eq("user_id", userId);
    const total = (rows ?? []).reduce((s, r) => s + (r.delta as number), 0);
    await db.from("users").update({ total_points: total }).eq("discord_id", userId);
  }
}

/** Submit a web form. `tier` is the submitter's app tier. */
export async function submitForm(formKey: string, userId: string, tier: Tier, formData: FormData) {
  const form = await getForm(formKey);
  if (!form.active) throw new ApiError("not_found", "사용할 수 없는 폼입니다.", 404);
  if (form.intake !== "web") throw new ApiError("invalid", "이 폼은 웹 제출을 받지 않습니다.");
  if (!atLeast(tier, form.submitMinTier)) throw new ApiError("forbidden", "제출 권한이 없습니다.", 403);

  const db = supabaseAdmin();
  const { data: dup } = await db
    .from("form_submissions")
    .select("id")
    .eq("form_id", form.id)
    .eq("user_id", userId)
    .eq("status", "pending")
    .maybeSingle();
  if (dup) throw new ApiError("conflict", "이미 검토 대기 중인 제출이 있습니다.", 409);

  // Build answers from the form's field schema.
  const answers: Record<string, unknown> = {};
  for (const f of form.fields) {
    const raw = formData.get(f.name);
    if (f.type === "image") {
      if (raw instanceof File && raw.size > 0) {
        if (raw.size > 5 * 1024 * 1024) throw new ApiError("too_large", `${f.label}: 5MB 이하만 가능합니다.`);
        const ext = raw.name.split(".").pop() || "png";
        const path = `${userId}/${Date.now()}-${f.name}.${ext}`;
        const { error: upErr } = await db.storage
          .from(env.supabase.evidenceBucket)
          .upload(path, raw, { contentType: raw.type, upsert: false });
        if (upErr) throw new ApiError("upload", "이미지 업로드에 실패했습니다.", 500);
        answers[f.name] = db.storage.from(env.supabase.evidenceBucket).getPublicUrl(path).data.publicUrl;
      } else if (f.required) {
        throw new ApiError("invalid", `${f.label}을(를) 첨부해주세요.`);
      }
    } else {
      const val = raw == null ? "" : String(raw).trim();
      if (f.required && !val) throw new ApiError("invalid", `${f.label}을(를) 입력해주세요.`);
      if (f.type === "number") {
        if (val && !Number.isFinite(Number(val))) throw new ApiError("invalid", `${f.label}은(는) 숫자여야 합니다.`);
        answers[f.name] = val ? Number(val) : null;
      } else if (f.type === "checkbox") {
        answers[f.name] = val === "true" || val === "on" || val === "1";
      } else {
        answers[f.name] = val;
      }
    }
  }

  const status = form.requiresApproval ? "pending" : "approved";
  const { data, error } = await db
    .from("form_submissions")
    .insert({ form_id: form.id, form_key: form.key, user_id: userId, answers, status, source: "web" })
    .select("id")
    .single();
  if (error) throw new ApiError("db", "제출에 실패했습니다.", 500);

  if (form.onApprove.grantRoleId && status === "pending") {
    await db.from("users").update({ member_status: "applied" }).eq("discord_id", userId);
  }
  if (status === "approved") await runOnApprove(form, userId, answers, userId);

  await db.from("audit_log").insert({
    actor_id: userId,
    action: "submission.create",
    target_type: "form_submission",
    target_id: data.id,
    detail: { form: form.key },
  });
  return { id: data.id, status };
}

export async function listMySubmissions(userId: string) {
  const { data } = await supabaseAdmin()
    .from("form_submissions")
    .select("id, form_key, answers, status, review_note, created_at, reviewed_at, forms:form_id(title)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function listSubmissionsForReview(opts: {
  formKey?: string;
  status?: string;
  source?: string;
  limit: number;
  offset: number;
}) {
  let q = supabaseAdmin()
    .from("form_submissions")
    .select("id, form_id, form_key, user_id, answers, status, source, discord_message_id, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false });
  if (opts.formKey) q = q.eq("form_key", opts.formKey);
  if (opts.status) q = q.eq("status", opts.status);
  if (opts.source) q = q.eq("source", opts.source);

  const { data, count } = await q.range(opts.offset, opts.offset + opts.limit - 1);
  return { items: data ?? [], total: count ?? 0, limit: opts.limit, offset: opts.offset };
}

export async function reviewSubmission(
  id: string,
  reviewerId: string,
  decision: "approved" | "rejected",
  note: string,
) {
  if (decision !== "approved" && decision !== "rejected") {
    throw new ApiError("invalid", "decision은 approved 또는 rejected여야 합니다.");
  }
  const db = supabaseAdmin();
  const { data: sub, error } = await db
    .from("form_submissions")
    .update({
      status: decision,
      reviewer_id: reviewerId,
      review_note: note || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending")
    .select("form_id, user_id, answers")
    .maybeSingle();
  if (error || !sub) throw new ApiError("not_found", "이미 처리되었거나 찾을 수 없습니다.", 404);

  const form = await getFormById(sub.form_id as string);
  const userId = (sub.user_id as string) ?? null;
  const config = await getConfig();

  if (decision === "approved") {
    await runOnApprove(form, userId, (sub.answers ?? {}) as Record<string, unknown>, reviewerId);
    if (userId) await notifyUser(userId, `✅ "${form.title}" 제출이 승인되었습니다.`, config.notifyChannelId);
  } else {
    if (form.onApprove.grantRoleId && userId) {
      await db.from("users").update({ member_status: "rejected" }).eq("discord_id", userId);
    }
    if (userId) {
      await notifyUser(
        userId,
        `"${form.title}" 제출이 반려되었습니다.${note ? ` 사유: ${note}` : ""}`,
        config.notifyChannelId,
      );
    }
  }

  await db.from("audit_log").insert({
    actor_id: reviewerId,
    action: `submission.${decision}`,
    target_type: "form_submission",
    target_id: id,
    detail: { note, form: form.key },
  });
  return { id, status: decision };
}
