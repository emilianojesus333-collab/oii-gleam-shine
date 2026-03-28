import { motion, AnimatePresence } from "framer-motion";
import { Edit3, Trash2, ChevronDown, ChevronUp, Dumbbell } from "lucide-react";
import { useState } from "react";

export interface DraftExercise {
  id: string;
  name: string;
  weight: number;
  reps: number;
  sets: number;
  rest: number;
  timestamp: number;
}

interface CompletedExercisesEditorProps {
  exercises: DraftExercise[];
  onUpdate: (id: string, field: keyof DraftExercise, value: number) => void;
  onRemove: (id: string) => void;
}

export const CompletedExercisesEditor = ({
  exercises,
  onUpdate,
  onRemove,
}: CompletedExercisesEditorProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (exercises.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-6 rounded-2xl bg-card/50 border border-border/20 overflow-hidden"
    >
      <div className="p-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Registar Treino</h3>
            <p className="text-xs text-muted-foreground">{exercises.length} exercícios · Edita antes de guardar</p>
          </div>
        </div>
      </div>

      <div className="px-5 pb-5 space-y-2">
        <AnimatePresence>
          {exercises.map((ex, idx) => {
            const isExpanded = expandedId === ex.id;
            return (
              <motion.div
                key={ex.id}
                initial={{ opacity: 0, x: -30, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, x: 30, height: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-xl bg-muted/20 border border-border/10 overflow-hidden"
              >
                {/* Header row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : ex.id)}
                  className="w-full flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-primary/50">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">{ex.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {ex.weight}kg · {ex.sets}×{ex.reps} · {ex.rest}s
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded editor */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4 space-y-3"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Peso (kg)</label>
                          <input
                            type="number"
                            value={ex.weight}
                            onChange={(e) => onUpdate(ex.id, "weight", Number(e.target.value))}
                            className="w-full bg-background/50 border border-border/30 rounded-lg px-3 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Reps</label>
                          <input
                            type="number"
                            value={ex.reps}
                            onChange={(e) => onUpdate(ex.id, "reps", Number(e.target.value))}
                            className="w-full bg-background/50 border border-border/30 rounded-lg px-3 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Séries</label>
                          <input
                            type="number"
                            value={ex.sets}
                            onChange={(e) => onUpdate(ex.id, "sets", Number(e.target.value))}
                            className="w-full bg-background/50 border border-border/30 rounded-lg px-3 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Descanso (s)</label>
                          <input
                            type="number"
                            value={ex.rest}
                            onChange={(e) => onUpdate(ex.id, "rest", Number(e.target.value))}
                            className="w-full bg-background/50 border border-border/30 rounded-lg px-3 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => onRemove(ex.id)}
                        className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remover exercício
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
