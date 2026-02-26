import { supabase } from "@/integrations/supabase/client";

export interface LatestProgression {
  id: string;
  exercise_id: string;
  decision: "progress" | "maintain" | "deload";
  score: number;
  confidence: "low" | "medium" | "high";
  base_weight: number | null;
  suggested_weight: number | null;
  suggested_increment_pct: number | null;
  created_at: string;
}

/**
 * Fetches the most recent progression decision for a given exercise ID.
 */
export async function getLatestProgression(
  exerciseId: string
): Promise<LatestProgression | null> {
  const { data, error } = await supabase
    .from("progression_logs")
    .select("id, exercise_id, decision, score, confidence, base_weight, suggested_weight, suggested_increment_pct, created_at")
    .eq("exercise_id", exerciseId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[progressionService] Error fetching progression:", error);
    return null;
  }

  return data as LatestProgression | null;
}

/**
 * Fetches the most recent progression decision for an exercise by name.
 * Looks up the exercise_id first, then queries progression_logs.
 */
export async function getLatestProgressionByName(
  exerciseName: string
): Promise<LatestProgression | null> {
  // Find exercise ID by name
  const { data: exercise, error: exError } = await supabase
    .from("exercises")
    .select("id")
    .eq("name", exerciseName)
    .limit(1)
    .maybeSingle();

  if (exError || !exercise) {
    return null;
  }

  return getLatestProgression(exercise.id);
}
