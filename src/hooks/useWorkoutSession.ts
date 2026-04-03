import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface GroupedExercise {
  exercise_id: string;
  exercise_name: string;
  sets: {
    set_number: number;
    weight: number;
    reps: number;
    rpe: number | null;
    set_type: string;
  }[];
}

export interface ProgressionLog {
  exercise_id: string;
  decision: "progress" | "maintain" | "deload";
  score: number;
  confidence: "low" | "medium" | "high";
  suggested_weight: number | null;
}

export interface SessionData {
  id: string;
  date: string;
  day_of_week: string | null;
  muscle_groups: string[] | null;
  status: string;
  exercises_completed: string[] | null;
  total_exercises: number | null;
  completion_rate: number | null;
  performance_score: number | null;
}

export function useWorkoutSession(sessionId: string | undefined) {
  const { user } = useAuth();
  const [session, setSession] = useState<SessionData | null>(null);
  const [groupedExercises, setGroupedExercises] = useState<GroupedExercise[]>([]);
  const [progressionLogs, setProgressionLogs] = useState<ProgressionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    if (!sessionId || !user) {
      setLoading(false);
      setError("invalid");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Parallel fetch: session, sets, progression_logs
      const [sessionRes, setsRes, logsRes] = await Promise.all([
        supabase
          .from("workout_sessions")
          .select("id, date, day_of_week, muscle_groups, status, exercises_completed, total_exercises, completion_rate, performance_score")
          .eq("id", sessionId)
          .maybeSingle(),
        supabase
          .from("workout_sets")
          .select("exercise_id, set_number, weight, reps, rpe, set_type")
          .eq("session_id", sessionId)
          .order("set_number", { ascending: true }),
        supabase
          .from("progression_logs")
          .select("exercise_id, decision, score, confidence, suggested_weight")
          .eq("session_id", sessionId),
      ]);

      if (sessionRes.error) throw sessionRes.error;
      if (!sessionRes.data) {
        setError("not_found");
        setLoading(false);
        return;
      }

      setSession(sessionRes.data as SessionData);

      // Group sets by exercise_id, resolve names from exercises table
      const sets = setsRes.data || [];
      const exerciseIds = [...new Set(sets.map((s) => s.exercise_id))];

      let exerciseNames: Record<string, string> = {};
      if (exerciseIds.length > 0) {
        const { data: exercises } = await supabase
          .from("exercises")
          .select("id, name")
          .in("id", exerciseIds);
        for (const ex of exercises || []) {
          exerciseNames[ex.id] = ex.name;
        }
      }

      const grouped: Record<string, GroupedExercise> = {};
      for (const s of sets) {
        if (!grouped[s.exercise_id]) {
          grouped[s.exercise_id] = {
            exercise_id: s.exercise_id,
            exercise_name: exerciseNames[s.exercise_id] || "Exercício",
            sets: [],
          };
        }
        grouped[s.exercise_id].sets.push({
          set_number: s.set_number,
          weight: s.weight,
          reps: s.reps,
          rpe: s.rpe,
          set_type: s.set_type,
        });
      }

      setGroupedExercises(Object.values(grouped));
      setProgressionLogs((logsRes.data || []) as ProgressionLog[]);
    } catch (err: unknown) {
      console.error("[useWorkoutSession]", err);
      setError((err as Error).message || "Erro ao carregar sessão");
    } finally {
      setLoading(false);
    }
  }, [sessionId, user]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return { session, groupedExercises, progressionLogs, loading, error, refresh: fetchSession };
}
