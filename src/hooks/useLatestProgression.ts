import { useState, useEffect, useCallback } from "react";
import { getLatestProgression, LatestProgression } from "@/services/progressionService";

interface UseLatestProgressionResult {
  data: LatestProgression | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useLatestProgression(exerciseId: string | null): UseLatestProgressionResult {
  const [data, setData] = useState<LatestProgression | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (id: string, signal: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getLatestProgression(id);
      if (!signal.aborted) {
        setData(result);
      }
    } catch (err) {
      if (!signal.aborted) {
        setError(err instanceof Error ? err.message : "Erro ao carregar progressão");
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!exerciseId) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    fetch(exerciseId, controller.signal);

    return () => controller.abort();
  }, [exerciseId, fetch]);

  const refresh = useCallback(() => {
    if (exerciseId) {
      const controller = new AbortController();
      fetch(exerciseId, controller.signal);
    }
  }, [exerciseId, fetch]);

  return { data, loading, error, refresh };
}
