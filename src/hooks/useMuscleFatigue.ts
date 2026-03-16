import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const MUSCLE_GROUPS = ["peito", "costas", "pernas", "ombros", "braços"] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

const RECOVERY_RATE_PER_HOUR = 1; // 1% per hour

export interface MuscleFatigueEntry {
  muscle_group: MuscleGroup;
  fatigue_pct: number; // stored value (at last_trained_at time)
  last_trained_at: string | null;
  current_fatigue: number; // computed with time-based recovery
  status: "recovered" | "almost_recovered" | "recovering" | "fatigued";
  hours_to_recovery: number;
}

function getStatus(pct: number): MuscleFatigueEntry["status"] {
  if (pct <= 20) return "recovered";
  if (pct <= 40) return "almost_recovered";
  if (pct <= 70) return "recovering";
  return "fatigued";
}

function getStatusLabel(status: MuscleFatigueEntry["status"]): string {
  switch (status) {
    case "recovered": return "Recuperado";
    case "almost_recovered": return "Quase recuperado";
    case "recovering": return "Em recuperação";
    case "fatigued": return "Fatigado";
  }
}

function getStatusColor(status: MuscleFatigueEntry["status"]): string {
  switch (status) {
    case "recovered": return "text-emerald-500";
    case "almost_recovered": return "text-blue-400";
    case "recovering": return "text-amber-500";
    case "fatigued": return "text-red-500";
  }
}

function getStatusDotColor(status: MuscleFatigueEntry["status"]): string {
  switch (status) {
    case "recovered": return "bg-emerald-500";
    case "almost_recovered": return "bg-blue-400";
    case "recovering": return "bg-amber-500";
    case "fatigued": return "bg-red-500";
  }
}

function getMuscleLabel(group: MuscleGroup): string {
  switch (group) {
    case "peito": return "Peito";
    case "costas": return "Costas";
    case "pernas": return "Pernas";
    case "ombros": return "Ombros";
    case "braços": return "Braços";
  }
}

function computeCurrentFatigue(storedPct: number, lastTrainedAt: string | null): number {
  if (!lastTrainedAt || storedPct <= 0) return 0;
  const hoursSince = (Date.now() - new Date(lastTrainedAt).getTime()) / (1000 * 60 * 60);
  const recovered = hoursSince * RECOVERY_RATE_PER_HOUR;
  return Math.max(0, storedPct - recovered);
}

export function useMuscleFatigue() {
  const { user } = useAuth();
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetchData = async () => {
      const { data } = await supabase
        .from("muscle_fatigue")
        .select("muscle_group, fatigue_pct, last_trained_at, updated_at")
        .eq("user_id", user.id);
      setRawData(data || []);
      setLoading(false);
    };

    fetchData();

    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const muscles = useMemo((): MuscleFatigueEntry[] => {
    const dataMap = new Map(rawData.map((d) => [d.muscle_group, d]));

    return MUSCLE_GROUPS.map((group) => {
      const row = dataMap.get(group);
      const storedPct = row?.fatigue_pct ?? 0;
      const lastTrained = row?.last_trained_at ?? null;
      const current = Math.round(computeCurrentFatigue(storedPct, lastTrained));
      const hoursToRecovery = current > 0 ? current / RECOVERY_RATE_PER_HOUR : 0;

      return {
        muscle_group: group,
        fatigue_pct: storedPct,
        last_trained_at: lastTrained,
        current_fatigue: current,
        status: getStatus(current),
        hours_to_recovery: Math.round(hoursToRecovery),
      };
    });
  }, [rawData]);

  const fatigued = useMemo(() => muscles.filter((m) => m.current_fatigue > 70), [muscles]);
  const mostRecovered = useMemo(
    () => [...muscles].sort((a, b) => a.current_fatigue - b.current_fatigue).slice(0, 2),
    [muscles]
  );

  return { muscles, fatigued, mostRecovered, loading };
}

export { getStatusLabel, getStatusColor, getStatusDotColor, getMuscleLabel, MUSCLE_GROUPS };
