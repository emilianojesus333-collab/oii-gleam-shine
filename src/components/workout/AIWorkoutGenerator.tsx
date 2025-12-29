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
  Check
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GeneratedExercise {
  name: string;
  sets: number;
  reps: string;
  rest: number;
  tip?: string;
  equipment?: string;
}

interface GeneratedWorkout {
  warmup: { name: string; duration: string }[];
  exercises: GeneratedExercise[];
  cooldown: string;
  estimatedDuration: number;
  difficulty: string;
  notes?: string;
}

interface AIWorkoutGeneratorProps {
  todayMuscleGroups: string[];
  trainingType: string;
  onSelectExercise?: (exercise: string) => void;
}

const weekDaysMap: Record<number, string> = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
};

export const AIWorkoutGenerator = ({ 
  todayMuscleGroups, 
  trainingType,
  onSelectExercise 
}: AIWorkoutGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [workout, setWorkout] = useState<GeneratedWorkout | null>(null);
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());

  // Get user profile from localStorage
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
      toast.error("Não há grupos musculares definidos para hoje");
      return;
    }

    setIsGenerating(true);
    setWorkout(null);
    setCompletedExercises(new Set());

    try {
      const { data, error } = await supabase.functions.invoke("generate-workout", {
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
        toast.success("Treino gerado com sucesso! 💪");
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error("Error generating workout:", error);
      toast.error(error.message || "Erro ao gerar treino. Tenta novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleExerciseComplete = (index: number) => {
    setCompletedExercises(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const progressPercentage = workout 
    ? Math.round((completedExercises.size / workout.exercises.length) * 100)
    : 0;

  if (todayMuscleGroups.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-primary/20 via-[#1E1E1E]/80 to-[#1E1E1E]/50 rounded-[20px] p-5 border border-primary/30"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/30 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">Gerador de Treino IA</h3>
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
          className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/30 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-5 h-5" />
              </motion.div>
              A gerar treino personalizado...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Gerar Treino para {todayMuscleGroups.join(" + ")}
            </>
          )}
        </motion.button>
      ) : (
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="bg-[#2A2A2A]/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Progresso</span>
              <span className="text-sm font-semibold text-primary">
                {completedExercises.size}/{workout.exercises.length} exercícios
              </span>
            </div>
            <div className="h-2 bg-[#1E1E1E] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
              />
            </div>
          </div>

          {/* Workout Info */}
          <div className="flex gap-3">
            <div className="flex-1 bg-[#2A2A2A]/50 rounded-xl p-3 text-center">
              <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{workout.estimatedDuration}'</p>
              <p className="text-xs text-gray-400">Duração</p>
            </div>
            <div className="flex-1 bg-[#2A2A2A]/50 rounded-xl p-3 text-center">
              <Target className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <p className="text-sm font-bold text-white">{workout.difficulty}</p>
              <p className="text-xs text-gray-400">Nível</p>
            </div>
            <div className="flex-1 bg-[#2A2A2A]/50 rounded-xl p-3 text-center">
              <Dumbbell className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{workout.exercises.length}</p>
              <p className="text-xs text-gray-400">Exercícios</p>
            </div>
          </div>

          {/* Warmup */}
          {workout.warmup && workout.warmup.length > 0 && (
            <div className="bg-[#2A2A2A]/30 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-amber-500 mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Aquecimento
              </h4>
              <div className="space-y-1">
                {workout.warmup.map((w, i) => (
                  <p key={i} className="text-sm text-gray-300">
                    • {w.name} - {w.duration}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Exercises */}
          <div className="space-y-2">
            {workout.exercises.map((exercise, index) => {
              const isCompleted = completedExercises.has(index);
              const isExpanded = expandedExercise === index;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-[#2A2A2A]/50 rounded-xl overflow-hidden transition-all ${
                    isCompleted ? "border border-green-500/30" : ""
                  }`}
                >
                  <div 
                    className="flex items-center gap-3 p-4 cursor-pointer"
                    onClick={() => setExpandedExercise(isExpanded ? null : index)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExerciseComplete(index);
                      }}
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isCompleted 
                          ? "bg-green-500 text-white" 
                          : "bg-[#1E1E1E] border border-gray-600"
                      }`}
                    >
                      {isCompleted && <Check className="w-4 h-4" />}
                    </button>
                    
                    <div className="flex-1">
                      <p className={`font-medium ${isCompleted ? "text-gray-400 line-through" : "text-white"}`}>
                        {exercise.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {exercise.sets}x{exercise.reps} • {exercise.rest}s descanso
                      </p>
                    </div>

                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4 overflow-hidden"
                      >
                        {exercise.tip && (
                          <div className="bg-[#1E1E1E]/50 rounded-lg p-3 mb-2">
                            <p className="text-sm text-gray-300">
                              <span className="text-primary font-medium">Dica:</span> {exercise.tip}
                            </p>
                          </div>
                        )}
                        {exercise.equipment && (
                          <p className="text-xs text-gray-400">
                            <span className="text-gray-300">Equipamento:</span> {exercise.equipment}
                          </p>
                        )}
                        {onSelectExercise && (
                          <button
                            onClick={() => onSelectExercise(exercise.name)}
                            className="mt-2 text-xs text-primary hover:underline"
                          >
                            Usar no registo →
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Cooldown */}
          {workout.cooldown && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-blue-400 mb-1">Cooldown</h4>
              <p className="text-sm text-gray-300">{workout.cooldown}</p>
            </div>
          )}

          {/* Notes */}
          {workout.notes && (
            <div className="flex items-start gap-2 p-3 bg-[#2A2A2A]/30 rounded-xl">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-400">{workout.notes}</p>
            </div>
          )}

          {/* Regenerate Button */}
          <button
            onClick={() => {
              setWorkout(null);
              generateWorkout();
            }}
            className="w-full py-3 rounded-xl bg-[#2A2A2A]/50 text-gray-300 font-medium flex items-center justify-center gap-2 hover:bg-[#2A2A2A]/80 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Gerar Novo Treino
          </button>
        </div>
      )}
    </motion.div>
  );
};
