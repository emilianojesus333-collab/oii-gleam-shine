import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Check,
  Plus,
  ChevronRight,
  Dumbbell,
  Save,
  Loader2,
  CheckCircle2,
  SkipForward,
} from "lucide-react";
import { toast } from "sonner";
import type { ActiveSession, PlannedExercise } from "@/hooks/useActiveSession";
import { useLatestProgression } from "@/hooks/useLatestProgression";
import { ProgressionSuggestionCard } from "./ProgressionSuggestionCard";

interface SavedExercise {
  name: string;
  weight: number;
  reps: number;
  sets: number;
  restTime: number;
  timestamp: number;
  source: "ai" | "manual";
  plannedId?: string;
}

interface SequentialWorkoutFlowProps {
  session: ActiveSession;
  onStart: () => void;
  onComplete: (exercises: SavedExercise[]) => void;
  onMarkCompleted: (exerciseId: string) => void;
  completing: boolean;
}

export const SequentialWorkoutFlow = ({
  session,
  onStart,
  onComplete,
  onMarkCompleted,
  completing,
}: SequentialWorkoutFlowProps) => {
  const planned = session.planned_exercises;
  const isPlanned = session.status === "planned";

  // Current exercise index (first non-completed)
  const currentIndex = useMemo(() => {
    const idx = planned.findIndex((e) => !e.completed && e.source === "ai");
    return idx === -1 ? planned.length : idx;
  }, [planned]);

  const currentExercise = planned[currentIndex] || null;
  const completedCount = planned.filter((e) => e.completed && e.source === "ai").length;
  const aiTotal = planned.filter((e) => e.source === "ai").length;

  // Form state
  const [weight, setWeight] = useState("30");
  const [reps, setReps] = useState("10");
  const [sets, setSets] = useState("3");
  const [savedExercises, setSavedExercises] = useState<SavedExercise[]>([]);

  // Manual add mode
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualWeight, setManualWeight] = useState("30");
  const [manualReps, setManualReps] = useState("10");
  const [manualSets, setManualSets] = useState("3");

  // Progression suggestion
  const { data: progressionData, loading: progressionLoading } = useLatestProgression(
    currentExercise?.exercise_name || null
  );

  // Pre-fill form when current exercise changes
  useEffect(() => {
    if (currentExercise) {
      setReps(String(parseInt(currentExercise.reps) || 10));
      setSets(String(currentExercise.sets));
      // Apply progression weight if available
      if (progressionData?.suggested_weight) {
        setWeight(String(progressionData.suggested_weight));
      } else {
        setWeight("30");
      }
    }
  }, [currentExercise?.id, progressionData?.suggested_weight]);

  const handleSaveCurrentExercise = () => {
    if (!currentExercise) return;

    const newExercise: SavedExercise = {
      name: currentExercise.exercise_name,
      weight: parseInt(weight) || 0,
      reps: parseInt(reps) || 0,
      sets: parseInt(sets) || 0,
      restTime: currentExercise.rest,
      timestamp: Date.now(),
      source: "ai",
      plannedId: currentExercise.id,
    };

    setSavedExercises((prev) => [...prev, newExercise]);
    onMarkCompleted(currentExercise.id);
    toast.success(`${currentExercise.exercise_name} guardado!`);
  };

  const handleSkipExercise = () => {
    if (!currentExercise) return;
    onMarkCompleted(currentExercise.id);
    toast.info(`${currentExercise.exercise_name} saltado`);
  };

  const handleSaveManual = () => {
    if (!manualName.trim()) {
      toast.error("Escreve o nome do exercício");
      return;
    }

    const newExercise: SavedExercise = {
      name: manualName,
      weight: parseInt(manualWeight) || 0,
      reps: parseInt(manualReps) || 0,
      sets: parseInt(manualSets) || 0,
      restTime: 90,
      timestamp: Date.now(),
      source: "manual",
    };

    setSavedExercises((prev) => [...prev, newExercise]);
    toast.success(`${manualName} adicionado!`);
    setManualName("");
    setManualWeight("30");
    setManualReps("10");
    setManualSets("3");
    setShowManualAdd(false);
  };

  const handleComplete = () => {
    onComplete(savedExercises);
  };

  // Planned status — show start button
  if (isPlanned) {
    return (
      <div className="px-5 space-y-5">
        {/* Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111311] rounded-[20px] p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Treino Planeado</h3>
              <p className="text-xs text-gray-400">
                {aiTotal} exercícios · {session.muscle_groups?.join(" + ")}
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-5">
            {planned.filter(e => e.source === "ai").map((ex, i) => (
              <div
                key={ex.id}
                className="flex items-center gap-3 bg-[#2A2A2A]/50 rounded-xl px-4 py-3"
              >
                <span className="text-xs text-gray-500 w-5">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white/70">{ex.exercise_name}</p>
                  <p className="text-xs text-gray-400">
                    {ex.sets}x{ex.reps} · {ex.rest}s descanso
                  </p>
                </div>
              </div>
            ))}
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onStart}
            className="w-full py-4 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            Começar Treino
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Active status — sequential execution
  const allAIDone = currentIndex >= planned.filter(e => e.source === "ai").length || !currentExercise;

  return (
    <div className="px-5 space-y-5">
      {/* Progress indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#111311] rounded-[20px] p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-400">Progresso</span>
          <span className="text-sm font-bold text-primary">
            {completedCount}/{aiTotal}
          </span>
        </div>
        <div className="w-full h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${aiTotal > 0 ? (completedCount / aiTotal) * 100 : 0}%` }}
            transition={{ type: "spring", stiffness: 100 }}
          />
        </div>

        {/* Mini exercise list */}
        <div className="flex gap-1 mt-3 overflow-x-auto pb-1">
          {planned.filter(e => e.source === "ai").map((ex, i) => (
            <div
              key={ex.id}
              className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                ex.completed
                  ? "bg-green-500/20 text-green-400"
                  : currentIndex === planned.indexOf(ex)
                  ? "bg-primary/20 text-primary ring-1 ring-primary/50"
                  : "bg-[#2A2A2A]/50 text-gray-500"
              }`}
            >
              {ex.completed ? <Check className="w-4 h-4" /> : i + 1}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Current exercise */}
      {currentExercise && !allAIDone && (
        <motion.div
          key={currentExercise.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#1E1E1E]/50 rounded-[20px] p-5"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-primary font-medium">
              Exercício {completedCount + 1} de {aiTotal}
            </span>
            <button
              onClick={handleSkipExercise}
              className="text-xs text-gray-500 flex items-center gap-1 hover:text-gray-300 transition-colors"
            >
              <SkipForward className="w-3 h-3" />
              Saltar
            </button>
          </div>

          <h3 className="text-lg font-bold text-white mb-1">
            {currentExercise.exercise_name}
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Sugestão: {currentExercise.sets}x{currentExercise.reps} · {currentExercise.rest}s descanso
          </p>

          {/* Progression suggestion */}
          <ProgressionSuggestionCard
            data={progressionData}
            loading={progressionLoading}
            onApply={(w) => setWeight(String(w))}
          />

          {/* Input grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Peso (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full bg-[#2A2A2A]/50 border border-gray-700/50 rounded-xl px-3 py-3 text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Reps</label>
              <input
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="w-full bg-[#2A2A2A]/50 border border-gray-700/50 rounded-xl px-3 py-3 text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Séries</label>
              <input
                type="number"
                value={sets}
                onChange={(e) => setSets(e.target.value)}
                className="w-full bg-[#2A2A2A]/50 border border-gray-700/50 rounded-xl px-3 py-3 text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSaveCurrentExercise}
            className="w-full py-4 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Guardar e Próximo
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </motion.div>
      )}

      {/* All AI exercises done */}
      {allAIDone && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-500/10 border border-green-500/20 rounded-[20px] p-5 text-center"
        >
          <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-2" />
          <h3 className="text-lg font-bold text-white mb-1">Exercícios concluídos!</h3>
          <p className="text-sm text-gray-400">
            {completedCount}/{aiTotal} exercícios do plano realizados
          </p>
        </motion.div>
      )}

      {/* Add extra exercise */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#111311] rounded-[20px] overflow-hidden"
      >
        <button
          onClick={() => setShowManualAdd(!showManualAdd)}
          className="w-full p-4 flex items-center gap-3 text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-[#2A2A2A] flex items-center justify-center">
            <Plus className="w-4 h-4 text-gray-400" />
          </div>
          <span className="text-sm font-medium text-gray-300">Adicionar exercício extra</span>
        </button>

        <AnimatePresence>
          {showManualAdd && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-4 overflow-hidden"
            >
              <input
                type="text"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="Nome do exercício..."
                className="w-full bg-[#2A2A2A]/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 mb-3"
              />
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Peso</label>
                  <input
                    type="number"
                    value={manualWeight}
                    onChange={(e) => setManualWeight(e.target.value)}
                    className="w-full bg-[#2A2A2A]/50 border border-gray-700/50 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Reps</label>
                  <input
                    type="number"
                    value={manualReps}
                    onChange={(e) => setManualReps(e.target.value)}
                    className="w-full bg-[#2A2A2A]/50 border border-gray-700/50 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Séries</label>
                  <input
                    type="number"
                    value={manualSets}
                    onChange={(e) => setManualSets(e.target.value)}
                    className="w-full bg-[#2A2A2A]/50 border border-gray-700/50 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              <button
                onClick={handleSaveManual}
                disabled={!manualName.trim()}
                className="w-full py-3 rounded-xl font-medium bg-[#2A2A2A] text-white flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Saved exercises list */}
      {savedExercises.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1E1E1E]/50 rounded-[20px] p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-400">Exercícios realizados</span>
            <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">
              {savedExercises.length}
            </span>
          </div>
          <div className="space-y-2">
            {savedExercises.map((ex) => (
              <div
                key={ex.timestamp}
                className="flex items-center justify-between bg-[#2A2A2A]/50 rounded-xl px-4 py-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white/70">{ex.name}</p>
                    {ex.source === "manual" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                        Extra
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {ex.weight}kg · {ex.sets}x{ex.reps}
                  </p>
                </div>
                <Check className="w-4 h-4 text-green-400" />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Complete workout button — always visible when at least 1 exercise done */}
      {savedExercises.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-20 left-0 right-0 z-50 px-5 pb-4 pt-3 bg-gradient-to-t from-black via-black/95 to-transparent"
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleComplete}
            disabled={completing}
            className="w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 bg-green-600 text-white disabled:opacity-50 transition-all shadow-lg shadow-green-600/30"
          >
            {completing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                A concluir...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Concluir Treino ({savedExercises.length})
              </>
            )}
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};
