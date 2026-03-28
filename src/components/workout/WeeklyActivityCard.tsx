import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useWeeklyStats } from "@/hooks/useWeeklyStats";

export function WeeklyActivityCard() {
  const { data: stats } = useWeeklyStats();

  const days = ["S", "T", "Q", "Q", "S", "S", "D"];
  const activity = stats?.dailyActivity ?? Array(7).fill(false);

  // Estimate volume per day (using sets data proportionally)
  // Since we only have daily booleans, simulate with totalSets distributed
  const totalSets = stats?.totalSets ?? 0;
  const activeDays = activity.filter(Boolean).length;
  const avgSetsPerDay = activeDays > 0 ? Math.round(totalSets / activeDays) : 0;

  const dailyVolume = activity.map((active: boolean) =>
    active ? avgSetsPerDay : 0
  );

  const maxVolume = Math.max(...dailyVolume, 1);

  // Date range
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const dateRange = `${monday.toLocaleDateString("pt-PT", opts)} – ${sunday.toLocaleDateString("pt-PT", opts)}, ${sunday.getFullYear()}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mx-5 rounded-2xl p-6 relative bg-card/95 border border-border/10"
      style={{
        boxShadow: "0 1px 3px rgba(0,0,0,0.3), 0 12px 24px -8px rgba(0,0,0,0.25)",
      }}
    >
      <h3 className="text-base font-bold text-foreground mb-1">Atividade Semanal</h3>

      <div className="flex items-center justify-between mb-5">
        <p className="text-xs text-muted-foreground/60">{dateRange}</p>
        <p className="text-xs text-muted-foreground/60">{totalSets} séries</p>
      </div>

      {/* Days row */}
      <div className="grid grid-cols-7 gap-1 mb-3">
        {days.map((day, i) => (
          <div key={i} className="text-center">
            <p className="text-xs font-medium text-muted-foreground/60 mb-3">{day}</p>
          </div>
        ))}
      </div>

      {/* Volume bubbles */}
      <div className="grid grid-cols-7 gap-1">
        {dailyVolume.map((vol: number, i: number) => {
          if (vol === 0) return <div key={i} className="flex justify-center h-14" />;

          const ratio = vol / maxVolume;
          const size = Math.max(20, Math.round(ratio * 52));

          return (
            <div key={i} className="flex justify-center items-end h-14">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 + i * 0.05, type: "spring" }}
                className="rounded-full flex items-center justify-center"
                style={{
                  width: size,
                  height: size,
                  background: `hsl(var(--primary) / ${0.5 + ratio * 0.5})`,
                }}
              >
                {size >= 36 && (
                  <span className="text-[10px] font-bold text-primary-foreground">
                    {vol}s
                  </span>
                )}
              </motion.div>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-4 right-4">
        <ChevronRight className="w-5 h-5 text-muted-foreground/30" />
      </div>
    </motion.div>
  );
}
