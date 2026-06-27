"use client";

// This utility intentionally keys its effect on caller-provided `deps` rather
// than a literal array, so the exhaustive-deps heuristic can't verify it.
/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useState } from "react";

// Minimal data-loading helper: runs `fn`, tracks loading/error, exposes reload.
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const run = useCallback(() => {
    setLoading(true);
    setError("");
    fn()
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "error"))
      .finally(() => setLoading(false));
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return { data, loading, error, reload: run, setData };
}
