import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Dumbbell, Loader2, RefreshCw, Check, Target, Clock, Flame, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GeneratedExercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
}

interface GeneratedWorkout {
  title: string;
  duration: string;
  difficulty: "Iniciante" | "Intermediário" | "Avançado";
  warmup: string[];
  exercises: GeneratedExercise[];
  cooldown: string[];
  tips: string[];
}

export const AIWorkoutGenerator = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [workout, setWorkout] = useState<GeneratedWorkout | null>(null);
  const [savedToday, setSavedToday] = useState(false);

  const getUserContext = () => {
    const onboardingData = localStorage.getItem("liftmate_onboarding");
    const data = onboardingData ? JSON.parse(onboardingData) : {};
    
    const weekDaysMap: Record<number, string> = {
      0: "Domingo", 1: "Segunda-feira", 2: "Terça-feira",
      3: "Quarta-feira", 4: "Quinta-feira", 5: "Sexta-feira", 6: "Sábado",
    };
    
    const today = new Date();
    const todayName = weekDaysMap[today.getDay()];
    const todayMuscleGroups = data.schedule?.[todayName] || [];
    
    return {
      goal: data.goal || "hipertrofia",
      experience: data.experience || "intermediário",
      focusAreas: data.focusAreas || [],
      todayMuscleGroups: Array.isArray(todayMuscleGroups) ? todayMuscleGroups : [todayMuscleGroups],
      equipment: data.equipment || ["halteres", "barra", "máquinas"],
    };
  };

  const generateWorkout = async () => {
    setIsGenerating(true);
    setWorkout(null);

    try {
      const context = getUserContext();
      
      const { data, error } = await supabase.functions.invoke("generate-workout", {
        body: { context },
      });

      if (error) throw error;
      
      if (data?.workout) {
        setWorkout(data.workout);
        toast.success("Treino gerado com sucesso!");
      } else {
        throw new Error("Resposta inválida da IA");
      }
    } catch (error) {
      console.error("Error generating workout:", error);
      toast.error("Erro ao gerar treino. Tenta novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveWorkoutToToday = () => {
    if (!workout) return;
    
    // Save generated workout to localStorage for today
    const savedWorkouts = JSON.parse(localStorage.getItem("liftmate_ai_workouts") || "[]");
    savedWorkouts.push({
      date: new Date().toISOString(),
      workout,
    });
    localStorage.setItem("liftmate_ai_workouts", JSON.stringify(savedWorkouts));
    
    setSavedToday(true);
    toast.success("Treino guardado para hoje!");
  };

  const difficultyColor = {
    "Iniciante": "bg-green-500/20 text-green-400",
    "Intermediário": "bg-yellow-500/20 text-yellow-400",
    "Avançado": "bg-red-500/20 text-red-400",
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full rounded-2xl bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30 p-4 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-white/70">Gerar Treino com IA</p>
              <p className="text-sm text-gray-400/70">Treino personalizado para hoje</p>
            </div>
          </div>
        </motion.button>
      </SheetTrigger>

      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl bg-card border-t-0">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Gerador de Treinos IA
          </SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto h-[calc(100%-100px)] pb-6 space-y-4">
          {!workout && !isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8 space-y-6"
            >
              <div className="flex justify-center">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <Dumbbell className="h-12 w-12 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  Treino Personalizado
                </h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                  A IA vai criar um treino baseado nos teus objetivos, experiência e grupos musculares de hoje.
                </p>
              </div>
              <Button
                onClick={generateWorkout}
                className="gap-2"
                size="lg"
              >
                <Sparkles className="h-5 w-5" />
                Gerar Treino
              </Button>
            </motion.div>
          )}

          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 space-y-4"
            >
              <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
              <p className="text-muted-foreground">A criar o teu treino personalizado...</p>
            </motion.div>
          )}

          <AnimatePresence>
            {workout && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{workout.title}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {workout.duration}
                      </Badge>
                      <Badge className={difficultyColor[workout.difficulty]}>
                        <Flame className="h-3 w-3 mr-1" />
                        {workout.difficulty}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={generateWorkout}
                    disabled={isGenerating}
                  >
                    <RefreshCw className={`h-5 w-5 ${isGenerating ? 'animate-spin' : ''}`} />
                  </Button>
                </div>

                {/* Warmup */}
                <div className="rounded-2xl bg-secondary/50 p-4">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-400" />
                    Aquecimento
                  </h4>
                  <ul className="space-y-1">
                    {workout.warmup.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Exercises */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-primary" />
                    Exercícios
                  </h4>
                  {workout.exercises.map((exercise, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="rounded-2xl bg-secondary/50 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{exercise.name}</p>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span>{exercise.sets} séries</span>
                            <span>×</span>
                            <span>{exercise.reps} reps</span>
                            <span>•</span>
                            <span>{exercise.rest} descanso</span>
                          </div>
                          {exercise.notes && (
                            <p className="text-xs text-primary/80 mt-2 flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              {exercise.notes}
                            </p>
                          )}
                        </div>
                        <span className="text-2xl font-black text-primary/30">{index + 1}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Cooldown */}
                <div className="rounded-2xl bg-secondary/50 p-4">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Heart className="h-4 w-4 text-blue-400" />
                    Retorno à calma
                  </h4>
                  <ul className="space-y-1">
                    {workout.cooldown.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tips */}
                {workout.tips.length > 0 && (
                  <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4">
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Dicas da IA
                    </h4>
                    <ul className="space-y-1">
                      {workout.tips.map((tip, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Save Button */}
                <Button
                  onClick={saveWorkoutToToday}
                  className="w-full gap-2"
                  size="lg"
                  disabled={savedToday}
                >
                  {savedToday ? (
                    <>
                      <Check className="h-5 w-5" />
                      Guardado
                    </>
                  ) : (
                    <>
                      <Dumbbell className="h-5 w-5" />
                      Usar este treino hoje
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
};
