import { motion } from "framer-motion";
import { useWeeklyStats } from "@/hooks/useWeeklyStats";

export function WeeklyProgressCard() {
  const { data, loading } = useWeeklyStats();

  if (loading || !data) {
    return (
      <div className="rounded-2xl p-5 animate-pulse" style={{ backgroundColor: "#111827" }}>
        <div className="h-32" />
      </div>);

  }

  const { completedSessions, plannedSessions, totalSets, totalReps, totalMinutes, dailyActivity } = data;
  const planned = Math.max(plannedSessions, 1);
  const pct = Math.min(Math.round(completedSessions / planned * 100), 100);

  // Ring SVG params
  const size = 100;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - pct / 100 * circumference;

  const dayLabels = ["S", "T", "Q", "Q", "S", "S", "D"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="rounded-2xl p-5 sm:p-6"
      style={{ backgroundColor: "#111827", border: "1px solid #1F2937" }}>
      
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF] mb-4">
        Progresso da Semana
      </h3>

      <div className="flex items-center gap-5">
        {/* Left side */}
        <div className="flex-1 space-y-3">
          <p className="text-2xl font-black text-[#F3F4F6]">
            {completedSessions} / {plannedSessions}
            <span className="text-sm font-normal text-[#9CA3AF] ml-1.5">treinos</span>
          </p>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]" />
              {totalSets} Séries
            </div>
            <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]" />
              {totalReps} Reps
            </div>
            <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]" />
              {totalMinutes} Min
            </div>
          </div>

          {/* Mini bar chart (7 days) */}
          <div className="flex items-end gap-1 pt-2">
            {dailyActivity.map((active, i) =>
            <div key={i} className="flex flex-col items-center gap-0.5">
                <div
                className="w-4 rounded-sm transition-all"
                style={{
                  height: active ? 16 : 6,
                  backgroundColor: active ? "#22C55E" : "#1F2937"
                }} />
              
                <span className="text-[8px] text-[#9CA3AF]">{dayLabels[i]}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right side — Ring */}
        <div className="relative flex-shrink-0">
          <svg width={size} height={size} className="-rotate-90">
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#1F2937"
              strokeWidth={stroke} />
            
            {/* Progress ring */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#22C55E"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.8 }} />
            
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center mr-0">
            <span className="text-lg font-black text-[#F3F4F6] leading-none">
              {completedSessions}/{plannedSessions}
            </span>
            <span className="text-[10px] text-[#9CA3AF] mt-0.5">
              {pct}%
            </span>
          </div>
        </div>
      </div>
    </motion.div>);

}