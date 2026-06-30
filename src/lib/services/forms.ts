import { supabaseAdmin } from "@/lib/supabase/server";
import { ApiError } from "@/lib/api/respond";
import type { Tier } from "@/lib/rbac";

export type FieldType = "text" | "textarea" | "number" | "select" | "checkbox" | "image";

export type FormField = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[]; // for select
};

export type OnApprove = {
  grantRoleId?: string;
  awardPointsField?: string;
  awardPointsFixed?: number;
  // 멤버 로스터 등록 (가입 승인): answers[nickField] 로 member 생성
  registerMember?: { nickField: string; attrFields?: Record<string, string>; defaults?: Record<string, unknown> };
  // 멤버 길드 스킬 증가 (인증 승인): members.attributes.skills[answers[skillField]] += answers[countField]
  incrementMemberSkill?: { nickField: string; skillField: string; countField: string; max?: number };
};

export type Form = {
  id: string;
  key: string;
  title: string;
  description: string | null;
  fields: FormField[];
  intake: "web" | "discord";
  discordChannelId: string | null;
  submitMinTier: Tier;
  requiresApproval: boolean;
  onApprove: OnApprove;
  active: boolean;
  sort: number;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToForm(r: any): Form {
  return {
    id: r.id,
    key: r.key,
    title: r.title,
    description: r.description ?? null,
    fields: (r.fields ?? []) as FormField[],
    intake: r.intake,
    discordChannelId: r.discord_channel_id ?? null,
    submitMinTier: (r.submit_min_tier ?? "member") as Tier,
    requiresApproval: !!r.requires_approval,
    onApprove: (r.on_approve ?? {}) as OnApprove,
    active: !!r.active,
    sort: r.sort ?? 0,
  };
}

export async function listForms(opts: { includeInactive?: boolean } = {}): Promise<Form[]> {
  let q = supabaseAdmin().from("forms").select("*").order("sort", { ascending: true });
  if (!opts.includeInactive) q = q.eq("active", true);
  const { data } = await q;
  return (data ?? []).map(rowToForm);
}

export async function getForm(key: string): Promise<Form> {
  const { data } = await supabaseAdmin().from("forms").select("*").eq("key", key).maybeSingle();
  if (!data) throw new ApiError("not_found", "폼을 찾을 수 없습니다.", 404);
  return rowToForm(data);
}

export async function getFormById(id: string): Promise<Form> {
  const { data } = await supabaseAdmin().from("forms").select("*").eq("id", id).maybeSingle();
  if (!data) throw new ApiError("not_found", "폼을 찾을 수 없습니다.", 404);
  return rowToForm(data);
}

export type FormInput = Partial<Omit<Form, "id">> & { key?: string };

function validateFields(fields: unknown): FormField[] {
  if (!Array.isArray(fields)) throw new ApiError("invalid", "fields는 배열이어야 합니다.");
  const seen = new Set<string>();
  return fields.map((f: any) => {
    if (!f?.name || !f?.label || !f?.type) throw new ApiError("invalid", "필드는 name/label/type이 필요합니다.");
    if (seen.has(f.name)) throw new ApiError("invalid", `중복 필드명: ${f.name}`);
    seen.add(f.name);
    return {
      name: String(f.name),
      label: String(f.label),
      type: f.type as FieldType,
      required: !!f.required,
      options: Array.isArray(f.options) ? f.options.map(String) : undefined,
    };
  });
}

export async function createForm(input: FormInput, createdBy: string): Promise<Form> {
  const key = (input.key ?? "").trim();
  if (!key || !/^[a-z0-9_]+$/.test(key)) {
    throw new ApiError("invalid", "key는 영문 소문자/숫자/_ 만 사용할 수 있습니다.");
  }
  if (!input.title?.trim()) throw new ApiError("invalid", "제목을 입력해주세요.");

  const { data, error } = await supabaseAdmin()
    .from("forms")
    .insert({
      key,
      title: input.title.trim(),
      description: input.description ?? null,
      fields: validateFields(input.fields ?? []),
      intake: input.intake ?? "web",
      discord_channel_id: input.discordChannelId ?? null,
      submit_min_tier: input.submitMinTier ?? "member",
      requires_approval: input.requiresApproval ?? true,
      on_approve: input.onApprove ?? {},
      active: input.active ?? true,
      sort: input.sort ?? 0,
      created_by: createdBy,
    })
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505") throw new ApiError("conflict", "이미 존재하는 key입니다.", 409);
    throw new ApiError("db", "생성에 실패했습니다.", 500);
  }
  return rowToForm(data);
}

export async function updateForm(key: string, input: FormInput, by: string): Promise<Form> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: by };
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.fields !== undefined) patch.fields = validateFields(input.fields);
  if (input.intake !== undefined) patch.intake = input.intake;
  if (input.discordChannelId !== undefined) patch.discord_channel_id = input.discordChannelId || null;
  if (input.submitMinTier !== undefined) patch.submit_min_tier = input.submitMinTier;
  if (input.requiresApproval !== undefined) patch.requires_approval = input.requiresApproval;
  if (input.onApprove !== undefined) patch.on_approve = input.onApprove;
  if (input.active !== undefined) patch.active = input.active;
  if (input.sort !== undefined) patch.sort = input.sort;

  const { data, error } = await supabaseAdmin()
    .from("forms")
    .update(patch)
    .eq("key", key)
    .select("*")
    .maybeSingle();
  if (error) throw new ApiError("db", "수정에 실패했습니다.", 500);
  if (!data) throw new ApiError("not_found", "폼을 찾을 수 없습니다.", 404);
  return rowToForm(data);
}

export async function setFormActive(key: string, active: boolean, by: string): Promise<Form> {
  return updateForm(key, { active }, by);
}
