import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface PerformanceScoreCardProps {
  score: number | null | undefined;
}

const getScoreConfig = (score: number) => {
  if (score >= 90) {
    return {
      label: "Treino excelente",
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
      progressColor: "bg-blue-400",
      emoji: "🔥",
    };
  }
  if (score >= 75) {
    return {
      label: "Treino muito bom",
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
      progressColor: "bg-blue-400",
      emoji: "💪",
    };
  }
  if (score >= 60) {
    return {
      label: "Treino sólido",
      color: "text-yellow-400",
      bgColor: "bg-yellow-400/10",
      progressColor: "bg-yellow-400",
      emoji: "⭐",
    };
  }
  if (score >= 40) {
    return {
      label: "Treino moderado",
      color: "text-orange-400",
      bgColor: "bg-orange-400/10",
      progressColor: "bg-orange-400",
      emoji: "👍",
    };
  }
  return {
    label: "Treino leve",
    color: "text-red-400",
    bgColor: "bg-red-400/10",
    progressColor: "bg-red-400",
    emoji: "🌱",
  };
};

export function PerformanceScoreCard({ score }: PerformanceScoreCardProps) {
  if (score === null || score === undefined) {
    return null;
  }

  const config = getScoreConfig(score);
  const normalizedScore = Math.min(Math.max(score, 0), 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card border border-border p-5 mb-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-sm">Performance do Treino</h2>
      </div>

      <div className="flex items-end gap-2 mb-3">
        <span className={`text-5xl font-bold ${config.color}`}>
          {normalizedScore}
        </span>
        <span className="text-lg text-muted-foreground mb-1">/ 100</span>
        <span className="text-2xl ml-auto">{config.emoji}</span>
      </div>

      <div className="mb-3">
        <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${normalizedScore}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${config.progressColor}`}
          />
        </div>
      </div>

      <p className={`text-sm font-medium ${config.color}`}>{config.label}</p>
    </motion.div>
  );
}
