import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, Minus, TrendingDown, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkoutSession } from "@/hooks/useWorkoutSession";
import { PerformanceScoreCard } from "@/components/workout/PerformanceScoreCard";

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
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { session, groupedExercises, progressionLogs, loading, error } = useWorkoutSession(sessionId);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error === "not_found" || error === "invalid") {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
        <p className="text-muted-foreground mb-4">Sessão não encontrada.</p>
        <Button onClick={() => navigate("/history")}>Ver Histórico</Button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
        <p className="text-muted-foreground mb-4">Erro ao carregar sessão.</p>
        <Button onClick={() => navigate("/home")}>Voltar ao Início</Button>
      </div>
    );
  }

  // Build progression map by exercise_id
  const progressionMap = new Map(progressionLogs.map((l) => [l.exercise_id, l]));

  // Narrative
  const hasProgress = progressionLogs.some((r) => r.decision === "progress");
  const allMaintain = progressionLogs.length > 0 && progressionLogs.every((r) => r.decision === "maintain");
  const hasDeload = progressionLogs.some((r) => r.decision === "deload");

  const narrative = hasProgress
    ? "Consistência sólida. O plano está a funcionar."
    : allMaintain
    ? "Estás a consolidar força."
    : hasDeload
    ? "Recuperação estratégica ativa."
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-6 pt-8">
        <Button variant="ghost" size="icon" onClick={() => navigate("/history")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Resumo do Treino</h1>
          <p className="text-xs text-muted-foreground">
            {session.day_of_week} · {new Date(session.date + "T00:00:00").toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
      </div>

      {session.muscle_groups && session.muscle_groups.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {session.muscle_groups.map((mg) => (
            <span key={mg} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
              {mg}
            </span>
          ))}
        </div>
      )}

      {narrative && <p className="text-sm text-muted-foreground mb-3 italic">{narrative}</p>}

      <PerformanceScoreCard score={session.performance_score} />

      {groupedExercises.length === 0 && progressionLogs.length === 0 ? (
        <div className="text-center py-12">
          <Dumbbell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Sem detalhes registados para esta sessão.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groupedExercises.map((ex, i) => {
            const prog = progressionMap.get(ex.exercise_id);
            const config = prog ? decisionConfig[prog.decision] : null;

            return (
              <motion.div
                key={ex.exercise_id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl bg-card border border-border p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">{ex.exercise_name}</h3>
                  {config && (() => {
                    const Icon = config.icon;
                    return (
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${config.bg} ${config.color}`}>
                        <Icon className="w-3 h-3" />
                        {config.label}
                      </span>
                    );
                  })()}
                </div>

                {/* Sets */}
                <div className="grid grid-cols-3 gap-1 mb-2">
                  {ex.sets.map((s) => (
                    <div key={s.set_number} className="text-center text-xs bg-muted/30 rounded-lg py-1">
                      <span className="text-muted-foreground">Set {s.set_number}:</span>{" "}
                      <span className="font-medium">{s.weight}kg × {s.reps}</span>
                    </div>
                  ))}
                </div>

                {/* Progression details */}
                {prog && (
                  <div className="grid grid-cols-3 gap-3 text-center mt-2 pt-2 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Score</p>
                      <p className="text-sm font-bold">{prog.score}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Peso sugerido</p>
                      <p className="text-sm font-bold">
                        {prog.suggested_weight ? `${prog.suggested_weight}kg` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Confiança</p>
                      <p className="text-sm font-bold">{confidenceLabels[prog.confidence] || prog.confidence}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}

          {/* Show progression logs for exercises without sets */}
          {progressionLogs
            .filter((l) => !groupedExercises.some((e) => e.exercise_id === l.exercise_id))
            .map((prog, i) => {
              const config = decisionConfig[prog.decision];
              const Icon = config.icon;
              return (
                <motion.div
                  key={prog.exercise_id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (groupedExercises.length + i) * 0.08 }}
                  className="rounded-2xl bg-card border border-border p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">{prog.exercise_id.slice(0, 8)}...</h3>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${config.bg} ${config.color}`}>
                      <Icon className="w-3 h-3" />
                      {config.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Score</p>
                      <p className="text-sm font-bold">{prog.score}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Peso sugerido</p>
                      <p className="text-sm font-bold">{prog.suggested_weight ? `${prog.suggested_weight}kg` : "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Confiança</p>
                      <p className="text-sm font-bold">{confidenceLabels[prog.confidence] || prog.confidence}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
        </div>
      )}

      <Button className="w-full mt-6" onClick={() => navigate("/home")}>
        Voltar ao Início
      </Button>
    </div>
  );
}
