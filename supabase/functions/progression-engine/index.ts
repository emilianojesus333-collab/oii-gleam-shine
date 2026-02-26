import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Constants ───
const WEIGHTS = { fatigue: 0.30, rpe: 0.30, volume: 0.25, frequency: 0.15 };
const THRESHOLD_PROGRESS = 70;
const THRESHOLD_DELOAD = 35;
const DELOAD_PERCENTAGE = -10;
const COMPOUND_INCREMENT_PCT = 2.5;
const ISOLATION_INCREMENT_PCT = 5;

const FATIGUE_STATUS_SCORES: Record<string, number> = {
  fully_rested: 90,
  stable: 80,
  recovering: 65,
  insufficient_data: 50,
  accumulating: 45,
  overreaching: 20,
};

const FREQUENCY_SCORES: Record<number, number> = { 0: 30, 1: 60 };
const FREQUENCY_DEFAULT = 85; // ≥2

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const { exercise_id, session_id } = await req.json();

    if (!exercise_id || !session_id) {
      return new Response(
        JSON.stringify({ error: "exercise_id and session_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── Step 1: Get exercise info + trend ───
    const [exerciseResult, trendResult] = await Promise.all([
      supabase
        .from("exercises")
        .select("id, name, primary_muscle, secondary_muscles")
        .eq("id", exercise_id)
        .single(),
      getExerciseTrend(supabase, userId, exercise_id),
    ]);

    if (exerciseResult.error || !exerciseResult.data) {
      return new Response(
        JSON.stringify({ error: "Exercise not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const exercise = exerciseResult.data;
    const trend = trendResult;
    const muscleGroup = exercise.primary_muscle;
    const isCompound =
      exercise.secondary_muscles && exercise.secondary_muscles.length >= 1;

    // ─── Step 2: Parallel metric calls ───
    const [volumeData, frequencyData, fatigueData] = await Promise.all([
      getWeeklyVolume(supabase, userId),
      getMuscleFrequency(supabase, userId),
      getAccumulatedFatigue(supabase, userId),
    ]);

    // ─── Step 3: Calculate sub-scores ───
    const reasoning: string[] = [];

    // 3a. Fatigue Score
    const fatigueStatus = fatigueData.status || "insufficient_data";
    const fatigueScore = FATIGUE_STATUS_SCORES[fatigueStatus] ?? 50;
    reasoning.push(`Fatigue status: ${fatigueStatus} → score ${fatigueScore}`);

    // 3b. RPE Score (from exercise trend)
    let avgRpe: number | null = null;
    if (trend.length > 0) {
      const rpeValues = trend
        .filter((s: any) => s.avg_rpe !== null)
        .map((s: any) => s.avg_rpe);
      if (rpeValues.length > 0) {
        avgRpe = rpeValues.reduce((a: number, b: number) => a + b, 0) / rpeValues.length;
      }
    }
    const rpeScore = avgRpe !== null
      ? clamp(100 - (avgRpe - 6) * 25, 0, 100)
      : 75; // neutral if no RPE data
    if (avgRpe !== null) {
      reasoning.push(`RPE médio (exercício): ${round2(avgRpe)} → score ${round2(rpeScore)}`);
    } else {
      reasoning.push("Sem dados de RPE — score neutro (75)");
    }

    // 3c. Volume Trend Score
    let volumeTrendScore = 75; // neutral default
    let volumeTrendPct: number | null = null;
    if (trend.length >= 2) {
      const recentVolume = trend[0].session_volume;
      const previousVolume = trend[1].session_volume;
      if (previousVolume > 0) {
        volumeTrendPct = round2(
          ((recentVolume - previousVolume) / previousVolume) * 100
        );
        volumeTrendScore = clamp(75 + volumeTrendPct * 2, 20, 100);
        reasoning.push(
          `Volume trend: ${volumeTrendPct}% (${previousVolume} → ${recentVolume}) → score ${round2(volumeTrendScore)}`
        );
      } else {
        reasoning.push("Volume anterior = 0 — score neutro (75)");
      }
    } else {
      reasoning.push("Sem sessões anteriores comparáveis — volume trend neutro (75)");
    }

    // 3d. Frequency Score
    const muscleFreq = frequencyData.find(
      (f: any) => f.muscle_group === muscleGroup
    );
    const trainingDays = muscleFreq?.training_days ?? 0;
    const frequencyScore =
      trainingDays >= 2
        ? FREQUENCY_DEFAULT
        : FREQUENCY_SCORES[trainingDays] ?? 30;
    reasoning.push(
      `Frequência ${muscleGroup}: ${trainingDays} dia(s)/sem → score ${frequencyScore}`
    );

    // ─── Step 4: Final Score ───
    const finalScore = round2(
      fatigueScore * WEIGHTS.fatigue +
      rpeScore * WEIGHTS.rpe +
      volumeTrendScore * WEIGHTS.volume +
      frequencyScore * WEIGHTS.frequency
    );

    // ─── Step 5: Decision + Proximity ───
    let decision: "progress" | "maintain" | "deload";
    let proximity: string | null = null;

    if (finalScore >= THRESHOLD_PROGRESS) {
      decision = "progress";
    } else if (finalScore >= THRESHOLD_DELOAD) {
      decision = "maintain";
      if (finalScore >= 65) proximity = "near_progress";
      if (finalScore <= 39) proximity = "near_deload";
    } else {
      decision = "deload";
    }

    reasoning.push(`Score final: ${finalScore} → ${decision}${proximity ? ` (${proximity})` : ""}`);

    // ─── Step 6: Calculate increment/deload ───
    let currentWeight: number | null = null;
    let suggestedWeight: number | null = null;
    let suggestedIncrement: { weight_kg: number; percentage: number } | null = null;

    if (trend.length > 0) {
      // Weighted average of last sessions (50/30/20)
      currentWeight = calculateBaseWeight(trend);

      if (decision === "progress") {
        const pct = isCompound ? COMPOUND_INCREMENT_PCT : ISOLATION_INCREMENT_PCT;
        const roundTo = isCompound ? 2.5 : 1.25;
        const increment = roundToNearest(currentWeight * (pct / 100), roundTo);
        suggestedWeight = roundToNearest(currentWeight + increment, roundTo);
        suggestedIncrement = {
          weight_kg: increment,
          percentage: pct,
        };
        reasoning.push(
          `${isCompound ? "Composto" : "Isolamento"}: +${pct}% → ${currentWeight}kg → ${suggestedWeight}kg`
        );
      } else if (decision === "deload") {
        const roundTo = isCompound ? 2.5 : 1.25;
        const reduction = roundToNearest(
          currentWeight * (Math.abs(DELOAD_PERCENTAGE) / 100),
          roundTo
        );
        suggestedWeight = roundToNearest(currentWeight - reduction, roundTo);
        suggestedIncrement = {
          weight_kg: -reduction,
          percentage: DELOAD_PERCENTAGE,
        };
        reasoning.push(`Deload -10%: ${currentWeight}kg → ${suggestedWeight}kg`);
      }
    }

    // ─── Step 7: Confidence ───
    const trendSessions = trend.length;
    let confidence: "low" | "medium" | "high";

    if (
      fatigueData.data_quality === "low" ||
      trendSessions < 2
    ) {
      confidence = "low";
    } else if (
      fatigueData.data_quality === "high" &&
      trendSessions >= 3 &&
      (finalScore >= THRESHOLD_PROGRESS || finalScore < THRESHOLD_DELOAD)
    ) {
      confidence = "high";
    } else {
      confidence = "medium";
    }

    // ─── Step 8: Upsert progression log ───
    const latestSessionId = session_id;
    const muscleVolume = volumeData.find((v: any) => v.muscle_group === muscleGroup);
    const incrementPct = suggestedIncrement ? suggestedIncrement.percentage : null;

    const logData = {
      user_id: userId,
      exercise_id: exercise.id,
      session_id: latestSessionId,
      algorithm_version: "v1.0",
      score: finalScore,
      decision,
      confidence,
      proximity,
      fatigue_status: fatigueStatus,
      fatigue_score: fatigueScore,
      fatigue_ratio: fatigueData.fatigue_ratio,
      rpe_avg: avgRpe !== null ? round2(avgRpe) : null,
      rpe_score: round2(rpeScore),
      volume_trend_pct: volumeTrendPct,
      volume_trend_score: round2(volumeTrendScore),
      frequency_days: trainingDays,
      frequency_score: frequencyScore,
      base_weight: currentWeight ? round2(currentWeight) : null,
      suggested_weight: suggestedWeight ? round2(suggestedWeight) : null,
      suggested_increment_pct: incrementPct,
      data_quality: fatigueData.data_quality,
      last_7_days_volume: muscleVolume?.total_volume ?? null,
      training_days_7d: fatigueData.training_days_7d ?? null,
      training_days_3d: fatigueData.training_days_3d ?? null,
      weights: WEIGHTS,
    };

    // Use service role for upsert (RLS requires auth.uid() = user_id)
    const { error: logError } = await supabase
      .from("progression_logs")
      .upsert(logData, { onConflict: "user_id,exercise_id,session_id" });

    if (logError) {
      console.error("[PROGRESSION-ENGINE] Log upsert error:", logError);
    }

    const elapsed = Date.now() - startTime;
    console.log(
      `[PROGRESSION-ENGINE] ${exercise.name}: score=${finalScore}, decision=${decision}, confidence=${confidence}, elapsed=${elapsed}ms`
    );

    const responseBody = {
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      muscle_group: muscleGroup,
      is_compound: isCompound,
      decision,
      score: finalScore,
      proximity,
      confidence,
      current_weight: currentWeight ? round2(currentWeight) : null,
      suggested_weight: suggestedWeight ? round2(suggestedWeight) : null,
      suggested_increment: suggestedIncrement,
      reasoning,
      sub_scores: {
        fatigue: { score: fatigueScore, status: fatigueStatus, weight: WEIGHTS.fatigue },
        rpe: { score: round2(rpeScore), avg_rpe: avgRpe !== null ? round2(avgRpe) : null, weight: WEIGHTS.rpe },
        volume_trend: { score: round2(volumeTrendScore), weight: WEIGHTS.volume },
        frequency: { score: frequencyScore, training_days: trainingDays, weight: WEIGHTS.frequency },
      },
      computed_at: new Date().toISOString(),
      elapsed_ms: elapsed,
      log_saved: !logError,
    };

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[PROGRESSION-ENGINE] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// ─── Metric Helpers (inline, no cross-function calls) ───

async function getExerciseTrend(supabase: any, userId: string, exerciseId: string) {
  const { data: sets, error: setsError } = await supabase
    .from("workout_sets")
    .select("session_id, set_number, weight, reps, rpe")
    .eq("user_id", userId)
    .eq("exercise_id", exerciseId)
    .eq("set_type", "working");

  if (setsError) throw setsError;
  if (!sets || sets.length === 0) return [];

  const sessionIds = [...new Set(sets.map((s: any) => s.session_id))];
  const { data: sessions, error: sessError } = await supabase
    .from("workout_sessions")
    .select("id, date, created_at")
    .in("id", sessionIds);

  if (sessError) throw sessError;

  const sortedSessions = (sessions || [])
    .sort((a: any, b: any) => {
      const dateCmp = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateCmp !== 0) return dateCmp;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, 3);

  return sortedSessions.map((session: any) => {
    const sessionSets = sets
      .filter((s: any) => s.session_id === session.id)
      .sort((a: any, b: any) => a.set_number - b.set_number);

    const sessionVolume = sessionSets.reduce(
      (sum: number, s: any) => sum + s.weight * s.reps, 0
    );
    const rpeValues = sessionSets.filter((s: any) => s.rpe !== null).map((s: any) => s.rpe);
    const avgRpe = rpeValues.length > 0
      ? rpeValues.reduce((a: number, b: number) => a + b, 0) / rpeValues.length
      : null;

    // Weighted avg load: Σ(weight × reps) / Σ(reps)
    const totalVolume = sessionSets.reduce((sum: number, s: any) => sum + s.weight * s.reps, 0);
    const totalReps = sessionSets.reduce((sum: number, s: any) => sum + s.reps, 0);
    const weightedAvgLoad = totalReps > 0 ? totalVolume / totalReps : 0;

    return {
      date: session.date,
      session_id: session.id,
      session_volume: sessionVolume,
      avg_rpe: avgRpe,
      weighted_avg_load: weightedAvgLoad,
    };
  });
}

async function getWeeklyVolume(supabase: any, userId: string) {
  const sevenDaysAgo = getDateNDaysAgo(6);

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("user_id", userId)
    .gte("date", sevenDaysAgo);

  if (!sessions || sessions.length === 0) return [];

  const { data: sets } = await supabase
    .from("workout_sets")
    .select("weight, reps, exercise_id")
    .eq("user_id", userId)
    .eq("set_type", "working")
    .in("session_id", sessions.map((s: any) => s.id));

  if (!sets || sets.length === 0) return [];

  const exerciseIds = [...new Set(sets.map((s: any) => s.exercise_id))];
  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, primary_muscle")
    .in("id", exerciseIds);

  const exerciseMap = new Map((exercises || []).map((e: any) => [e.id, e.primary_muscle]));
  const volumeByMuscle: Record<string, number> = {};

  for (const set of sets) {
    const muscle = exerciseMap.get(set.exercise_id);
    if (!muscle) continue;
    volumeByMuscle[muscle] = (volumeByMuscle[muscle] || 0) + set.weight * set.reps;
  }

  return Object.entries(volumeByMuscle).map(([muscle_group, total_volume]) => ({
    muscle_group,
    total_volume,
  }));
}

async function getMuscleFrequency(supabase: any, userId: string) {
  const sevenDaysAgo = getDateNDaysAgo(6);

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id, date")
    .eq("user_id", userId)
    .gte("date", sevenDaysAgo);

  if (!sessions || sessions.length === 0) return [];

  const { data: sets } = await supabase
    .from("workout_sets")
    .select("exercise_id, session_id")
    .eq("user_id", userId)
    .eq("set_type", "working")
    .in("session_id", sessions.map((s: any) => s.id));

  if (!sets || sets.length === 0) return [];

  const exerciseIds = [...new Set(sets.map((s: any) => s.exercise_id))];
  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, primary_muscle")
    .in("id", exerciseIds);

  const exerciseMap = new Map((exercises || []).map((e: any) => [e.id, e.primary_muscle]));
  const sessionDateMap = new Map(sessions.map((s: any) => [s.id, s.date]));
  const freqByMuscle: Record<string, Set<string>> = {};

  for (const set of sets) {
    const muscle = exerciseMap.get(set.exercise_id);
    if (!muscle) continue;
    if (!freqByMuscle[muscle]) freqByMuscle[muscle] = new Set();
    freqByMuscle[muscle].add(sessionDateMap.get(set.session_id));
  }

  return Object.entries(freqByMuscle).map(([muscle_group, dates]) => ({
    muscle_group,
    training_days: dates.size,
  }));
}

async function getAccumulatedFatigue(supabase: any, userId: string) {
  const sevenDaysAgo = getDateNDaysAgo(6);
  const threeDaysAgo = getDateNDaysAgo(2);

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id, date")
    .eq("user_id", userId)
    .gte("date", sevenDaysAgo);

  if (!sessions || sessions.length === 0) {
    return {
      status: "insufficient_data",
      data_quality: "low",
      fatigue_ratio: null,
      training_days_7d: 0,
      training_days_3d: 0,
    };
  }

  const { data: sets } = await supabase
    .from("workout_sets")
    .select("weight, reps, session_id")
    .eq("user_id", userId)
    .eq("set_type", "working")
    .in("session_id", sessions.map((s: any) => s.id));

  const sessionDateMap = new Map(sessions.map((s: any) => [s.id, s.date]));
  const dailyVolumes: Record<string, number> = {};

  for (const set of sets || []) {
    const date = sessionDateMap.get(set.session_id);
    if (!date) continue;
    dailyVolumes[date] = (dailyVolumes[date] || 0) + set.weight * set.reps;
  }

  let trainingDays3d = 0;
  let trainingDays7d = 0;
  let vol3d = 0;
  let vol7d = 0;

  for (const [date, volume] of Object.entries(dailyVolumes)) {
    vol7d += volume;
    trainingDays7d += 1;
    if (date >= threeDaysAgo) {
      vol3d += volume;
      trainingDays3d += 1;
    }
  }

  if (trainingDays7d < 2) {
    return { status: "insufficient_data", data_quality: "low", fatigue_ratio: null, training_days_7d: trainingDays7d, training_days_3d: trainingDays3d };
  }

  if (trainingDays3d === 0) {
    return { status: "fully_rested", data_quality: "high", fatigue_ratio: null, training_days_7d: trainingDays7d, training_days_3d: trainingDays3d };
  }

  const avg3d = vol3d / trainingDays3d;
  const avg7d = vol7d / trainingDays7d;
  const ratio = avg7d > 0 ? Math.round((avg3d / avg7d) * 100) / 100 : 0;

  let status: string;
  if (ratio < 0.8) status = "recovering";
  else if (ratio <= 1.2) status = "stable";
  else if (ratio <= 1.5) status = "accumulating";
  else status = "overreaching";

  return { status, data_quality: "high", fatigue_ratio: ratio, training_days_7d: trainingDays7d, training_days_3d: trainingDays3d };
}

// ─── Utility Functions ───

function calculateBaseWeight(trend: any[]): number {
  // Weighted mean of weighted_avg_load: 50/30/20 for last 3 sessions
  if (trend.length === 1) return trend[0].weighted_avg_load;
  if (trend.length === 2) {
    return trend[0].weighted_avg_load * 0.6 + trend[1].weighted_avg_load * 0.4;
  }
  return (
    trend[0].weighted_avg_load * 0.5 +
    trend[1].weighted_avg_load * 0.3 +
    trend[2].weighted_avg_load * 0.2
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function roundToNearest(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function getDateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}
