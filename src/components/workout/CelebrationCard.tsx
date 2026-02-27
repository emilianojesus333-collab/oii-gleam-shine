import { motion } from "framer-motion";
import { Trophy, TrendingUp, Flame } from "lucide-react";
import type { CelebrationEvent } from "@/services/workoutService";

const celebrationConfig = {
  new_max: {
    title: "Recorde pessoal nas últimas 12 semanas",
    subtitle: (v: number) => `Nova carga máxima: ${v} kg`,
    icon: Trophy,
    border: "border-yellow-500/70",
    iconColor: "text-yellow-400",
    bg: "bg-yellow-400/[0.07]",
    iconSize: "w-6 h-6",
    titleClass: "text-sm font-bold text-foreground",
    padding: "p-5",
  },
  new_12_week_high: {
    title: "Melhor média de carga das últimas 12 semanas",
    subtitle: (v: number) => `Média de carga: ${v} kg`,
    icon: TrendingUp,
    border: "border-primary/35",
    iconColor: "text-primary",
    bg: "bg-primary/5",
    iconSize: "w-5 h-5",
    titleClass: "text-sm font-semibold text-foreground",
    padding: "p-4",
  },
  progress_streak: {
    title: "Consistência comprovada",
    subtitle: (_v: number, streak?: number) =>
      `${streak ?? _v} sessões consecutivas a progredir`,
    icon: Flame,
    border: "border-border",
    iconColor: "text-muted-foreground",
    bg: "bg-muted/20",
    iconSize: "w-4.5 h-4.5",
    titleClass: "text-[13px] font-medium text-foreground/90",
    padding: "p-4",
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
      className={`rounded-2xl border ${config.border} ${config.bg} ${config.padding}`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${config.iconColor}`}>
          <Icon className={config.iconSize} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            {celebration.exercise_name}
          </p>
          <p className={config.titleClass}>
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
