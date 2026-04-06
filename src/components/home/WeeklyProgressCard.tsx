import { motion } from "framer-motion";
import { useWeeklyStats } from "@/hooks/useWeeklyStats";

export function WeeklyProgressCard() {
  const { data, loading } = useWeeklyStats();

  if (loading || !data) {
    return (
      <div className="space-y-3">
        <div className="h-5 w-32 rounded bg-muted-foreground/10 animate-pulse" />
        <div className="rounded-2xl p-5 animate-pulse bg-[hsl(220,13%,12%)]">
          <div className="h-24" />
        </div>
      </div>
    );
  }

  const { completedSessions, plannedSessions, totalSets, totalReps, totalMinutes, dailyActivity } = data;
  const planned = Math.max(plannedSessions, 1);
  const pct = Math.min(Math.round((completedSessions / planned) * 100), 100);

  // Ring SVG params
  const size = 72;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="space-y-3"
    >
      <h3 className="text-base font-bold text-foreground">Esta semana</h3>

      <div className="rounded-2xl bg-[hsl(220,13%,12%)] p-5 shadow-lg shadow-black/20">
        <div className="flex items-center gap-4">
          {/* Ring */}
          <div className="relative flex-shrink-0">
            <svg width={size} height={size} className="-rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="hsl(220,10%,20%)"
                strokeWidth={stroke}
              />
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#2563EB"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.8 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-base font-black text-foreground leading-none">
                {completedSessions}/{plannedSessions}
              </span>
            </div>
          </div>

          {/* Text */}
          <div className="flex-1 space-y-1">
            <p className="text-base font-bold text-foreground">
              {completedSessions} de {plannedSessions} treinos
            </p>
            <p className="text-sm text-muted-foreground">
              {totalSets} séries · {totalReps} reps · {totalMinutes} min
            </p>
          </div>
        </div>

        {/* Day activity pills */}
        <div className="flex items-center gap-1.5 mt-4">
          {dailyActivity.map((active, i) => (
            <div
              key={i}
              className="h-2 flex-1 rounded-full transition-all"
              style={{
                backgroundColor: active ? "#2563EB" : "hsl(220,10%,20%)",
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
