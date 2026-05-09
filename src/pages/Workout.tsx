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
  Sparkles,
  X,
  Power,
  AlignLeft,
  Footprints,
  Timer,
  Droplets,
  BarChart2,
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
import { supabase } from "@/integrations/supabase/client";
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
  Pernas: "#4ADE80",
  Tríceps: "#FB923C",
  Abdominais: "#22D3EE",
};

const MUSCLE_BG: Record<string, string> = {
  Costas: "rgba(167,139,250,0.15)",
  Ombros: "rgba(251,191,36,0.15)",
  Bíceps: "rgba(248,113,113,0.15)",
  Peito: "rgba(96,165,250,0.15)",
  Pernas: "rgba(74,222,128,0.15)",
  Tríceps: "rgba(251,146,60,0.15)",
  Abdominais: "rgba(34,211,238,0.15)",
};

type WorkoutItem = {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: number;
  weight: number;
  done: boolean;
  skipped?: boolean;
  source: "ai" | "manual";
};

const Workout = () => {
  const { settings, isLoading } = useUserSettings();
  const { activeSession, refresh: refreshSession, markExerciseCompleted } = useActiveSession();
  const [trainingType, setTrainingType] = useState<TrainingType>("Hipertrofia");
  const [selectedExercise, setSelectedExercise] = useState("");
  const [weight, setWeight] = useState("30");
  const [reps, setReps] = useState("7");
  const [sets, setSets] = useState("3");
  const [restTime, setRestTime] = useState("90");
  const [savedExercises, setSavedExercises] = useState<ExerciseLog[]>([]);
  const savedExercisesRef = useRef<ExerciseLog[]>([]); // Always up-to-date mirror — avoids stale closures in setTimeout
  const [workoutItems, setWorkoutItems] = useState<WorkoutItem[]>([]);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const restAutoHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [currentOneRM, setCurrentOneRM] = useState<Record<string, number>>({});
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [completing, setCompleting] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showBarbellCalc, setShowBarbellCalc] = useState(false);
  const { checkAndNotify: checkFatigueNotification } = useFatigueNotification();
  const workoutStartRef = useRef(Date.now());

  // --- AI guided mode ---
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
  const isLastAIExercise = isGuidedMode && !allAIDone && currentAIIndex === aiExercises.length - 1;

  // Derived workoutItems stats
  const doneCount = workoutItems.filter((i) => i.done && !i.skipped).length;
  const skippedCount = workoutItems.filter((i) => i.skipped === true).length;
  const totalCount = workoutItems.length;
  const listProgressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // Pre-fill card when guided exercise changes
  useEffect(() => {
    if (currentPlannedExercise && isGuidedMode) {
      setSelectedExercise(currentPlannedExercise.exercise_name);
      setReps(String(parseInt(currentPlannedExercise.reps) || 10));
      setSets(String(currentPlannedExercise.sets));
      if (currentPlannedExercise.rest > 0) setRestTime(String(currentPlannedExercise.rest));
    }
  }, [currentPlannedExercise?.id, isGuidedMode]);

  // Pre-fill weight/reps from last saved set for selected exercise
  useEffect(() => {
    if (!selectedExercise) return;
    const lastLog = [...savedExercises].reverse().find((e) => e.name === selectedExercise);
    if (lastLog) {
      if (lastLog.weight > 0) setWeight(String(lastLog.weight));
      if (lastLog.reps > 0) setReps(String(lastLog.reps));
    }
  }, [selectedExercise]);

  // Online/offline detection
  useEffect(() => {
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online",  on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  // Load today's saved exercises on mount
  useEffect(() => {
    if (!user) return;
    const history = getWorkoutHistory(user.id);
    const today = new Date().toISOString().split("T")[0];
    const todaySession = history.sessions.find((s) => s.date === today);
    if (todaySession?.exerciseLogs) {
      savedExercisesRef.current = todaySession.exerciseLogs;
      setSavedExercises(todaySession.exerciseLogs);
    }
  }, [user]);

  // Populate AI exercises into workoutItems once
  useEffect(() => {
    if (!isGuidedMode || aiExercises.length === 0) return;
    setWorkoutItems((prev) => {
      if (prev.some((i) => i.source === "ai")) return prev;
      const aiItems: WorkoutItem[] = aiExercises.map((e) => ({
        id: e.id,
        name: e.exercise_name,
        sets: e.sets,
        reps: String(e.reps),
        rest: e.rest,
        weight: 0,
        done: e.completed,
        source: "ai",
      }));
      return [...aiItems, ...prev.filter((i) => i.source === "manual")];
    });
  }, [isGuidedMode, aiExercises]);

  // Cleanup auto-hide timeout on unmount
  useEffect(() => {
    return () => { if (restAutoHideRef.current) clearTimeout(restAutoHideRef.current); };
  }, []);

  const todayWorkout = useMemo(() => {
    const schedule = settings?.onboarding_data?.schedule || {};
    const todayName = weekDaysMap[new Date().getDay()];
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
    const daysAgo = Math.round(
      (new Date(today + "T00:00:00").getTime() - new Date(last.date + "T00:00:00").getTime()) / 86400000
    );
    const lastVol = last.exerciseLogs?.reduce((s, l) => s + (l.weight || 0) * (l.reps || 0) * (l.sets || 0), 0) ?? 0;
    const prevVol = prev?.exerciseLogs?.reduce((s, l) => s + (l.weight || 0) * (l.reps || 0) * (l.sets || 0), 0) ?? null;
    const volPct = prevVol && prevVol > 0 ? Math.round(((lastVol - prevVol) / prevVol) * 100) : null;
    return { daysAgo, volPct };
  }, [user, todayMuscleGroups]);

  const triggerRestTimer = useCallback(() => {
    if (restAutoHideRef.current) clearTimeout(restAutoHideRef.current);
    setShowRestTimer(true);
    restAutoHideRef.current = setTimeout(() => setShowRestTimer(false), 8000);
  }, []);

  const handleToggleDone = (item: WorkoutItem) => {
    const nowDone = !item.done;
    setWorkoutItems((prev) => prev.map((i) => i.id === item.id ? { ...i, done: nowDone } : i));
    if (nowDone) {
      triggerRestTimer();
      if (item.source === "ai") markExerciseCompleted(item.id);
      if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
    }
  };

  const handleRemoveItem = (item: WorkoutItem) => {
    setWorkoutItems((prev) => prev.filter((i) => i.id !== item.id));
    if (item.source === "manual") {
      setSavedExercises((prev) => {
        let idx = -1;
        for (let i = prev.length - 1; i >= 0; i--) {
          const e = prev[i];
          if (e.name === item.name && e.weight === item.weight && e.reps === parseInt(item.reps) && e.sets === item.sets) {
            idx = i; break;
          }
        }
        if (idx === -1) return prev;
        return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
      });
    }
  };

  const checkAndSaveOneRM = async (exerciseName: string, weightKg: number, repsCount: number) => {
    if (!user?.id || !exerciseName || weightKg <= 0 || repsCount <= 0) return;
    const new1RM = Math.round(weightKg * (1 + repsCount / 30));
    setCurrentOneRM((prev) => ({ ...prev, [exerciseName]: new1RM }));
    try {
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
        await supabase.from("one_rm_records").insert({
          user_id: user.id,
          exercise_name: exerciseName,
          calculated_1rm: new1RM,
          weight_used: weightKg,
          reps_performed: repsCount,
        });
        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 300]);
      }
    } catch (err) {
      console.error("[1RM] Error:", err);
    }
  };

  const handleSaveClick = () => {
    if (!selectedExercise.trim()) { toast.error("Seleciona um exercício primeiro"); return; }
    if (!user) { toast.error("Faz login para guardar exercícios"); return; }
    if (isGuidedMode && currentPlannedExercise && !allAIDone) {
      confirmSaveExercise();
      markExerciseCompleted(currentPlannedExercise.id);
      if (isLastAIExercise) setTimeout(() => handleCompleteWorkout(), 500);
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
    savedExercisesRef.current = updatedExercises; // Sync ref immediately — avoids stale closure in handleCompleteWorkout
    setSavedExercises(updatedExercises);

    // Update unified list
    if (isGuidedMode && currentPlannedExercise) {
      setWorkoutItems((prev) => prev.map((i) =>
        i.id === currentPlannedExercise.id ? { ...i, done: true, weight: newLog.weight } : i
      ));
    } else {
      setWorkoutItems((prev) => [...prev, {
        id: String(newLog.timestamp),
        name: newLog.name,
        sets: newLog.sets,
        reps: String(newLog.reps),
        rest: newLog.restTime,
        weight: newLog.weight,
        done: false,
        source: "manual",
      }]);
    }

    // 1RM
    if (navigator.onLine) {
      checkAndSaveOneRM(newLog.name, newLog.weight, newLog.reps);
    } else if (user) {
      const est1RM = Math.round(newLog.weight * (1 + newLog.reps / 30));
      setCurrentOneRM((prev) => ({ ...prev, [newLog.name]: est1RM }));
      saveToOfflineQueue(user.id, {
        user_id: user.id,
        exercise_name: newLog.name,
        calculated_1rm: est1RM,
        weight_used: newLog.weight,
        reps_performed: newLog.reps,
      }, "one_rm_record");
    }

    if (!isGuidedMode) {
      const today = new Date();
      const muscleGroups = todayWorkout?.split(" + ") || [];
      const session: Omit<WorkoutSession, "timestamp"> = {
        date: today.toISOString().split("T")[0],
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
    toast.success(`${selectedExercise} guardado!`);
    setSelectedExercise("");
    setShowSaveConfirm(false);
  };

  const handleSkipExercise = useCallback(() => {
    if (!currentPlannedExercise) return;
    markExerciseCompleted(currentPlannedExercise.id);
    setWorkoutItems((prev) => prev.map((i) =>
      i.id === currentPlannedExercise.id ? { ...i, done: true, skipped: true } : i
    ));
    toast.info(`${currentPlannedExercise.exercise_name} saltado`);
  }, [currentPlannedExercise, markExerciseCompleted]);

  const handleReturnToGenerator = async () => {
    setShowExitModal(false);
    if (!activeSession) return;
    try {
      await supabase.from("planned_exercises" as any).delete().eq("session_id", activeSession.id);
      await supabase.from("workout_sessions").update({ status: "cancelled" as any }).eq("id", activeSession.id);
      await refreshSession();
    } catch (err) {
      console.error("[Workout] Return to generator error:", err);
    }
  };

  const handleSaveAndExit = async () => {
    setShowExitModal(false);
    if (!user || savedExercises.length === 0) { navigate("/"); return; }
    setCompleting(true);
    try {
      const today = new Date();
      await completeWorkout({
        date: activeSession?.date || today.toISOString().split("T")[0],
        day_of_week: activeSession?.day_of_week || weekDaysMap[today.getDay()],
        muscle_groups: activeSession?.muscle_groups || todayWorkout?.split(" + ") || [],
        exercises: savedExercises.map((e) => ({ name: e.name, weight: e.weight, reps: e.reps, sets: e.sets })),
        session_id: activeSession?.id,
      });
    } catch (err) {
      console.error("[Workout] Save and exit error:", err);
    } finally {
      setCompleting(false);
      navigate("/");
    }
  };

  const handleDiscardAndExit = async () => {
    setShowExitModal(false);
    if (activeSession) {
      try {
        await supabase.from("planned_exercises" as any).delete().eq("session_id", activeSession.id);
        await supabase.from("workout_sessions").update({ status: "cancelled" as any }).eq("id", activeSession.id);
      } catch { /* ignore */ }
    }
    navigate("/");
  };

  const handleCompleteWorkout = async () => {
    if (!user) return;

    // Allow completion if savedExercises has data, OR if done items exist (guided mode with toggle)
    const doneItems = workoutItems.filter((i) => i.done && !i.skipped);
    const fallbackExercises = doneItems.map((i) => ({
      name: i.name, weight: i.weight, reps: parseInt(i.reps) || 0, sets: i.sets,
    }));
    const finalExercises = savedExercisesRef.current.length > 0
      ? savedExercisesRef.current.map((e) => ({ name: e.name, weight: e.weight, reps: e.reps, sets: e.sets }))
      : fallbackExercises;

    if (finalExercises.length === 0) {
      toast.error("Marca pelo menos um exercício como concluído");
      return;
    }

    setCompleting(true);

    if (!navigator.onLine) {
      const today = new Date();
      const muscleGroups = activeSession?.muscle_groups || todayWorkout?.split(" + ") || [];
      saveToOfflineQueue(user.id, {
        user_id: user.id,
        date: activeSession?.date || today.toISOString().split("T")[0],
        day_of_week: activeSession?.day_of_week || weekDaysMap[today.getDay()],
        muscle_groups: muscleGroups,
        exercises_completed: finalExercises.map((e) => e.name),
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
        exercises: finalExercises,
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

      if (user?.id) {
        if (!isTaskComplete(user.id, "first_workout_done")) {
          markTaskComplete(user.id, "first_workout_done");
        } else if (!isTaskComplete(user.id, "second_workout_done")) {
          markTaskComplete(user.id, "second_workout_done");
        }
      }

      const durationMin = Math.round((Date.now() - workoutStartRef.current) / 60000);
      const totalSets = savedExercisesRef.current.reduce((acc, e) => acc + e.sets, 0);
      const totalReps = savedExercisesRef.current.reduce((acc, e) => acc + e.reps * e.sets, 0);
      const muscleGroups = activeSession?.muscle_groups || todayWorkout?.split(" + ") || [];

      navigate("/workout-complete", {
        state: {
          workoutName: muscleGroups.join(" + ") || "Treino",
          trainingType,
          exercises: aiExercises.filter((e) => e.completed).map((e) => ({
            name: e.exercise_name, sets: e.sets, reps: e.reps, rest: e.rest,
          })),
          durationMin: durationMin || 1,
          totalSets,
          totalReps,
          sessionId: result.session_id,
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

  // Weekly stats for rest day screen
  const weeklyWorkouts = useMemo(() => {
    if (!user) return null;
    const history = getWorkoutHistory(user.id);
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekStartStr = weekStart.toISOString().split("T")[0];
    return history.sessions.filter((s) => s.date >= weekStartStr && s.status === "completed").length;
  }, [user]);

  const weeklyVolume = useMemo(() => {
    if (!user) return null;
    const history = getWorkoutHistory(user.id);
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekStartStr = weekStart.toISOString().split("T")[0];
    const vol = history.sessions
      .filter((s) => s.date >= weekStartStr && s.status === "completed")
      .reduce((acc, s) => acc + (s.exerciseLogs?.reduce((a, e) => a + e.sets.reduce((b, st) => b + (st.weight || 0) * (st.reps || 0), 0), 0) || 0), 0);
    return vol > 0 ? Math.round(vol) : null;
  }, [user]);

  const consistencyPct = useMemo(() => {
    if (!user) return null;
    const history = getWorkoutHistory(user.id);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const daysInMonth = now.getDate();
    const completed = history.sessions.filter((s) => s.date >= monthStart && s.status === "completed").length;
    return Math.round((completed / Math.max(daysInMonth / 2, 1)) * 100);
  }, [user]);

  const hasScheduleSet = useMemo(() => {
    const schedule = settings?.onboarding_data?.schedule || {};
    return Object.values(schedule).some((v) => v !== null && v !== undefined);
  }, [settings]);

  const saveButtonLabel = useMemo(() => {
    if (!isGuidedMode || allAIDone) return undefined;
    return currentAIIndex === aiExercises.length - 1 ? "Concluir Treino" : "Guardar e Próximo";
  }, [isGuidedMode, allAIDone, currentAIIndex, aiExercises.length]);

  return (
    <div className="min-h-screen pb-40" style={{ backgroundColor: "#000000", position: "relative", zIndex: 1 }}>

      {/* ── OFFLINE BANNER ── */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{
              position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
              background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)",
              padding: "10px 20px", display: "flex", alignItems: "center", gap: 8,
            }}
          >
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
              style={{ width: 7, height: 7, borderRadius: "50%", background: "#FBBF24", flexShrink: 0 }}
            />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#FBBF24" }}>
              Sem ligação — dados guardados localmente
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── STICKY HEADER ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "#000",
        borderBottom: totalCount > 0 ? "1px solid rgba(255,255,255,0.07)" : "none",
        paddingTop: isOnline ? 52 : 84,
      }}>
        <div style={{ padding: "0 20px 12px" }}>
          {/* Row 1: day label + exit button */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <p style={{
                fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.30)",
                letterSpacing: "0.1em", textTransform: "uppercase", margin: 0,
              }}>
                {weekDaysMap[new Date().getDay()]}
              </p>
              {!isOnline && (
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <motion.div
                    animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ width: 6, height: 6, borderRadius: "50%", background: "#FBBF24" }}
                  />
                  <span style={{ fontSize: 11, color: "#FBBF24", fontWeight: 600 }}>Offline</span>
                </div>
              )}
            </div>
            {(isGuidedMode || savedExercises.length > 0) && (
              <button
                onClick={() => setShowExitModal(true)}
                style={{
                  background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 20, padding: "6px 14px",
                  display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.50)" }}>← Voltar</span>
              </button>
            )}
          </div>

          {/* Row 2: muscle chips */}
          {!isRestDay && todayMuscleGroups.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: totalCount > 0 ? 10 : 0 }}>
              {todayMuscleGroups.map((mg) => (
                <span key={mg} style={{
                  padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: MUSCLE_BG[mg] ?? "rgba(255,255,255,0.07)",
                  color: MUSCLE_COLOR[mg] ?? "rgba(255,255,255,0.70)",
                }}>
                  {mg}
                </span>
              ))}
            </div>
          )}

          {/* Row 3: progress count */}
          {totalCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.50)", fontWeight: 600 }}>
                {doneCount} de {totalCount} concluídos
              </span>
              <span style={{ fontSize: 11, color: "#4ADE80", fontWeight: 700 }}>
                {listProgressPercent}%
              </span>
            </div>
          )}
        </div>

        {/* 3px progress bar */}
        {totalCount > 0 && (
          <div style={{ height: 3, background: "rgba(255,255,255,0.07)", width: "100%" }}>
            <motion.div
              style={{ height: "100%", background: "#4ADE80" }}
              initial={{ width: 0 }}
              animate={{ width: `${listProgressPercent}%` }}
              transition={{ type: "spring", stiffness: 100 }}
            />
          </div>
        )}
      </div>

      {/* ── FIRST-USE NUDGE ── */}
      {!hasScheduleSet && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: "#1A1A1A", borderBottom: "1px solid #2A2A2A", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}
        >
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Configura o teu plano semanal</p>
            <p className="text-xs text-muted-foreground mt-0.5">Define os grupos musculares por dia nas Definições</p>
          </div>
          <button onClick={() => navigate("/settings")} className="text-xs font-semibold text-primary flex-shrink-0">
            Ir →
          </button>
        </motion.div>
      )}

      {/* ── REST DAY ── */}
      {isRestDay ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ paddingBottom: 90 }}>

          {/* Hero card */}
          <div style={{
            margin: "16px 16px 0",
            background: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(99,102,241,0.18)",
            borderRadius: 20, padding: 18,
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "rgba(99,102,241,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Power size={22} strokeWidth={1.8} color="rgba(167,139,250,0.85)" />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(167,139,250,0.65)", textTransform: "uppercase", marginBottom: 3 }}>
                Hoje
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 3 }}>Recuperação ativa</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.30)", lineHeight: 1.45 }}>
                O descanso é parte do treino. O teu corpo cresce enquanto recupera.
              </div>
            </div>
          </div>

          {/* CTA — criar treino para amanhã */}
          <button
            onClick={() => navigate("/chat")}
            style={{
              margin: "14px 16px 0", width: "calc(100% - 32px)",
              background: "linear-gradient(135deg, #1D4ED8, #2563EB)",
              borderRadius: 16, padding: "16px 18px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              border: "none", cursor: "pointer",
              boxShadow: "0 8px 24px rgba(37,99,235,0.25)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 40, background: "rgba(255,255,255,0.15)",
                borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Sparkles size={18} color="#fff" />
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.50)", textTransform: "uppercase", marginBottom: 3 }}>
                  Buddy IA
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Criar treino para amanhã</div>
              </div>
            </div>
            <ChevronRight size={18} color="rgba(255,255,255,0.70)" />
          </button>

          {/* Recovery activities grid */}
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.30)", textTransform: "uppercase", padding: "18px 16px 8px" }}>
            Recuperação ativa
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 16px" }}>
            {([
              { icon: AlignLeft,  label: "Alongamentos",   dur: "10–15 min"  },
              { icon: Footprints, label: "Caminhada leve", dur: "20–30 min"  },
              { icon: Timer,      label: "Respiração",     dur: "5 min"      },
              { icon: Droplets,   label: "Hidratação",     dur: "Meta: 2.5L" },
            ] as const).map(({ icon: Icon, label, dur }) => (
              <div key={label} style={{
                background: "#141414", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16, padding: 14,
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                <div style={{
                  width: 38, height: 38, background: "rgba(255,255,255,0.04)",
                  borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={17} strokeWidth={1.8} color="rgba(255,255,255,0.50)" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.90)" }}>{label}</div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.30)", marginTop: 1 }}>{dur}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Weekly stats strip */}
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.30)", textTransform: "uppercase", padding: "18px 16px 8px" }}>
            Esta semana
          </div>
          <div style={{ display: "flex", gap: 10, padding: "0 16px 16px" }}>
            {([
              { val: weeklyWorkouts ?? "—", unit: "treinos", lbl: "Concluídos"   },
              { val: weeklyVolume   ?? "—", unit: "kg",      lbl: "Volume"       },
              { val: consistencyPct ?? "—", unit: "%",       lbl: "Consistência" },
            ] as const).map(({ val, unit, lbl }) => (
              <div key={lbl} style={{
                flex: 1, background: "#141414",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 14, padding: 12,
              }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 2 }}>
                  {val} <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.30)" }}>{unit}</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.30)" }}>{lbl}</div>
              </div>
            ))}
          </div>

        </motion.div>
      ) : (
        <div className="space-y-0">

          {/* Last session pill */}
          {!isLoading && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "9px 20px",
              background: "rgba(255,255,255,0.04)",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Clock size={14} style={{ color: "white", opacity: 0.35, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.30)", fontWeight: 500 }}>
                  {lastSessionInfo
                    ? `Última sessão · há ${lastSessionInfo.daysAgo} ${lastSessionInfo.daysAgo === 1 ? "dia" : "dias"}`
                    : "Sem sessões anteriores"}
                </span>
              </div>
              {lastSessionInfo?.volPct !== null && lastSessionInfo?.volPct !== undefined ? (
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <ArrowUp size={12} color="#4ADE80" />
                  <span style={{ fontSize: 11, color: "#4ADE80", fontWeight: 700 }}>
                    {lastSessionInfo.volPct > 0 ? "+" : ""}{lastSessionInfo.volPct}% volume
                  </span>
                </div>
              ) : (
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.30)" }}>—</span>
              )}
            </div>
          )}

          {/* Training type selector — free mode only */}
          {!isGuidedMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ background: "#1A1A1A", borderBottom: "1px solid #2A2A2A", padding: "20px 16px" }}
            >
              <span className="text-sm font-medium mb-4 block text-muted-foreground">Tipo de treino</span>
              <div className="flex gap-2">
                {(Object.keys(trainingTypeConfig) as TrainingType[]).map((type) => {
                  const isSelected = trainingType === type;
                  return (
                    <motion.button
                      key={type} whileTap={{ scale: 0.95 }} onClick={() => setTrainingType(type)}
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
          )}

          {/* AI Generator — free mode only */}
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

          {/* Guided mode: current exercise label */}
          {isGuidedMode && currentPlannedExercise && !allAIDone && (
            <motion.div
              key={currentPlannedExercise.id}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              style={{ background: "#1A1A1A", borderBottom: "1px solid #2A2A2A", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">{currentAIIndex + 1}</span>
              </div>
              <div className="flex-1">
                <p className="text-xs text-primary font-medium">
                  Exercício {completedAICount + 1} de {aiExercises.length}
                </p>
                <p className="text-base font-bold text-foreground">{currentPlannedExercise.exercise_name}</p>
                <p className="text-xs text-muted-foreground">
                  Sugestão: {currentPlannedExercise.sets}x{currentPlannedExercise.reps} · {currentPlannedExercise.rest}s
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-primary/50" />
            </motion.div>
          )}

          {/* Exercise Tools Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
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
              focusTrigger={0}
              completedSetsCount={savedExercises.filter((e) => e.name === selectedExercise).length}
              targetSets={parseInt(sets) || undefined}
              estimatedOneRM={(() => {
                const w = parseFloat(weight);
                const r = parseInt(reps);
                if (!w || !r || w <= 0 || r <= 0) return undefined;
                return Math.round(w * (1 + r / 30));
              })()}
            />
          </motion.div>

          {/* Barbell calculator trigger */}
          <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 4px" }}>
            <button
              onClick={() => setShowBarbellCalc(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
                cursor: "pointer", fontSize: 11, color: "rgba(255,255,255,0.30)", fontWeight: 600, padding: "4px 8px",
              }}
            >
              Calculadora de barbell
            </button>
          </div>
          {showBarbellCalc && (
            <BarbellCalculator onClose={() => setShowBarbellCalc(false)} defaultWeight={parseFloat(weight) || 80} />
          )}

          {/* Rest Timer — appears after marking done, auto-hides after 8s */}
          <AnimatePresence>
            {showRestTimer && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                style={{ overflow: "hidden" }}
              >
                <RestTimerCard
                  savedExercises={savedExercises}
                  trainingType={trainingType}
                  userId={user?.id}
                  autoStartTrigger={0}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── UNIFIED EXERCISE LIST ── */}
          {workoutItems.length > 0 && (
            <div style={{ background: "#1A1A1A", borderBottom: "1px solid #2A2A2A", padding: "20px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.50)" }}>Exercícios</span>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  background: "rgba(37,99,235,0.15)", color: "#60A5FA",
                  padding: "4px 10px", borderRadius: 20,
                }}>
                  {doneCount}/{totalCount}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {workoutItems.map((item, index) => {
                  const isCurrent = isGuidedMode && item.source === "ai"
                    && item.id === currentPlannedExercise?.id && !item.done;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      style={{
                        background: "#141414",
                        border: isCurrent
                          ? "1px solid rgba(37,99,235,0.35)"
                          : "1px solid rgba(255,255,255,0.07)",
                        borderRadius: 16,
                        padding: 16,
                        borderLeft: item.done && !item.skipped
                          ? "3px solid #4ADE80"
                          : item.skipped
                          ? "3px solid rgba(255,255,255,0.15)"
                          : isCurrent
                          ? "3px solid #2563EB"
                          : "3px solid transparent",
                        opacity: item.done ? 0.5 : 1,
                        transition: "opacity 0.2s, border-left-color 0.2s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.30)",
                          minWidth: 20, textAlign: "center",
                        }}>
                          {index + 1}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontSize: 14, fontWeight: 700, color: "white",
                            textDecoration: item.done ? "line-through" : "none",
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}>
                            {item.name}
                            {item.source === "ai" && (
                              <span style={{ fontSize: 11, color: "rgba(96,165,250,0.7)", marginLeft: 6, fontWeight: 600 }}>
                                IA
                              </span>
                            )}
                          </p>
                          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.30)", marginTop: 3 }}>
                            {item.sets}x{item.reps}
                            {item.weight > 0 ? ` · ${item.weight}kg` : ""}
                            {item.rest > 0 ? ` · ${item.rest}s` : ""}
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <button
                            onClick={() => handleToggleDone(item)}
                            style={{
                              width: 32, height: 32, borderRadius: 8,
                              background: item.done ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.07)",
                              border: item.done ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(255,255,255,0.07)",
                              color: item.done ? "#4ADE80" : "rgba(255,255,255,0.50)",
                              fontSize: 14, cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => handleRemoveItem(item)}
                            style={{
                              width: 32, height: 32, borderRadius: 8,
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.07)",
                              color: "rgba(255,255,255,0.30)",
                              fontSize: 12, cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Last Session Card */}
          <div>
            <LastSessionCard todayMuscleGroups={todayMuscleGroups} userId={user?.id} />
          </div>
        </div>
      )}

      <BottomNav />

      {/* ── FIXED BOTTOM BAR ── */}
      <AnimatePresence>
        {totalCount > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            style={{
              position: "fixed", bottom: 68, left: 0, right: 0,
              padding: "10px 16px",
              background: "#000",
              borderTop: "1px solid rgba(255,255,255,0.07)",
              zIndex: 45,
              display: "flex", alignItems: "center", gap: 12,
            }}
          >
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.30)", fontWeight: 600, flexShrink: 0 }}>
              {doneCount} feitos{skippedCount > 0 ? ` · ${skippedCount} saltados` : ""}
            </span>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleCompleteWorkout}
              disabled={completing}
              style={{
                flex: 1, height: 40, borderRadius: 100,
                background: doneCount > 0 ? "#2563EB" : "rgba(255,255,255,0.07)",
                border: doneCount > 0 ? "none" : "1px solid rgba(255,255,255,0.15)",
                color: doneCount > 0 ? "white" : "rgba(255,255,255,0.30)",
                fontSize: 13, fontWeight: 800, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                opacity: completing ? 0.7 : 1,
              }}
            >
              {completing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> A guardar...</>
              ) : (
                <>Terminar treino <Check size={14} /></>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── EXIT MODAL ── */}
      <AnimatePresence>
        {showExitModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 9999,
              background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
            }}
            onClick={() => setShowExitModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: "#141414", borderRadius: 20, padding: 24, width: "calc(100% - 32px)", maxWidth: 380 }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "white", marginBottom: 8 }}>
                Tens a certeza?
              </h3>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.50)", marginBottom: 20, lineHeight: 1.5 }}>
                {savedExercises.length > 0
                  ? `Tens ${savedExercises.length} ${savedExercises.length === 1 ? "set registado" : "sets registados"}. O que queres fazer?`
                  : "Ainda não registaste nenhum set."}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  onClick={() => setShowExitModal(false)}
                  style={{
                    width: "100%", height: 44, borderRadius: 12,
                    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.70)", fontWeight: 700, fontSize: 14, cursor: "pointer",
                  }}
                >
                  Continuar treino
                </button>
                {savedExercises.length > 0 && (
                  <button
                    onClick={handleSaveAndExit}
                    style={{
                      width: "100%", height: 44, borderRadius: 12,
                      background: "#2563EB", border: "none",
                      color: "white", fontWeight: 800, fontSize: 14, cursor: "pointer",
                    }}
                  >
                    ✓ Guardar e sair
                  </button>
                )}
                <button
                  onClick={handleDiscardAndExit}
                  style={{
                    width: "100%", height: 44, borderRadius: 12,
                    background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)",
                    color: "#F87171", fontWeight: 700, fontSize: 14, cursor: "pointer",
                  }}
                >
                  ✕ Descartar e sair
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
