"use client";
import { useCallback, useEffect, useState } from "react";
import { apiGet, ApiError } from "./api";
import type { Me } from "./types";

/** 현재 사용자/등급. GET /api/v1/me 를 로딩/에러와 함께 반환. */
export function useMe() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMe(await apiGet<Me>("/api/v1/me"));
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { me, loading, error, reload };
}
