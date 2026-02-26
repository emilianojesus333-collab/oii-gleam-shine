import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const { metric, params } = await req.json();

    let data: unknown;

    switch (metric) {
      case "weekly_volume":
        data = await getWeeklyVolume(supabase, userId);
        break;
      case "exercise_trend":
        if (!params?.exercise_id) {
          return new Response(
            JSON.stringify({ error: "exercise_id is required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        data = await getExerciseTrend(supabase, userId, params.exercise_id);
        break;
      case "muscle_frequency":
        data = await getMuscleFrequency(supabase, userId);
        break;
      case "weighted_intensity":
        data = await getWeightedIntensity(supabase, userId);
        break;
      case "accumulated_fatigue":
        data = await getAccumulatedFatigue(supabase, userId);
        break;
      default:
        return new Response(
          JSON.stringify({
            error: `Unknown metric: ${metric}`,
            available: [
              "weekly_volume",
              "exercise_trend",
              "muscle_frequency",
              "weighted_intensity",
              "accumulated_fatigue",
            ],
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }

    const elapsed = Date.now() - startTime;
    console.log(`[TRAINING-METRICS] ${metric} completed in ${elapsed}ms`);

    return new Response(
      JSON.stringify({
        metric,
        data,
        computed_at: new Date().toISOString(),
        elapsed_ms: elapsed,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[TRAINING-METRICS] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// ─── Handler 1: Weekly Volume by Muscle Group (rolling 7 days) ───

async function getWeeklyVolume(supabase: any, userId: string) {
  // Get sessions from the last 7 days (today included)
  const sevenDaysAgo = getDateNDaysAgo(6);

  const { data: sessions, error: sessionsError } = await supabase
    .from("workout_sessions")
    .select("id, date")
    .eq("user_id", userId)
    .gte("date", sevenDaysAgo);

  if (sessionsError) throw sessionsError;
  if (!sessions || sessions.length === 0) return [];

  const sessionIds = sessions.map((s: any) => s.id);

  const { data: sets, error: setsError } = await supabase
    .from("workout_sets")
    .select("weight, reps, exercise_id")
    .eq("user_id", userId)
    .eq("set_type", "working")
    .in("session_id", sessionIds);

  if (setsError) throw setsError;
  if (!sets || sets.length === 0) return [];

  // Get exercise info for muscle mapping
  const exerciseIds = [...new Set(sets.map((s: any) => s.exercise_id))];
  const { data: exercises, error: exError } = await supabase
    .from("exercises")
    .select("id, primary_muscle")
    .in("id", exerciseIds);

  if (exError) throw exError;

  const exerciseMap = new Map(
    (exercises || []).map((e: any) => [e.id, e.primary_muscle])
  );

  // Aggregate volume by muscle group
  const volumeByMuscle: Record<
    string,
    { total_sets: number; total_volume: number }
  > = {};

  for (const set of sets) {
    const muscle = exerciseMap.get(set.exercise_id);
    if (!muscle) continue;
    if (!volumeByMuscle[muscle]) {
      volumeByMuscle[muscle] = { total_sets: 0, total_volume: 0 };
    }
    volumeByMuscle[muscle].total_sets += 1;
    volumeByMuscle[muscle].total_volume += set.weight * set.reps;
  }

  return Object.entries(volumeByMuscle)
    .map(([muscle_group, stats]) => ({
      muscle_group,
      ...stats,
    }))
    .sort((a, b) => b.total_volume - a.total_volume);
}

// ─── Handler 2: Exercise Trend (last 3 sessions) ───

async function getExerciseTrend(
  supabase: any,
  userId: string,
  exerciseId: string
) {
  // Get all working sets for this exercise
  const { data: sets, error: setsError } = await supabase
    .from("workout_sets")
    .select("session_id, set_number, weight, reps, rpe")
    .eq("user_id", userId)
    .eq("exercise_id", exerciseId)
    .eq("set_type", "working");

  if (setsError) throw setsError;
  if (!sets || sets.length === 0) return [];

  // Get session dates
  const sessionIds = [...new Set(sets.map((s: any) => s.session_id))];
  const { data: sessions, error: sessError } = await supabase
    .from("workout_sessions")
    .select("id, date, created_at")
    .in("id", sessionIds)
    .order("date", { ascending: false });

  if (sessError) throw sessError;

  // Sort by date DESC, then created_at DESC for determinism
  const sortedSessions = (sessions || [])
    .sort((a: any, b: any) => {
      const dateCmp =
        new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateCmp !== 0) return dateCmp;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    })
    .slice(0, 3);

  const sessionMap = new Map(
    sortedSessions.map((s: any) => [s.id, s])
  );

  return sortedSessions.map((session: any) => {
    const sessionSets = sets
      .filter((s: any) => s.session_id === session.id)
      .sort((a: any, b: any) => a.set_number - b.set_number)
      .map((s: any) => ({
        set_number: s.set_number,
        weight: s.weight,
        reps: s.reps,
        rpe: s.rpe,
      }));

    const sessionVolume = sessionSets.reduce(
      (sum: number, s: any) => sum + s.weight * s.reps,
      0
    );
    const rpeValues = sessionSets
      .filter((s: any) => s.rpe !== null)
      .map((s: any) => s.rpe);
    const avgRpe =
      rpeValues.length > 0
        ? Math.round(
            (rpeValues.reduce((a: number, b: number) => a + b, 0) /
              rpeValues.length) *
              10
          ) / 10
        : null;

    return {
      date: session.date,
      session_id: session.id,
      sets: sessionSets,
      session_volume: sessionVolume,
      avg_rpe: avgRpe,
    };
  });
}

// ─── Handler 3: Muscle Frequency (rolling 7 days) ───

async function getMuscleFrequency(supabase: any, userId: string) {
  const sevenDaysAgo = getDateNDaysAgo(6);

  const { data: sessions, error: sessionsError } = await supabase
    .from("workout_sessions")
    .select("id, date")
    .eq("user_id", userId)
    .gte("date", sevenDaysAgo);

  if (sessionsError) throw sessionsError;
  if (!sessions || sessions.length === 0) return [];

  const sessionIds = sessions.map((s: any) => s.id);
  const sessionDateMap = new Map(
    sessions.map((s: any) => [s.id, s.date])
  );

  const { data: sets, error: setsError } = await supabase
    .from("workout_sets")
    .select("exercise_id, session_id")
    .eq("user_id", userId)
    .eq("set_type", "working")
    .in("session_id", sessionIds);

  if (setsError) throw setsError;
  if (!sets || sets.length === 0) return [];

  const exerciseIds = [...new Set(sets.map((s: any) => s.exercise_id))];
  const { data: exercises, error: exError } = await supabase
    .from("exercises")
    .select("id, primary_muscle")
    .in("id", exerciseIds);

  if (exError) throw exError;

  const exerciseMap = new Map(
    (exercises || []).map((e: any) => [e.id, e.primary_muscle])
  );

  const freqByMuscle: Record<
    string,
    { sessions: Set<string>; dates: Set<string> }
  > = {};

  for (const set of sets) {
    const muscle = exerciseMap.get(set.exercise_id);
    if (!muscle) continue;
    if (!freqByMuscle[muscle]) {
      freqByMuscle[muscle] = { sessions: new Set(), dates: new Set() };
    }
    freqByMuscle[muscle].sessions.add(set.session_id);
    freqByMuscle[muscle].dates.add(sessionDateMap.get(set.session_id));
  }

  return Object.entries(freqByMuscle)
    .map(([muscle_group, stats]) => ({
      muscle_group,
      session_count: stats.sessions.size,
      training_days: stats.dates.size,
    }))
    .sort((a, b) => b.session_count - a.session_count);
}

// ─── Handler 4: Weighted Intensity (rolling 14 days) ───

async function getWeightedIntensity(supabase: any, userId: string) {
  const fourteenDaysAgo = getDateNDaysAgo(13);

  const { data: sessions, error: sessionsError } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("user_id", userId)
    .gte("date", fourteenDaysAgo);

  if (sessionsError) throw sessionsError;
  if (!sessions || sessions.length === 0) return [];

  const sessionIds = sessions.map((s: any) => s.id);

  const { data: sets, error: setsError } = await supabase
    .from("workout_sets")
    .select("weight, reps, rpe, exercise_id")
    .eq("user_id", userId)
    .eq("set_type", "working")
    .in("session_id", sessionIds);

  if (setsError) throw setsError;
  if (!sets || sets.length === 0) return [];

  const exerciseIds = [...new Set(sets.map((s: any) => s.exercise_id))];
  const { data: exercises, error: exError } = await supabase
    .from("exercises")
    .select("id, primary_muscle")
    .in("id", exerciseIds);

  if (exError) throw exError;

  const exerciseMap = new Map(
    (exercises || []).map((e: any) => [e.id, e.primary_muscle])
  );

  const intensityByMuscle: Record<
    string,
    { totalWeightedLoad: number; totalReps: number; rpeSum: number; rpeCount: number; totalSets: number }
  > = {};

  for (const set of sets) {
    const muscle = exerciseMap.get(set.exercise_id);
    if (!muscle) continue;
    if (!intensityByMuscle[muscle]) {
      intensityByMuscle[muscle] = {
        totalWeightedLoad: 0,
        totalReps: 0,
        rpeSum: 0,
        rpeCount: 0,
        totalSets: 0,
      };
    }
    const m = intensityByMuscle[muscle];
    m.totalWeightedLoad += set.weight * set.reps;
    m.totalReps += set.reps;
    m.totalSets += 1;
    if (set.rpe !== null) {
      m.rpeSum += set.rpe;
      m.rpeCount += 1;
    }
  }

  return Object.entries(intensityByMuscle)
    .map(([muscle_group, m]) => ({
      muscle_group,
      weighted_avg_load:
        m.totalReps > 0
          ? Math.round((m.totalWeightedLoad / m.totalReps) * 10) / 10
          : 0,
      avg_rpe:
        m.rpeCount > 0
          ? Math.round((m.rpeSum / m.rpeCount) * 10) / 10
          : null,
      total_sets: m.totalSets,
    }))
    .sort((a, b) => b.weighted_avg_load - a.weighted_avg_load);
}

// ─── Handler 5: Accumulated Fatigue ───

async function getAccumulatedFatigue(supabase: any, userId: string) {
  const sevenDaysAgo = getDateNDaysAgo(6);
  const threeDaysAgo = getDateNDaysAgo(2);

  const { data: sessions, error: sessionsError } = await supabase
    .from("workout_sessions")
    .select("id, date")
    .eq("user_id", userId)
    .gte("date", sevenDaysAgo);

  if (sessionsError) throw sessionsError;
  if (!sessions || sessions.length === 0) {
    return {
      last_3_days_volume: 0,
      last_3_days_avg: 0,
      last_7_days_volume: 0,
      last_7_days_avg: 0,
      training_days_3d: 0,
      training_days_7d: 0,
      fatigue_ratio: null,
      status: "insufficient_data",
      data_quality: "low",
    };
  }

  const sessionIds = sessions.map((s: any) => s.id);
  const sessionDateMap = new Map(
    sessions.map((s: any) => [s.id, s.date])
  );

  const { data: sets, error: setsError } = await supabase
    .from("workout_sets")
    .select("weight, reps, session_id")
    .eq("user_id", userId)
    .eq("set_type", "working")
    .in("session_id", sessionIds);

  if (setsError) throw setsError;

  // Aggregate daily volumes
  const dailyVolumes: Record<string, number> = {};
  for (const set of sets || []) {
    const date = sessionDateMap.get(set.session_id);
    if (!date) continue;
    dailyVolumes[date] = (dailyVolumes[date] || 0) + set.weight * set.reps;
  }

  // Split into 3d and 7d
  let last3DaysVolume = 0;
  let trainingDays3d = 0;
  let last7DaysVolume = 0;
  let trainingDays7d = 0;

  for (const [date, volume] of Object.entries(dailyVolumes)) {
    last7DaysVolume += volume;
    trainingDays7d += 1;
    if (date >= threeDaysAgo) {
      last3DaysVolume += volume;
      trainingDays3d += 1;
    }
  }

  const avg3d = trainingDays3d > 0 ? last3DaysVolume / trainingDays3d : 0;
  const avg7d = trainingDays7d > 0 ? last7DaysVolume / trainingDays7d : 0;

  // Hierarchical status determination
  // 1. insufficient_data if < 2 training days in 7d
  // 2. fully_rested if 0 training days in 3d
  // 3. ratio-based status otherwise
  let fatigueRatio: number | null = null;
  let status: string;
  let dataQuality: string;

  if (trainingDays7d < 2) {
    status = "insufficient_data";
    dataQuality = "low";
  } else if (trainingDays3d === 0) {
    status = "fully_rested";
    dataQuality = "high";
  } else {
    fatigueRatio = avg7d > 0 ? Math.round((avg3d / avg7d) * 100) / 100 : 0;
    dataQuality = "high";
    if (fatigueRatio < 0.8) {
      status = "recovering";
    } else if (fatigueRatio <= 1.2) {
      status = "stable";
    } else if (fatigueRatio <= 1.5) {
      status = "accumulating";
    } else {
      status = "overreaching";
    }
  }

  return {
    last_3_days_volume: Math.round(last3DaysVolume),
    last_3_days_avg: Math.round(avg3d),
    last_7_days_volume: Math.round(last7DaysVolume),
    last_7_days_avg: Math.round(avg7d),
    training_days_3d: trainingDays3d,
    training_days_7d: trainingDays7d,
    fatigue_ratio: fatigueRatio,
    status,
    data_quality: dataQuality,
  };
}

// ─── Utility ───

function getDateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}
