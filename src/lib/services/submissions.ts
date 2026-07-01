import { supabaseAdmin } from "@/lib/supabase/server";
import { getConfig } from "@/lib/config";
import { notifyUser, addRole } from "@/lib/discord";
import { env } from "@/lib/env";
import { atLeast, type Tier } from "@/lib/rbac";
import { ApiError } from "@/lib/api/respond";
import { getForm, getFormById, type Form } from "@/lib/services/forms";
import type { SubmittedData, ResolvedAttachment } from "@/lib/discord-interactions";

/** Run a form's on-approve side effects (grant role / award points). */
async function runOnApprove(form: Form, userId: string | null, answers: Record<string, unknown>, actorId: string) {
  const db = supabaseAdmin();
  const config = await getConfig();

  // ---- 사이트 사용자(userId) 대상 효과 ----
  if (!userId) return;

  // 프로필 동기화 (가입 승인): answers → users 프로필(캐릭터명/직업/레벨 등)
  const prof = form.onApprove.profile;
  if (prof) {
    const patch: Record<string, unknown> = {};
    if (prof.nickField) {
      const nick = String((answers as any)[prof.nickField] ?? "").trim();
      if (nick) patch.character_name = nick;
    }
    for (const [col, field] of Object.entries(prof.fields ?? {})) {
      const v = (answers as any)[field];
      if (v == null || v === "") continue;
      if (col === "level") {
        if (Number.isFinite(Number(v))) patch.level = Number(v);
      } else {
        patch[col] = String(v);
      }
    }
    if (Object.keys(patch).length) await db.from("users").update(patch).eq("discord_id", userId);
  }

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

  // 차단된 디스코드 계정은 제출 자체를 막는다.
  const { data: blocker } = await db.from("users").select("blocked").eq("discord_id", userId).maybeSingle();
  if (blocker?.blocked) throw new ApiError("forbidden", "차단된 계정입니다. 운영진에게 문의하세요.", 403);

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

/**
 * Best-effort copy of a Discord attachment into the evidence bucket.
 * Discord CDN URLs expire (~24h), so we re-host; on any failure we fall back to
 * the raw URL so a submission is never lost.
 */
async function rehostToEvidence(
  db: ReturnType<typeof supabaseAdmin>,
  userId: string,
  field: string,
  att: ResolvedAttachment,
): Promise<string> {
  try {
    const res = await fetch(att.url);
    if (!res.ok) return att.url;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength > 8 * 1024 * 1024) return att.url;
    const ext = (att.filename.split(".").pop() || "png").toLowerCase();
    const path = `${userId}/${Date.now()}-${field}.${ext}`;
    const { error } = await db.storage
      .from(env.supabase.evidenceBucket)
      .upload(path, buf, { contentType: att.content_type || `image/${ext}`, upsert: false });
    if (error) return att.url;
    return db.storage.from(env.supabase.evidenceBucket).getPublicUrl(path).data.publicUrl;
  } catch {
    return att.url;
  }
}

/**
 * Submit a form via a Discord modal. No app session/tier — any guild member who
 * can click the button may submit; reviewers gate at the review queue. Stored
 * identically to web/polled submissions (source='discord') so the review and
 * approval pipeline is fully reused.
 *
 * Runs inline (single serverless invocation) and must finish within Discord's
 * 3s window. The only slow step is image re-hosting, which is best-effort and
 * falls back to the raw CDN URL. If image-heavy forms start timing out, switch
 * to a deferred response (type 5) + followup worker.
 */
export async function submitDiscordForm(
  formKey: string,
  userId: string,
  authorName: string,
  submitted: SubmittedData,
) {
  const form = await getForm(formKey);
  if (!form.active) throw new ApiError("not_found", "사용할 수 없는 폼입니다.", 404);

  const db = supabaseAdmin();
  const { data: dup } = await db
    .from("form_submissions")
    .select("id")
    .eq("form_id", form.id)
    .eq("user_id", userId)
    .eq("status", "pending")
    .maybeSingle();
  if (dup) throw new ApiError("conflict", "이미 검토 대기 중인 제출이 있어요.", 409);

  const answers: Record<string, unknown> = { author_name: authorName };
  for (const f of form.fields) {
    const v = submitted.values[f.name];
    if (f.type === "image") {
      const ids = Array.isArray(v) ? (v as string[]) : v ? [String(v)] : [];
      const att = ids.map((id) => submitted.attachments[id]).find(Boolean);
      if (att) answers[f.name] = await rehostToEvidence(db, userId, f.name, att);
      else if (f.required) throw new ApiError("invalid", `${f.label}을(를) 첨부해주세요.`);
      else answers[f.name] = null;
    } else if (f.type === "number") {
      const s = v == null ? "" : String(v).trim();
      if (f.required && !s) throw new ApiError("invalid", `${f.label}을(를) 입력해주세요.`);
      if (s && !Number.isFinite(Number(s))) throw new ApiError("invalid", `${f.label}은(는) 숫자여야 해요.`);
      answers[f.name] = s ? Number(s) : null;
    } else {
      const s = Array.isArray(v) ? String(v[0] ?? "") : v == null ? "" : String(v);
      const t = s.trim();
      if (f.required && !t) throw new ApiError("invalid", `${f.label}을(를) 입력해주세요.`);
      answers[f.name] = f.type === "checkbox" ? t === "true" || t === "on" || t === "1" : t;
    }
  }

  const status = form.requiresApproval ? "pending" : "approved";
  const { data, error } = await db
    .from("form_submissions")
    .insert({ form_id: form.id, form_key: form.key, user_id: userId, answers, status, source: "discord" })
    .select("id")
    .single();
  if (error) throw new ApiError("db", "제출에 실패했어요.", 500);

  if (status === "approved") await runOnApprove(form, userId, answers, userId);

  await db.from("audit_log").insert({
    actor_id: userId,
    action: "submission.create",
    target_type: "form_submission",
    target_id: data.id,
    detail: { form: form.key, via: "discord_modal" },
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
  const db = supabaseAdmin();
  let q = db
    .from("form_submissions")
    .select(
      "id, form_id, form_key, user_id, answers, status, review_note, source, discord_message_id, created_at, forms:form_id(title)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });
  if (opts.formKey) q = q.eq("form_key", opts.formKey);
  if (opts.status) q = q.eq("status", opts.status);
  if (opts.source) q = q.eq("source", opts.source);

  const { data, count } = await q.range(opts.offset, opts.offset + opts.limit - 1);
  const items = data ?? [];

  // Attach submitter info for web submissions. (user_id has no FK — discord
  // authors may not be site users — so we merge manually instead of embedding.)
  const ids = [...new Set(items.filter((i) => i.source === "web" && i.user_id).map((i) => i.user_id as string))];
  let userMap: Record<
    string,
    { username: string; global_name: string | null; guild_nick: string | null; avatar: string | null; blocked: boolean }
  > = {};
  if (ids.length) {
    const { data: users } = await db
      .from("users")
      .select("discord_id, username, global_name, guild_nick, avatar, blocked")
      .in("discord_id", ids);
    userMap = Object.fromEntries(
      (users ?? []).map((u) => [
        u.discord_id,
        {
          username: u.username,
          global_name: u.global_name,
          guild_nick: u.guild_nick,
          avatar: u.avatar,
          blocked: !!u.blocked,
        },
      ]),
    );
  }
  const withUser = items.map((i) => ({ ...i, user: i.user_id ? userMap[i.user_id as string] ?? null : null }));

  return { items: withUser, total: count ?? 0, limit: opts.limit, offset: opts.offset };
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

/**
 * 디스코드 계정 차단/해제. 차단은 거절과 별개로, 해당 계정의 가입 신청 자체를 막는다.
 * 차단 시 검토 대기 중(pending)인 제출은 큐에서 빠지도록 함께 반려 처리한다.
 */
export async function setUserBlocked(targetId: string, actorId: string, blocked: boolean, reason: string) {
  const db = supabaseAdmin();
  const { data: u } = await db.from("users").select("discord_id").eq("discord_id", targetId).maybeSingle();
  if (!u) throw new ApiError("not_found", "대상 사용자를 찾을 수 없습니다.", 404);

  await db
    .from("users")
    .update({
      blocked,
      blocked_reason: blocked ? reason || null : null,
      blocked_by: blocked ? actorId : null,
      blocked_at: blocked ? new Date().toISOString() : null,
    })
    .eq("discord_id", targetId);

  if (blocked) {
    // 대기 중 신청은 반려로 정리(이력은 남는다).
    await db
      .from("form_submissions")
      .update({
        status: "rejected",
        reviewer_id: actorId,
        review_note: reason ? `차단: ${reason}` : "차단됨",
        reviewed_at: new Date().toISOString(),
      })
      .eq("user_id", targetId)
      .eq("status", "pending");
  }

  await db.from("audit_log").insert({
    actor_id: actorId,
    action: blocked ? "user.block" : "user.unblock",
    target_type: "user",
    target_id: targetId,
    detail: { reason },
  });
  return { id: targetId, blocked };
}
