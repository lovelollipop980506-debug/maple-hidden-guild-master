"use client";
import { useCallback, useEffect, useState } from "react";
import { apiGet, ApiError } from "./api";

/**
 * 경로별 응답 캐시. 같은 GET을 다시 마운트하면(페이지 이동 등) 캐시를 즉시
 * 보여주고 백그라운드로 재검증한다 → 사이드바/이미 본 화면이 깜빡이지 않음.
 */
const cache = new Map<string, unknown>();

/** GET 데이터 로더 — data/loading/error/reload. */
export function useApi<T>(path: string | null) {
  const cached = path ? (cache.get(path) as T | undefined) : undefined;
  const [data, setData] = useState<T | null>(cached ?? null);
  const [loading, setLoading] = useState(!!path && cached === undefined);
  const [error, setError] = useState<ApiError | null>(null);

  const reload = useCallback(async () => {
    if (!path) return;
    if (cache.get(path) === undefined) setLoading(true);
    setError(null);
    try {
      const d = await apiGet<T>(path);
      cache.set(path, d);
      setData(d);
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}
