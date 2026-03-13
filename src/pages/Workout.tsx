import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useTimerNotification } from "@/hooks/useTimerNotification";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useActiveSession } from "@/hooks/useActiveSession";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Dumbbell,
  Target,
  Zap,
  TrendingUp,
  Clock,
  Save,
  Check,
  Loader2,
  CheckCircle2,
  SkipForward,
  Plus,
  ChevronRight,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BottomNav } from "@/components/BottomNav";
import { getExercisesForGroups } from "@/data/exerciseDatabase";
import {
  getWorkoutHistory,
  saveWorkoutSession,
  type ExerciseLog,
  type WorkoutSession,
} from "@/data/workoutHistory";
import { toast } from "sonner";
import { MainWorkoutCarousel } from "@/components/workout/MainWorkoutCarousel";
import { AIWorkoutGenerator } from "@/components/workout/AIWorkoutGenerator";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { completeWorkout } from "@/services/workoutService";
import { useFatigueNotification } from "@/hooks/useFatigueNotification";
import { Progress } from "@/components/ui/progress";

const weekDaysMap: Record<number, string> = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
};

type TrainingType = "Força" | "Hipertrofia" | "Resistência";

const trainingTypeConfig: Record<TrainingType, { icon: typeof Zap; description: string }> = {
  Força: { icon: Zap, description: "Cargas altas, poucas reps" },
  Hipertrofia: { icon: TrendingUp, description: "Volume moderado" },
  Resistência: { icon: Clock, description: "Mais reps, menos descanso" },
};

interface RestBreakdown {
  base: number;
  weightBonus: number;
  repsAdjustment: number;
  setsBonus: number;
  repsCategory: string;
}

const calculateRestTime = (
  weight: number,
  reps: number,
  sets: number
): { total: number; breakdown: RestBreakdown } => {
  const breakdown: RestBreakdown = {
    base: 60,
    weightBonus: 0,
    repsAdjustment: 0,
    setsBonus: 0,
    repsCategory: "Hipertrofia",
  };
  breakdown.weightBonus = Math.floor(weight / 10) * 10;
  if (reps <= 5) { breakdown.repsAdjustment = 60; breakdown.repsCategory = "Força máxima"; }
  else if (reps <= 8) { breakdown.repsAdjustment = 30; breakdown.repsCategory = "Força/Hipertrofia"; }
  else if (reps <= 12) { breakdown.repsAdjustment = 0; breakdown.repsCategory = "Hipertrofia"; }
  else { breakdown.repsAdjustment = -15; breakdown.repsCategory = "Resistência"; }
  if (sets >= 4) breakdown.setsBonus = 15;
  const total = breakdown.base + breakdown.weightBonus + breakdown.repsAdjustment + breakdown.setsBonus;
  return { total: Math.max(30, Math.min(300, total)), breakdown };
};

const Workout = () => {
  const { t } = useLanguage();
  const { settings, isLoading } = useUserSettings();
  const { activeSession, loading: sessionLoading, refresh: refreshSession, markExerciseCompleted, startSession } = useActiveSession();
  const [trainingType, setTrainingType] = useState<TrainingType>("Hipertrofia");
  const [selectedExercise, setSelectedExercise] = useState("");
  const [weight, setWeight] = useState("30");
  const [reps, setReps] = useState("7");
  const [sets, setSets] = useState("3");
  const [restTime, setRestTime] = useState("90");
  const [restBreakdown, setRestBreakdown] = useState<RestBreakdown>({
    base: 60, weightBonus: 30, repsAdjustment: 30, setsBonus: 0, repsCategory: "Força/Hipertrofia",
  });

  const [isRestRunning, setIsRestRunning] = useState(false);
  const [restRemaining, setRestRemaining] = useState(90);
  const [savedExercises, setSavedExercises] = useState<ExerciseLog[]>([]);
  const [justSaved, setJustSaved] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [completing, setCompleting] = useState(false);
  const { checkAndNotify: checkFatigueNotification } = useFatigueNotification();

  // --- AI guided mode state ---
  const isGuidedMode = !!(activeSession && activeSession.planned_exercises.length > 0);

  const aiExercises = useMemo(() => {
    if (!activeSession) return [];
    return activeSession.planned_exercises.filter((e) => e.source === "ai");
  }, [activeSession]);

  const currentAIIndex = useMemo(() => {
    const idx = aiExercises.findIndex((e) => !e.completed);
    return idx === -1 ? aiExercises.length : idx;
  }, [aiExercises]);

  const currentPlannedExercise = aiExercises[currentAIIndex] || null;
  const completedAICount = aiExercises.filter((e) => e.completed).length;
  const allAIDone = currentAIIndex >= aiExercises.length;
  const progressPercent = aiExercises.length > 0 ? Math.round((completedAICount / aiExercises.length) * 100) : 0;

  // Pre-fill card when guided exercise changes
  useEffect(() => {
    if (currentPlannedExercise && isGuidedMode) {
      setSelectedExercise(currentPlannedExercise.exercise_name);
      setReps(String(parseInt(currentPlannedExercise.reps) || 10));
      setSets(String(currentPlannedExercise.sets));
      // Use AI-suggested rest time
      const aiRest = currentPlannedExercise.rest;
      if (aiRest && aiRest > 0) {
        setRestTime(String(aiRest));
        if (!isRestRunning) setRestRemaining(aiRest);
      }
      // weight stays or gets set from progression later
    }
  }, [currentPlannedExercise?.id, isGuidedMode]);

  // Load today's saved exercises on mount (manual flow)
  useEffect(() => {
    if (!user) return;
    const history = getWorkoutHistory(user.id);
    const today = new Date().toISOString().split("T")[0];
    const todaySession = history.sessions.find((s) => s.date === today);
    if (todaySession?.exerciseLogs) {
      setSavedExercises(todaySession.exerciseLogs);
    }
  }, [user]);

  const todayWorkout = useMemo(() => {
    const schedule = settings?.onboarding_data?.schedule || {};
    const today = new Date();
    const todayName = weekDaysMap[today.getDay()];
    const muscleGroups = schedule[todayName] || null;
    return muscleGroups
      ? Array.isArray(muscleGroups) ? muscleGroups.join(" + ") : muscleGroups
      : null;
  }, [settings]);

  const todayMuscleGroups = useMemo(() => {
    if (!todayWorkout || todayWorkout === "Descanso") return [];
    return todayWorkout.split(" + ");
  }, [todayWorkout]);

  const todayExercises = useMemo(() => {
    if (!todayWorkout || todayWorkout === "Descanso") return [];
    return getExercisesForGroups(todayWorkout.split(" + "));
  }, [todayWorkout]);

  // Rest timer
  useEffect(() => {
    const weightNum = parseInt(weight) || 0;
    const repsNum = parseInt(reps) || 0;
    const setsNum = parseInt(sets) || 0;
    if (weightNum > 0 && repsNum > 0 && setsNum > 0) {
      const { total, breakdown } = calculateRestTime(weightNum, repsNum, setsNum);
      setRestTime(String(total));
      setRestBreakdown(breakdown);
      if (!isRestRunning) setRestRemaining(total);
    }
  }, [weight, reps, sets, isRestRunning]);

  const { notifyTimerEnd } = useTimerNotification();
  const hasNotifiedRef = useRef(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRestRunning && restRemaining > 0) {
      hasNotifiedRef.current = false;
      interval = setInterval(() => {
        setRestRemaining((prev) => {
          if (prev <= 1) {
            setIsRestRunning(false);
            if (!hasNotifiedRef.current) {
              hasNotifiedRef.current = true;
              notifyTimerEnd();
              toast.success("Tempo de descanso terminado! 💪");
            }
            return parseInt(restTime);
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRestRunning, restRemaining, restTime, notifyTimerEnd]);

  const formatRestTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const startRestTimer = () => { setRestRemaining(parseInt(restTime)); setIsRestRunning(true); };
  const resetRestTimer = () => { setIsRestRunning(false); setRestRemaining(parseInt(restTime)); };

  const isLastAIExercise = isGuidedMode && !allAIDone && currentAIIndex === aiExercises.length - 1;

  // --- Save handler: works for both manual and guided ---
  const handleSaveClick = () => {
    if (!selectedExercise.trim()) { toast.error("Seleciona um exercício primeiro"); return; }
    if (!user) { toast.error("Faz login para guardar exercícios"); return; }

    if (isGuidedMode && currentPlannedExercise && !allAIDone) {
      // Guided mode: save and advance
      confirmSaveExercise();
      markExerciseCompleted(currentPlannedExercise.id);

      // If this was the last AI exercise, auto-complete the workout
      if (isLastAIExercise) {
        // Small delay to let state update, then complete
        setTimeout(() => handleCompleteWorkout(), 500);
      }
    } else {
      setShowSaveConfirm(true);
    }
  };

  const confirmSaveExercise = () => {
    if (!user) return;
    const newLog: ExerciseLog = {
      name: selectedExercise,
      weight: parseInt(weight) || 0,
      reps: parseInt(reps) || 0,
      sets: parseInt(sets) || 0,
      restTime: parseInt(restTime) || 0,
      timestamp: Date.now(),
    };
    const updatedExercises = [...savedExercises, newLog];
    setSavedExercises(updatedExercises);

    if (!isGuidedMode) {
      // Manual mode: persist to localStorage
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0];
      const muscleGroups = todayWorkout?.split(" + ") || [];
      const session: Omit<WorkoutSession, "timestamp"> = {
        date: dateStr,
        dayOfWeek: weekDaysMap[today.getDay()],
        muscleGroups,
        exercisesCompleted: updatedExercises.map((e) => e.name),
        exerciseLogs: updatedExercises,
        totalExercises: todayExercises.length,
        completionRate: Math.round((updatedExercises.length / Math.max(todayExercises.length, 1)) * 100),
      };
      saveWorkoutSession(session, user.id);
    }

    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
    toast.success(`${selectedExercise} guardado!`);
    setSelectedExercise("");
    setShowSaveConfirm(false);
  };

  const handleSkipExercise = useCallback(() => {
    if (!currentPlannedExercise) return;
    markExerciseCompleted(currentPlannedExercise.id);
    toast.info(`${currentPlannedExercise.exercise_name} saltado`);
  }, [currentPlannedExercise, markExerciseCompleted]);

  // --- Complete workout ---
  const handleCompleteWorkout = async () => {
    if (!user) return;
    if (savedExercises.length === 0) return;
    setCompleting(true);
    try {
      const today = new Date();
      const result = await completeWorkout({
        date: activeSession?.date || today.toISOString().split("T")[0],
        day_of_week: activeSession?.day_of_week || weekDaysMap[today.getDay()],
        muscle_groups: activeSession?.muscle_groups || todayWorkout?.split(" + ") || [],
        exercises: savedExercises.map((e) => ({
          name: e.name, weight: e.weight, reps: e.reps, sets: e.sets,
        })),
        session_id: activeSession?.id,
      });

      // Clear localStorage for manual flow
      if (!isGuidedMode) {
        const storageKey = `liftmate_workout_history_${user.id}`;
        const history = JSON.parse(localStorage.getItem(storageKey) || '{"sessions":[]}');
        const todayStr = today.toISOString().split("T")[0];
        history.sessions = history.sessions.filter((s: any) => s.date !== todayStr);
        localStorage.setItem(storageKey, JSON.stringify(history));
      }

      checkFatigueNotification(result.fatigue_index);
      navigate(`/workout-summary/${result.session_id}`);
    } catch (err: any) {
      console.error("[Workout] Complete error:", err);
      toast.error("Erro ao concluir treino. Os dados não foram perdidos.");
    } finally {
      setCompleting(false);
    }
  };

  const isRestDay = !todayWorkout || todayWorkout === "Descanso";

  // Button label for guided mode
  const saveButtonLabel = useMemo(() => {
    if (!isGuidedMode || allAIDone) return undefined;
    const isLast = currentAIIndex === aiExercises.length - 1;
    if (isLast) return "Concluir Treino";
    return "Guardar e Próximo";
  }, [isGuidedMode, allAIDone, currentAIIndex, aiExercises.length]);

  return (
    <div className="min-h-screen bg-black pb-32">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#1E1E1E]/50 flex items-center justify-center">
            <Dumbbell className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-destructive-foreground">
              {isRestDay ? t("workout.restDay") : todayWorkout}
            </h1>
            <p className="text-sm text-gray-400/70">{weekDaysMap[new Date().getDay()]}</p>
          </div>
        </motion.div>
      </div>

      {/* Guided mode progress bar */}
      {isGuidedMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-5 mb-5"
        >
          <div className="bg-[#111311] rounded-[20px] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-400">
                {activeSession?.muscle_groups?.join(" + ") || "Treino"}
              </span>
              <span className="text-sm font-bold text-primary">
                {completedAICount}/{aiExercises.length} exercícios
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#2A2A2A] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ type: "spring", stiffness: 100 }}
              />
            </div>

            {/* Mini exercise indicators */}
            <div className="flex gap-1 mt-3 overflow-x-auto pb-1">
              {aiExercises.map((ex, i) => (
                <div
                  key={ex.id}
                  className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                    ex.completed
                      ? "bg-green-500/20 text-green-400"
                      : i === currentAIIndex
                      ? "bg-primary/20 text-primary ring-1 ring-primary/50"
                      : "bg-[#2A2A2A]/50 text-gray-500"
                  }`}
                >
                  {ex.completed ? <Check className="w-4 h-4" /> : i + 1}
                </div>
              ))}
            </div>

            {/* Skip button for current exercise */}
            {currentPlannedExercise && !allAIDone && (
              <button
                onClick={handleSkipExercise}
                className="mt-3 text-xs text-gray-500 flex items-center gap-1 hover:text-gray-300 transition-colors"
              >
                <SkipForward className="w-3 h-3" />
                Saltar {currentPlannedExercise.exercise_name}
              </button>
            )}

            {/* All done message */}
            {allAIDone && (
              <div className="mt-3 flex items-center gap-2 text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-medium">Todos os exercícios do plano concluídos!</span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {isRestDay ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-5 py-12 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-[#1E1E1E]/50 flex items-center justify-center mx-auto mb-6">
            <Target className="w-10 h-10 text-gray-400/70" />
          </div>
          <h3 className="text-xl font-semibold text-white/70 mb-2">{t("workout.activeRecovery")}</h3>
          <p className="text-gray-400/70 max-w-xs mx-auto">{t("workout.restImportant")}</p>
        </motion.div>
      ) : (
        <div className="px-5 space-y-5 bg-black">
          {/* Fixed bottom CTA */}
          {savedExercises.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed bottom-20 left-0 right-0 z-50 px-5 pb-4 pt-3 bg-gradient-to-t from-black via-black/95 to-transparent"
            >
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleCompleteWorkout}
                disabled={completing}
                className="w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-600/30"
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

          {/* Training Type Selector — hide in guided mode */}
          {!isGuidedMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-[20px] p-5 bg-[#111311]"
            >
              <span className="text-sm font-medium mb-4 block text-gray-400">
                {t("workout.trainingType")}
              </span>
              <div className="flex gap-2">
                {(Object.keys(trainingTypeConfig) as TrainingType[]).map((type) => {
                  const isSelected = trainingType === type;
                  return (
                    <motion.button
                      key={type}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setTrainingType(type)}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                          : "bg-[#2A2A2A]/50 text-gray-400/70 hover:bg-[#2A2A2A]/80"
                      }`}
                    >
                      {type}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* AI Workout Generator — hide in guided mode */}
          {!isGuidedMode && (
            <AIWorkoutGenerator
              todayMuscleGroups={todayMuscleGroups}
              trainingType={trainingType}
              onAddExercise={(exercise) => {
                setSelectedExercise(exercise.name);
                setWeight(String(exercise.weight || 30));
                setReps(String(exercise.reps));
                setSets(String(exercise.sets));
              }}
              onSessionCreated={refreshSession}
            />
          )}

          {/* Guided mode: exercise label */}
          {isGuidedMode && currentPlannedExercise && !allAIDone && (
            <motion.div
              key={currentPlannedExercise.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-primary/10 border border-primary/20 rounded-[20px] p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">{currentAIIndex + 1}</span>
              </div>
              <div className="flex-1">
                <p className="text-xs text-primary font-medium">
                  Exercício {completedAICount + 1} de {aiExercises.length}
                </p>
                <p className="text-base font-bold text-white">
                  {currentPlannedExercise.exercise_name}
                </p>
                <p className="text-xs text-gray-400">
                  Sugestão: {currentPlannedExercise.sets}x{currentPlannedExercise.reps} · {currentPlannedExercise.rest}s descanso
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-primary/50" />
            </motion.div>
          )}

          {/* Main Carousel Card (Registar Exercício) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1E1E1E]/50 rounded-[20px] overflow-hidden"
          >
            <MainWorkoutCarousel
              selectedExercise={selectedExercise}
              setSelectedExercise={setSelectedExercise}
              weight={weight}
              setWeight={setWeight}
              reps={reps}
              setReps={setReps}
              sets={sets}
              setSets={setSets}
              restTime={restTime}
              setRestTime={setRestTime}
              todayExercises={todayExercises}
              saveExercise={handleSaveClick}
              justSaved={justSaved}
              saveButtonLabel={saveButtonLabel}
            />
          </motion.div>

          {/* Saved Exercises Today */}
          {savedExercises.length > 0 && (
            <motion.div
              id="saved-exercises-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-[#1E1E1E]/50 rounded-[20px] p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-400/70">
                  {t("workout.savedExercisesToday")}
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">
                  {savedExercises.length}
                </span>
              </div>
              <div className="space-y-2">
                {savedExercises.map((exercise, index) => (
                  <motion.div
                    key={exercise.timestamp}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between bg-[#2A2A2A]/50 rounded-xl px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-white/70">{exercise.name}</p>
                      <p className="text-xs text-gray-400/70">
                        {new Date(exercise.timestamp).toLocaleTimeString("pt-PT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-primary">{exercise.weight}kg</p>
                      <p className="text-xs text-gray-400/70">
                        {exercise.sets}x{exercise.reps}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Rest Time Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-[20px] p-5 bg-[#111311]"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-400/70">{t("workout.restCalculation")}</span>
              <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">
                {restBreakdown.repsCategory}
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-500" />
                  <span className="text-sm text-gray-400/70">{t("workout.baseTime")}</span>
                </div>
                <span className="text-sm font-medium text-white/70">{restBreakdown.base}s</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm text-gray-400/70">{t("workout.weight")} ({weight}kg)</span>
                </div>
                <span className={`text-sm font-medium ${restBreakdown.weightBonus > 0 ? "text-primary" : "text-gray-400/70"}`}>
                  +{restBreakdown.weightBonus}s
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${restBreakdown.repsAdjustment >= 0 ? "bg-amber-500" : "bg-green-500"}`} />
                  <span className="text-sm text-gray-400/70">{t("workout.reps")} ({reps})</span>
                </div>
                <span className={`text-sm font-medium ${restBreakdown.repsAdjustment > 0 ? "text-amber-500" : restBreakdown.repsAdjustment < 0 ? "text-green-500" : "text-gray-400/70"}`}>
                  {restBreakdown.repsAdjustment >= 0 ? "+" : ""}{restBreakdown.repsAdjustment}s
                </span>
              </div>
              {restBreakdown.setsBonus > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-sm text-gray-400/70">{t("workout.highSets")} ({sets})</span>
                  </div>
                  <span className="text-sm font-medium text-blue-400">+{restBreakdown.setsBonus}s</span>
                </div>
              )}
              <div className="border-t border-gray-700/50 my-2" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white/70">{t("workout.totalRecommended")}</span>
                <span className="text-lg font-bold text-primary">{restTime}s</span>
              </div>
            </div>
          </motion.div>

          {/* Rest Timer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-primary/10 via-[#1E1E1E]/50 to-[#1E1E1E]/50 rounded-[20px] p-6 border border-primary/20 bg-[#111311]"
          >
            <span className="text-sm font-medium text-gray-400/70 text-center block mb-4">
              {t("workout.restTimer")}
            </span>
            <motion.div key={restRemaining} initial={{ scale: 1.02 }} animate={{ scale: 1 }} className="text-center mb-6">
              <span className={`text-7xl font-mono font-bold tracking-tight ${isRestRunning ? "text-primary" : "text-white/70"}`}>
                {formatRestTime(restRemaining)}
              </span>
            </motion.div>
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={isRestRunning ? () => setIsRestRunning(false) : startRestTimer}
                className={`flex-1 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                  isRestRunning
                    ? "bg-red-500/90 text-white"
                    : "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                }`}
              >
                {isRestRunning ? (
                  <><Pause className="w-5 h-5" /> Pausar</>
                ) : (
                  <><Play className="w-5 h-5" /> Iniciar Descanso</>
                )}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={resetRestTimer}
                className="w-14 h-14 rounded-xl bg-[#2A2A2A]/50 flex items-center justify-center text-gray-400/70 hover:bg-[#2A2A2A]/80 transition-all"
              >
                <RotateCcw className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      <BottomNav />

      {/* Save Confirmation Dialog (manual mode only) */}
      <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <AlertDialogContent className="bg-[#1E1E1E] border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Guardar exercício?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              <span className="font-semibold text-primary">{selectedExercise}</span>
              <br />
              {weight}kg · {sets}x{reps} reps
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-white border-none hover:bg-gray-600">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmSaveExercise} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Workout;
