import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Progression Engine Constants (inline) ───
const WEIGHTS = { fatigue: 0.30, rpe: 0.30, volume: 0.25, frequency: 0.15 };
const THRESHOLD_PROGRESS = 70;
const THRESHOLD_DELOAD = 35;
const DELOAD_PERCENTAGE = -10;
const COMPOUND_INCREMENT_PCT = 2.5;
const ISOLATION_INCREMENT_PCT = 5;

const FATIGUE_STATUS_SCORES: Record<string, number> = {
  fully_rested: 90, stable: 80, recovering: 65,
  insufficient_data: 50, accumulating: 45, overreaching: 20,
};
const FREQUENCY_SCORES: Record<number, number> = { 0: 30, 1: 60 };
const FREQUENCY_DEFAULT = 85;

interface ExerciseInput {
  name: string;
  weight: number;
  reps: number;
  sets: number;
  rpe?: number | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ─── Auth ───
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const userId = claimsData.claims.sub;

    // ─── Parse input ───
    const body = await req.json();
    const {
      date,
      day_of_week,
      muscle_groups,
      exercises,
      session_id, // optional: if provided, updates existing session
    }: {
      date: string;
      day_of_week: string;
      muscle_groups: string[];
      exercises: ExerciseInput[];
      session_id?: string;
    } = body;

    if (!date || !exercises || exercises.length === 0) {
      return jsonResponse({ error: "date and exercises are required" }, 400);
    }

    console.log(`[COMPLETE-WORKOUT] User ${userId}: ${exercises.length} exercises on ${date}`);

    // ─── Step 1: Upsert workout_session ───
    const sessionId = session_id || crypto.randomUUID();
    const exerciseNames = exercises.map((e) => e.name);

    const { error: sessionError } = await supabase
      .from("workout_sessions")
      .upsert({
        id: sessionId,
        user_id: userId,
        date,
        day_of_week,
        muscle_groups: muscle_groups || [],
        exercises_completed: exerciseNames,
        total_exercises: exercises.length,
        completion_rate: 100,
        exercise_logs: exercises,
        status: "completed",
      }, { onConflict: "id" });

    if (sessionError) {
      console.error("[COMPLETE-WORKOUT] Session upsert error:", sessionError);
      return jsonResponse({ error: "Failed to save session", details: sessionError.message }, 500);
    }

    // ─── Step 2: Resolve exercise IDs ───
    // Look up exercises by name, create if not found
    const exerciseMap = new Map<string, { id: string; primary_muscle: string; secondary_muscles: string[] | null }>();

    const { data: existingExercises } = await supabase
      .from("exercises")
      .select("id, name, primary_muscle, secondary_muscles")
      .in("name", exerciseNames);

    for (const ex of existingExercises || []) {
      exerciseMap.set(ex.name, ex);
    }

    // ─── Step 3: Insert workout_sets ───
    const setsToInsert: any[] = [];

    for (const exercise of exercises) {
      const exerciseInfo = exerciseMap.get(exercise.name);
      if (!exerciseInfo) {
        console.warn(`[COMPLETE-WORKOUT] Exercise not found: ${exercise.name} — skipping sets`);
        continue;
      }

      for (let setNum = 1; setNum <= exercise.sets; setNum++) {
        setsToInsert.push({
          user_id: userId,
          session_id: sessionId,
          exercise_id: exerciseInfo.id,
          set_number: setNum,
          weight: exercise.weight,
          reps: exercise.reps,
          rpe: exercise.rpe ?? null,
          set_type: "working",
        });
      }
    }

    if (setsToInsert.length > 0) {
      // Delete existing sets for this session first (in case of re-sync)
      await supabase
        .from("workout_sets")
        .delete()
        .eq("session_id", sessionId)
        .eq("user_id", userId);

      const { error: setsError } = await supabase
        .from("workout_sets")
        .insert(setsToInsert);

      if (setsError) {
        console.error("[COMPLETE-WORKOUT] Sets insert error:", setsError);
      } else {
        console.log(`[COMPLETE-WORKOUT] Inserted ${setsToInsert.length} sets`);
      }
    }

    // ─── Step 4: Run progression engine for each unique exercise ───
    const progressionResults: any[] = [];
    const uniqueExerciseIds = [...new Set(
      exercises
        .map((e) => exerciseMap.get(e.name)?.id)
        .filter(Boolean)
    )] as string[];

    for (const exerciseId of uniqueExerciseIds) {
      try {
        const result = await runProgressionEngine(supabase, userId, exerciseId, sessionId);
        progressionResults.push(result);
      } catch (err: any) {
        console.error(`[COMPLETE-WORKOUT] Progression error for ${exerciseId}:`, err.message);
        progressionResults.push({ exercise_id: exerciseId, error: err.message });
      }
    }

    console.log(`[COMPLETE-WORKOUT] Completed. ${progressionResults.length} progression results.`);

    return jsonResponse({
      session_id: sessionId,
      status: "completed",
      exercises_synced: exercises.length,
      sets_inserted: setsToInsert.length,
      progression_results: progressionResults,
    });
  } catch (err: any) {
    console.error("[COMPLETE-WORKOUT] Error:", err);
    return jsonResponse({ error: err.message || "Internal server error" }, 500);
  }
});

// ─── Progression Engine (inline) ───
async function runProgressionEngine(
  supabase: any,
  userId: string,
  exerciseId: string,
  sessionId: string
) {
  const [exerciseResult, trend] = await Promise.all([
    supabase.from("exercises").select("id, name, primary_muscle, secondary_muscles").eq("id", exerciseId).single(),
    getExerciseTrend(supabase, userId, exerciseId),
  ]);

  if (exerciseResult.error || !exerciseResult.data) {
    throw new Error(`Exercise ${exerciseId} not found`);
  }

  const exercise = exerciseResult.data;
  const muscleGroup = exercise.primary_muscle;
  const isCompound = exercise.secondary_muscles && exercise.secondary_muscles.length >= 1;

  const [volumeData, frequencyData, fatigueData] = await Promise.all([
    getWeeklyVolume(supabase, userId),
    getMuscleFrequency(supabase, userId),
    getAccumulatedFatigue(supabase, userId),
  ]);

  // ── Sub-scores ──
  const fatigueStatus = fatigueData.status || "insufficient_data";
  const fatigueScore = FATIGUE_STATUS_SCORES[fatigueStatus] ?? 50;

  let avgRpe: number | null = null;
  if (trend.length > 0) {
    const rpeValues = trend.filter((s: any) => s.avg_rpe !== null).map((s: any) => s.avg_rpe);
    if (rpeValues.length > 0) {
      avgRpe = rpeValues.reduce((a: number, b: number) => a + b, 0) / rpeValues.length;
    }
  }
  const rpeScore = avgRpe !== null ? clamp(100 - (avgRpe - 6) * 25, 0, 100) : 75;

  let volumeTrendScore = 75;
  let volumeTrendPct: number | null = null;
  if (trend.length >= 2) {
    const recent = trend[0].session_volume;
    const previous = trend[1].session_volume;
    if (previous > 0) {
      volumeTrendPct = round2(((recent - previous) / previous) * 100);
      volumeTrendScore = clamp(75 + volumeTrendPct * 2, 20, 100);
    }
  }

  const muscleFreq = frequencyData.find((f: any) => f.muscle_group === muscleGroup);
  const trainingDays = muscleFreq?.training_days ?? 0;
  const frequencyScore = trainingDays >= 2 ? FREQUENCY_DEFAULT : FREQUENCY_SCORES[trainingDays] ?? 30;

  const finalScore = round2(
    fatigueScore * WEIGHTS.fatigue +
    rpeScore * WEIGHTS.rpe +
    volumeTrendScore * WEIGHTS.volume +
    frequencyScore * WEIGHTS.frequency
  );

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

  let currentWeight: number | null = null;
  let suggestedWeight: number | null = null;
  let suggestedIncrement: { weight_kg: number; percentage: number } | null = null;

  if (trend.length > 0) {
    currentWeight = calculateBaseWeight(trend);
    if (decision === "progress") {
      const pct = isCompound ? COMPOUND_INCREMENT_PCT : ISOLATION_INCREMENT_PCT;
      const roundTo = isCompound ? 2.5 : 1.25;
      const increment = roundToNearest(currentWeight * (pct / 100), roundTo);
      suggestedWeight = roundToNearest(currentWeight + increment, roundTo);
      suggestedIncrement = { weight_kg: increment, percentage: pct };
    } else if (decision === "deload") {
      const roundTo = isCompound ? 2.5 : 1.25;
      const reduction = roundToNearest(currentWeight * (Math.abs(DELOAD_PERCENTAGE) / 100), roundTo);
      suggestedWeight = roundToNearest(currentWeight - reduction, roundTo);
      suggestedIncrement = { weight_kg: -reduction, percentage: DELOAD_PERCENTAGE };
    }
  }

  const trendSessions = trend.length;
  let confidence: "low" | "medium" | "high";
  if (fatigueData.data_quality === "low" || trendSessions < 2) {
    confidence = "low";
  } else if (fatigueData.data_quality === "high" && trendSessions >= 3 && (finalScore >= THRESHOLD_PROGRESS || finalScore < THRESHOLD_DELOAD)) {
    confidence = "high";
  } else {
    confidence = "medium";
  }

  const muscleVolume = volumeData.find((v: any) => v.muscle_group === muscleGroup);
  const incrementPct = suggestedIncrement ? suggestedIncrement.percentage : null;

  const logData = {
    user_id: userId,
    exercise_id: exercise.id,
    session_id: sessionId,
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

  const { error: logError } = await supabase
    .from("progression_logs")
    .upsert(logData, { onConflict: "user_id,exercise_id,session_id" });

  if (logError) console.error("[COMPLETE-WORKOUT] Progression log error:", logError);

  return {
    exercise_id: exercise.id,
    exercise_name: exercise.name,
    muscle_group: muscleGroup,
    decision,
    score: finalScore,
    confidence,
    current_weight: currentWeight ? round2(currentWeight) : null,
    suggested_weight: suggestedWeight ? round2(suggestedWeight) : null,
    suggested_increment: suggestedIncrement,
    log_saved: !logError,
  };
}

// ─── Data Helpers (same as progression-engine) ───

async function getExerciseTrend(supabase: any, userId: string, exerciseId: string) {
  const { data: sets, error } = await supabase
    .from("workout_sets")
    .select("session_id, set_number, weight, reps, rpe")
    .eq("user_id", userId)
    .eq("exercise_id", exerciseId)
    .eq("set_type", "working");

  if (error) throw error;
  if (!sets || sets.length === 0) return [];

  const sessionIds = [...new Set(sets.map((s: any) => s.session_id))];
  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id, date, created_at")
    .in("id", sessionIds);

  const sortedSessions = (sessions || [])
    .sort((a: any, b: any) => {
      const d = new Date(b.date).getTime() - new Date(a.date).getTime();
      return d !== 0 ? d : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, 3);

  return sortedSessions.map((session: any) => {
    const sessionSets = sets.filter((s: any) => s.session_id === session.id).sort((a: any, b: any) => a.set_number - b.set_number);
    const sessionVolume = sessionSets.reduce((sum: number, s: any) => sum + s.weight * s.reps, 0);
    const rpeValues = sessionSets.filter((s: any) => s.rpe !== null).map((s: any) => s.rpe);
    const avgRpe = rpeValues.length > 0 ? rpeValues.reduce((a: number, b: number) => a + b, 0) / rpeValues.length : null;
    const totalVolume = sessionSets.reduce((sum: number, s: any) => sum + s.weight * s.reps, 0);
    const totalReps = sessionSets.reduce((sum: number, s: any) => sum + s.reps, 0);
    const weightedAvgLoad = totalReps > 0 ? totalVolume / totalReps : 0;
    return { date: session.date, session_id: session.id, session_volume: sessionVolume, avg_rpe: avgRpe, weighted_avg_load: weightedAvgLoad };
  });
}

async function getWeeklyVolume(supabase: any, userId: string) {
  const sevenDaysAgo = getDateNDaysAgo(6);
  const { data: sessions } = await supabase.from("workout_sessions").select("id").eq("user_id", userId).gte("date", sevenDaysAgo);
  if (!sessions || sessions.length === 0) return [];
  const { data: sets } = await supabase.from("workout_sets").select("weight, reps, exercise_id").eq("user_id", userId).eq("set_type", "working").in("session_id", sessions.map((s: any) => s.id));
  if (!sets || sets.length === 0) return [];
  const exerciseIds = [...new Set(sets.map((s: any) => s.exercise_id))];
  const { data: exercises } = await supabase.from("exercises").select("id, primary_muscle").in("id", exerciseIds);
  const exerciseMap = new Map((exercises || []).map((e: any) => [e.id, e.primary_muscle]));
  const volumeByMuscle: Record<string, number> = {};
  for (const set of sets) {
    const muscle = exerciseMap.get(set.exercise_id);
    if (muscle) volumeByMuscle[muscle] = (volumeByMuscle[muscle] || 0) + set.weight * set.reps;
  }
  return Object.entries(volumeByMuscle).map(([muscle_group, total_volume]) => ({ muscle_group, total_volume }));
}

async function getMuscleFrequency(supabase: any, userId: string) {
  const sevenDaysAgo = getDateNDaysAgo(6);
  const { data: sessions } = await supabase.from("workout_sessions").select("id, date").eq("user_id", userId).gte("date", sevenDaysAgo);
  if (!sessions || sessions.length === 0) return [];
  const { data: sets } = await supabase.from("workout_sets").select("exercise_id, session_id").eq("user_id", userId).eq("set_type", "working").in("session_id", sessions.map((s: any) => s.id));
  if (!sets || sets.length === 0) return [];
  const exerciseIds = [...new Set(sets.map((s: any) => s.exercise_id))];
  const { data: exercises } = await supabase.from("exercises").select("id, primary_muscle").in("id", exerciseIds);
  const exerciseMap = new Map((exercises || []).map((e: any) => [e.id, e.primary_muscle]));
  const sessionDateMap = new Map(sessions.map((s: any) => [s.id, s.date]));
  const freqByMuscle: Record<string, Set<string>> = {};
  for (const set of sets) {
    const muscle = exerciseMap.get(set.exercise_id);
    if (!muscle) continue;
    if (!freqByMuscle[muscle]) freqByMuscle[muscle] = new Set();
    freqByMuscle[muscle].add(sessionDateMap.get(set.session_id));
  }
  return Object.entries(freqByMuscle).map(([muscle_group, dates]) => ({ muscle_group, training_days: dates.size }));
}

async function getAccumulatedFatigue(supabase: any, userId: string) {
  const sevenDaysAgo = getDateNDaysAgo(6);
  const threeDaysAgo = getDateNDaysAgo(2);
  const { data: sessions } = await supabase.from("workout_sessions").select("id, date").eq("user_id", userId).gte("date", sevenDaysAgo);
  if (!sessions || sessions.length === 0) return { status: "insufficient_data", data_quality: "low", fatigue_ratio: null, training_days_7d: 0, training_days_3d: 0 };
  const { data: sets } = await supabase.from("workout_sets").select("weight, reps, session_id").eq("user_id", userId).eq("set_type", "working").in("session_id", sessions.map((s: any) => s.id));
  const sessionDateMap = new Map(sessions.map((s: any) => [s.id, s.date]));
  const dailyVolumes: Record<string, number> = {};
  for (const set of sets || []) {
    const date = sessionDateMap.get(set.session_id);
    if (date) dailyVolumes[date] = (dailyVolumes[date] || 0) + set.weight * set.reps;
  }
  let trainingDays3d = 0, trainingDays7d = 0, vol3d = 0, vol7d = 0;
  for (const [date, volume] of Object.entries(dailyVolumes)) {
    vol7d += volume; trainingDays7d++;
    if (date >= threeDaysAgo) { vol3d += volume; trainingDays3d++; }
  }
  if (trainingDays7d < 2) return { status: "insufficient_data", data_quality: "low", fatigue_ratio: null, training_days_7d: trainingDays7d, training_days_3d: trainingDays3d };
  if (trainingDays3d === 0) return { status: "fully_rested", data_quality: "high", fatigue_ratio: null, training_days_7d: trainingDays7d, training_days_3d: trainingDays3d };
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

// ─── Utilities ───
function calculateBaseWeight(trend: any[]): number {
  if (trend.length === 1) return trend[0].weighted_avg_load;
  if (trend.length === 2) return trend[0].weighted_avg_load * 0.6 + trend[1].weighted_avg_load * 0.4;
  return trend[0].weighted_avg_load * 0.5 + trend[1].weighted_avg_load * 0.3 + trend[2].weighted_avg_load * 0.2;
}
function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
function round2(n: number) { return Math.round(n * 100) / 100; }
function roundToNearest(v: number, s: number) { return Math.round(v / s) * s; }
function getDateNDaysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split("T")[0]; }
function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
