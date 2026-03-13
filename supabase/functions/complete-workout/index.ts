import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ExerciseInput {
  name: string;
  weight: number;
  reps: number;
  sets: number;
  rpe?: number | null;
}

interface Celebration {
  exercise_id: string;
  exercise_name: string;
  type: "new_max" | "new_12_week_high" | "progress_streak";
  value: number;
  streak_count?: number;
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
      session_id,
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

    const { data: existingSession } = await supabase
      .from("workout_sessions")
      .select("id")
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle();

    const finalSessionId = existingSession?.id || sessionId;

    // ─── Check planned_exercises for flexible completion_rate ───
    let completionRate = 100;
    const { data: plannedExercises } = await supabase
      .from("planned_exercises")
      .select("exercise_name, completed")
      .eq("session_id", finalSessionId);

    if (plannedExercises && plannedExercises.length > 0) {
      const aiExercises = plannedExercises.filter((e: any) => true); // all are AI-sourced
      const completedAI = aiExercises.filter((e: any) => e.completed).length;
      // Also count exercises being submitted now that match planned names
      const submittedNames = new Set(exerciseNames);
      const additionalCompleted = aiExercises.filter((e: any) => !e.completed && submittedNames.has(e.exercise_name)).length;
      completionRate = Math.round(((completedAI + additionalCompleted) / aiExercises.length) * 100);
    }

    const sessionPayload = {
      id: finalSessionId,
      user_id: userId,
      date,
      day_of_week,
      muscle_groups: muscle_groups || [],
      exercises_completed: exerciseNames,
      total_exercises: exercises.length,
      completion_rate: completionRate,
      exercise_logs: exercises,
      status: "completed",
    };

    const { error: sessionError } = existingSession
      ? await supabase.from("workout_sessions").update(sessionPayload).eq("id", finalSessionId)
      : await supabase.from("workout_sessions").insert(sessionPayload);

    if (sessionError) {
      console.error("[COMPLETE-WORKOUT] Session upsert error:", sessionError);
      return jsonResponse({ error: "Failed to save session", details: sessionError.message }, 500);
    }

    // ─── Step 2: Resolve exercise IDs ───
    const exerciseMap = new Map<string, { id: string; primary_muscle: string; secondary_muscles: string[] | null; user_id: string | null }>();

    const { data: existingExercises } = await supabase
      .from("exercises")
      .select("id, name, primary_muscle, secondary_muscles, user_id")
      .in("name", exerciseNames)
      .or(`user_id.eq.${userId},user_id.is.null`);

    for (const ex of existingExercises || []) {
      const current = exerciseMap.get(ex.name);
      if (!current || (ex.user_id !== null && current.user_id === null)) {
        exerciseMap.set(ex.name, ex);
      }
    }

    // Auto-create exercises that don't exist yet
    const missingExercises = exerciseNames.filter((name) => !exerciseMap.has(name));
    if (missingExercises.length > 0) {
      const validMuscles = ["chest","back","shoulders","biceps","triceps","forearms","quadriceps","hamstrings","glutes","calves","abs","traps"];
      const muscleGroupMap: Record<string, string> = {
        "Peito": "chest", "Costas": "back", "Ombros": "shoulders",
        "Bíceps": "biceps", "Tríceps": "triceps", "Antebraços": "forearms",
        "Pernas": "quadriceps", "Quadríceps": "quadriceps", "Posteriores": "hamstrings",
        "Glúteos": "glutes", "Gémeos": "calves", "Abdómen": "abs", "Trapézio": "traps",
      };
      const inferredMuscle = (muscle_groups || [])
        .map((mg: string) => muscleGroupMap[mg])
        .find((m: string | undefined) => m && validMuscles.includes(m)) || "chest";

      const toInsert = missingExercises.map((name) => ({
        name,
        user_id: userId,
        primary_muscle: inferredMuscle,
        secondary_muscles: [],
      }));

      const { data: created, error: createError } = await supabase
        .from("exercises")
        .insert(toInsert)
        .select("id, name, primary_muscle, secondary_muscles, user_id");

      if (createError) {
        console.error("[COMPLETE-WORKOUT] Failed to auto-create exercises:", createError.message);
      } else if (created) {
        for (const ex of created) {
          exerciseMap.set(ex.name, ex);
        }
        console.log(`[COMPLETE-WORKOUT] Auto-created ${created.length} exercises: ${missingExercises.join(", ")}`);
      }
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
          session_id: finalSessionId,
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
      await supabase
        .from("workout_sets")
        .delete()
        .eq("session_id", finalSessionId)
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

    // ─── Step 4: Call progression-engine for each unique exercise ───
    const progressionResults: any[] = [];
    const uniqueExerciseIds = [...new Set(
      exercises
        .map((e) => exerciseMap.get(e.name)?.id)
        .filter(Boolean)
    )] as string[];

    const progressionUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/progression-engine`;

    const progressionPromises = uniqueExerciseIds.map(async (exerciseId) => {
      try {
        const response = await fetch(progressionUrl, {
          method: "POST",
          headers: {
            "Authorization": authHeader,
            "Content-Type": "application/json",
            "apikey": Deno.env.get("SUPABASE_ANON_KEY")!,
          },
          body: JSON.stringify({
            exercise_id: exerciseId,
            session_id: finalSessionId,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[COMPLETE-WORKOUT] Progression error for ${exerciseId}: ${errorText}`);
          return { exercise_id: exerciseId, error: errorText };
        }

        return await response.json();
      } catch (err: any) {
        console.error(`[COMPLETE-WORKOUT] Progression fetch error for ${exerciseId}:`, err.message);
        return { exercise_id: exerciseId, error: err.message };
      }
    });

    const progressionSettled = await Promise.all(progressionPromises);
    progressionResults.push(...progressionSettled);

    // ─── Step 5: Celebration detection ───
    const decisionMap = new Map<string, string>();
    for (const pr of progressionResults) {
      if (pr.exercise_id && pr.decision) decisionMap.set(pr.exercise_id, pr.decision);
    }
    const celebrations = await detectCelebrations(
      supabase, userId, finalSessionId, exercises, exerciseMap, uniqueExerciseIds, decisionMap
    );

    // ─── Step 6: Performance Score ───
    const performanceScore = await calculatePerformanceScore(
      supabase, userId, finalSessionId, date, exercises, progressionResults
    );

    // Persist score on session
    await supabase
      .from("workout_sessions")
      .update({ performance_score: performanceScore })
      .eq("id", finalSessionId);

    // ─── Step 7: Fatigue Index ───
    const fatigueIndex = await calculateFatigueIndex(supabase, userId, finalSessionId);

    // Persist fatigue index on user_settings
    await supabase
      .from("user_settings")
      .update({ fatigue_index: fatigueIndex })
      .eq("user_id", userId);

    console.log(`[COMPLETE-WORKOUT] Completed. score=${performanceScore}, fatigue=${fatigueIndex}, ${progressionResults.length} progressions, ${celebrations.length} celebrations.`);

    return jsonResponse({
      session_id: finalSessionId,
      status: "completed",
      exercises_synced: exercises.length,
      sets_inserted: setsToInsert.length,
      progression_results: progressionResults,
      celebrations,
      performance_score: performanceScore,
      fatigue_index: fatigueIndex,
    });
  } catch (err: any) {
    console.error("[COMPLETE-WORKOUT] Error:", err);
    return jsonResponse({ error: err.message || "Internal server error" }, 500);
  }
});

// ─── Celebration Detection ───
async function detectCelebrations(
  supabase: any,
  userId: string,
  currentSessionId: string,
  exercises: ExerciseInput[],
  exerciseMap: Map<string, { id: string; primary_muscle: string; secondary_muscles: string[] | null; user_id: string | null }>,
  exerciseIds: string[],
  decisionMap: Map<string, string>
): Promise<Celebration[]> {
  const progressExerciseIds = exerciseIds.filter((id) => decisionMap.get(id) === "progress");
  if (progressExerciseIds.length === 0) return [];

  const twelveWeeksAgo = getDateNDaysAgo(84);

  // Batch Query 1: Historical sets (12 weeks, excluding current session)
  const { data: historicalSessions } = await supabase
    .from("workout_sessions")
    .select("id, date")
    .eq("user_id", userId)
    .gte("date", twelveWeeksAgo)
    .neq("id", currentSessionId);

  const historicalSessionIds = (historicalSessions || []).map((s: any) => s.id);

  let historicalSets: any[] = [];
  if (historicalSessionIds.length > 0) {
    const { data: sets } = await supabase
      .from("workout_sets")
      .select("exercise_id, session_id, weight, reps")
      .eq("user_id", userId)
      .eq("set_type", "working")
      .in("exercise_id", progressExerciseIds)
      .in("session_id", historicalSessionIds);
    historicalSets = sets || [];
  }

  // Batch Query 2: Recent progression_logs for streak
  const { data: recentLogs } = await supabase
    .from("progression_logs")
    .select("exercise_id, decision, session_id, created_at")
    .eq("user_id", userId)
    .in("exercise_id", progressExerciseIds)
    .neq("session_id", currentSessionId)
    .order("created_at", { ascending: false })
    .limit(progressExerciseIds.length * 10);

  // Build historical stats per exercise (in-memory)
  const histByExercise = new Map<string, { maxWeight: number; maxAvgLoad: number }>();
  const setsByExSession = new Map<string, { weight: number; reps: number }[]>();

  for (const set of historicalSets) {
    const key = `${set.exercise_id}::${set.session_id}`;
    if (!setsByExSession.has(key)) setsByExSession.set(key, []);
    setsByExSession.get(key)!.push({ weight: set.weight, reps: set.reps });

    const cur = histByExercise.get(set.exercise_id) || { maxWeight: 0, maxAvgLoad: 0 };
    if (set.weight > cur.maxWeight) cur.maxWeight = set.weight;
    histByExercise.set(set.exercise_id, cur);
  }

  for (const [key, sets] of setsByExSession) {
    const exerciseId = key.split("::")[0];
    const totalVol = sets.reduce((s, v) => s + v.weight * v.reps, 0);
    const totalReps = sets.reduce((s, v) => s + v.reps, 0);
    const avgLoad = totalReps > 0 ? totalVol / totalReps : 0;
    const cur = histByExercise.get(exerciseId)!;
    if (avgLoad > cur.maxAvgLoad) cur.maxAvgLoad = avgLoad;
  }

  // Build streaks per exercise
  const streakByExercise = new Map<string, number>();
  const logsByExercise = new Map<string, any[]>();
  for (const log of recentLogs || []) {
    if (!logsByExercise.has(log.exercise_id)) logsByExercise.set(log.exercise_id, []);
    logsByExercise.get(log.exercise_id)!.push(log);
  }
  for (const [exId, logs] of logsByExercise) {
    let historicalStreak = 0;
    for (const log of logs) {
      if (log.decision === "progress") historicalStreak++;
      else break;
    }
    const totalStreak = historicalStreak + 1;
    if (totalStreak >= 2) streakByExercise.set(exId, totalStreak);
  }

  // Evaluate celebrations
  const celebrations: Celebration[] = [];

  for (const exercise of exercises) {
    const info = exerciseMap.get(exercise.name);
    if (!info || decisionMap.get(info.id) !== "progress") continue;

    const currentMaxWeight = exercise.weight;
    const currentAvgLoad = exercise.reps > 0 ? exercise.weight : 0;
    const hist = histByExercise.get(info.id);

    let bestCelebration: Celebration | null = null;

    if (hist && currentMaxWeight > hist.maxWeight && hist.maxWeight > 0) {
      bestCelebration = {
        exercise_id: info.id,
        exercise_name: exercise.name,
        type: "new_max",
        value: round2(currentMaxWeight),
      };
    }

    if (!bestCelebration && hist && currentAvgLoad > hist.maxAvgLoad && hist.maxAvgLoad > 0) {
      bestCelebration = {
        exercise_id: info.id,
        exercise_name: exercise.name,
        type: "new_12_week_high",
        value: round2(currentAvgLoad),
      };
    }

    const streak = streakByExercise.get(info.id);
    if (!bestCelebration && streak && streak >= 2) {
      bestCelebration = {
        exercise_id: info.id,
        exercise_name: exercise.name,
        type: "progress_streak",
        value: streak,
        streak_count: streak,
      };
    }

    if (bestCelebration) celebrations.push(bestCelebration);
  }

  return celebrations;
}

// ─── Performance Score Calculation ───
async function calculatePerformanceScore(
  supabase: any,
  userId: string,
  sessionId: string,
  date: string,
  exercises: ExerciseInput[],
  progressionResults: any[]
): Promise<number> {
  // 1. Completion Score (30%) — completion_rate is always 100 when finishing via this function
  const completionScore = 100 * 0.30;

  // 2. Volume Score (30%) — compare session volume to avg of last 5 sessions
  const sessionVolume = exercises.reduce((sum, ex) => sum + ex.weight * ex.reps * ex.sets, 0);

  let volumeScore = 30; // default full if no history
  const { data: recentSessions } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "completed")
    .neq("id", sessionId)
    .order("date", { ascending: false })
    .limit(5);

  if (recentSessions && recentSessions.length > 0) {
    const sessionIds = recentSessions.map((s: any) => s.id);
    const { data: historicalSets } = await supabase
      .from("workout_sets")
      .select("weight, reps, session_id")
      .eq("user_id", userId)
      .eq("set_type", "working")
      .in("session_id", sessionIds);

    if (historicalSets && historicalSets.length > 0) {
      const volBySession = new Map<string, number>();
      for (const s of historicalSets) {
        volBySession.set(s.session_id, (volBySession.get(s.session_id) || 0) + s.weight * s.reps);
      }
      const avgVolume = [...volBySession.values()].reduce((a, b) => a + b, 0) / volBySession.size;
      if (avgVolume > 0) {
        const ratio = Math.min(sessionVolume / avgVolume, 1);
        volumeScore = ratio * 30;
      }
    }
  }

  // 3. Progression Score (30%) — based on progression-engine decisions
  const decisionScores: Record<string, number> = { progress: 30, maintain: 18, deload: 8 };
  const validDecisions = progressionResults.filter((r) => r.decision && !r.error);
  let progressionScore = 18; // default maintain if no results
  if (validDecisions.length > 0) {
    const total = validDecisions.reduce((sum, r) => sum + (decisionScores[r.decision] ?? 18), 0);
    progressionScore = total / validDecisions.length;
  }

  // 4. Consistency Score (10%) — sessions this week (Mon-Sun containing `date`)
  const sessionDate = new Date(date + "T00:00:00Z");
  const dayOfWeek = sessionDate.getUTCDay(); // 0=Sun
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(sessionDate);
  weekStart.setUTCDate(weekStart.getUTCDate() - mondayOffset);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

  const { count: weekCount } = await supabase
    .from("workout_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed")
    .gte("date", weekStart.toISOString().split("T")[0])
    .lte("date", weekEnd.toISOString().split("T")[0]);

  const sessionsThisWeek = weekCount ?? 1;
  let consistencyScore = 0;
  if (sessionsThisWeek >= 4) consistencyScore = 10;
  else if (sessionsThisWeek >= 2) consistencyScore = 6;
  else if (sessionsThisWeek >= 1) consistencyScore = 3;

  const raw = completionScore + volumeScore + progressionScore + consistencyScore;
  const score = Math.round(Math.min(Math.max(raw, 0), 100));

  console.log(`[PERF-SCORE] completion=${completionScore} volume=${round2(volumeScore)} progression=${round2(progressionScore)} consistency=${consistencyScore} => ${score}`);
  return score;
}

// ─── Fatigue Index Calculation ───
async function calculateFatigueIndex(
  supabase: any,
  userId: string,
  currentSessionId: string
): Promise<number> {
  const sevenDaysAgo = getDateNDaysAgo(7);
  const fourWeeksAgo = getDateNDaysAgo(28);

  // Parallel: recent 7d sessions, historical 4w sessions, recent performance scores
  const [recentRes, historicalRes, perfRes] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select("id, date")
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("date", sevenDaysAgo),
    supabase
      .from("workout_sessions")
      .select("id, date")
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("date", fourWeeksAgo)
      .lt("date", sevenDaysAgo),
    supabase
      .from("workout_sessions")
      .select("performance_score")
      .eq("user_id", userId)
      .eq("status", "completed")
      .not("performance_score", "is", null)
      .order("date", { ascending: false })
      .limit(5),
  ]);

  const recentSessions = recentRes.data || [];
  const historicalSessions = historicalRes.data || [];
  const perfScores = perfRes.data || [];

  // ─── 1. Volume Score (50%) ───
  const recentSessionIds = recentSessions.map((s: any) => s.id);
  const historicalSessionIds = historicalSessions.map((s: any) => s.id);

  let volumeScore = 0;

  if (recentSessionIds.length > 0) {
    const [recentSetsRes, historicalSetsRes] = await Promise.all([
      supabase
        .from("workout_sets")
        .select("weight, reps")
        .eq("user_id", userId)
        .eq("set_type", "working")
        .in("session_id", recentSessionIds),
      historicalSessionIds.length > 0
        ? supabase
            .from("workout_sets")
            .select("weight, reps, session_id")
            .eq("user_id", userId)
            .eq("set_type", "working")
            .in("session_id", historicalSessionIds)
        : Promise.resolve({ data: [] }),
    ]);

    const recentVolume = (recentSetsRes.data || []).reduce(
      (sum: number, s: any) => sum + s.weight * s.reps, 0
    );

    const histSets = historicalSetsRes.data || [];
    if (histSets.length > 0) {
      // Calculate weekly average from historical weeks
      const weekCount = Math.max(1, Math.ceil(historicalSessionIds.length > 0 ? 3 : 1));
      const histVolume = histSets.reduce((sum: number, s: any) => sum + s.weight * s.reps, 0);
      const avgWeeklyVolume = histVolume / weekCount;

      if (avgWeeklyVolume > 0) {
        const volumeRatio = recentVolume / avgWeeklyVolume;
        volumeScore = Math.min(volumeRatio, 1.5) * (50 / 1.5); // normalize: 1.5 ratio = 50 pts
      }
    } else {
      // No historical data, use moderate default
      volumeScore = recentVolume > 0 ? 25 : 0;
    }
  }

  // ─── 2. Frequency Score (30%) ───
  const sessionsThisWeek = recentSessionIds.length;
  let frequencyScore = 0;
  if (sessionsThisWeek >= 5) frequencyScore = 30;
  else if (sessionsThisWeek >= 4) frequencyScore = 24;
  else if (sessionsThisWeek >= 3) frequencyScore = 18;
  else if (sessionsThisWeek >= 2) frequencyScore = 12;
  else if (sessionsThisWeek >= 1) frequencyScore = 6;

  // ─── 3. Performance Score (20%) ───
  let performanceComponent = 10; // default moderate
  const validScores = perfScores
    .map((s: any) => s.performance_score)
    .filter((s: number | null) => s !== null) as number[];

  if (validScores.length > 0) {
    const avgPerf = validScores.reduce((a: number, b: number) => a + b, 0) / validScores.length;
    performanceComponent = (avgPerf / 100) * 20;
  }

  // ─── Final ───
  const raw = volumeScore + frequencyScore + performanceComponent;
  const fatigueIndex = Math.round(Math.min(Math.max(raw, 0), 100));

  console.log(`[FATIGUE-INDEX] volume=${round2(volumeScore)} frequency=${frequencyScore} performance=${round2(performanceComponent)} => ${fatigueIndex}`);
  return fatigueIndex;
}

// ─── Utilities ───
function round2(n: number) { return Math.round(n * 100) / 100; }
function getDateNDaysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split("T")[0]; }
function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
