import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Dumbbell,
  Clock,
  ChevronDown,
  ChevronUp,
  Target,
  Zap,
  AlertCircle,
  Play,
} from "lucide-react";
import { invokeWithAuth } from "@/lib/supabaseHelpers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useUserSettings } from "@/hooks/useUserSettings";

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
  /** Ref that will be set to the generateWorkout function so parent can trigger it */
  triggerRef?: React.MutableRefObject<(() => void) | null>;
  /** When true, hides the built-in header row and default generate button */
  hideHeader?: boolean;
  /** Called whenever the generating state changes */
  onGeneratingChange?: (generating: boolean) => void;
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
  triggerRef,
  hideHeader = false,
  onGeneratingChange,
}: AIWorkoutGeneratorProps) => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [workout, setWorkout] = useState<GeneratedWorkout | null>(null);
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);
  const [addedExercises, setAddedExercises] = useState<Set<number>>(new Set());
  const [persistingPlan, setPersistingPlan] = useState(false);

  const { settings } = useUserSettings();

  const userProfile = useMemo(() => {
    // Prefer Supabase onboarding data, fall back to user-scoped localStorage
    if (settings?.onboarding_data) {
      return {
        experience: settings.onboarding_data.experience || "Intermédio",
        goal: settings.onboarding_data.goal || "Ganho de massa muscular",
      };
    }
    // Fallback: user-scoped key
    const scopedKey = user?.id ? `liftmate_onboarding_${user.id}` : null;
    const onboardingData = scopedKey ? localStorage.getItem(scopedKey) : null;
    if (onboardingData) {
      try {
        const parsed = JSON.parse(onboardingData);
        return {
          experience: parsed.experience || "Intermédio",
          goal: parsed.goal || "Ganho de massa muscular",
        };
      } catch {}
    }
    return { experience: "Intermédio", goal: "Ganho de massa muscular" };
  }, [settings, user?.id]);

  const generateWorkout = async () => {
    if (todayMuscleGroups.length === 0) {
      toast.error("Seleciona pelo menos um grupo muscular.");
      return;
    }

    setIsGenerating(true);
    onGeneratingChange?.(true);
    setWorkout(null);
    setAddedExercises(new Set());

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
        toast.success("Treino gerado com sucesso!");
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error: unknown) {
      console.error("Error generating workout:", error);
      toast.error((error as Error).message || "Erro ao gerar treino.");
    } finally {
      setIsGenerating(false);
      onGeneratingChange?.(false);
    }
  };

  // Expose generateWorkout to parent via ref after it's defined (runs every render)
  if (triggerRef) triggerRef.current = generateWorkout;

  const handlePersistAndStart = async () => {
    if (!workout || !user) return;

    setPersistingPlan(true);
    try {
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0];
      const dayOfWeek = weekDaysMap[today.getDay()];

      // Check if session already exists for today
      const { data: existing } = await supabase
        .from("workout_sessions")
        .select("id")
        .eq("user_id", user.id)
        .eq("date", dateStr)
        .maybeSingle();

      const sessionId = existing?.id || crypto.randomUUID();

      if (existing) {
        // Update existing session
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

        // Delete old planned exercises
        await supabase
          .from("planned_exercises" as any)
          .delete()
          .eq("session_id", sessionId);
      } else {
        // Create new session
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

      // Insert planned exercises
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

      toast.success("Treino planeado criado!");
      onSessionCreated?.();
    } catch (err: unknown) {
      console.error("Error persisting workout plan:", err);
      toast.error("Erro ao criar plano de treino");
    } finally {
      setPersistingPlan(false);
    }
  };

  const handleAddExercise = (exercise: GeneratedExercise, index: number) => {
    const repsNum = parseInt(exercise.reps) || 10;
    onAddExercise({
      name: exercise.name,
      weight: 0,
      reps: repsNum,
      sets: exercise.sets,
    });
    setAddedExercises((prev) => new Set(prev).add(index));
    toast.success(`${exercise.name} adicionado ao treino`);
  };

  if (todayMuscleGroups.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ background: "#1A1A1A", borderRadius: 0, border: "none", borderBottom: "1px solid #2A2A2A", padding: "20px 16px", width: "100%", margin: 0 }}
      >
        <button
          disabled
          className="shimmer-blue w-full rounded-xl font-semibold flex items-center justify-center gap-2"
          style={{ color: "#ffffff", border: "none", height: 44, opacity: 0.4, cursor: "not-allowed", pointerEvents: "none" }}
        >
          <Sparkles className="w-5 h-5" />
          Gerar treino
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={hideHeader ? {} : { background: "#1A1A1A", borderRadius: 0, border: "none", borderBottom: "1px solid #2A2A2A", padding: "20px 16px", width: "100%", margin: 0 }}
    >
      {!hideHeader && (
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">Treino IA</h3>
            <p className="text-xs text-gray-400">
              {todayMuscleGroups.join(" + ")} • {trainingType}
            </p>
          </div>
        </div>
      )}

      {!hideHeader && !workout && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={generateWorkout}
          disabled={isGenerating}
          className="shimmer-blue w-full rounded-xl font-semibold flex items-center justify-center gap-2"
          style={{ color: "#ffffff", border: "none", height: 44 }}
        >
          {isGenerating ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-5 h-5" />
              </motion.div>
              A gerar...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Gerar treino · {todayMuscleGroups.join(" + ")}
            </>
          )}
        </motion.button>
      )}

      {workout ? (
        <div className="space-y-4">
          {/* Action buttons row — primary decision before starting */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setWorkout(null)}
              style={{
                flex: 1, height: 44, borderRadius: 100,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              ↺ Gerar novo
            </button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handlePersistAndStart}
              disabled={persistingPlan}
              style={{
                flex: 2, height: 44, borderRadius: 100,
                background: "#2563EB", border: "none",
                color: "white", fontSize: 14, fontWeight: 800,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                opacity: persistingPlan ? 0.7 : 1,
              }}
            >
              {persistingPlan ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                  A criar plano...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Usar este treino
                </>
              )}
            </motion.button>
          </div>

          {/* Workout Info */}
          <div className="flex gap-3">
            {[
              { value: `${workout.estimatedDuration}'`, label: "Duração" },
              { value: workout.difficulty,              label: "Nível" },
              { value: workout.exercises.length,        label: "Exercícios" },
            ].map(({ value, label }) => (
              <div key={label} style={{ flex: 1, background: "#141414", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", padding: "14px 10px", textAlign: "center" }}>
                <p style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>{value}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Warmup */}
          {workout.warmup && workout.warmup.length > 0 && (
            <div style={{ background: "#141414", borderRadius: 16, border: "1px solid rgba(251,191,36,0.15)", padding: 16 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: "#FBBF24", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <Zap style={{ width: 14, height: 14, color: "#FBBF24", flexShrink: 0 }} />
                ⚡ Aquecimento
              </h4>
              <div className="space-y-1">
                {workout.warmup.map((w, i) => (
                  <p key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                    <span style={{ color: "#FBBF24" }}>•</span> {w.name} - {w.duration}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Exercises */}
          <div className="space-y-2">
            {workout.exercises.map((exercise, index) => {
              const isExpanded = expandedExercise === index;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  style={{ background: "#141414", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}
                >
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer"
                    onClick={() => setExpandedExercise(isExpanded ? null : index)}
                  >
                    <span className="text-xs text-gray-500 w-5">{index + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{exercise.name}</p>
                        {exercise.category === "accessory" && (
                          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(96,165,250,0.12)", color: "#60A5FA" }}>Acessório</span>
                        )}
                      </div>
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
                              <span className="text-primary font-medium">Dica:</span>{" "}
                              {exercise.tip}
                            </p>
                          </div>
                        )}
                        {exercise.equipment && (
                          <p className="text-xs text-gray-400">
                            <span className="text-gray-300">Equipamento:</span>{" "}
                            {exercise.equipment}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Stretching */}
          {workout.stretching && workout.stretching.length > 0 && (
            <div style={{ background: "#141414", borderRadius: 16, border: "1px solid rgba(167,139,250,0.12)", padding: 16 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: "#A78BFA", marginBottom: 10 }}>Alongamento</h4>
              <div className="space-y-1">
                {workout.stretching.map((s, i) => (
                  <p key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                    <span style={{ color: "#A78BFA" }}>•</span> {s.name} - {s.duration}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Cooldown */}
          {workout.cooldown && (
            <div style={{ background: "#141414", borderRadius: 16, border: "1px solid rgba(96,165,250,0.12)", padding: 16 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: "#60A5FA", marginBottom: 8 }}>Arrefecimento</h4>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{workout.cooldown}</p>
            </div>
          )}

          {/* Notes */}
          {workout.notes && (
            <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.1)", borderRadius: 12, padding: 12, display: "flex", alignItems: "flex-start", gap: 8 }}>
              <AlertCircle style={{ width: 14, height: 14, color: "#FBBF24", marginTop: 2, flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{workout.notes}</p>
            </div>
          )}

        </div>
      ) : null}
    </motion.div>
  );
};
