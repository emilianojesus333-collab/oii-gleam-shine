import { useState, useEffect, useCallback } from "react";
import { getLatestProgressionByName, LatestProgression } from "@/services/progressionService";

interface UseLatestProgressionResult {
  data: LatestProgression | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Fetches the latest progression recommendation for an exercise by name.
 * Only executes when exerciseName is non-empty.
 * Cancels state updates on unmount.
 */
export function useLatestProgression(exerciseName: string | null): UseLatestProgressionResult {
  const [data, setData] = useState<LatestProgression | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchByName = useCallback(async (name: string, signal: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getLatestProgressionByName(name);
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
    if (!exerciseName?.trim()) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    fetchByName(exerciseName, controller.signal);

    return () => controller.abort();
  }, [exerciseName, fetchByName]);

  const refresh = useCallback(() => {
    if (exerciseName?.trim()) {
      const controller = new AbortController();
      fetchByName(exerciseName, controller.signal);
    }
  }, [exerciseName, fetchByName]);

  return { data, loading, error, refresh };
}
