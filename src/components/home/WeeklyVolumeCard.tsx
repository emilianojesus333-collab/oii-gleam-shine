import { motion } from "framer-motion";
import { Dumbbell } from "lucide-react";
import { WeeklyStats } from "@/hooks/useWeeklyStats";

interface Props {
  stats: WeeklyStats;
}

export function WeeklyVolumeCard({ stats }: Props) {
  const { totalSets, totalReps, totalMinutes, dailySessions } = stats;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-2xl p-4 bg-[#111827] border border-[#1F2937] flex flex-col justify-between"
    >
      <div className="flex items-center gap-2 mb-3">
        <Dumbbell className="w-4 h-4 text-[#06B6D4]" />
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
          Volume
        </h4>
      </div>

      <div className="space-y-1.5">
        <p className="text-xl font-black text-[#F3F4F6]">{totalSets}</p>
        <p className="text-[10px] text-[#9CA3AF]">séries totais</p>
        <div className="text-xs text-[#9CA3AF] space-y-0.5">
          <p>{totalReps} reps</p>
          <p>{totalMinutes} min</p>
        </div>
      </div>

      {/* Mini vertical bars */}
      <div className="flex items-end gap-0.5 h-8 mt-3">
        {dailySessions.map((d, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{
              height: d.count > 0 ? `${Math.max(6, d.count * 12)}px` : "2px",
              backgroundColor: d.count > 0 ? "#06B6D4" : "#1F2937",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
