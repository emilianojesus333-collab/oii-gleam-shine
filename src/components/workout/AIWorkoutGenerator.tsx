import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Dumbbell,
  Clock,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Target,
  Zap,
  AlertCircle,
  Plus } from
"lucide-react";
import { invokeWithAuth } from "@/lib/supabaseHelpers";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";

interface GeneratedExercise {
  name: string;
  sets: number;
  reps: string;
  rest: number;
  tip?: string;
  equipment?: string;
}

interface GeneratedWorkout {
  warmup: {name: string;duration: string;}[];
  exercises: GeneratedExercise[];
  cooldown: string;
  estimatedDuration: number;
  difficulty: string;
  notes?: string;
}

interface AIWorkoutGeneratorProps {
  todayMuscleGroups: string[];
  trainingType: string;
  onAddExercise: (exercise: { name: string; weight: number; reps: number; sets: number }) => void;
}

export const AIWorkoutGenerator = ({
  todayMuscleGroups,
  trainingType,
  onAddExercise
}: AIWorkoutGeneratorProps) => {
  const { t } = useLanguage();
  const [isGenerating, setIsGenerating] = useState(false);
  const [workout, setWorkout] = useState<GeneratedWorkout | null>(null);
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);
  const [addedExercises, setAddedExercises] = useState<Set<number>>(new Set());

  // Get user profile from localStorage
  const userProfile = useMemo(() => {
    const onboardingData = localStorage.getItem("liftmate_onboarding");
    if (onboardingData) {
      const parsed = JSON.parse(onboardingData);
      return {
        experience: parsed.experience || "Intermédio",
        goal: parsed.goal || "Ganho de massa muscular"
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
    setAddedExercises(new Set());

    try {
      const { data, error } = await invokeWithAuth<{workout?: GeneratedWorkout;error?: string;}>("generate-workout", {
        body: {
          muscleGroups: todayMuscleGroups,
          trainingType,
          experience: userProfile.experience,
          goal: userProfile.goal,
          equipment: "Ginásio completo"
        }
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

  const handleAddExercise = (exercise: GeneratedExercise, index: number) => {
    const repsNum = parseInt(exercise.reps) || 10;
    onAddExercise({
      name: exercise.name,
      weight: 0, // User will set weight
      reps: repsNum,
      sets: exercise.sets
    });
    setAddedExercises((prev) => new Set(prev).add(index));
    toast.success(`${exercise.name} adicionado ao treino`);
  };

  const handleAddAll = () => {
    if (!workout) return;
    workout.exercises.forEach((exercise, index) => {
      if (!addedExercises.has(index)) {
        const repsNum = parseInt(exercise.reps) || 10;
        onAddExercise({
          name: exercise.name,
          weight: 0,
          reps: repsNum,
          sets: exercise.sets
        });
      }
    });
    setAddedExercises(new Set(workout.exercises.map((_, i) => i)));
    toast.success("Todos os exercícios adicionados ao treino");
  };

  if (todayMuscleGroups.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-primary/20 via-[#1E1E1E]/80 to-[#1E1E1E]/50 rounded-[20px] p-5 border border-primary/30 bg-stone-950">

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

      {!workout ?
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={generateWorkout}
        disabled={isGenerating}
        className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/30 disabled:opacity-50">

          {isGenerating ?
        <>
              <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <Sparkles className="w-5 h-5" />
              </motion.div>
              {t("aiWorkout.generating")}
            </> :
        <>
              <Sparkles className="w-5 h-5" />
              {t("aiWorkout.generateFor")} {todayMuscleGroups.join(" + ")}
            </>
        }
        </motion.button> :

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

          {/* Add All Button */}
          {addedExercises.size < workout.exercises.length && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleAddAll}
              className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-green-600/30">
              <Plus className="w-5 h-5" />
              Adicionar todos ao treino
            </motion.button>
          )}

          {/* Warmup */}
          {workout.warmup && workout.warmup.length > 0 &&
        <div className="bg-[#2A2A2A]/30 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-amber-500 mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                {t("aiWorkout.warmup")}
              </h4>
              <div className="space-y-1">
                {workout.warmup.map((w, i) =>
            <p key={i} className="text-sm text-gray-300">
                    • {w.name} - {w.duration}
                  </p>
            )}
              </div>
            </div>
        }

          {/* Exercises */}
          <div className="space-y-2">
            {workout.exercises.map((exercise, index) => {
            const isAdded = addedExercises.has(index);
            const isExpanded = expandedExercise === index;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-[#2A2A2A]/50 rounded-xl overflow-hidden transition-all ${
                isAdded ? "border border-green-500/30" : ""}`
                }>

                  <div
                  className="flex items-center gap-3 p-4 cursor-pointer"
                  onClick={() => setExpandedExercise(isExpanded ? null : index)}>

                    <div className="flex-1">
                      <p className={`font-medium ${isAdded ? "text-green-400" : "text-white"}`}>
                        {exercise.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {exercise.sets}x{exercise.reps} • {exercise.rest}s {t("aiWorkout.rest")}
                      </p>
                    </div>

                    {!isAdded ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddExercise(exercise, index);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30 transition-all">
                        <Plus className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-xs text-green-400 font-medium">✓ Adicionado</span>
                    )}

                    {isExpanded ?
                  <ChevronUp className="w-5 h-5 text-gray-400" /> :
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                  }
                  </div>

                  <AnimatePresence>
                    {isExpanded &&
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-4 overflow-hidden">

                        {exercise.tip &&
                    <div className="bg-[#1E1E1E]/50 rounded-lg p-3 mb-2">
                            <p className="text-sm text-gray-300">
                              <span className="text-primary font-medium">{t("aiWorkout.tip")}:</span> {exercise.tip}
                            </p>
                          </div>
                    }
                        {exercise.equipment &&
                    <p className="text-xs text-gray-400">
                            <span className="text-gray-300">{t("aiWorkout.equipment")}:</span> {exercise.equipment}
                          </p>
                    }
                      </motion.div>
                  }
                  </AnimatePresence>
                </motion.div>);

          })}
          </div>

          {/* Cooldown */}
          {workout.cooldown &&
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-blue-400 mb-1">{t("aiWorkout.cooldown")}</h4>
              <p className="text-sm text-gray-300">{workout.cooldown}</p>
            </div>
        }

          {/* Notes */}
          {workout.notes &&
        <div className="flex items-start gap-2 p-3 bg-[#2A2A2A]/30 rounded-xl">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-400">{workout.notes}</p>
            </div>
        }

          {/* Regenerate Button */}
          <button
          onClick={() => {
            setWorkout(null);
            generateWorkout();
          }}
          className="w-full py-3 rounded-xl bg-[#2A2A2A]/50 text-gray-300 font-medium flex items-center justify-center gap-2 hover:bg-[#2A2A2A]/80 transition-all">

            <RotateCcw className="w-4 h-4" />
            {t("aiWorkout.regenerate")}
          </button>

          {/* Ver Treino sticky button */}
          {addedExercises.size > 0 && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                document.getElementById("saved-exercises-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="sticky bottom-4 w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/30 z-10">
              <Dumbbell className="w-5 h-5" />
              Ver Treino ({addedExercises.size} exercícios)
            </motion.button>
          )}
        </div>
      }
    </motion.div>);

};