import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface FitnessMetric {
  label: string;
  value: number; // 0–10
  fullMark: 10;
}

export interface FitnessScoreData {
  metrics: FitnessMetric[];
  totalScore: number; // 0–1000
  loading: boolean;
}

export function useFitnessScore(): FitnessScoreData {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["fitness-score", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);

      const [sessionsRes, progressionRes] = await Promise.all([
        supabase
          .from("workout_sessions")
          .select("id, date, status, performance_score, completion_rate, exercise_logs")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
          .order("date", { ascending: true }),
        supabase
          .from("progression_logs")
          .select("decision, score, created_at")
          .eq("user_id", user.id)
          .gte("created_at", thirtyDaysAgo.toISOString()),
      ]);

      const sessions = sessionsRes.data ?? [];
      const progressions = progressionRes.data ?? [];

      // --- Consistency (0-10): based on training frequency ---
      // Ideal: 4+ sessions/week over 30 days → ~17+ sessions
      const consistency = Math.min(10, (sessions.length / 16) * 10);

      // --- Volume (0-10): based on total volume from exercise_logs ---
      let totalVolume = 0;
      for (const s of sessions) {
        const logs = s.exercise_logs as any[];
        if (Array.isArray(logs)) {
          for (const log of logs) {
            const sets = log.sets || log.series;
            if (Array.isArray(sets)) {
              for (const set of sets) {
                totalVolume += (set.weight || 0) * (set.reps || 0);
              }
            }
          }
        }
      }
      // Normalize: 100k kg volume in 30 days = 10
      const volume = Math.min(10, (totalVolume / 80000) * 10);

      // --- Progress (0-10): ratio of "progress" decisions ---
      const progressCount = progressions.filter((p) => p.decision === "progress").length;
      const progress = progressions.length > 0
        ? Math.min(10, (progressCount / progressions.length) * 12)
        : 0;

      // --- Endurance (0-10): average completion rate ---
      const avgCompletion = sessions.length > 0
        ? sessions.reduce((sum, s) => sum + (s.completion_rate ?? 100), 0) / sessions.length
        : 0;
      const endurance = Math.min(10, (avgCompletion / 100) * 10);

      // --- Habits (0-10): training regularity (how many distinct weeks had ≥1 session) ---
      const weeksWithTraining = new Set<string>();
      for (const s of sessions) {
        const d = new Date(s.date + "T00:00:00");
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        weeksWithTraining.add(weekStart.toISOString().split("T")[0]);
      }
      // 4+ weeks out of ~4.3 weeks = perfect
      const habits = Math.min(10, (weeksWithTraining.size / 4) * 10);

      return { consistency, volume, progress, endurance, habits };
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });

  const metrics: FitnessMetric[] = [
    { label: "Consistência", value: round(data?.consistency ?? 0), fullMark: 10 },
    { label: "Resistência", value: round(data?.endurance ?? 0), fullMark: 10 },
    { label: "Volume", value: round(data?.volume ?? 0), fullMark: 10 },
    { label: "Progresso", value: round(data?.progress ?? 0), fullMark: 10 },
    { label: "Hábitos", value: round(data?.habits ?? 0), fullMark: 10 },
  ];

  // Total score: weighted sum out of 1000
  const totalScore = Math.round(
    metrics.reduce((sum, m) => sum + m.value, 0) * 20 // 5 metrics * 10 max = 50, *20 = 1000
  );

  return { metrics, totalScore, loading: isLoading };
}

function round(v: number): number {
  return Math.round(v * 10) / 10;
}
