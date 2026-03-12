import { motion } from "framer-motion";
import { BatteryCharging, Battery, BatteryMedium, BatteryWarning, BatteryFull } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface FatigueIndexCardProps {
  score: number | null | undefined;
}

const getFatigueConfig = (score: number) => {
  // 0-20: Recuperação total (verde)
  if (score <= 20) {
    return {
      label: "Recuperação total",
      subtitle: "Pronto para dar o máximo",
      color: "text-green-400",
      bgColor: "bg-green-400/10",
      progressColor: "bg-green-400",
      icon: BatteryFull,
    };
  }
  // 21-40: Fadiga leve (azul)
  if (score <= 40) {
    return {
      label: "Fadiga leve",
      subtitle: "Bom estado de recuperação",
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
      progressColor: "bg-blue-400",
      icon: Battery,
    };
  }
  // 41-60: Fadiga moderada (amarelo)
  if (score <= 60) {
    return {
      label: "Fadiga moderada",
      subtitle: "Recuperação necessária",
      color: "text-yellow-400",
      bgColor: "bg-yellow-400/10",
      progressColor: "bg-yellow-400",
      icon: BatteryMedium,
    };
  }
  // 61-80: Fadiga alta (laranja)
  if (score <= 80) {
    return {
      label: "Fadiga alta",
      subtitle: "Descanso recomendado",
      color: "text-orange-400",
      bgColor: "bg-orange-400/10",
      progressColor: "bg-orange-400",
      icon: BatteryWarning,
    };
  }
  // 81-100: Fadiga muito alta (vermelho)
  return {
    label: "Fadiga muito alta",
    subtitle: "Recuperação prioridade",
    color: "text-red-400",
    bgColor: "bg-red-400/10",
    progressColor: "bg-red-400",
    icon: BatteryCharging,
  };
};

export function FatigueIndexCard({ score }: FatigueIndexCardProps) {
  if (score === null || score === undefined) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card border border-border p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <BatteryCharging className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-sm">Estado de Recuperação</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Completa um treino para ver o teu nível de fadiga
        </p>
      </motion.div>
    );
  }

  const config = getFatigueConfig(score);
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  const IconComponent = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card border border-border p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <IconComponent className={`w-5 h-5 ${config.color}`} />
        <h2 className="font-semibold text-sm">Estado de Recuperação</h2>
      </div>

      <div className="flex items-end gap-2 mb-3">
        <span className={`text-5xl font-bold ${config.color}`}>
          {normalizedScore}
        </span>
        <span className="text-lg text-muted-foreground mb-1">/ 100</span>
        <div className={`ml-auto p-2 rounded-full ${config.bgColor}`}>
          <IconComponent className={`w-6 h-6 ${config.color}`} />
        </div>
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

      <p className={`text-sm font-semibold ${config.color}`}>{config.label}</p>
      <p className="text-xs text-muted-foreground mt-1">{config.subtitle}</p>
    </motion.div>
  );
}
