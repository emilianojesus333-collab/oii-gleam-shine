import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, TrendingUp, History } from "lucide-react";
import { getWorkoutHistory } from "@/data/workoutHistory";

interface ExerciseInsightsCarouselProps {
  selectedExercise: string;
  weight: string;
  reps: string;
  exerciseFocus?: string;
}

export const ExerciseInsightsCarousel = ({
  selectedExercise,
  weight,
  reps,
}: ExerciseInsightsCarouselProps) => {
  const [activeSlide, setActiveSlide] = useState(0);

  // Get last workout data for this exercise
  const lastWorkout = useMemo(() => {
    if (!selectedExercise) return null;

    const history = getWorkoutHistory();
    for (const session of history.sessions) {
      const exerciseLog = session.exerciseLogs?.find(
        (log) => log.name.toLowerCase() === selectedExercise.toLowerCase()
      );
      if (exerciseLog) {
        return {
          ...exerciseLog,
          date: session.date,
        };
      }
    }
    return null;
  }, [selectedExercise]);

  // Calculate 1RM estimate using Epley formula: 1RM = weight × (1 + reps/30)
  const oneRM = useMemo(() => {
    const w = parseFloat(weight) || 0;
    const r = parseInt(reps) || 0;
    if (w > 0 && r > 0) {
      return Math.round(w * (1 + r / 30));
    }
    return null;
  }, [weight, reps]);

  // Recommended load based on 1RM (around 70-75% for hypertrophy)
  const recommendedLoad = useMemo(() => {
    if (oneRM) {
      return Math.round(oneRM * 0.72);
    }
    return null;
  }, [oneRM]);

  const slides = [
    {
      id: "register",
      icon: Dumbbell,
      title: "Registar Exercício",
      content: (
        <p className="text-white text-sm">
          {selectedExercise 
            ? `Pronto para registar: ${selectedExercise}`
            : "Seleciona um exercício para começar"}
        </p>
      ),
    },
    {
      id: "1rm",
      icon: TrendingUp,
      title: "1RM",
      content: oneRM ? (
        <div className="space-y-1">
          <p className="text-white font-semibold">1RM estimado: {oneRM}kg</p>
          <p className="text-gray-400 text-xs">
            Carga recomendada:{" "}
            <span className="text-primary font-medium">{recommendedLoad}kg</span>
          </p>
        </div>
      ) : (
        <p className="text-gray-400 text-xs">
          Preenche peso e reps para calcular
        </p>
      ),
    },
    {
      id: "history",
      icon: History,
      title: "Histórico",
      content: lastWorkout ? (
        <div className="space-y-1">
          <p className="text-white font-semibold">
            Última vez: {lastWorkout.weight}kg - {lastWorkout.reps} reps
          </p>
          <p className="text-gray-400 text-xs">
            {new Date(lastWorkout.date).toLocaleDateString("pt-PT", {
              day: "numeric",
              month: "short",
            })}
            {" • "}
            {lastWorkout.sets} séries
          </p>
        </div>
      ) : (
        <p className="text-gray-400 text-xs">
          Sem registos anteriores deste exercício
        </p>
      ),
    },
  ];

  return (
    <div className="mb-5">
      {/* Carousel Container */}
      <div className="relative overflow-hidden rounded-xl bg-[#2A2A2A]/30 border border-gray-700/30">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                {(() => {
                  const Icon = slides[activeSlide].icon;
                  return <Icon className="w-4 h-4 text-primary" />;
                })()}
              </div>
              <div className="flex-1 min-h-[44px]">
                <p className="text-xs text-gray-400 mb-1">
                  {slides[activeSlide].title}
                </p>
                {slides[activeSlide].content}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Dots */}
      <div className="flex justify-center gap-2 mt-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveSlide(index)}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
              activeSlide === index
                ? "bg-primary w-4"
                : "bg-gray-600 hover:bg-gray-500"
            }`}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
