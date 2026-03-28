import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOneRMRecords } from "@/hooks/useOneRMRecords";
import { useWeeklyStats } from "@/hooks/useWeeklyStats";

interface WorkoutStatStripProps {
  todayMuscleGroups: string[];
  todayExerciseNames?: string[];
}

export const WorkoutStatStrip = ({ todayMuscleGroups, todayExerciseNames = [] }: WorkoutStatStripProps) => {
  const { user } = useAuth();
  const { records } = useOneRMRecords();
  const { data: weeklyStats } = useWeeklyStats();
  const [maxSetPR, setMaxSetPR] = useState<{ name: string; weight: number } | null>(null);

  // Primary source: workout_sets (real training data)
  useEffect(() => {
    if (!user) return;
    const fetchMaxWeight = async () => {
      try {
        const { data, error } = await supabase
          .from("workout_sets")
          .select("weight, exercise_id, exercises(name)")
          .eq("user_id", user.id)
          .eq("set_type", "working")
          .order("weight", { ascending: false })
          .limit(20);

        if (error || !data?.length) return;

        // Filter for today's exercises if available
        if (todayExerciseNames.length) {
          const match = data.find((s: any) =>
            todayExerciseNames.some(
              (n) => s.exercises?.name?.toLowerCase() === n.toLowerCase()
            )
          );
          if (match && (match as any).exercises?.name) {
            setMaxSetPR({ name: (match as any).exercises.name, weight: match.weight });
            return;
          }
        }

        // Fallback: highest weight across all sets
        const top = data[0] as any;
        if (top?.exercises?.name) {
          setMaxSetPR({ name: top.exercises.name, weight: top.weight });
        }
      } catch (e) {
        console.error("Error fetching max weight from sets:", e);
      }
    };
    fetchMaxWeight();
  }, [user, todayExerciseNames.join(",")]);

  // Combine sources: workout_sets first, one_rm_records as fallback
  const closestPR = (() => {
    if (maxSetPR) {
      return { name: maxSetPR.name, value: `${maxSetPR.weight}kg` };
    }
    if (!records.length) return null;
    if (todayExerciseNames.length) {
      for (const name of todayExerciseNames) {
        const match = records.find(
          (r) => r.exercise_name.toLowerCase() === name.toLowerCase()
        );
        if (match) return { name: match.exercise_name, value: `${match.weight_used}kg` };
      }
    }
    const top = records.reduce((a, b) => (a.weight_used > b.weight_used ? a : b));
    return { name: top.exercise_name, value: `${top.weight_used}kg` };
  })();

  // Streak calculation from weekly stats
  const streak = (() => {
    if (!weeklyStats?.dailyActivity) return 0;
    // Count consecutive days backwards from today
    const today = new Date().getDay();
    const idx = today === 0 ? 6 : today - 1; // Mon=0
    let count = 0;
    for (let i = idx; i >= 0; i--) {
      if (weeklyStats.dailyActivity[i]) count++;
      else break;
    }
    return count;
  })();

  // Volume
  const totalVolume = weeklyStats
    ? (weeklyStats.totalSets * 50 / 1000).toFixed(1) // rough estimate
    : "0";

  const stats = [
    {
      label: "PR PRÓXIMO",
      value: closestPR?.value || "—",
      sub: closestPR?.name?.substring(0, 12) || "Sem dados",
    },
    {
      label: "SEQUÊNCIA",
      value: `${streak} ${streak === 1 ? "dia" : "dias"}`,
      sub: streak >= 3 ? "🔥" : "",
    },
    {
      label: "VOLUME",
      value: `${totalVolume}t`,
      sub: "esta semana",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mx-6 rounded-2xl bg-card border border-border/30 p-4"
    >
      <div className="grid grid-cols-3 divide-x divide-border/30">
        {stats.map((stat, i) => (
          <div key={i} className="px-3 first:pl-0 last:pr-0">
            <p className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground mb-1">
              {stat.label}
            </p>
            <p className="text-lg font-mono font-bold text-foreground leading-none">
              {stat.value}
            </p>
            {stat.sub && (
              <p className="text-[10px] text-muted-foreground/60 mt-1 truncate">
                {stat.sub}
              </p>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};
