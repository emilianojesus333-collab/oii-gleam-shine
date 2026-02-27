import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface WeeklyPerformance {
  totalSessions: number;
  progressCount: number;
  maintainCount: number;
  deloadCount: number;
  avgScore: number | null;
}

export function useWeeklyPerformance() {
  const { user } = useAuth();
  const [data, setData] = useState<WeeklyPerformance | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async (signal: AbortSignal) => {
    if (!user) return;
    setLoading(true);

    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const dateStr = sevenDaysAgo.toISOString().split("T")[0];

      // Two parallel queries: sessions count + progression logs
      const [sessionsRes, logsRes] = await Promise.all([
        supabase
          .from("workout_sessions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "completed")
          .gte("date", dateStr),
        supabase
          .from("progression_logs")
          .select("decision, score, session_id")
          .eq("user_id", user.id)
          .gte("created_at", `${dateStr}T00:00:00Z`),
      ]);

      if (signal.aborted) return;

      const totalSessions = sessionsRes.count ?? 0;
      const logs = logsRes.data ?? [];

      let progressCount = 0;
      let maintainCount = 0;
      let deloadCount = 0;
      let scoreSum = 0;

      for (const log of logs) {
        scoreSum += Number(log.score);
        if (log.decision === "progress") progressCount++;
        else if (log.decision === "maintain") maintainCount++;
        else if (log.decision === "deload") deloadCount++;
      }

      if (!signal.aborted) {
        setData({
          totalSessions,
          progressCount,
          maintainCount,
          deloadCount,
          avgScore: logs.length > 0 ? Math.round(scoreSum / logs.length) : null,
        });
      }
    } catch {
      // silent fail
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(controller.signal);
    return () => controller.abort();
  }, [fetch]);

  return { data, loading };
}
