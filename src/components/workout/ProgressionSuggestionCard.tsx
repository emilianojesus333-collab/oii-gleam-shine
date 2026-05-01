import { motion } from "framer-motion";
import { TrendingUp, Minus, TrendingDown, Loader2, Sparkles } from "lucide-react";
import { LatestProgression } from "@/services/progressionService";

interface ProgressionSuggestionCardProps {
  data: LatestProgression | null;
  loading: boolean;
  onApply: (weight: number) => void;
}

const decisionConfig = {
  progress: {
    icon: TrendingUp,
    label: "Progresso",
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
    getText: (w: number | null) => w ? `Hoje sobe para ${w} kg.` : "Podes subir de carga.",
  },
  maintain: {
    icon: Minus,
    label: "Manter",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
    getText: (w: number | null) => w ? `Mantém ${w} kg e consolida.` : "Mantém a carga atual.",
  },
  deload: {
    icon: TrendingDown,
    label: "Deload",
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
    getText: (w: number | null) => w ? `Reduz para ${w} kg (-10%).` : "Reduz a carga para recuperar.",
  },
};

const confidenceMap: Record<string, string> = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

export const ProgressionSuggestionCard = ({
  data,
  loading,
  onApply,
}: ProgressionSuggestionCardProps) => {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-muted/30 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        A analisar histórico…
      </div>
    );
  }

  if (!data) return null;

  const config = decisionConfig[data.decision];
  const Icon = config.icon;

  const isLow = data.confidence === "low";

  // BLOCO 2: Compute trend from score_trend if available
  const trendIndicator = data.score_trend
    ? data.score_trend === "up"
      ? { symbol: "↑", color: "text-green-400", label: "Tendência positiva" }
      : data.score_trend === "down"
      ? { symbol: "↓", color: "text-red-400", label: "Tendência negativa" }
      : { symbol: "→", color: "text-muted-foreground", label: "Estável" }
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-none p-4 space-y-3 ${config.bg} ${isLow ? "opacity-70" : ""} mb-2`}
      style={{ background: "#1A1A1A", borderRadius: 0, border: "none", borderBottom: "1px solid #2A2A2A", padding: "20px 16px", width: "100%", margin: 0 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-black/20`}>
            <Icon className={`w-4 h-4 ${config.color}`} />
          </div>
          <div>
            <p className={`text-sm font-medium text-white/90 ${isLow ? "text-white/60" : ""}`}>
              {config.getText(data.suggested_weight)}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-gray-400">
                Confiança: {confidenceMap[data.confidence] || data.confidence}
              </p>
              {isLow && (
                <span className="text-[10px] text-gray-500 italic">· Baseado em dados limitados</span>
              )}
              {trendIndicator && (
                <span className={`text-xs font-medium ${trendIndicator.color}`} title={trendIndicator.label}>
                  {trendIndicator.symbol}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {data.suggested_weight && !isLow && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onApply(data.suggested_weight!)}
          className="w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white/90 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Aplicar sugestão — {data.suggested_weight} kg
        </motion.button>
      )}
    </motion.div>
  );
};
