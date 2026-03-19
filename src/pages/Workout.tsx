import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useTimerNotification } from "@/hooks/useTimerNotification";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useActiveSession, type PlannedExercise } from "@/hooks/useActiveSession";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Dumbbell,
  Target,
  Zap,
  TrendingUp,
  Clock,
  Loader2,
  CheckCircle2,
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
import { ExerciseExecutionCarousel } from "@/components/workout/ExerciseExecutionCarousel";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { completeWorkout } from "@/services/workoutService";
import { useFatigueNotification } from "@/hooks/useFatigueNotification";

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
  if (reps <= 5) {
    breakdown.repsAdjustment = 60;
    breakdown.repsCategory = "Força máxima";
  } else if (reps <= 8) {
    breakdown.repsAdjustment = 30;
    breakdown.repsCategory = "Força/Hipertrofia";
  } else if (reps <= 12) {
    breakdown.repsAdjustment = 0;
    breakdown.repsCategory = "Hipertrofia";
  } else {
    breakdown.repsAdjustment = -15;
    breakdown.repsCategory = "Resistência";
  }
  if (sets >= 4) breakdown.setsBonus = 15;
  const total = breakdown.base + breakdown.weightBonus + breakdown.repsAdjustment + breakdown.setsBonus;
  return { total: Math.max(30, Math.min(300, total)), breakdown };
};

const Workout = () => {
  const { t } = useLanguage();
  const { settings } = useUserSettings();
  const { activeSession, refresh: refreshSession, markExerciseCompleted, startSession } = useActiveSession();
  const [trainingType, setTrainingType] = useState<TrainingType>("Hipertrofia");
  const [selectedExercise, setSelectedExercise] = useState("");
  const [weight, setWeight] = useState("30");
  const [reps, setReps] = useState("7");
  const [sets, setSets] = useState("3");
  const [restTime, setRestTime] = useState("90");
  const [restBreakdown, setRestBreakdown] = useState<RestBreakdown>({
    base: 60,
    weightBonus: 30,
    repsAdjustment: 30,
    setsBonus: 0,
    repsCategory: "Força/Hipertrofia",
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

  const plannedExercises = useMemo(() => activeSession?.planned_exercises ?? [], [activeSession?.planned_exercises]);
  const isGuidedMode = plannedExercises.length > 0;
  const completedPlannedCount = useMemo(
    () => plannedExercises.filter((exercise) => exercise.completed).length,
    [plannedExercises]
  );

  useEffect(() => {
    if (isGuidedMode && activeSession?.id && activeSession.status === "planned") {
      void startSession(activeSession.id);
    }
  }, [activeSession?.id, activeSession?.status, isGuidedMode, startSession]);

  useEffect(() => {
    if (!user) return;
    const history = getWorkoutHistory(user.id);
    const today = new Date().toISOString().split("T")[0];
    const todaySession = history.sessions.find((session) => session.date === today);
    if (todaySession?.exerciseLogs) {
      setSavedExercises(todaySession.exerciseLogs);
    }
  }, [user]);

  const todayWorkout = useMemo(() => {
    const schedule = settings?.onboarding_data?.schedule || {};
    const today = new Date();
    const todayName = weekDaysMap[today.getDay()];
    const muscleGroups = schedule[todayName] || null;
    return muscleGroups ? (Array.isArray(muscleGroups) ? muscleGroups.join(" + ") : muscleGroups) : null;
  }, [settings]);

  const todayMuscleGroups = useMemo(() => {
    if (!todayWorkout || todayWorkout === "Descanso") return [];
    return todayWorkout.split(" + ");
  }, [todayWorkout]);

  const todayExercises = useMemo(() => {
    if (!todayWorkout || todayWorkout === "Descanso") return [];
    return getExercisesForGroups(todayWorkout.split(" + "));
  }, [todayWorkout]);

  useEffect(() => {
    if (isGuidedMode) return;

    const weightNum = parseInt(weight) || 0;
    const repsNum = parseInt(reps) || 0;
    const setsNum = parseInt(sets) || 0;

    if (weightNum > 0 && repsNum > 0 && setsNum > 0) {
      const { total, breakdown } = calculateRestTime(weightNum, repsNum, setsNum);
      setRestTime(String(total));
      setRestBreakdown(breakdown);
      if (!isRestRunning) setRestRemaining(total);
    }
  }, [weight, reps, sets, isRestRunning, isGuidedMode]);

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

  const startRestTimer = () => {
    setRestRemaining(parseInt(restTime));
    setIsRestRunning(true);
  };

  const resetRestTimer = () => {
    setIsRestRunning(false);
    setRestRemaining(parseInt(restTime));
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

    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];
    const muscleGroups = todayWorkout?.split(" + ") || [];
    const session: Omit<WorkoutSession, "timestamp"> = {
      date: dateStr,
      dayOfWeek: weekDaysMap[today.getDay()],
      muscleGroups,
      exercisesCompleted: updatedExercises.map((exercise) => exercise.name),
      exerciseLogs: updatedExercises,
      totalExercises: todayExercises.length,
      completionRate: Math.round((updatedExercises.length / Math.max(todayExercises.length, 1)) * 100),
    };

    saveWorkoutSession(session, user.id);

    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
    toast.success(`${selectedExercise} guardado!`);
    setSelectedExercise("");
    setShowSaveConfirm(false);
  };

  const handleSaveClick = () => {
    if (!selectedExercise.trim()) {
      toast.error("Seleciona um exercício primeiro");
      return;
    }

    if (!user) {
      toast.error("Faz login para guardar exercícios");
      return;
    }

    setShowSaveConfirm(true);
  };

  const guidedExercisesPayload = useMemo(
    () =>
      plannedExercises.map((exercise) => ({
        name: exercise.exercise_name,
        weight: 0,
        reps: Number.parseInt(exercise.reps, 10) || 0,
        sets: exercise.sets,
      })),
    [plannedExercises]
  );

  const handleCompleteWorkout = useCallback(
    async (
      exerciseOverrides?: {
        name: string;
        weight: number;
        reps: number;
        sets: number;
        rpe?: number | null;
      }[]
    ) => {
      if (!user) return;

      const today = new Date();
      const exercisesPayload =
        exerciseOverrides ||
        savedExercises.map((exercise) => ({
          name: exercise.name,
          weight: exercise.weight,
          reps: exercise.reps,
          sets: exercise.sets,
        }));

      if (exercisesPayload.length === 0) return;

      setCompleting(true);

      try {
        const result = await completeWorkout({
          date: activeSession?.date || today.toISOString().split("T")[0],
          day_of_week: activeSession?.day_of_week || weekDaysMap[today.getDay()],
          muscle_groups: activeSession?.muscle_groups || todayWorkout?.split(" + ") || [],
          exercises: exercisesPayload,
          session_id: activeSession?.id,
        });

        if (!isGuidedMode) {
          const storageKey = `liftmate_workout_history_${user.id}`;
          const history = JSON.parse(localStorage.getItem(storageKey) || '{"sessions":[]}');
          const todayStr = today.toISOString().split("T")[0];
          history.sessions = history.sessions.filter((session: { date: string }) => session.date !== todayStr);
          localStorage.setItem(storageKey, JSON.stringify(history));
        }

        checkFatigueNotification(result.fatigue_index);
        navigate(`/workout-summary/${result.session_id}`);
      } catch (err: unknown) {
        console.error("[Workout] Complete error:", err);
        toast.error("Erro ao concluir treino. Os dados não foram perdidos.");
      } finally {
        setCompleting(false);
      }
    },
    [
      activeSession?.date,
      activeSession?.day_of_week,
      activeSession?.id,
      activeSession?.muscle_groups,
      checkFatigueNotification,
      isGuidedMode,
      navigate,
      savedExercises,
      todayWorkout,
      user,
    ]
  );

  const handleCompletePlannedExercise = useCallback(
    async (exercise: PlannedExercise) => {
      await markExerciseCompleted(exercise.id);
      toast.success(`${exercise.exercise_name} concluído`);
    },
    [markExerciseCompleted]
  );

  useEffect(() => {
    if (
      !isGuidedMode ||
      plannedExercises.length === 0 ||
      completedPlannedCount !== plannedExercises.length ||
      completing ||
      activeSession?.status === "completed"
    ) {
      return;
    }

    void handleCompleteWorkout(guidedExercisesPayload);
  }, [
    activeSession?.status,
    completing,
    completedPlannedCount,
    guidedExercisesPayload,
    handleCompleteWorkout,
    isGuidedMode,
    plannedExercises.length,
  ]);

  const isRestDay = !todayWorkout || todayWorkout === "Descanso";

  return (
    <div className="min-h-screen bg-background pb-32 text-foreground">
      <div className="px-5 pt-12 pb-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card/60 border border-border/60">
            <Dumbbell className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">{isRestDay ? t("workout.restDay") : todayWorkout}</h1>
            <p className="text-sm text-muted-foreground">{weekDaysMap[new Date().getDay()]}</p>
          </div>
        </motion.div>
      </div>

      {isRestDay ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 py-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-border/60 bg-card/60">
            <Target className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-foreground">{t("workout.activeRecovery")}</h3>
          <p className="mx-auto max-w-xs text-muted-foreground">{t("workout.restImportant")}</p>
        </motion.div>
      ) : (
        <div className="space-y-5 bg-background px-5">
          {!isGuidedMode && savedExercises.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed bottom-20 left-0 right-0 z-50 bg-gradient-to-t from-background via-background/95 to-transparent px-5 pb-4 pt-3"
            >
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => void handleCompleteWorkout()}
                disabled={completing}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all disabled:cursor-not-allowed disabled:opacity-50"
              >
                {completing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    A concluir...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    Concluir Treino ({savedExercises.length})
                  </>
                )}
              </motion.button>
            </motion.div>
          )}

          {!isGuidedMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-[20px] border border-border/60 bg-card/60 p-5"
            >
              <span className="mb-4 block text-sm font-medium text-muted-foreground">{t("workout.trainingType")}</span>
              <div className="flex gap-2">
                {(Object.keys(trainingTypeConfig) as TrainingType[]).map((type) => {
                  const isSelected = trainingType === type;
                  return (
                    <motion.button
                      key={type}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setTrainingType(type)}
                      className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {type}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

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

          {isGuidedMode ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="overflow-hidden rounded-[20px] border border-border/60 bg-card/60"
            >
              <ExerciseExecutionCarousel
                exercises={plannedExercises}
                completedCount={completedPlannedCount}
                totalCount={plannedExercises.length}
                isFinishing={completing}
                onCompleteExercise={handleCompletePlannedExercise}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="overflow-hidden rounded-[20px] border border-border/60 bg-card/60"
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
              />
            </motion.div>
          )}

          {!isGuidedMode && savedExercises.length > 0 && (
            <motion.div
              id="saved-exercises-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-[20px] border border-border/60 bg-card/60 p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{t("workout.savedExercisesToday")}</span>
                <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">{savedExercises.length}</span>
              </div>
              <div className="space-y-2">
                {savedExercises.map((exercise, index) => (
                  <motion.div
                    key={exercise.timestamp}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between rounded-xl bg-muted/70 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{exercise.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(exercise.timestamp).toLocaleTimeString("pt-PT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-primary">{exercise.weight}kg</p>
                      <p className="text-xs text-muted-foreground">
                        {exercise.sets}x{exercise.reps}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {!isGuidedMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-[20px] border border-border/60 bg-card/60 p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{t("workout.restCalculation")}</span>
                <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  {restBreakdown.repsCategory}
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                    <span className="text-sm text-muted-foreground">{t("workout.baseTime")}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{restBreakdown.base}s</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-sm text-muted-foreground">{t("workout.weight")} ({weight}kg)</span>
                  </div>
                  <span className="text-sm font-medium text-primary">+{restBreakdown.weightBonus}s</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                    <span className="text-sm text-muted-foreground">{t("workout.reps")} ({reps})</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {restBreakdown.repsAdjustment >= 0 ? "+" : ""}
                    {restBreakdown.repsAdjustment}s
                  </span>
                </div>
                {restBreakdown.setsBonus > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-secondary-foreground/70" />
                      <span className="text-sm text-muted-foreground">{t("workout.highSets")} ({sets})</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">+{restBreakdown.setsBonus}s</span>
                  </div>
                )}
                <div className="my-2 border-t border-border/60" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{t("workout.totalRecommended")}</span>
                  <span className="text-lg font-bold text-primary">{restTime}s</span>
                </div>
              </div>
            </motion.div>
          )}

          {!isGuidedMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-[20px] border border-primary/20 bg-card/60 p-6"
            >
              <span className="mb-4 block text-center text-sm font-medium text-muted-foreground">{t("workout.restTimer")}</span>
              <motion.div key={restRemaining} initial={{ scale: 1.02 }} animate={{ scale: 1 }} className="mb-6 text-center">
                <span className={`text-7xl font-mono font-bold tracking-tight ${isRestRunning ? "text-primary" : "text-foreground"}`}>
                  {formatRestTime(restRemaining)}
                </span>
              </motion.div>
              <div className="flex items-center gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={isRestRunning ? () => setIsRestRunning(false) : startRestTimer}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-4 font-semibold transition-all ${
                    isRestRunning
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  }`}
                >
                  {isRestRunning ? (
                    <>
                      <Pause className="h-5 w-5" /> Pausar
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5" /> Iniciar Descanso
                    </>
                  )}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={resetRestTimer}
                  className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-all hover:bg-muted/80"
                >
                  <RotateCcw className="h-5 w-5" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      <BottomNav />

      <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <AlertDialogContent className="border-border bg-card text-card-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Guardar exercício?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              <span className="font-semibold text-primary">{selectedExercise}</span>
              <br />
              {weight}kg · {sets}x{reps} reps
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border bg-muted text-foreground hover:bg-muted/80">
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
