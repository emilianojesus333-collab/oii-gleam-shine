import { supabase } from "@/integrations/supabase/client";

export interface ProgressionResult {
  exercise_id: string;
  exercise_name: string;
  muscle_group: string;
  decision: "progress" | "maintain" | "deload";
  score: number;
  confidence: "low" | "medium" | "high";
  current_weight: number | null;
  suggested_weight: number | null;
  suggested_increment: { weight_kg: number; percentage: number } | null;
  log_saved: boolean;
  error?: string;
}

export interface CelebrationEvent {
  exercise_id: string;
  exercise_name: string;
  type: "new_max" | "new_12_week_high" | "progress_streak";
  value: number;
  streak_count?: number;
}

export interface CompleteWorkoutResponse {
  session_id: string;
  status: string;
  exercises_synced: number;
  sets_inserted: number;
  progression_results: ProgressionResult[];
  celebrations: CelebrationEvent[];
  performance_score: number;
  fatigue_index: number;
}

export interface CompleteWorkoutInput {
  date: string;
  day_of_week: string;
  muscle_groups: string[];
  exercises: {
    name: string;
    weight: number;
    reps: number;
    sets: number;
    rpe?: number | null;
  }[];
  session_id?: string;
}

/**
 * Syncs localStorage workout data to backend, marks session as completed,
 * and runs the progression engine for each exercise.
 *
 * Does NOT clear localStorage — caller is responsible for cleanup only after success.
 */
export async function completeWorkout(
  input: CompleteWorkoutInput
): Promise<CompleteWorkoutResponse> {
  const { data, error } = await supabase.functions.invoke<CompleteWorkoutResponse>(
    "complete-workout",
    { body: input }
  );

  if (error) {
    throw new Error(error.message || "Failed to complete workout");
  }

  if (!data) {
    throw new Error("Empty response from complete-workout");
  }

  return data;
}
