import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserSettings } from "@/hooks/useUserSettings";

interface WorkoutOption {
  id: string;
  title: string;
  description: string;
  isSuggested?: boolean;
}

export function WorkoutCarouselCard() {
  const navigate = useNavigate();
  const { settings } = useUserSettings();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const aiName = settings?.ai_name || "Victoria";

  const todayMuscles = (() => {
    const schedule = settings?.onboarding_data?.schedule || {};
    const weekDaysMap: Record<number, string> = {
      0: "Domingo", 1: "Segunda-feira", 2: "Terça-feira",
      3: "Quarta-feira", 4: "Quinta-feira", 5: "Sexta-feira", 6: "Sábado"
    };
    const todayName = weekDaysMap[new Date().getDay()];
    const groups = schedule[todayName];
    if (!groups) return null;
    return Array.isArray(groups) ? groups : [groups];
  })();

  if (!todayMuscles || todayMuscles.length === 0) return null;

  const workoutOptions: WorkoutOption[] = [
    {
      id: "a",
      title: "Treino A",
      description: `Foco ${todayMuscles[0] || "principal"}: Exercícios compostos e isolamento.`,
    },
    {
      id: "b",
      title: "Treino B",
      description: `Foco ${todayMuscles[1] || todayMuscles[0] || "secundário"}: Variação de exercícios.`,
    },
    {
      id: "ai",
      title: `Sugerido pela ${aiName}`,
      description: "Treino personalizado com base no teu progresso e fadiga.",
      isSuggested: true,
    },
  ];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : workoutOptions.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < workoutOptions.length - 1 ? prev + 1 : 0));
  };

  const handleSelect = () => {
    if (selectedId) {
      navigate("/workout", { state: { selectedWorkout: selectedId } });
    } else {
      setSelectedId(workoutOptions[currentIndex].id);
    }
  };

  const current = workoutOptions[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="space-y-3"
    >
      {/* Carousel */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="relative h-[200px] sm:h-[240px] bg-card border border-border/50 rounded-2xl overflow-hidden">
          {/* Content */}
          <div className="relative z-10 flex flex-col justify-end h-full p-5">
            <div className="flex items-center gap-2 mb-1">
              {current.isSuggested && (
                <Sparkles className="w-4 h-4 text-primary" />
              )}
              <h3 className="text-xl font-black text-foreground">
                {current.title}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {current.description}
            </p>
          </div>

          {/* Navigation arrows */}
          <div className="absolute top-1/2 -translate-y-1/2 left-2 z-20">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handlePrev}
              className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </motion.button>
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 right-2 z-20">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleNext}
              className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4 text-foreground" />
            </motion.button>
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 mt-2">
          {workoutOptions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                idx === currentIndex
                  ? "bg-foreground w-4"
                  : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Select / Generate button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleSelect}
        className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${
          selectedId
            ? "bg-primary text-primary-foreground shadow-lg"
            : "bg-muted text-foreground"
        }`}
      >
        {selectedId ? "GERAR" : "Selecionar treino"}
      </motion.button>
    </motion.div>
  );
}
