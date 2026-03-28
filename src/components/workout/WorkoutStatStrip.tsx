import { motion } from "framer-motion";
import { useOneRMRecords } from "@/hooks/useOneRMRecords";
import { useWeeklyStats } from "@/hooks/useWeeklyStats";

interface WorkoutStatStripProps {
  todayMuscleGroups: string[];
  todayExerciseNames?: string[];
}

export const WorkoutStatStrip = ({ todayMuscleGroups, todayExerciseNames = [] }: WorkoutStatStripProps) => {
  const { records } = useOneRMRecords();
  const { data: weeklyStats } = useWeeklyStats();

  // Find max weight used across all records for today's exercises, fallback to any record
  const closestPR = (() => {
    if (!records.length) return null;
    
    // Try to find best record for today's exercises first
    if (todayExerciseNames.length) {
      let best: { name: string; value: string } | null = null;
      let maxWeight = 0;
      for (const name of todayExerciseNames) {
        const matches = records.filter(
          (r) => r.exercise_name.toLowerCase() === name.toLowerCase()
        );
        for (const m of matches) {
          if (m.weight_used > maxWeight) {
            maxWeight = m.weight_used;
            best = { name: m.exercise_name, value: `${m.weight_used}kg` };
          }
        }
      }
      if (best) return best;
    }
    
    // Fallback: highest weight across all records
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
