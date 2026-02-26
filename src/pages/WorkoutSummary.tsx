import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, Minus, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProgressionResult } from "@/services/workoutService";

const decisionConfig = {
  progress: { label: "Progredir", icon: TrendingUp, color: "text-green-400", bg: "bg-green-400/10" },
  maintain: { label: "Manter", icon: Minus, color: "text-yellow-400", bg: "bg-yellow-400/10" },
  deload: { label: "Reduzir", icon: TrendingDown, color: "text-red-400", bg: "bg-red-400/10" },
};

const confidenceLabels: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

export default function WorkoutSummary() {
  const location = useLocation();
  const navigate = useNavigate();
  const { progressionResults, sessionId } = (location.state || {}) as {
    progressionResults?: ProgressionResult[];
    sessionId?: string;
  };

  if (!progressionResults || progressionResults.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
        <p className="text-muted-foreground mb-4">Sem dados de progressão.</p>
        <Button onClick={() => navigate("/workout")}>Voltar ao Treino</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-6 pt-8">
        <Button variant="ghost" size="icon" onClick={() => navigate("/home")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">Resumo do Treino</h1>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        {progressionResults.length} exercício{progressionResults.length > 1 ? "s" : ""} analisado{progressionResults.length > 1 ? "s" : ""}
      </p>

      <div className="space-y-3">
        {progressionResults.map((result, i) => {
          const config = decisionConfig[result.decision];
          const Icon = config.icon;

          return (
            <motion.div
              key={result.exercise_id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl bg-card border border-border p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">{result.exercise_name}</h3>
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${config.bg} ${config.color}`}>
                  <Icon className="w-3 h-3" />
                  {config.label}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Score</p>
                  <p className="text-sm font-bold">{result.score}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Peso sugerido</p>
                  <p className="text-sm font-bold">
                    {result.suggested_weight ? `${result.suggested_weight}kg` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Confiança</p>
                  <p className="text-sm font-bold">{confidenceLabels[result.confidence] || result.confidence}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <Button
        className="w-full mt-6"
        onClick={() => navigate("/home")}
      >
        Voltar ao Início
      </Button>
    </div>
  );
}
