import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import {
  buildHydrationSummary,
  clampHydrationGoalLiters,
  estimateWorkoutIntensityFromLogs,
  extractExerciseLogs,
  parseWeightKg,
} from "@/lib/hydration";

const MUSCLE_GROUPS = ["peito", "costas", "pernas", "ombros", "braços"] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export interface MuscleFatigueEntry {
  muscle_group: MuscleGroup;
  fatigue_pct: number;
  last_trained_at: string | null;
  current_fatigue: number;
  status: "recovered" | "almost_recovered" | "recovering" | "fatigued";
  hours_to_recovery: number;
}

function getStatus(pct: number): MuscleFatigueEntry["status"] {
  if (pct <= 20) return "recovered";
  if (pct <= 50) return "almost_recovered";
  if (pct <= 75) return "recovering";
  return "fatigued";
}

function getStatusLabel(status: MuscleFatigueEntry["status"]): string {
  switch (status) {
    case "recovered":
      return "Recuperado";
    case "almost_recovered":
      return "Quase recuperado";
    case "recovering":
      return "Em recuperação";
    case "fatigued":
      return "Fatigado";
  }
}

function getStatusColor(status: MuscleFatigueEntry["status"]): string {
  switch (status) {
    case "recovered":
      return "text-[#2563EB]";
    case "almost_recovered":
      return "text-[hsl(45,93%,47%)]";
    case "recovering":
      return "text-[hsl(270,60%,55%)]";
    case "fatigued":
      return "text-destructive";
  }
}

function getStatusDotColor(status: MuscleFatigueEntry["status"]): string {
  switch (status) {
    case "recovered":
      return "bg-[#2563EB]";
    case "almost_recovered":
      return "bg-[hsl(45,93%,47%)]";
    case "recovering":
      return "bg-[hsl(270,60%,55%)]";
    case "fatigued":
      return "bg-destructive";
  }
}

function getMuscleLabel(group: MuscleGroup): string {
  switch (group) {
    case "peito":
      return "Peito";
    case "costas":
      return "Costas";
    case "pernas":
      return "Pernas";
    case "ombros":
      return "Ombros";
    case "braços":
      return "Braços";
  }
}

function computeCurrentFatigue(
  storedPct: number,
  lastTrainedAt: string | null,
  recoveryRatePerHour: number
): number {
  if (!lastTrainedAt || storedPct <= 0) return 0;
  const hoursSince = (Date.now() - new Date(lastTrainedAt).getTime()) / (1000 * 60 * 60);
  const recovered = hoursSince * recoveryRatePerHour;
  return Math.max(0, storedPct - recovered);
}

export function useMuscleFatigue() {
  const { user } = useAuth();
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hydrationSummary, setHydrationSummary] = useState(() =>
    buildHydrationSummary(0, 1000, null, "none")
  );

  const fetchData = useCallback(async () => {
    if (!user) {
      setRawData([]);
      setHydrationSummary(buildHydrationSummary(0, 1000, null, "none"));
      setLoading(false);
      return;
    }

    try {
      const today = new Date().toISOString().split("T")[0];

      const [fatigueResponse, settingsResponse, sessionsResponse] = await Promise.all([
        supabase
          .from("muscle_fatigue")
          .select("muscle_group, fatigue_pct, last_trained_at, updated_at")
          .eq("user_id", user.id),
        supabase
          .from("user_settings")
          .select("alerts_config, onboarding_data")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("workout_sessions")
          .select("exercise_logs")
          .eq("user_id", user.id)
          .eq("date", today)
          .eq("status", "completed"),
      ]);

      const alertsConfig = settingsResponse.data?.alerts_config as Record<string, any> | null;
      const hydrationSettings = alertsConfig?.hydration ?? {};
      const hydration = buildHydrationSummary(
        Number(hydrationSettings.currentIntake) || 0,
        Number(hydrationSettings.bottleSizeMl) || 1000,
        parseWeightKg(settingsResponse.data?.onboarding_data),
        estimateWorkoutIntensityFromLogs(extractExerciseLogs(sessionsResponse.data ?? [])),
        clampHydrationGoalLiters(hydrationSettings.customDailyGoalLiters ?? hydrationSettings.dailyGoalLiters)
      );

      setRawData(fatigueResponse.data ?? []);
      setHydrationSummary(hydration);
    } catch (error) {
      console.error("Error loading muscle fatigue:", error);
      setRawData([]);
      setHydrationSummary(buildHydrationSummary(0, 1000, null, "none"));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const muscles = useMemo((): MuscleFatigueEntry[] => {
    const dataMap = new Map(rawData.map((d) => [d.muscle_group, d]));

    return MUSCLE_GROUPS.map((group) => {
      const row = dataMap.get(group);
      const storedPct = row?.fatigue_pct ?? 0;
      const lastTrained = row?.last_trained_at ?? null;
      const current = Math.round(
        computeCurrentFatigue(storedPct, lastTrained, hydrationSummary.recoveryRatePerHour)
      );
      const hoursToRecovery = current > 0 ? current / hydrationSummary.recoveryRatePerHour : 0;

      return {
        muscle_group: group,
        fatigue_pct: storedPct,
        last_trained_at: lastTrained,
        current_fatigue: current,
        status: getStatus(current),
        hours_to_recovery: Math.round(hoursToRecovery),
      };
    });
  }, [rawData, hydrationSummary.recoveryRatePerHour]);

  const fatigued = useMemo(() => muscles.filter((m) => m.current_fatigue > 70), [muscles]);
  const mostRecovered = useMemo(
    () => [...muscles].sort((a, b) => a.current_fatigue - b.current_fatigue).slice(0, 2),
    [muscles]
  );

  return {
    muscles,
    fatigued,
    mostRecovered,
    loading,
    hydrationContext: {
      status: hydrationSummary.status,
      message: hydrationSummary.message,
      percentage: Math.round(hydrationSummary.percentage),
      goalLiters: hydrationSummary.goalLiters,
      currentIntakeLiters: hydrationSummary.currentIntakeLiters,
      recoveryRatePerHour: hydrationSummary.recoveryRatePerHour,
    },
  };
}

export { getStatusLabel, getStatusColor, getStatusDotColor, getMuscleLabel, MUSCLE_GROUPS };
