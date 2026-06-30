"use client";
// 공용 API 클라이언트. same-origin 쿠키 세션. 성공 data 반환 / 실패 ApiError throw.

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

type Envelope<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } };

function toLogin() {
  if (typeof window === "undefined") return;
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `/login?next=${next}`;
}

async function handle<T>(res: Response): Promise<T> {
  let body: Envelope<T> | null = null;
  try {
    body = (await res.json()) as Envelope<T>;
  } catch {
    if (res.status === 401) toLogin();
    throw new ApiError("parse_error", "응답을 해석할 수 없습니다.", res.status);
  }
  if (body.ok) return body.data;
  if (res.status === 401) toLogin();
  throw new ApiError(body.error?.code ?? "unknown", body.error?.message ?? "오류가 발생했습니다.", res.status);
}

export async function apiGet<T>(path: string): Promise<T> {
  return handle<T>(await fetch(path, { credentials: "same-origin" }));
}

async function send<T>(path: string, method: string, json?: unknown): Promise<T> {
  return handle<T>(
    await fetch(path, {
      method,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: json === undefined ? undefined : JSON.stringify(json),
    }),
  );
}

export const apiPost = <T>(path: string, json?: unknown) => send<T>(path, "POST", json);
export const apiPut = <T>(path: string, json?: unknown) => send<T>(path, "PUT", json);
export const apiDelete = <T>(path: string) => send<T>(path, "DELETE");

export async function apiPostForm<T>(path: string, form: FormData): Promise<T> {
  return handle<T>(await fetch(path, { method: "POST", credentials: "same-origin", body: form }));
}
