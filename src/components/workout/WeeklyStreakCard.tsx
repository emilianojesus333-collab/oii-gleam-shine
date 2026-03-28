import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useWeeklyStats } from "@/hooks/useWeeklyStats";

export function WeeklyStreakCard() {
  const { data: stats } = useWeeklyStats();

  const completed = stats?.completedSessions ?? 0;
  const planned = stats?.plannedSessions ?? 5;
  const progress = planned > 0 ? Math.min(completed / planned, 1) : 0;

  // SVG ring calculations
  const size = 80;
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl p-5 relative flex flex-col justify-between min-h-[200px]"
      style={{
        background: "linear-gradient(145deg, hsl(var(--card)) 0%, hsl(var(--card)/0.8) 100%)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <h3 className="text-base font-bold text-foreground">Sequência</h3>

      <div className="flex justify-center my-3">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background ring */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke="hsl(var(--muted)/0.3)"
            strokeWidth={stroke}
          />
          {/* Progress ring */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke="hsl(142, 71%, 45%)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="transition-all duration-700"
          />
          {/* Center icon */}
          <text
            x={size / 2} y={size / 2 + 6}
            textAnchor="middle"
            fontSize="22"
          >
            💪
          </text>
        </svg>
      </div>

      <div>
        <p className="text-sm text-muted-foreground/80">Sequência semanal</p>
        <p className="text-xs text-muted-foreground/50">
          {completed}/{planned} treinos
        </p>
      </div>

      <div className="absolute bottom-4 right-4">
        <ChevronRight className="w-5 h-5 text-muted-foreground/30" />
      </div>
    </motion.div>
  );
}
