import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useTimerNotification } from "@/hooks/useTimerNotification";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useActiveSession } from "@/hooks/useActiveSession";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Target,
  Zap,
  TrendingUp,
  Clock,
  Check,
  Loader2,
  CheckCircle2,
  SkipForward,
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
import { WorkoutShareCard } from "@/components/workout/WorkoutShareCard";

// Editorial components
import { ExerciseCardStack } from "@/components/workout/ExerciseCardStack";
import { EditorialQuote } from "@/components/workout/EditorialQuote";
import { WorkoutTimeline } from "@/components/workout/WorkoutTimeline";

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
  const [userEditedRest, setUserEditedRest] = useState(false);
  const [savedExercises, setSavedExercises] = useState<ExerciseLog[]>([]);
  const [justSaved, setJustSaved] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [completing, setCompleting] = useState(false);
  const { checkAndNotify: checkFatigueNotification } = useFatigueNotification();
  const [shareData, setShareData] = useState<{
    muscleGroups: string[]; durationMin: number; totalVolume: number;
    totalSets: number; date: string; dayOfWeek: string;
  } | null>(null);
  const workoutStartRef = useRef(Date.now());

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
      setUserEditedRest(false);
      const aiRest = currentPlannedExercise.rest;
      if (aiRest && aiRest > 0) {
        setRestTime(String(aiRest));
        if (!isRestRunning) setRestRemaining(aiRest);
      }
    }
  }, [currentPlannedExercise?.id, isGuidedMode]);

  // Load today's saved exercises on mount
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
    if (isGuidedMode && currentPlannedExercise) return;
    if (userEditedRest) return;
    const weightNum = parseInt(weight) || 0;
    const repsNum = parseInt(reps) || 0;
    const setsNum = parseInt(sets) || 0;
    if (weightNum > 0 && repsNum > 0 && setsNum > 0) {
      const { total, breakdown } = calculateRestTime(weightNum, repsNum, setsNum);
      setRestTime(String(total));
      setRestBreakdown(breakdown);
      if (!isRestRunning) setRestRemaining(total);
    }
  }, [weight, reps, sets, isRestRunning, isGuidedMode, currentPlannedExercise, userEditedRest]);

  // Persist timer state
  const TIMER_STORAGE_KEY = `liftmate_rest_timer_${user?.id}`;

  useEffect(() => {
    if (!user) return;
    try {
      const saved = localStorage.getItem(TIMER_STORAGE_KEY);
      if (!saved) return;
      const { startTime, duration, isActive } = JSON.parse(saved);
      if (!isActive || !startTime || !duration) return;
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = duration - elapsed;
      if (remaining > 0) {
        setRestTime(String(duration));
        setRestRemaining(remaining);
        setIsRestRunning(true);
      } else {
        localStorage.removeItem(TIMER_STORAGE_KEY);
      }
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (isRestRunning) {
      const startTime = Date.now() - ((parseInt(restTime) - restRemaining) * 1000);
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify({
        startTime,
        duration: parseInt(restTime),
        isActive: true,
      }));
    } else {
      localStorage.removeItem(TIMER_STORAGE_KEY);
    }
  }, [isRestRunning, restRemaining, restTime, user]);

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
  const resetRestTimer = () => { setIsRestRunning(false); setRestRemaining(parseInt(restTime)); if (user) localStorage.removeItem(TIMER_STORAGE_KEY); };

  const REST_PRESETS = [30, 60, 90, 120, 180, 300];
  const handleRestPreset = (seconds: number) => {
    setUserEditedRest(true);
    setRestTime(String(seconds));
    if (!isRestRunning) setRestRemaining(seconds);
  };

  const isLastAIExercise = isGuidedMode && !allAIDone && currentAIIndex === aiExercises.length - 1;

  const handleSaveClick = () => {
    if (!selectedExercise.trim()) { toast.error("Seleciona um exercício primeiro"); return; }
    if (!user) { toast.error("Faz login para guardar exercícios"); return; }

    if (isGuidedMode && currentPlannedExercise && !allAIDone) {
      confirmSaveExercise();
      markExerciseCompleted(currentPlannedExercise.id);
      if (isLastAIExercise) {
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

      if (!isGuidedMode) {
        const storageKey = `liftmate_workout_history_${user.id}`;
        const history = JSON.parse(localStorage.getItem(storageKey) || '{"sessions":[]}');
        const todayStr = today.toISOString().split("T")[0];
        history.sessions = history.sessions.filter((s: any) => s.date !== todayStr);
        localStorage.setItem(storageKey, JSON.stringify(history));
      }

      checkFatigueNotification(result.fatigue_index);

      const durationMin = Math.round((Date.now() - workoutStartRef.current) / 60000);
      const totalVolume = savedExercises.reduce((acc, e) => acc + (e.weight * e.reps * e.sets), 0);
      const totalSets = savedExercises.reduce((acc, e) => acc + e.sets, 0);
      const muscleGroups = activeSession?.muscle_groups || todayWorkout?.split(" + ") || [];

      setShareData({
        muscleGroups,
        durationMin: durationMin || 1,
        totalVolume,
        totalSets,
        date: activeSession?.date || new Date().toISOString().split("T")[0],
        dayOfWeek: activeSession?.day_of_week || weekDaysMap[new Date().getDay()],
      });

      (window as any).__lastSessionId = result.session_id;
    } catch (err: any) {
      console.error("[Workout] Complete error:", err);
      toast.error("Erro ao concluir treino. Os dados não foram perdidos.");
    } finally {
      setCompleting(false);
    }
  };

  const isRestDay = !todayWorkout || todayWorkout === "Descanso";

  const saveButtonLabel = useMemo(() => {
    if (!isGuidedMode || allAIDone) return undefined;
    const isLast = currentAIIndex === aiExercises.length - 1;
    if (isLast) return "Concluir Treino";
    return "Guardar e Próximo";
  }, [isGuidedMode, allAIDone, currentAIIndex, aiExercises.length]);

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* ── HEADER (old style) ── */}
      <div className="px-6 pt-14 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center">
            <Zap className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isRestDay ? t("workout.restDay") : todayMuscleGroups.join(" + ")}
            </h1>
            <p className="text-sm text-muted-foreground">{weekDaysMap[new Date().getDay()]}</p>
          </div>
        </div>
      </div>

      {isRestDay ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-6 py-16 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-6">
            <Target className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-semibold text-foreground/70 mb-2">{t("workout.activeRecovery")}</h3>
          <p className="text-muted-foreground max-w-xs mx-auto">{t("workout.restImportant")}</p>
        </motion.div>
      ) : (
        <div className="space-y-5">
          {/* ── TRAINING TYPE SELECTOR ── */}
          {!isGuidedMode && (
            <div className="px-6 space-y-5">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl p-5 bg-card border border-border/20"
              >
                <span className="text-sm font-medium mb-4 block text-muted-foreground">
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
                            : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                        }`}
                      >
                        {type}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>

              {/* ── AI GENERATOR ── */}
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
            </div>
          )}

          {/* ── GUIDED MODE: Card Stack ── */}
          {isGuidedMode && aiExercises.length > 0 && (
            <>
              <div className="px-6 pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Progresso</span>
                  <span className="text-xs font-bold text-primary">{completedAICount}/{aiExercises.length}</span>
                </div>
                <div className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ type: "spring", stiffness: 100 }}
                  />
                </div>
              </div>

              <ExerciseCardStack
                exercises={aiExercises}
                currentIndex={currentAIIndex}
                completedCount={completedAICount}
                onSwipeRight={(ex) => {
                  // Pre-fill form
                  setSelectedExercise(ex.exercise_name);
                  setReps(String(parseInt(ex.reps) || 10));
                  setSets(String(ex.sets));
                  if (ex.rest > 0) {
                    setRestTime(String(ex.rest));
                    if (!isRestRunning) setRestRemaining(ex.rest);
                  }
                  // Save + mark completed
                  handleSaveClick();
                  markExerciseCompleted(ex.id);
                }}
                onSwipeLeft={(ex) => {
                  // Undo - skip for now (mark as completed undone)
                  toast.info(`${ex.exercise_name} desfeito`);
                }}
                onFinish={handleCompleteWorkout}
                isCompleting={completing}
              />
            </>
          )}

          {/* ── EXERCISE REGISTRATION CARD ── */}
          <div className="px-6 space-y-5">
            {/* Guided mode: current exercise label */}
            {isGuidedMode && currentPlannedExercise && !allAIDone && (
              <motion.div
                key={currentPlannedExercise.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{currentAIIndex + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-primary font-medium">
                    Exercício {completedAICount + 1} de {aiExercises.length}
                  </p>
                  <p className="text-base font-bold text-foreground">
                    {currentPlannedExercise.exercise_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sugestão: {currentPlannedExercise.sets}x{currentPlannedExercise.reps} · {currentPlannedExercise.rest}s
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-primary/50" />
              </motion.div>
            )}

            {/* Main Carousel Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card/50 rounded-2xl overflow-hidden border border-border/20"
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

            {/* Saved Exercises */}
            {savedExercises.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card/50 rounded-2xl p-5 border border-border/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t("workout.savedExercisesToday")}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/15 text-primary font-medium">
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
                      className="flex items-center justify-between bg-muted/20 rounded-xl px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground/70">{exercise.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(exercise.timestamp).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-primary">{exercise.weight}kg</p>
                        <p className="text-xs text-muted-foreground">{exercise.sets}x{exercise.reps}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Rest Calculation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5 bg-card border border-border/20"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-foreground">Cálculo do Descanso</span>
                <span className="text-xs px-3 py-1 rounded-full bg-primary/15 text-primary font-medium">
                  {restBreakdown.repsCategory}
                </span>
              </div>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                    <span className="text-muted-foreground">Tempo base</span>
                  </div>
                  <span className="font-medium text-foreground">{restBreakdown.base}s</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Peso ({weight}kg)</span>
                  </div>
                  <span className="font-medium text-primary">+{restBreakdown.weightBonus}s</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-muted-foreground">Repetições ({reps})</span>
                  </div>
                  <span className="font-medium text-amber-400">
                    {restBreakdown.repsAdjustment >= 0 ? "+" : ""}{restBreakdown.repsAdjustment}s
                  </span>
                </div>
                <div className="border-t border-border/30 pt-2.5 flex items-center justify-between">
                  <span className="font-semibold text-foreground">Total recomendado</span>
                  <span className="font-bold text-lg text-primary">{parseInt(restTime)}s</span>
                </div>
              </div>
            </motion.div>

            {/* Rest Timer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card/50 rounded-2xl p-5 border border-border/20"
            >
              <span className="text-sm font-medium text-muted-foreground text-center block mb-3">
                {t("workout.restTimer")}
              </span>

              <div className="flex flex-wrap gap-1.5 mb-3 justify-center">
                {REST_PRESETS.map((sec) => {
                  const label = sec >= 60 ? `${sec / 60}min` : `${sec}s`;
                  const isActive = parseInt(restTime) === sec;
                  return (
                    <button
                      key={sec}
                      onClick={() => handleRestPreset(sec)}
                      disabled={isRestRunning}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? "bg-primary/20 text-primary border border-primary/40"
                          : "bg-muted/20 text-muted-foreground border border-transparent hover:bg-muted/40"
                      } disabled:opacity-40`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="text-center mb-4">
                <span className={`text-5xl font-mono font-bold tracking-tight ${isRestRunning ? "text-primary" : "text-foreground/70"}`}>
                  {formatRestTime(restRemaining)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={isRestRunning ? () => setIsRestRunning(false) : startRestTimer}
                  className={`flex-1 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all text-sm ${
                    isRestRunning
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  }`}
                >
                  {isRestRunning ? (
                    <><Pause className="w-4 h-4" /> Pausar</>
                  ) : (
                    <><Play className="w-4 h-4" /> Iniciar Descanso</>
                  )}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={resetRestTimer}
                  className="w-12 h-12 rounded-xl bg-muted/30 flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>

            {/* ── Complete Workout Button ── */}
            {savedExercises.length > 0 && !isGuidedMode && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleCompleteWorkout}
                disabled={completing}
                className="w-full py-4 rounded-2xl bg-[hsl(142,60%,45%)] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[hsl(142,60%,45%)]/25 disabled:opacity-50"
              >
                {completing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> A concluir...</>
                ) : (
                  <><Check className="w-4 h-4" /> Concluir Treino ({savedExercises.length} exercícios)</>
                )}
              </motion.button>
            )}
          </div>

          {/* ── EDITORIAL QUOTE (after timer) ── */}
          <EditorialQuote
            muscleGroups={todayMuscleGroups}
            aiName={settings?.ai_name || "Victoria AI"}
          />

          {/* ── TIMELINE (after quote) ── */}
          <WorkoutTimeline todayMuscleGroups={todayMuscleGroups} />
        </div>
      )}

      <BottomNav />

      {/* Save Confirmation Dialog */}
      <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Guardar exercício?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              <span className="font-semibold text-primary">{selectedExercise}</span>
              <br />
              {weight}kg · {sets}x{reps} reps
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted text-foreground border-none hover:bg-muted/80">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmSaveExercise} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AnimatePresence>
        {shareData && (
          <WorkoutShareCard
            open={!!shareData}
            onClose={() => {
              setShareData(null);
              const sid = (window as any).__lastSessionId;
              if (sid) navigate(`/workout-summary/${sid}`);
            }}
            data={shareData}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Workout;
