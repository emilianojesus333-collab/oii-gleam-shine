import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { useWeeklyStats } from "@/hooks/useWeeklyStats";

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function WeeklyStatsGrid() {
  const { data, loading } = useWeeklyStats();

  if (loading || !data) return null;

  const { totalSets, totalReps, totalMinutes, prevSets, prevReps, prevMinutes, completedSessions, prevSessions } = data;

  const volumeChange = pctChange(totalSets + totalReps, prevSets + prevReps);
  const consistencyChange = pctChange(completedSessions, prevSessions);
  const freqChange = pctChange(completedSessions, prevSessions);

  const trends = [
    { label: "Volume", value: volumeChange },
    { label: "Consistência", value: consistencyChange },
    { label: "Frequência", value: freqChange },
  ];

  return (
    <div className="mx-4 mb-3 grid grid-cols-2 gap-3">
      {/* Volume Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        style={{ background: "#141414", borderRadius: 20, border: "1px solid rgba(255,255,255,0.07)", padding: "18px" }}
      >
        <div className="flex items-center gap-1.5 mb-3">
          <BarChart3 className="h-3.5 w-3.5 text-[#06B6D4]" />
          <h4 className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
            Volume
          </h4>
        </div>

        <div className="space-y-2">
          <div>
            <span className="text-xl font-black text-[#F3F4F6]">{totalSets}</span>
            <span className="text-[10px] text-[#9CA3AF] ml-1">séries</span>
          </div>
          <div>
            <span className="text-lg font-bold text-[#F3F4F6]">{totalReps}</span>
            <span className="text-[10px] text-[#9CA3AF] ml-1">reps</span>
          </div>
          <div>
            <span className="text-lg font-bold text-[#F3F4F6]">{totalMinutes}</span>
            <span className="text-[10px] text-[#9CA3AF] ml-1">min</span>
          </div>
        </div>

        {/* Mini vertical bars */}
        <div className="flex items-end gap-1 mt-3 h-6">
          {[totalSets, totalReps / 10, totalMinutes / 5].map((v, i) => (
            <div
              key={i}
              className="w-3 rounded-sm"
              style={{
                height: `${Math.min(Math.max((v / 40) * 100, 15), 100)}%`,
                backgroundColor: "#06B6D4",
                opacity: 0.5 + i * 0.2,
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Trend Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75 }}
        style={{ background: "#141414", borderRadius: 20, border: "1px solid rgba(255,255,255,0.07)", padding: "18px" }}
      >
        <div className="flex items-center gap-1.5 mb-3">
          <TrendingUp className="h-3.5 w-3.5 text-[#22C55E]" />
          <h4 className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
            Tendência
          </h4>
        </div>

        <div className="space-y-2.5">
          {trends.map((t) => {
            const isPositive = t.value >= 0;
            const Icon = isPositive ? TrendingUp : TrendingDown;
            const color = isPositive ? "#22C55E" : "#EF4444";

            return (
              <div key={t.label} className="flex items-center justify-between">
                <span className="text-xs text-[#9CA3AF]">{t.label}</span>
                <div className="flex items-center gap-1">
                  <Icon className="h-3 w-3" style={{ color }} />
                  <span className="text-sm font-bold" style={{ color }}>
                    {isPositive ? "+" : ""}{t.value}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[9px] text-[#9CA3AF] mt-3">
          Comparado à semana passada
        </p>
      </motion.div>
    </div>
  );
}
