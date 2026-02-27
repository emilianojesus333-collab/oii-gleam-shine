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
  score_trend?: "up" | "down" | "stable" | null;
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
    .limit(3);

  if (error || !data || data.length === 0) {
    if (error) console.error("[progressionService] Error fetching progression:", error);
    return null;
  }

  const latest = data[0] as LatestProgression;

  // Compute trend from last 3 scores
  if (data.length >= 3) {
    const [s1, s2, s3] = data.map((d) => Number(d.score));
    if (s1 > s2 && s2 > s3) latest.score_trend = "up";
    else if (s1 < s2 && s2 < s3) latest.score_trend = "down";
    else latest.score_trend = "stable";
  } else if (data.length === 2) {
    const [s1, s2] = data.map((d) => Number(d.score));
    latest.score_trend = s1 > s2 ? "up" : s1 < s2 ? "down" : "stable";
  } else {
    latest.score_trend = null;
  }

  return latest;
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
