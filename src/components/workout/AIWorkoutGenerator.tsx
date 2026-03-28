import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Dumbbell,
  Clock,
  Target,
  RotateCcw,
} from "lucide-react";
import { invokeWithAuth } from "@/lib/supabaseHelpers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";

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
  const [generatedSummary, setGeneratedSummary] = useState<{
    exerciseCount: number;
    duration: number;
    difficulty: string;
  } | null>(null);

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

  const generateAndPersist = async () => {
    if (todayMuscleGroups.length === 0) {
      toast.error(t("aiWorkout.noMuscleGroups"));
      return;
    }
    if (!user) {
      toast.error("Faz login para gerar treino");
      return;
    }

    setIsGenerating(true);

    try {
      // 1. Generate workout via AI
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
      if (!data?.workout) throw new Error(data?.error || "Erro ao gerar treino");

      const workout = data.workout;

      // 2. Persist session + planned exercises immediately
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

      // 3. Save summary for minimal display
      setGeneratedSummary({
        exerciseCount: workout.exercises.length,
        duration: workout.estimatedDuration,
        difficulty: workout.difficulty,
      });

      toast.success(t("aiWorkout.success"));

      // 4. Notify parent → triggers guided mode with CardStack
      onSessionCreated?.();
    } catch (error: any) {
      console.error("Error generating workout:", error);
      toast.error(error.message || t("aiWorkout.error"));
    } finally {
      setIsGenerating(false);
    }
  };

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

      {/* Summary after generation */}
      {generatedSummary && (
        <div className="flex gap-3 mb-4">
          <div className="flex-1 bg-[#2A2A2A]/50 rounded-xl p-3 text-center">
            <Clock className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-sm font-bold text-white">{generatedSummary.duration}'</p>
            <p className="text-[10px] text-gray-400">{t("aiWorkout.duration")}</p>
          </div>
          <div className="flex-1 bg-[#2A2A2A]/50 rounded-xl p-3 text-center">
            <Target className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-xs font-bold text-white">{generatedSummary.difficulty}</p>
            <p className="text-[10px] text-gray-400">{t("aiWorkout.level")}</p>
          </div>
          <div className="flex-1 bg-[#2A2A2A]/50 rounded-xl p-3 text-center">
            <Dumbbell className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <p className="text-sm font-bold text-white">{generatedSummary.exerciseCount}</p>
            <p className="text-[10px] text-gray-400">{t("home.exercises")}</p>
          </div>
        </div>
      )}

      {/* Generate button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={generateAndPersist}
        disabled={isGenerating}
        className="w-full py-4 rounded-xl font-semibold shadow-lg shadow-primary/30 bg-black text-primary flex items-center justify-center gap-2 border-transparent opacity-75 disabled:opacity-40"
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
        ) : generatedSummary ? (
          <>
            <RotateCcw className="w-4 h-4" />
            Gerar novo treino
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            {t("aiWorkout.generateFor")} {todayMuscleGroups.join(" + ")}
          </>
        )}
      </motion.button>
    </motion.div>
  );
};
