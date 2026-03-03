import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { WeeklyStats } from "@/hooks/useWeeklyStats";

interface Props {
  stats: WeeklyStats;
}

function TrendLine({ label, value }: { label: string; value: number }) {
  const isPositive = value >= 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[#9CA3AF]">{label}</span>
      <div className="flex items-center gap-1">
        <Icon className={`w-3 h-3 ${isPositive ? "text-[#22C55E]" : "text-[#EF4444]"}`} />
        <span className={`text-xs font-bold ${isPositive ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
          {isPositive ? "+" : ""}{value}%
        </span>
      </div>
    </div>
  );
}

export function WeeklyTrendCard({ stats }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
      className="rounded-2xl p-4 bg-[#111827] border border-[#1F2937] flex flex-col justify-between"
    >
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-[#22C55E]" />
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
          Tendência
        </h4>
      </div>

      <div className="space-y-2.5">
        <TrendLine label="Volume" value={stats.volumeTrendPct} />
        <TrendLine label="Consistência" value={stats.consistencyTrendPct} />
        <TrendLine label="Frequência" value={stats.frequencyTrendPct} />
      </div>

      <p className="text-[9px] text-[#9CA3AF] mt-3">Comparado à semana passada</p>
    </motion.div>
  );
}
