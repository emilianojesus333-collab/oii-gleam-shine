import { motion } from "framer-motion";
import { Trophy, TrendingUp, Flame } from "lucide-react";
import type { CelebrationEvent } from "@/services/workoutService";

const celebrationConfig = {
  new_max: {
    title: "Recorde pessoal nas últimas 12 semanas",
    subtitle: (v: number) => `Nova carga máxima: ${v} kg`,
    icon: Trophy,
    border: "border-yellow-500/60",
    iconColor: "text-yellow-400",
    bg: "bg-yellow-400/5",
  },
  new_12_week_high: {
    title: "Melhor média de carga das últimas 12 semanas",
    subtitle: (v: number) => `Média de carga: ${v} kg`,
    icon: TrendingUp,
    border: "border-primary/40",
    iconColor: "text-primary",
    bg: "bg-primary/5",
  },
  progress_streak: {
    title: "Consistência comprovada",
    subtitle: (_v: number, streak?: number) =>
      `${streak ?? _v} sessões consecutivas a progredir`,
    icon: Flame,
    border: "border-border",
    iconColor: "text-muted-foreground",
    bg: "bg-muted/30",
  },
} as const;

interface CelebrationCardProps {
  celebration: CelebrationEvent;
  index: number;
}

export default function CelebrationCard({ celebration, index }: CelebrationCardProps) {
  const config = celebrationConfig[celebration.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className={`rounded-2xl border ${config.border} ${config.bg} p-4`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${config.iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            {celebration.exercise_name}
          </p>
          <p className="text-sm font-semibold text-foreground">
            {config.title}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {config.subtitle(celebration.value, celebration.streak_count)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
