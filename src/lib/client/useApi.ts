"use client";
import { useCallback, useEffect, useState } from "react";
import { apiGet, ApiError } from "./api";

/**
 * 경로별 응답 캐시 + 구독. 같은 GET을 다시 마운트하면 캐시를 즉시 보여주고
 * 백그라운드 재검증한다(깜빡임 방지). `mutate(path)`를 호출하면 그 경로를 쓰는
 * 모든 컴포넌트가 다시 불러온다 — 예: 인증 승인 후 사이드바 stats 갱신.
 */
const cache = new Map<string, unknown>();
const subscribers = new Map<string, Set<() => void>>();

/** 해당 경로를 구독 중인 모든 useApi 를 재검증시킨다. */
export function mutate(path: string) {
  subscribers.get(path)?.forEach((fn) => fn());
}

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
    if (!path) return;
    let set = subscribers.get(path);
    if (!set) {
      set = new Set();
      subscribers.set(path, set);
    }
    set.add(reload);
    return () => {
      set!.delete(reload);
    };
  }, [path, reload]);

  return { data, loading, error, reload, setData };
}
