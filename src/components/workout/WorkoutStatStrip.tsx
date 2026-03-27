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

  // Find closest PR for today's exercises
  const closestPR = (() => {
    if (!records.length || !todayExerciseNames.length) return null;
    for (const name of todayExerciseNames) {
      const match = records.find(
        (r) => r.exercise_name.toLowerCase() === name.toLowerCase()
      );
      if (match) return { name: match.exercise_name, value: `${match.calculated_1rm}kg` };
    }
    return records[0] ? { name: records[0].exercise_name, value: `${records[0].calculated_1rm}kg` } : null;
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
