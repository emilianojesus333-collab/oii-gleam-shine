import { motion } from "framer-motion";
import { WeeklyStats } from "@/hooks/useWeeklyStats";

interface Props {
  stats: WeeklyStats;
}

export function WeeklyProgressCard({ stats }: Props) {
  const { completedSessions, plannedSessions, completionPercent, totalSets, totalReps, totalMinutes, dailySessions } = stats;

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPercent / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="rounded-2xl p-5 bg-[#111827] border border-[#1F2937]"
    >
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-4">
        Progresso da Semana
      </h3>

      <div className="flex items-center gap-5">
        {/* Left side - stats */}
        <div className="flex-1 space-y-3">
          <p className="text-2xl font-black text-[#F3F4F6]">
            {completedSessions} / {plannedSessions}{" "}
            <span className="text-sm font-medium text-[#9CA3AF]">treinos</span>
          </p>

          <div className="flex gap-4 text-xs text-[#9CA3AF]">
            <span>{totalSets} <span className="text-[#F3F4F6] font-semibold">séries</span></span>
            <span>{totalReps} <span className="text-[#F3F4F6] font-semibold">reps</span></span>
            <span>{totalMinutes} <span className="text-[#F3F4F6] font-semibold">min</span></span>
          </div>

          {/* Mini bar chart */}
          <div className="flex items-end gap-1 h-6 mt-2">
            {dailySessions.map((d, i) => (
              <div key={i} className="flex flex-col items-center flex-1 gap-0.5">
                <div
                  className="w-full rounded-sm transition-all"
                  style={{
                    height: d.count > 0 ? `${Math.max(8, d.count * 16)}px` : "3px",
                    backgroundColor: d.count > 0 ? "#22C55E" : "#1F2937",
                  }}
                />
                <span className="text-[8px] text-[#9CA3AF]">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right side - ring */}
        <div className="relative flex-shrink-0">
          <svg width="100" height="100" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50" cy="50" r={radius}
              fill="none"
              stroke="#1F2937"
              strokeWidth="8"
            />
            {/* Progress ring */}
            <motion.circle
              cx="50" cy="50" r={radius}
              fill="none"
              stroke="#22C55E"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.6 }}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-black text-[#F3F4F6]">
              {completedSessions}/{plannedSessions}
            </span>
            <span className="text-[10px] text-[#9CA3AF]">{completionPercent}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
