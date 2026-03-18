import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserSettings } from "@/hooks/useUserSettings";

export interface WeeklyIntensityDay {
  label: string;
  value: number;
  level: "rest" | "low" | "medium" | "high";
}

export interface WeeklyStats {
  completedSessions: number;
  plannedSessions: number;
  totalSets: number;
  totalReps: number;
  totalMinutes: number;
  dailyActivity: boolean[];
  intensityWeek: WeeklyIntensityDay[];
  prevSets: number;
  prevReps: number;
  prevMinutes: number;
  prevSessions: number;
}

const shortDayMap = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function useWeeklyStats() {
  const { user } = useAuth();
  const { settings } = useUserSettings();
  const [data, setData] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async (signal: AbortSignal) => {
    if (!user) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

      const thisMonday = new Date(now);
      thisMonday.setDate(now.getDate() + mondayOffset);
      thisMonday.setHours(0, 0, 0, 0);

      const thisSunday = new Date(thisMonday);
      thisSunday.setDate(thisMonday.getDate() + 6);
      thisSunday.setHours(23, 59, 59, 999);

      const lastMonday = new Date(thisMonday);
      lastMonday.setDate(thisMonday.getDate() - 7);

      const lastSunday = new Date(thisMonday);
      lastSunday.setDate(thisMonday.getDate() - 1);
      lastSunday.setHours(23, 59, 59, 999);

      const lastSevenStart = new Date(now);
      lastSevenStart.setDate(now.getDate() - 6);
      lastSevenStart.setHours(0, 0, 0, 0);

      const fmt = (d: Date) => d.toISOString().split("T")[0];

      const [thisWeekRes, lastWeekRes, thisSetsRes, lastSetsRes, lastSevenSessionsRes, lastSevenSetsRes] = await Promise.all([
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
        supabase
          .from("workout_sessions")
          .select("id, date")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .gte("date", fmt(lastSevenStart))
          .lte("date", fmt(now)),
        supabase
          .from("workout_sets")
          .select("reps, weight, session_id")
          .eq("user_id", user.id)
          .gte("created_at", lastSevenStart.toISOString())
          .lte("created_at", now.toISOString()),
      ]);

      if (signal.aborted) return;

      const thisSessions = thisWeekRes.data ?? [];
      const lastSessions = lastWeekRes.data ?? [];
      const thisSets = thisSetsRes.data ?? [];
      const lastSets = lastSetsRes.data ?? [];
      const lastSevenSessions = lastSevenSessionsRes.data ?? [];
      const lastSevenSets = lastSevenSetsRes.data ?? [];

      const schedule = settings?.onboarding_data?.schedule || {};
      const weekDaysMap: Record<number, string> = {
        0: "Domingo",
        1: "Segunda-feira",
        2: "Terça-feira",
        3: "Quarta-feira",
        4: "Quinta-feira",
        5: "Sexta-feira",
        6: "Sábado",
      };

      let planned = 0;
      for (let i = 0; i < 7; i++) {
        const dayName = weekDaysMap[i];
        const groups = (schedule as Record<string, unknown>)[dayName];
        if (groups && groups !== "Descanso" && !(Array.isArray(groups) && groups.length === 0)) {
          planned++;
        }
      }

      const dailyActivity = Array(7).fill(false);
      for (const session of thisSessions) {
        const date = new Date(session.date);
        const dayIndex = date.getDay();
        const normalizedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
        dailyActivity[normalizedIndex] = true;
      }

      const estimateMinutes = (sessions: typeof thisSessions) => sessions.length * 45;

      const sessionDateById = new Map(lastSevenSessions.map((session) => [session.id, session.date]));
      const volumeByDate = new Map<string, number>();

      for (const set of lastSevenSets) {
        const sessionDate = sessionDateById.get(set.session_id);
        if (!sessionDate) continue;
        const currentVolume = volumeByDate.get(sessionDate) ?? 0;
        const setVolume = Number(set.reps ?? 0) * Number(set.weight ?? 0);
        volumeByDate.set(sessionDate, currentVolume + setVolume);
      }

      const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(lastSevenStart);
        date.setDate(lastSevenStart.getDate() + index);
        return date;
      });

      const rawVolumes = lastSevenDays.map((date) => volumeByDate.get(fmt(date)) ?? 0);
      const maxVolume = Math.max(...rawVolumes, 1);

      const intensityWeek: WeeklyIntensityDay[] = lastSevenDays.map((date, index) => {
        const volume = rawVolumes[index];
        const ratio = volume > 0 ? volume / maxVolume : 0;
        const level = volume === 0 ? "rest" : ratio < 0.4 ? "low" : ratio < 0.75 ? "medium" : "high";
        const value = volume === 0 ? 12 : Math.round(24 + ratio * 76);

        return {
          label: shortDayMap[date.getDay()],
          value,
          level,
        };
      });

      const totalSets = thisSets.length;
      const totalReps = thisSets.reduce((sum, set) => sum + (set.reps || 0), 0);

      setData({
        completedSessions: thisSessions.length,
        plannedSessions: planned,
        totalSets,
        totalReps,
        totalMinutes: estimateMinutes(thisSessions),
        dailyActivity,
        intensityWeek,
        prevSets: lastSets.length,
        prevReps: lastSets.reduce((sum, set) => sum + (set.reps || 0), 0),
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
