import { supabaseAdmin } from "@/lib/supabase/server";
import { ApiError } from "@/lib/api/respond";

export async function listNotices(opts: { includeInactive?: boolean } = {}) {
  let q = supabaseAdmin()
    .from("notices")
    .select("id, title, body, notice_date, active, sort, created_at")
    .order("sort", { ascending: true })
    .order("created_at", { ascending: false });
  if (!opts.includeInactive) q = q.eq("active", true);
  const { data } = await q;
  return data ?? [];
}

export async function createNotice(input: { title: string; body?: string; noticeDate?: string | null }, by: string) {
  const title = (input.title ?? "").trim();
  if (!title) throw new ApiError("invalid", "공지 제목을 입력하세요.");
  const { data, error } = await supabaseAdmin()
    .from("notices")
    .insert({ title, body: input.body ?? "", notice_date: input.noticeDate || null, created_by: by })
    .select("*")
    .single();
  if (error) throw new ApiError("db", "저장에 실패했습니다.", 500);
  return data;
}

export async function updateNotice(
  id: string,
  input: { title?: string; body?: string; noticeDate?: string | null; active?: boolean; sort?: number },
) {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.title !== undefined) patch.title = String(input.title).trim();
  if (input.body !== undefined) patch.body = input.body;
  if (input.noticeDate !== undefined) patch.notice_date = input.noticeDate || null;
  if (input.active !== undefined) patch.active = input.active;
  if (input.sort !== undefined) patch.sort = input.sort;
  const { data, error } = await supabaseAdmin().from("notices").update(patch).eq("id", id).select("*").maybeSingle();
  if (error) throw new ApiError("db", "수정에 실패했습니다.", 500);
  if (!data) throw new ApiError("not_found", "공지를 찾을 수 없습니다.", 404);
  return data;
}

export async function deleteNotice(id: string) {
  const { error } = await supabaseAdmin().from("notices").delete().eq("id", id);
  if (error) throw new ApiError("db", "삭제에 실패했습니다.", 500);
  return { ok: true };
}
