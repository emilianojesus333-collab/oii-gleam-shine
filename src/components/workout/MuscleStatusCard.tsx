import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useMuscleFatigue, getStatusLabel, type MuscleGroup } from "@/hooks/useMuscleFatigue";

interface MuscleStatusCardProps {
  todayMuscleGroups: string[];
}

const muscleGroupMap: Record<string, MuscleGroup> = {
  "Peito": "peito", "Costas": "costas", "Pernas": "pernas",
  "Ombros": "ombros", "Braços": "braços", "Bíceps": "braços",
  "Tríceps": "braços",
};

function getStatusColor(pct: number): string {
  if (pct <= 20) return "hsl(142, 71%, 45%)";    // green
  if (pct <= 50) return "hsl(45, 93%, 47%)";      // yellow
  if (pct <= 75) return "hsl(270, 60%, 55%)";     // purple
  return "hsl(0, 84%, 60%)";                       // red
}

export function MuscleStatusCard({ todayMuscleGroups }: MuscleStatusCardProps) {
  const { muscles } = useMuscleFatigue();

  // Find the primary muscle for today
  const primaryGroup = todayMuscleGroups[0] || "";
  const mappedGroup = muscleGroupMap[primaryGroup] || "peito";
  const currentMuscle = muscles.find((m) => m.muscle_group === mappedGroup);

  const currentFatigue = currentMuscle?.current_fatigue ?? 0;
  const status = currentMuscle?.status ?? "recovered";

  // Get current week date range
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const lastMonday = new Date(monday);
  lastMonday.setDate(monday.getDate() - 7);
  const lastSunday = new Date(monday);
  lastSunday.setDate(monday.getDate() - 1);

  const formatRange = (start: Date, end: Date) => {
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return `${start.toLocaleDateString("pt-PT", opts)} – ${end.toLocaleDateString("pt-PT", opts)}, ${end.getFullYear()}`;
  };

  // Simulated previous week fatigue (stored fatigue_pct)
  const storedFatigue = currentMuscle?.fatigue_pct ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="rounded-2xl p-5 relative flex flex-col justify-between min-h-[200px]"
      style={{
        background: "linear-gradient(145deg, hsl(var(--card)) 0%, hsl(var(--card)/0.8) 100%)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <h3 className="text-base font-bold text-foreground">Estado Muscular</h3>

      <div className="mt-3">
        <p
          className="text-4xl font-bold tabular-nums"
          style={{ color: getStatusColor(currentFatigue) }}
        >
          {currentFatigue}
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          {formatRange(monday, sunday)}
        </p>
      </div>

      <div className="mt-4">
        <p
          className="text-2xl font-bold tabular-nums"
          style={{ color: getStatusColor(storedFatigue) }}
        >
          {Math.round(storedFatigue)}
        </p>
        <p className="text-xs text-muted-foreground/40 mt-1">
          {formatRange(lastMonday, lastSunday)}
        </p>
      </div>

      <p className="text-[10px] text-muted-foreground/40 mt-2">
        {primaryGroup} · {getStatusLabel(status)}
      </p>

      <div className="absolute bottom-4 right-4">
        <ChevronRight className="w-5 h-5 text-muted-foreground/30" />
      </div>
    </motion.div>
  );
}
