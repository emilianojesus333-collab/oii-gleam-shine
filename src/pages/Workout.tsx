import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useActiveSession } from "@/hooks/useActiveSession";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Zap,
  TrendingUp,
  Clock,
  Check,
  Loader2,
  ChevronRight,
  ArrowUp,
} from "lucide-react";
import { HexBadge } from "@/components/ui/HexBadge";
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
import { ExerciseToolsCard } from "@/components/workout/ExerciseToolsCard";
import { RestTimerCard } from "@/components/workout/RestTimerCard";
import { BarbellCalculator } from "@/components/workout/BarbellCalculator";
import { LastSessionCard } from "@/components/workout/LastSessionCard";
import { AIWorkoutGenerator } from "@/components/workout/AIWorkoutGenerator";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { completeWorkout } from "@/services/workoutService";
import { markTaskComplete, isTaskComplete } from "@/utils/onboardingFlow";
import { useFatigueNotification } from "@/hooks/useFatigueNotification";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

// Editorial components
import { ExerciseCardStack } from "@/components/workout/ExerciseCardStack";
import CelebrationCard from "@/components/workout/CelebrationCard";
import type { CelebrationEvent } from "@/services/workoutService";
import { saveToOfflineQueue } from "@/utils/offlineSync";

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

const MUSCLE_COLOR: Record<string, string> = {
  Costas: "#A78BFA",
  Ombros: "#FBBF24",
  Bíceps: "#F87171",
  Peito: "#60A5FA",
  Pernas: "#34D399",
  Tríceps: "#FB923C",
  Abdominais: "#22D3EE",
};

const MUSCLE_BG: Record<string, string> = {
  Costas: "rgba(167,139,250,0.15)",
  Ombros: "rgba(251,191,36,0.15)",
  Bíceps: "rgba(248,113,113,0.15)",
  Peito: "rgba(96,165,250,0.15)",
  Pernas: "rgba(52,211,153,0.15)",
  Tríceps: "rgba(251,146,60,0.15)",
  Abdominais: "rgba(34,211,238,0.15)",
};

const TYPE_SUB: Record<TrainingType, string> = {
  Força: "3–6 reps",
  Hipertrofia: "8–12 reps",
  Resistência: "15–20 reps",
};


const Workout = () => {
  const { settings, isLoading } = useUserSettings();
  const { activeSession, loading: sessionLoading, refresh: refreshSession, markExerciseCompleted, startSession } = useActiveSession();
  const [trainingType, setTrainingType] = useState<TrainingType>("Hipertrofia");
  const [aiGenerating, setAiGenerating] = useState(false);
  const aiGenerateRef = useRef<(() => void) | null>(null);
  const [selectedExercise, setSelectedExercise] = useState("");
  const [weight, setWeight] = useState("30");
  const [reps, setReps] = useState("7");
  const [sets, setSets] = useState("3");
  const [restTime, setRestTime] = useState("90");
  const [savedExercises, setSavedExercises] = useState<ExerciseLog[]>([]);
  const [justSaved, setJustSaved] = useState(false);
  const [autoStartTrigger, setAutoStartTrigger] = useState(0);
  const [currentOneRM, setCurrentOneRM] = useState<Record<string, number>>({});
  const [prCelebration, setPrCelebration] = useState<CelebrationEvent | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [completing, setCompleting] = useState(false);
  const [showBarbellCalc, setShowBarbellCalc] = useState(false);
  const { checkAndNotify: checkFatigueNotification } = useFatigueNotification();
  const [shareData, setShareData] = useState<null>(null);
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
      const aiRest = currentPlannedExercise.rest;
      if (aiRest && aiRest > 0) {
        setRestTime(String(aiRest));
      }
    }
  }, [currentPlannedExercise?.id, isGuidedMode]);

  // Pre-fill weight/reps from the last saved set for the selected exercise
  useEffect(() => {
    if (!selectedExercise) return;
    const lastLog = [...savedExercises]
      .reverse()
      .find((e) => e.name === selectedExercise);
    if (lastLog) {
      if (lastLog.weight > 0) setWeight(String(lastLog.weight));
      if (lastLog.reps > 0) setReps(String(lastLog.reps));
    }
  }, [selectedExercise]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

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

  const isLastAIExercise = isGuidedMode && !allAIDone && currentAIIndex === aiExercises.length - 1;

  // Last session stats for the header pill
  const lastSessionInfo = useMemo(() => {
    if (!user || todayMuscleGroups.length === 0) return null;
    const history = getWorkoutHistory(user.id);
    const today = new Date().toISOString().split("T")[0];
    const relevant = history.sessions.filter(
      (s) => s.date !== today && s.muscleGroups.some((mg) => todayMuscleGroups.includes(mg))
    );
    if (!relevant.length) return null;
    const last = relevant[0];
    const prev = relevant[1] ?? null;
    const lastDate = new Date(last.date + "T00:00:00");
    const todayDate = new Date(today + "T00:00:00");
    const daysAgo = Math.round((todayDate.getTime() - lastDate.getTime()) / 86400000);
    const lastVol = last.exerciseLogs?.reduce((s, l) => s + (l.weight || 0) * (l.reps || 0) * (l.sets || 0), 0) ?? 0;
    const prevVol = prev?.exerciseLogs?.reduce((s, l) => s + (l.weight || 0) * (l.reps || 0) * (l.sets || 0), 0) ?? null;
    const volPct = prevVol && prevVol > 0 ? Math.round(((lastVol - prevVol) / prevVol) * 100) : null;
    return { daysAgo, volPct };
  }, [user, todayMuscleGroups]);

  const checkAndSaveOneRM = async (exerciseName: string, weightKg: number, repsCount: number) => {
    if (!user?.id || !exerciseName || weightKg <= 0 || repsCount <= 0) return;
    const new1RM = Math.round(weightKg * (1 + repsCount / 30));

    // Update live display
    setCurrentOneRM((prev) => ({ ...prev, [exerciseName]: new1RM }));

    try {
      // Fetch previous best for this exercise
      const { data: existing } = await supabase
        .from("one_rm_records")
        .select("calculated_1rm")
        .eq("user_id", user.id)
        .eq("exercise_name", exerciseName)
        .order("calculated_1rm", { ascending: false })
        .limit(1)
        .maybeSingle();

      const previousBest = existing?.calculated_1rm ?? 0;

      if (new1RM > previousBest) {
        // Save new record
        await supabase.from("one_rm_records").insert({
          user_id: user.id,
          exercise_name: exerciseName,
          calculated_1rm: new1RM,
          weight_used: weightKg,
          reps_performed: repsCount,
        });

        // Vibrate
        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 300]);

        // Toast
        toast.success(`🏆 Novo recorde! 1RM estimado: ${new1RM}kg`);

        // Trigger CelebrationCard
        setPrCelebration({
          exercise_id: exerciseName,
          type: "new_max",
          exercise_name: exerciseName,
          value: new1RM,
        });

        // Auto-dismiss after 5s
        setTimeout(() => setPrCelebration(null), 5000);
      }
    } catch (err) {
      console.error("[1RM] Error checking/saving record:", err);
    }
  };

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

    // 1RM check — online: Supabase, offline: queue
    if (navigator.onLine) {
      checkAndSaveOneRM(newLog.name, newLog.weight, newLog.reps);
    } else if (user) {
      const estimated1RM = Math.round(newLog.weight * (1 + newLog.reps / 30));
      setCurrentOneRM((prev) => ({ ...prev, [newLog.name]: estimated1RM }));
      saveToOfflineQueue(user.id, {
        user_id: user.id,
        exercise_name: newLog.name,
        calculated_1rm: estimated1RM,
        weight_used: newLog.weight,
        reps_performed: newLog.reps,
      }, "one_rm_record");
    }

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

    if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
    toast.success(`${selectedExercise} guardado! ⏱️ Descanso iniciado`);
    setAutoStartTrigger((prev) => prev + 1);
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

    // Offline fallback
    if (!navigator.onLine) {
      const today = new Date();
      const muscleGroups = activeSession?.muscle_groups || todayWorkout?.split(" + ") || [];
      saveToOfflineQueue(user.id, {
        user_id: user.id,
        date: activeSession?.date || today.toISOString().split("T")[0],
        day_of_week: activeSession?.day_of_week || weekDaysMap[today.getDay()],
        muscle_groups: muscleGroups,
        exercises_completed: savedExercises.map((e) => e.name),
        status: "completed",
      }, "workout_session");
      toast.warning("Sem ligação — treino guardado localmente. Será sincronizado quando voltar online.");
      setCompleting(false);
      return;
    }

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
        history.sessions = history.sessions.filter((s: { date?: string }) => s.date !== todayStr);
        localStorage.setItem(storageKey, JSON.stringify(history));
      }

      checkFatigueNotification(result.fatigue_index, user?.id);

      // Auto-mark day flow tasks
      if (user?.id) {
        if (!isTaskComplete(user.id, "first_workout_done")) {
          markTaskComplete(user.id, "first_workout_done");
        } else if (!isTaskComplete(user.id, "second_workout_done")) {
          markTaskComplete(user.id, "second_workout_done");
        }
      }

      const durationMin = Math.round((Date.now() - workoutStartRef.current) / 60000);
      const totalSets   = savedExercises.reduce((acc, e) => acc + e.sets, 0);
      const totalReps   = savedExercises.reduce((acc, e) => acc + (e.reps * e.sets), 0);
      const muscleGroups = activeSession?.muscle_groups || todayWorkout?.split(" + ") || [];

      navigate("/workout-complete", {
        state: {
          workoutName:   muscleGroups.join(" + ") || "Treino",
          trainingType:  trainingType,
          exercises:     aiExercises.filter((e) => e.completed).map((e) => ({
            name: e.exercise_name,
            sets: e.sets,
            reps: e.reps,
            rest: e.rest,
          })),
          durationMin:   durationMin || 1,
          totalSets,
          totalReps,
          sessionId:     result.session_id,
        },
      });
    } catch (err: unknown) {
      console.error("[Workout] Complete error:", err);
      toast.error("Erro ao concluir treino. Os dados não foram perdidos.");
    } finally {
      setCompleting(false);
    }
  };

  const isRestDay = !todayWorkout || todayWorkout === "Descanso";
  const hasScheduleSet = useMemo(() => {
    const schedule = settings?.onboarding_data?.schedule || {};
    return Object.values(schedule).some(v => v !== null && v !== undefined);
  }, [settings]);

  const saveButtonLabel = useMemo(() => {
    if (!isGuidedMode || allAIDone) return undefined;
    const isLast = currentAIIndex === aiExercises.length - 1;
    if (isLast) return "Concluir Treino";
    return "Guardar e Próximo";
  }, [isGuidedMode, allAIDone, currentAIIndex, aiExercises.length]);

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: "#000000", position: "relative", zIndex: 1 }}>

      {/* ── OFFLINE BANNER ── */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            style={{
              position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
              background: "rgba(251,191,36,0.15)",
              border: "1px solid rgba(251,191,36,0.3)",
              padding: "10px 20px",
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ width: 7, height: 7, borderRadius: "50%", background: "#FBBF24", flexShrink: 0 }}
            />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#FBBF24" }}>
              Sem ligação — dados guardados localmente
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <div className="px-6 pt-14 pb-2">
        {/* 1. Day label + offline indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <p style={{
            fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)",
            letterSpacing: "0.1em", textTransform: "uppercase", margin: 0,
          }}>
            {weekDaysMap[new Date().getDay()]}
          </p>
          {!isOnline && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ width: 6, height: 6, borderRadius: "50%", background: "#FBBF24" }}
              />
              <span style={{ fontSize: 11, color: "#FBBF24", fontWeight: 600 }}>Offline</span>
            </div>
          )}
        </div>

        {!isRestDay && !isLoading && (
          <>
            {/* 2. Workout title */}
            <h1 style={{
              fontSize: 30, fontWeight: 900, color: "white",
              letterSpacing: "-0.02em", lineHeight: 1.05, marginBottom: 12,
            }}>
              {todayMuscleGroups.map((g, i) => (
                <span key={g}>
                  {g}{i < todayMuscleGroups.length - 1 ? " +" : ""}
                  {i < todayMuscleGroups.length - 1 && <br />}
                </span>
              ))}
            </h1>

            {/* 3. Muscle chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
              {todayMuscleGroups.map((mg) => (
                <span key={mg} style={{
                  padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700,
                  background: MUSCLE_BG[mg] ?? "rgba(255,255,255,0.08)",
                  color: MUSCLE_COLOR[mg] ?? "rgba(255,255,255,0.6)",
                }}>
                  {mg}
                </span>
              ))}
            </div>

            {/* 4. Last session pill */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "9px 14px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 10, marginBottom: 20,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Clock size={14} style={{ color: "white", opacity: 0.35, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", fontWeight: 500 }}>
                  {lastSessionInfo
                    ? `Última sessão · há ${lastSessionInfo.daysAgo} ${lastSessionInfo.daysAgo === 1 ? "dia" : "dias"}`
                    : "Sem sessões anteriores"}
                </span>
              </div>
              {lastSessionInfo?.volPct !== null && lastSessionInfo?.volPct !== undefined ? (
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <ArrowUp size={12} color="#34D399" />
                  <span style={{ fontSize: 11, color: "#34D399", fontWeight: 700 }}>
                    {lastSessionInfo.volPct > 0 ? "+" : ""}{lastSessionInfo.volPct}% volume
                  </span>
                </div>
              ) : (
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                  Sem dados anteriores
                </span>
              )}
            </div>

          </>
        )}
      </div>

      {/* First-use nudge: no schedule configured */}
      {!hasScheduleSet && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ background: "#1A1A1A", borderRadius: 0, border: "none", borderBottom: "1px solid #2A2A2A", padding: "16px 20px", width: "100%", margin: 0, display: "flex", alignItems: "center", gap: 12 }}
        >
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Configura o teu plano semanal</p>
            <p className="text-xs text-muted-foreground mt-0.5">Define os grupos musculares por dia nas Definições</p>
          </div>
          <button
            onClick={() => navigate("/settings")}
            className="text-xs font-semibold text-primary flex-shrink-0"
          >
            Ir →
          </button>
        </motion.div>
      )}

      {isRestDay ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-6 py-16 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-6">
            <Target className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-semibold text-foreground/70 mb-2">Recuperação ativa</h3>
          <p className="text-muted-foreground max-w-xs mx-auto">O descanso é parte do treino. Aproveita para recuperar.</p>
        </motion.div>
      ) : (
        <div className="space-y-0">
          {/* ── TRAINING TYPE SELECTOR ── */}
          {!isGuidedMode && (
            <div className="space-y-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{ background: "#1A1A1A", borderRadius: 0, border: "none", borderBottom: "1px solid #2A2A2A", padding: "20px 16px", width: "100%", margin: 0 }}
              >
                <span className="text-sm font-medium mb-4 block text-muted-foreground">
                  Tipo de treino
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
                  }
                  // Save + mark completed
                  handleSaveClick();
                  markExerciseCompleted(ex.id);
                }}
                onSwipeLeft={(ex) => {
                  markExerciseCompleted(ex.id);
                  toast.info("Exercício saltado");
                }}
                onFinish={handleCompleteWorkout}
                isCompleting={completing}
                onUndo={() => {
                  // Undo last completed exercise
                  const lastCompleted = [...aiExercises].reverse().find((e) => e.completed);
                  if (lastCompleted) {
                    supabase
                      .from("planned_exercises" as any)
                      .update({ completed: false })
                      .eq("id", lastCompleted.id)
                      .then(() => refreshSession());
                    toast.info("Exercício desfeito");
                  }
                }}
              />
            </>
          )}

          {/* ── EXERCISE REGISTRATION CARD ── */}
          <div className="space-y-0">
            {/* Guided mode: current exercise label */}
            {isGuidedMode && currentPlannedExercise && !allAIDone && (
              <motion.div
                key={currentPlannedExercise.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ background: "#1A1A1A", borderRadius: 0, border: "none", borderBottom: "1px solid #2A2A2A", padding: "16px 20px", width: "100%", display: "flex", alignItems: "center", gap: 12 }}
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

            {/* Exercise Tools Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <ExerciseToolsCard
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
                userId={user?.id}
                focusTrigger={autoStartTrigger}
                completedSetsCount={savedExercises.filter((e) => e.name === selectedExercise).length}
                targetSets={parseInt(sets) || undefined}
                estimatedOneRM={
                  (() => {
                    const w = parseFloat(weight);
                    const r = parseInt(reps);
                    if (!w || !r || w <= 0 || r <= 0) return undefined;
                    return Math.round(w * (1 + r / 30));
                  })()
                }
              />
            </motion.div>

            {/* Barbell Calculator trigger */}
            <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 4px" }}>
              <button
                onClick={() => setShowBarbellCalc(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 600,
                  padding: "4px 8px",
                }}
              >
                🏋️ Calculadora de barbell
              </button>
            </div>

            {showBarbellCalc && (
              <BarbellCalculator
                onClose={() => setShowBarbellCalc(false)}
                defaultWeight={parseFloat(weight) || 80}
              />
            )}

            {/* Saved Exercises */}
            {savedExercises.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ background: "#1A1A1A", borderRadius: 0, border: "none", borderBottom: "1px solid #2A2A2A", padding: "20px 16px", width: "100%", margin: 0 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    Exercícios guardados hoje
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

            {/* PR Celebration Card */}
            <AnimatePresence>
              {prCelebration && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <CelebrationCard celebration={prCelebration} index={0} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Rest Timer Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <RestTimerCard
                savedExercises={savedExercises}
                trainingType={trainingType}
                userId={user?.id}
                autoStartTrigger={autoStartTrigger}
              />
            </motion.div>

            {/* ── Complete Workout Button ── */}
            {savedExercises.length > 0 && !isGuidedMode && (
              <div style={{ background: "#1A1A1A", borderRadius: 0, border: "none", borderBottom: "1px solid #2A2A2A", padding: "16px 20px", width: "100%" }}>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCompleteWorkout}
                  disabled={completing}
                  className="w-full py-4 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: "#0D0D0D", border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  {completing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> A concluir...</>
                  ) : (
                    <><Check className="w-4 h-4" /> Concluir Treino ({savedExercises.length} exercícios)</>
                  )}
                </motion.button>
              </div>
            )}
          </div>

          {/* ── LAST SESSION CARD ── */}
          <div>
            <LastSessionCard
              todayMuscleGroups={todayMuscleGroups}
              userId={user?.id}
            />
          </div>
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

    </div>
  );
};

export default Workout;
