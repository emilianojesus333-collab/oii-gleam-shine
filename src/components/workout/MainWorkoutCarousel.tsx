import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Dumbbell, TrendingUp, History, Save, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { getWorkoutHistory } from "@/data/workoutHistory";

interface MainWorkoutCarouselProps {
  selectedExercise: string;
  setSelectedExercise: (value: string) => void;
  weight: string;
  setWeight: (value: string) => void;
  reps: string;
  setReps: (value: string) => void;
  sets: string;
  setSets: (value: string) => void;
  restTime: string;
  setRestTime: (value: string) => void;
  todayExercises: { name: string; focus?: string }[];
  saveExercise: () => void;
  justSaved: boolean;
}

export const MainWorkoutCarousel = ({
  selectedExercise,
  setSelectedExercise,
  weight,
  setWeight,
  reps,
  setReps,
  sets,
  setSets,
  restTime,
  setRestTime,
  todayExercises,
  saveExercise,
  justSaved,
}: MainWorkoutCarouselProps) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Calculate 1RM estimate using Epley formula
  const oneRM = useMemo(() => {
    const w = parseFloat(weight) || 0;
    const r = parseInt(reps) || 0;
    if (w > 0 && r > 0) {
      return Math.round(w * (1 + r / 30));
    }
    return null;
  }, [weight, reps]);

  const recommendedLoad = useMemo(() => {
    if (oneRM) {
      return Math.round(oneRM * 0.72);
    }
    return null;
  }, [oneRM]);

  const slides = [
    { id: "register", icon: Dumbbell, title: "Registar Exercício" },
    { id: "1rm", icon: TrendingUp, title: "1RM Estimado" },
    { id: "history", icon: History, title: "Histórico" },
  ];

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const swipe = swipePower(info.offset.x, info.velocity.x);
    
    if (swipe < -swipeConfidenceThreshold && activeSlide < slides.length - 1) {
      paginate(1);
    } else if (swipe > swipeConfidenceThreshold && activeSlide > 0) {
      paginate(-1);
    }
  };

  const paginate = (newDirection: number) => {
    const newSlide = activeSlide + newDirection;
    if (newSlide >= 0 && newSlide < slides.length) {
      setDirection(newDirection);
      setActiveSlide(newSlide);
    }
  };

  const goToSlide = (index: number) => {
    setDirection(index > activeSlide ? 1 : -1);
    setActiveSlide(index);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
  };

  return (
    <div className="relative">
      {/* Header with slide title */}
      <div className="flex items-center justify-between p-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            {(() => {
              const Icon = slides[activeSlide].icon;
              return <Icon className="w-5 h-5 text-primary" />;
            })()}
          </div>
          <h2 className="text-lg font-semibold text-white">{slides[activeSlide].title}</h2>
        </div>
        
        {/* Navigation arrows */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => paginate(-1)}
            disabled={activeSlide === 0}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              activeSlide === 0 ? "text-gray-600" : "text-gray-400 hover:bg-white/10"
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => paginate(1)}
            disabled={activeSlide === slides.length - 1}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              activeSlide === slides.length - 1 ? "text-gray-600" : "text-gray-400 hover:bg-white/10"
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Carousel Content */}
      <div className="overflow-hidden" ref={containerRef}>
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={activeSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
              scale: { duration: 0.2 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            className={`px-5 pb-5 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          >
              {activeSlide === 0 && (
                <div className="space-y-4">
                  {/* Exercise selector */}
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Nome do Exercício</label>
                    <input
                      type="text"
                      list="exercise-options"
                      value={selectedExercise}
                      onChange={(e) => setSelectedExercise(e.target.value)}
                      placeholder="Escreve ou seleciona um exercício..."
                      className="w-full bg-[#2A2A2A]/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                    <datalist id="exercise-options">
                      {todayExercises.map((exercise) => (
                        <option key={exercise.name} value={exercise.name} />
                      ))}
                    </datalist>
                  </div>

                  {/* Input Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Peso (kg)</label>
                      <input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="w-full bg-[#2A2A2A]/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        placeholder="80"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Repetições</label>
                      <input
                        type="number"
                        value={reps}
                        onChange={(e) => setReps(e.target.value)}
                        className="w-full bg-[#2A2A2A]/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        placeholder="10"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Séries</label>
                      <input
                        type="number"
                        value={sets}
                        onChange={(e) => setSets(e.target.value)}
                        className="w-full bg-[#2A2A2A]/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        placeholder="3"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Descanso (seg)</label>
                      <input
                        type="number"
                        value={restTime}
                        onChange={(e) => setRestTime(e.target.value)}
                        className="w-full bg-[#2A2A2A]/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        placeholder="90"
                      />
                    </div>
                  </div>

                  {/* Save Button */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={saveExercise}
                    disabled={!selectedExercise.trim()}
                    className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                      justSaved
                        ? "bg-green-500 text-white"
                        : selectedExercise.trim()
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                        : "bg-[#2A2A2A]/50 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {justSaved ? (
                        <motion.div
                          key="saved"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="flex items-center gap-2"
                        >
                          <Check className="w-5 h-5" />
                          Guardado!
                        </motion.div>
                      ) : (
                        <motion.div
                          key="save"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="flex items-center gap-2"
                        >
                          <Save className="w-5 h-5" />
                          Guardar Exercício
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              )}

              {activeSlide === 1 && (
                <div className="min-h-[280px] flex flex-col items-center justify-center text-center py-6">
                  {oneRM ? (
                    <>
                      <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                        <TrendingUp className="w-12 h-12 text-primary" />
                      </div>
                      <p className="text-gray-400 text-sm mb-2">1RM Estimado</p>
                      <p className="text-6xl font-bold text-white mb-2">{oneRM}<span className="text-2xl text-gray-400 ml-1">kg</span></p>
                      <p className="text-gray-400 text-sm mt-6">Carga recomendada para hipertrofia (72%)</p>
                      <p className="text-3xl font-bold text-primary mt-2">{recommendedLoad}kg</p>
                      <p className="text-xs text-gray-500 mt-4">
                        Calculado com base em {weight}kg × {reps} reps (Fórmula de Epley)
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-full bg-gray-700/30 flex items-center justify-center mb-4">
                        <TrendingUp className="w-10 h-10 text-gray-500" />
                      </div>
                      <p className="text-gray-400 text-lg mb-2">Sem dados para calcular</p>
                      <p className="text-gray-500 text-sm max-w-xs">
                        Preenche o peso e repetições no slide de registo para ver o teu 1RM estimado
                      </p>
                    </>
                  )}
                </div>
              )}

              {activeSlide === 2 && (
                <div className="min-h-[280px] flex flex-col items-center justify-center text-center py-6">
                  {lastWorkout ? (
                    <>
                      <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                        <History className="w-12 h-12 text-primary" />
                      </div>
                      <p className="text-gray-400 text-sm mb-2">Última vez: {selectedExercise}</p>
                      <p className="text-5xl font-bold text-white mb-1">{lastWorkout.weight}<span className="text-xl text-gray-400 ml-1">kg</span></p>
                      <p className="text-2xl font-semibold text-gray-300">{lastWorkout.reps} reps × {lastWorkout.sets} séries</p>
                      <p className="text-gray-500 text-sm mt-6">
                        {new Date(lastWorkout.date).toLocaleDateString("pt-PT", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </p>
                    </>
                  ) : selectedExercise ? (
                    <>
                      <div className="w-20 h-20 rounded-full bg-gray-700/30 flex items-center justify-center mb-4">
                        <History className="w-10 h-10 text-gray-500" />
                      </div>
                      <p className="text-gray-400 text-lg mb-2">Primeiro registo!</p>
                      <p className="text-gray-500 text-sm max-w-xs">
                        Ainda não tens histórico para "{selectedExercise}"
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-full bg-gray-700/30 flex items-center justify-center mb-4">
                        <History className="w-10 h-10 text-gray-500" />
                      </div>
                      <p className="text-gray-400 text-lg mb-2">Seleciona um exercício</p>
                      <p className="text-gray-500 text-sm max-w-xs">
                        Escolhe um exercício no slide de registo para ver o histórico
                      </p>
                    </>
                  )}
                </div>
              )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Dots */}
      <div className="flex justify-center gap-2 pb-5">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              activeSlide === index
                ? "bg-primary w-6"
                : "bg-gray-600 w-1.5 hover:bg-gray-500"
            }`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
