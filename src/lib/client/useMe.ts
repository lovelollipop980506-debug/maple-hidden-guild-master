"use client";
import { useApi } from "./useApi";
import type { Me } from "./types";

/** 현재 로그인 사용자(/api/v1/me). 미로그인 시 error(401). */
export function useMe() {
  const { data, loading, error, reload } = useApi<Me>("/api/v1/me");
  return { me: data, loading, error, reload };
}
