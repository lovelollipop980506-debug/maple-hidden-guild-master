"use client";
import { useCallback, useEffect, useState } from "react";
import type { ApiError } from "./api";

/**
 * 단순 데이터 로더 — 로딩/빈/에러 상태 + reload 를 제공.
 * 화면 목록/상세에서 GET 호출을 감쌀 때 사용한다.
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableFetcher = useCallback(fetcher, deps);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await stableFetcher());
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setLoading(false);
    }
  }, [stableFetcher]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}
