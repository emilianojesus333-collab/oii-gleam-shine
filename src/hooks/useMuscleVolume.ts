import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface WeekVolume {
  weekLabel: string;   // "S1", "S2" …
  weekStart: string;   // ISO date
  [muscle: string]: number | string;
}

export const MUSCLE_COLORS: Record<string, string> = {
  Peito:      "#60A5FA",
  Costas:     "#A78BFA",
  Pernas:     "#34D399",
  Ombros:     "#FBBF24",
  Bíceps:     "#F87171",
  Tríceps:    "#FB923C",
  Abdominais: "#22D3EE",
};

export const ALL_MUSCLES = Object.keys(MUSCLE_COLORS);

export interface MuscleVolumeData {
  weeks: WeekVolume[];
  muscles: string[];          // muscles that have any data
  loading: boolean;
}

/** Returns ISO monday of the week containing `date` */
function monday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function useMuscleVolume(weeksBack = 8): MuscleVolumeData {
  const { user } = useAuth();
  const [weeks, setWeeks]     = useState<WeekVolume[]>([]);
  const [muscles, setMuscles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    (async () => {
      setLoading(true);

      // Build week buckets (last N weeks)
      const thisMonday = monday(new Date());
      const buckets: { start: Date; end: Date; label: string }[] = [];
      for (let i = weeksBack - 1; i >= 0; i--) {
        const start = addDays(thisMonday, -i * 7);
        const end   = addDays(start, 6);
        buckets.push({ start, end, label: `S${weeksBack - i}` });
      }

      const earliest = isoDate(buckets[0].start);

      // Fetch sessions with muscle groups in range
      const { data: sessions } = await supabase
        .from("workout_sessions")
        .select("id, date, muscle_groups")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("date", earliest)
        .order("date", { ascending: true });

      if (cancelled) return;
      if (!sessions || sessions.length === 0) {
        setWeeks(buckets.map((b, i) => ({ weekLabel: b.label, weekStart: isoDate(b.start) })));
        setMuscles([]);
        setLoading(false);
        return;
      }

      // Fetch sets volume for those sessions
      const sessionIds = sessions.map((s) => s.id);
      const { data: sets } = await supabase
        .from("workout_sets")
        .select("session_id, weight, reps")
        .in("session_id", sessionIds);

      if (cancelled) return;

      // Map session_id → volume
      const volBySession: Record<string, number> = {};
      for (const set of sets || []) {
        const v = (Number(set.weight) ?? 0) * (set.reps ?? 0);
        volBySession[set.session_id] = (volBySession[set.session_id] ?? 0) + v;
      }

      // Aggregate volume per week per muscle
      const weekMap: Record<string, Record<string, number>> = {};
      buckets.forEach((b) => { weekMap[b.label] = {}; });

      for (const session of sessions) {
        const sessionDate = new Date(session.date + "T00:00:00");
        const bucket = buckets.find(
          (b) => sessionDate >= b.start && sessionDate <= b.end
        );
        if (!bucket) continue;

        const muscleGroups: string[] = Array.isArray(session.muscle_groups)
          ? session.muscle_groups
          : [];

        const vol = volBySession[session.id] ?? 0;
        const perMuscle = muscleGroups.length > 0 ? vol / muscleGroups.length : vol;

        for (const mg of muscleGroups) {
          weekMap[bucket.label][mg] = (weekMap[bucket.label][mg] ?? 0) + perMuscle;
        }
      }

      // Collect muscles with any data
      const musclesFound = new Set<string>();
      Object.values(weekMap).forEach((wk) =>
        Object.keys(wk).forEach((m) => musclesFound.add(m))
      );
      const muscleList = ALL_MUSCLES.filter((m) => musclesFound.has(m));

      // Build final array
      const result: WeekVolume[] = buckets.map((b) => {
        const entry: WeekVolume = { weekLabel: b.label, weekStart: isoDate(b.start) };
        for (const m of muscleList) {
          entry[m] = Math.round(weekMap[b.label][m] ?? 0);
        }
        return entry;
      });

      if (!cancelled) {
        setWeeks(result);
        setMuscles(muscleList);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user, weeksBack]);

  return { weeks, muscles, loading };
}
