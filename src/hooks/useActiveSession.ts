import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface PlannedExercise {
  id: string;
  exercise_name: string;
  sets: number;
  reps: string;
  rest: number;
  order_index: number;
  completed: boolean;
  source: string;
}

export interface ActiveSession {
  id: string;
  date: string;
  status: string;
  muscle_groups: string[] | null;
  day_of_week: string | null;
  planned_exercises: PlannedExercise[];
}

export function useActiveSession() {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchActiveSession = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    const { data: session } = await supabase
      .from("workout_sessions")
      .select("id, date, status, muscle_groups, day_of_week")
      .eq("user_id", user.id)
      .eq("date", today)
      .in("status", ["planned", "in_progress"])
      .maybeSingle();

    if (!session) {
      setActiveSession(null);
      setLoading(false);
      return;
    }

    // Fetch planned exercises
    const { data: exercises } = await supabase
      .from("planned_exercises" as any)
      .select("*")
      .eq("session_id", session.id)
      .order("order_index", { ascending: true });

    setActiveSession({
      ...session,
      planned_exercises: (exercises || []) as PlannedExercise[],
    });
    setLoading(false);
  }, [user]);

  const markExerciseCompleted = useCallback(async (exerciseId: string) => {
    await supabase
      .from("planned_exercises" as any)
      .update({ completed: true })
      .eq("id", exerciseId);

    setActiveSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        planned_exercises: prev.planned_exercises.map((e) =>
          e.id === exerciseId ? { ...e, completed: true } : e
        ),
      };
    });
  }, []);

  const startSession = useCallback(async (sessionId: string) => {
    await supabase
      .from("workout_sessions")
      .update({ status: "in_progress" as any })
      .eq("id", sessionId);

    setActiveSession((prev) =>
      prev ? { ...prev, status: "in_progress" } : null
    );
  }, []);

  useEffect(() => {
    fetchActiveSession();
  }, [fetchActiveSession]);

  return {
    activeSession,
    loading,
    refresh: fetchActiveSession,
    markExerciseCompleted,
    startSession,
  };
}
