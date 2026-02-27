import { motion } from "framer-motion";
import { TrendingUp, Minus, TrendingDown, Activity } from "lucide-react";
import { useWeeklyPerformance } from "@/hooks/useWeeklyPerformance";

export function WeeklyPerformanceWidget() {
  const { data, loading } = useWeeklyPerformance();

  if (loading || !data || data.totalSessions === 0) return null;

  const stats = [
    { value: data.totalSessions, label: "Sessões", icon: Activity, color: "text-foreground" },
    { value: data.progressCount, label: "Progressos", icon: TrendingUp, color: "text-green-400" },
    { value: data.maintainCount, label: "Manutenção", icon: Minus, color: "text-yellow-400" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="rounded-2xl bg-[#111311] p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Últimos 7 dias
        </h3>
        {data.avgScore !== null && (
          <span className="text-xs text-muted-foreground">
            Score médio: <span className="font-bold text-foreground">{data.avgScore}</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
                <span className="text-lg font-bold text-foreground">{stat.value}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
