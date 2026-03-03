import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserSettings } from "@/hooks/useUserSettings";

export interface WeeklyStats {
  // Sessions
  completedSessions: number;
  plannedSessions: number;
  completionPercent: number;
  // Volume
  totalSets: number;
  totalReps: number;
  totalMinutes: number;
  // Daily breakdown (last 7 days, Mon-Sun)
  dailySessions: { day: string; count: number }[];
  // Trend vs previous week
  volumeTrendPct: number;      // % change in sets
  consistencyTrendPct: number; // % change in completion rate
  frequencyTrendPct: number;   // % change in session count
}

const SHORT_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

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
      // Start of this week (Monday)
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const thisMonday = new Date(now);
      thisMonday.setDate(now.getDate() + mondayOffset);
      thisMonday.setHours(0, 0, 0, 0);
      const thisMondayStr = thisMonday.toISOString().split("T")[0];

      // Previous week
      const prevMonday = new Date(thisMonday);
      prevMonday.setDate(prevMonday.getDate() - 7);
      const prevMondayStr = prevMonday.toISOString().split("T")[0];
      const prevSunday = new Date(thisMonday);
      prevSunday.setDate(prevSunday.getDate() - 1);
      const prevSundayStr = prevSunday.toISOString().split("T")[0];

      // Fetch this week + previous week sessions in parallel
      const [thisWeekRes, prevWeekRes] = await Promise.all([
        supabase
          .from("workout_sessions")
          .select("date, exercise_logs, total_exercises, completion_rate")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .gte("date", thisMondayStr),
        supabase
          .from("workout_sessions")
          .select("date, exercise_logs, total_exercises, completion_rate")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .gte("date", prevMondayStr)
          .lte("date", prevSundayStr),
      ]);

      if (signal.aborted) return;

      const thisWeek = thisWeekRes.data ?? [];
      const prevWeek = prevWeekRes.data ?? [];

      // Calculate planned sessions from schedule
      const schedule = settings?.onboarding_data?.schedule || {};
      const weekDays = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
      let plannedSessions = 0;
      weekDays.forEach(day => {
        const val = schedule[day];
        if (val) {
          if (Array.isArray(val)) {
            if (val.length > 0 && !(val.length === 1 && val[0] === "Descanso")) plannedSessions++;
          } else if (val !== "Descanso") {
            plannedSessions++;
          }
        }
      });
      if (plannedSessions === 0) plannedSessions = 5; // fallback

      // Volume calculations
      let totalSets = 0;
      let totalReps = 0;
      let totalRestSeconds = 0;

      thisWeek.forEach(session => {
        const logs = Array.isArray(session.exercise_logs) ? session.exercise_logs : [];
        logs.forEach((log: any) => {
          totalSets += log.sets || log.set_count || 0;
          totalReps += (log.reps || 0) * (log.sets || log.set_count || 1);
          totalRestSeconds += (log.restTime || log.rest_time || 0) * (log.sets || log.set_count || 1);
        });
      });

      const workSeconds = totalSets * 45;
      const totalMinutes = Math.round((workSeconds + totalRestSeconds) / 60);

      // Previous week volume
      let prevSets = 0;
      prevWeek.forEach(session => {
        const logs = Array.isArray(session.exercise_logs) ? session.exercise_logs : [];
        logs.forEach((log: any) => {
          prevSets += log.sets || log.set_count || 0;
        });
      });

      // Trends
      const volumeTrendPct = prevSets > 0 ? Math.round(((totalSets - prevSets) / prevSets) * 100) : 0;
      const consistencyTrendPct = prevWeek.length > 0
        ? Math.round(((thisWeek.length / plannedSessions - prevWeek.length / plannedSessions) / (prevWeek.length / plannedSessions)) * 100)
        : 0;
      const frequencyTrendPct = prevWeek.length > 0
        ? Math.round(((thisWeek.length - prevWeek.length) / prevWeek.length) * 100)
        : 0;

      // Daily breakdown
      const dailySessions: { day: string; count: number }[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(thisMonday);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split("T")[0];
        const count = thisWeek.filter(s => s.date === dateStr).length;
        dailySessions.push({ day: SHORT_DAYS[d.getDay()], count });
      }

      const completedSessions = thisWeek.length;
      const completionPercent = plannedSessions > 0
        ? Math.min(Math.round((completedSessions / plannedSessions) * 100), 100)
        : 0;

      if (!signal.aborted) {
        setData({
          completedSessions,
          plannedSessions,
          completionPercent,
          totalSets,
          totalReps,
          totalMinutes,
          dailySessions,
          volumeTrendPct,
          consistencyTrendPct,
          frequencyTrendPct,
        });
      }
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
