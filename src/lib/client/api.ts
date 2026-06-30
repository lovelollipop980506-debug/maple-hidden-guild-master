"use client";
// 공용 API 클라이언트. 모든 호출은 same-origin 쿠키 세션을 사용한다.
// 성공: { ok:true, data } → data 반환 / 실패: { ok:false, error } → ApiError throw.

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

type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } };

function redirectToLogin() {
  if (typeof window === "undefined") return;
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `/login?next=${next}`;
}

async function handle<T>(res: Response): Promise<T> {
  let body: ApiResponse<T> | null = null;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    if (res.status === 401) redirectToLogin();
    throw new ApiError("parse_error", "응답을 해석할 수 없습니다.", res.status);
  }
  if (body.ok) return body.data;

  const { code, message } = body.error ?? { code: "unknown", message: "알 수 없는 오류가 발생했습니다." };
  if (res.status === 401) {
    redirectToLogin();
  }
  throw new ApiError(code, message, res.status);
}

const BASE: RequestInit = { credentials: "same-origin", headers: { Accept: "application/json" } };

export function apiGet<T>(path: string): Promise<T> {
  return fetch(path, { ...BASE, method: "GET" }).then((r) => handle<T>(r));
}

export function apiPost<T>(path: string, json?: unknown): Promise<T> {
  return fetch(path, {
    ...BASE,
    method: "POST",
    headers: { ...BASE.headers, "Content-Type": "application/json" },
    body: json != null ? JSON.stringify(json) : undefined,
  }).then((r) => handle<T>(r));
}

export function apiPostForm<T>(path: string, fd: FormData): Promise<T> {
  // multipart — Content-Type 은 브라우저가 boundary 와 함께 자동 설정한다(직접 지정 금지).
  return fetch(path, { ...BASE, method: "POST", body: fd }).then((r) => handle<T>(r));
}

export function apiPut<T>(path: string, json?: unknown): Promise<T> {
  return fetch(path, {
    ...BASE,
    method: "PUT",
    headers: { ...BASE.headers, "Content-Type": "application/json" },
    body: json != null ? JSON.stringify(json) : undefined,
  }).then((r) => handle<T>(r));
}

export function apiDelete<T>(path: string): Promise<T> {
  return fetch(path, { ...BASE, method: "DELETE" }).then((r) => handle<T>(r));
}
