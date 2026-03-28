import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Dumbbell,
  Clock,
  RotateCcw,
  Target,
  AlertCircle,
} from "lucide-react";
import { invokeWithAuth } from "@/lib/supabaseHelpers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { SwipeableCardStack, type StackExercise } from "./SwipeableCardStack";

interface GeneratedExercise {
  name: string;
  category?: "main" | "accessory";
  sets: number;
  reps: string;
  rest: number;
  tip?: string;
  equipment?: string;
}

interface GeneratedWorkout {
  warmup: { name: string; duration: string }[];
  exercises: GeneratedExercise[];
  stretching?: { name: string; duration: string }[];
  cooldown: string;
  estimatedDuration: number;
  difficulty: string;
  recommendedCount?: number;
  notes?: string;
}

interface AIWorkoutGeneratorProps {
  todayMuscleGroups: string[];
  trainingType: string;
  onAddExercise: (exercise: { name: string; weight: number; reps: number; sets: number }) => void;
  onSessionCreated?: () => void;
}

const weekDaysMap: Record<number, string> = {
  0: "Domingo", 1: "Segunda-feira", 2: "Terça-feira", 3: "Quarta-feira",
  4: "Quinta-feira", 5: "Sexta-feira", 6: "Sábado",
};

export const AIWorkoutGenerator = ({
  todayMuscleGroups,
  trainingType,
  onAddExercise,
  onSessionCreated,
}: AIWorkoutGeneratorProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [workout, setWorkout] = useState<GeneratedWorkout | null>(null);
  const [persistingPlan, setPersistingPlan] = useState(false);

  const userProfile = useMemo(() => {
    const onboardingData = localStorage.getItem("liftmate_onboarding");
    if (onboardingData) {
      const parsed = JSON.parse(onboardingData);
      return {
        experience: parsed.experience || "Intermédio",
        goal: parsed.goal || "Ganho de massa muscular",
      };
    }
    return { experience: "Intermédio", goal: "Ganho de massa muscular" };
  }, []);

  const generateWorkout = async () => {
    if (todayMuscleGroups.length === 0) {
      toast.error(t("aiWorkout.noMuscleGroups"));
      return;
    }

    setIsGenerating(true);
    setWorkout(null);

    try {
      const { data, error } = await invokeWithAuth<{
        workout?: GeneratedWorkout;
        error?: string;
      }>("generate-workout", {
        body: {
          muscleGroups: todayMuscleGroups,
          trainingType,
          experience: userProfile.experience,
          goal: userProfile.goal,
          equipment: "Ginásio completo",
        },
      });

      if (error) throw error;

      if (data?.workout) {
        setWorkout(data.workout);
        toast.success(t("aiWorkout.success"));
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error("Error generating workout:", error);
      toast.error(error.message || t("aiWorkout.error"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePersistAndStart = useCallback(async () => {
    if (!workout || !user) return;

    setPersistingPlan(true);
    try {
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0];
      const dayOfWeek = weekDaysMap[today.getDay()];

      const { data: existing } = await supabase
        .from("workout_sessions")
        .select("id")
        .eq("user_id", user.id)
        .eq("date", dateStr)
        .maybeSingle();

      const sessionId = existing?.id || crypto.randomUUID();

      if (existing) {
        await supabase
          .from("workout_sessions")
          .update({
            status: "in_progress" as any,
            total_exercises: workout.exercises.length,
            completion_rate: 0,
            muscle_groups: todayMuscleGroups,
            day_of_week: dayOfWeek,
            exercises_completed: [],
          })
          .eq("id", sessionId);

        await supabase
          .from("planned_exercises" as any)
          .delete()
          .eq("session_id", sessionId);
      } else {
        await supabase
          .from("workout_sessions")
          .insert({
            id: sessionId,
            user_id: user.id,
            date: dateStr,
            day_of_week: dayOfWeek,
            muscle_groups: todayMuscleGroups,
            status: "in_progress" as any,
            total_exercises: workout.exercises.length,
            completion_rate: 0,
            exercises_completed: [],
            exercise_logs: [],
          });
      }

      const plannedRows = workout.exercises.map((ex, i) => ({
        session_id: sessionId,
        user_id: user.id,
        exercise_name: ex.name,
        sets: ex.sets,
        reps: String(ex.reps),
        rest: ex.rest,
        order_index: i,
        completed: false,
        source: "ai",
      }));

      await supabase.from("planned_exercises" as any).insert(plannedRows as any);

      toast.success("Treino concluído e guardado!");
      onSessionCreated?.();
    } catch (err: any) {
      console.error("Error persisting workout plan:", err);
      toast.error("Erro ao guardar treino");
    } finally {
      setPersistingPlan(false);
    }
  }, [workout, user, todayMuscleGroups, onSessionCreated]);

  const handleSwipeRight = useCallback(
    (exercise: StackExercise) => {
      const repsNum = parseInt(exercise.reps) || 10;
      onAddExercise({
        name: exercise.name,
        weight: exercise.weight || 0,
        reps: repsNum,
        sets: exercise.sets,
      });
    },
    [onAddExercise]
  );

  const stackExercises: StackExercise[] = useMemo(() => {
    if (!workout) return [];
    return workout.exercises.map((ex) => ({
      name: ex.name,
      sets: ex.sets,
      reps: String(ex.reps),
      rest: ex.rest,
      weight: 0,
      equipment: ex.equipment,
      category: ex.category,
    }));
  }, [workout]);

  if (todayMuscleGroups.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-primary/20 via-[#1E1E1E]/80 to-[#1E1E1E]/50 rounded-[20px] p-5 border border-primary/30 bg-stone-950"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/30 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">{t("aiWorkout.title")}</h3>
          <p className="text-xs text-gray-400">
            {todayMuscleGroups.join(" + ")} • {trainingType}
          </p>
        </div>
      </div>

      {!workout ? (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={generateWorkout}
          disabled={isGenerating}
          className="w-full py-4 rounded-xl font-semibold shadow-lg shadow-primary/30 bg-black text-primary flex items-center justify-center gap-0 border-transparent opacity-75"
        >
          {isGenerating ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-5 h-5" />
              </motion.div>
              {t("aiWorkout.generating")}
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              {t("aiWorkout.generateFor")} {todayMuscleGroups.join(" + ")}
            </>
          )}
        </motion.button>
      ) : (
        <div className="space-y-4">
          {/* Workout Info */}
          <div className="flex gap-3">
            <div className="flex-1 bg-[#2A2A2A]/50 rounded-xl p-3 text-center">
              <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{workout.estimatedDuration}'</p>
              <p className="text-xs text-gray-400">{t("aiWorkout.duration")}</p>
            </div>
            <div className="flex-1 bg-[#2A2A2A]/50 rounded-xl p-3 text-center">
              <Target className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <p className="text-sm font-bold text-white">{workout.difficulty}</p>
              <p className="text-xs text-gray-400">{t("aiWorkout.level")}</p>
            </div>
            <div className="flex-1 bg-[#2A2A2A]/50 rounded-xl p-3 text-center">
              <Dumbbell className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{workout.exercises.length}</p>
              <p className="text-xs text-gray-400">{t("home.exercises")}</p>
            </div>
          </div>

          {/* Card Stack inline */}
          <SwipeableCardStack
            exercises={stackExercises}
            onSwipeRight={handleSwipeRight}
            onFinish={handlePersistAndStart}
            isFinishing={persistingPlan}
          />

          {/* Notes */}
          {workout.notes && (
            <div className="flex items-start gap-2 p-3 bg-[#2A2A2A]/30 rounded-xl">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-400">{workout.notes}</p>
            </div>
          )}

          {/* Regenerate */}
          <button
            onClick={() => {
              setWorkout(null);
              generateWorkout();
            }}
            className="w-full py-3 rounded-xl bg-[#2A2A2A]/50 text-gray-300 font-medium flex items-center justify-center gap-2 hover:bg-[#2A2A2A]/80 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            {t("aiWorkout.regenerate")}
          </button>
        </div>
      )}
    </motion.div>
  );
};
