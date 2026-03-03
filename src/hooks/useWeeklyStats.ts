import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserSettings } from "@/hooks/useUserSettings";

export interface WeeklyStats {
  completedSessions: number;
  plannedSessions: number;
  totalSets: number;
  totalReps: number;
  totalMinutes: number;
  dailyActivity: boolean[]; // 7 booleans, Mon-Sun
  // Previous week for trend comparison
  prevSets: number;
  prevReps: number;
  prevMinutes: number;
  prevSessions: number;
}

export function useWeeklyStats() {
  const { user } = useAuth();
  const { settings } = useUserSettings();
  const [data, setData] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async (signal: AbortSignal) => {
    if (!user) return;
    setLoading(true);

    try {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0=Sun
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

      // This week Mon-Sun
      const thisMonday = new Date(now);
      thisMonday.setDate(now.getDate() + mondayOffset);
      thisMonday.setHours(0, 0, 0, 0);

      const thisSunday = new Date(thisMonday);
      thisSunday.setDate(thisMonday.getDate() + 6);
      thisSunday.setHours(23, 59, 59, 999);

      // Last week Mon-Sun
      const lastMonday = new Date(thisMonday);
      lastMonday.setDate(thisMonday.getDate() - 7);

      const lastSunday = new Date(thisMonday);
      lastSunday.setDate(thisMonday.getDate() - 1);
      lastSunday.setHours(23, 59, 59, 999);

      const fmt = (d: Date) => d.toISOString().split("T")[0];

      const [thisWeekRes, lastWeekRes, thisSetsRes, lastSetsRes] = await Promise.all([
        supabase
          .from("workout_sessions")
          .select("id, date, exercise_logs")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .gte("date", fmt(thisMonday))
          .lte("date", fmt(thisSunday)),
        supabase
          .from("workout_sessions")
          .select("id, date, exercise_logs")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .gte("date", fmt(lastMonday))
          .lte("date", fmt(lastSunday)),
        supabase
          .from("workout_sets")
          .select("reps, weight, session_id")
          .eq("user_id", user.id)
          .gte("created_at", thisMonday.toISOString())
          .lte("created_at", thisSunday.toISOString()),
        supabase
          .from("workout_sets")
          .select("reps, weight, session_id")
          .eq("user_id", user.id)
          .gte("created_at", lastMonday.toISOString())
          .lte("created_at", lastSunday.toISOString()),
      ]);

      if (signal.aborted) return;

      const thisSessions = thisWeekRes.data ?? [];
      const lastSessions = lastWeekRes.data ?? [];
      const thisSets = thisSetsRes.data ?? [];
      const lastSets = lastSetsRes.data ?? [];

      // Calculate planned sessions from schedule
      const schedule = settings?.onboarding_data?.schedule || {};
      const weekDaysMap: Record<number, string> = {
        0: "Domingo", 1: "Segunda-feira", 2: "Terça-feira",
        3: "Quarta-feira", 4: "Quinta-feira", 5: "Sexta-feira", 6: "Sábado",
      };
      let planned = 0;
      for (let i = 0; i < 7; i++) {
        const dayName = weekDaysMap[i];
        const groups = (schedule as Record<string, unknown>)[dayName];
        if (groups && groups !== "Descanso" && !(Array.isArray(groups) && groups.length === 0)) {
          planned++;
        }
      }

      // Daily activity (Mon=0 ... Sun=6)
      const dailyActivity = Array(7).fill(false);
      for (const s of thisSessions) {
        const d = new Date(s.date);
        const di = d.getDay(); // 0=Sun
        const idx = di === 0 ? 6 : di - 1; // Mon=0
        dailyActivity[idx] = true;
      }

      // Estimate minutes: ~2 min per set as rough estimate, or use session count * 45
      const estimateMinutes = (sessions: typeof thisSessions) =>
        sessions.length * 45; // rough average

      const totalSets = thisSets.length;
      const totalReps = thisSets.reduce((s, set) => s + (set.reps || 0), 0);

      setData({
        completedSessions: thisSessions.length,
        plannedSessions: planned,
        totalSets,
        totalReps,
        totalMinutes: estimateMinutes(thisSessions),
        dailyActivity,
        prevSets: lastSets.length,
        prevReps: lastSets.reduce((s, set) => s + (set.reps || 0), 0),
        prevMinutes: estimateMinutes(lastSessions),
        prevSessions: lastSessions.length,
      });
    } catch {
      // silent
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [user, settings]);

  useEffect(() => {
    const controller = new AbortController();
    fetchStats(controller.signal);
    return () => controller.abort();
  }, [fetchStats]);

  return { data, loading };
}
