import { motion } from "framer-motion";
import { useWeeklyStats } from "@/hooks/useWeeklyStats";

const barTone = {
  rest: "bg-muted/40",
  low: "bg-primary/35",
  medium: "bg-primary/60",
  high: "bg-primary",
} as const;

export function WeeklyProgressCard() {
  const { data, loading } = useWeeklyStats();

  if (loading || !data) {
    return (
      <div className="animate-pulse rounded-2xl border border-border/50 bg-card p-5 sm:p-6">
        <div className="h-44" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="rounded-2xl border border-border/50 bg-card p-5 sm:p-6"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Intensidade semanal
          </h3>
          <p className="mt-2 text-2xl font-black tracking-tight text-foreground">Últimos 7 dias</p>
        </div>
      </div>

      <div className="relative h-44">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between py-2">
          {[0, 1, 2, 3].map((line) => (
            <div key={line} className="border-t border-border/30 border-dashed" />
          ))}
        </div>

        <div className="relative flex h-full items-end justify-between gap-2 pt-4">
          {data.intensityWeek.map((day, index) => (
            <div key={`${day.label}-${index}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex h-32 w-full items-end justify-center">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${day.value}%` }}
                  transition={{ duration: 0.45, ease: "easeOut", delay: index * 0.04 }}
                  className={`w-full max-w-[26px] rounded-t-xl rounded-b-md ${barTone[day.level]}`}
                />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">{day.label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
