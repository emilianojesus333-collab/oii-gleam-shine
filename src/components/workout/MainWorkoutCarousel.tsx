import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Dumbbell, TrendingUp, Save, Check, ChevronLeft, ChevronRight, Calculator, Zap, Target, Activity, BookmarkPlus, TrendingDown, User } from "lucide-react";
import { useOneRMRecords } from "@/hooks/useOneRMRecords";
import { useNavigate } from "react-router-dom";
import { OneRMProgressChart } from "./OneRMProgressChart";
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

// 1RM Calculation Formulas
const calculate1RM = (weight: number, reps: number) => {
  if (weight <= 0 || reps <= 0) return null;
  
  // Multiple scientific formulas for accuracy
  const epley = weight * (1 + reps / 30);
  const brzycki = weight / (1.0278 - 0.0278 * reps);
  const lander = (100 * weight) / (101.3 - 2.67123 * reps);
  const lombardi = weight * Math.pow(reps, 0.1);
  const oconner = weight * (1 + reps * 0.025);
  
  // Average of formulas for higher accuracy
  const average = (epley + brzycki + lander + lombardi + oconner) / 5;
  
  return {
    average: Math.round(average),
    epley: Math.round(epley),
    brzycki: Math.round(brzycki),
    lander: Math.round(lander),
    lombardi: Math.round(lombardi),
    oconner: Math.round(oconner),
  };
};

// Training zones based on 1RM percentage
const getTrainingZones = (oneRM: number) => ({
  strength: { min: Math.round(oneRM * 0.85), max: Math.round(oneRM * 0.95), reps: "1-5" },
  hypertrophy: { min: Math.round(oneRM * 0.65), max: Math.round(oneRM * 0.85), reps: "6-12" },
  endurance: { min: Math.round(oneRM * 0.50), max: Math.round(oneRM * 0.65), reps: "12-20" },
});

// XRM projections
const getXRMProjections = (oneRM: number) => ({
  "3RM": Math.round(oneRM * 0.93),
  "5RM": Math.round(oneRM * 0.87),
  "8RM": Math.round(oneRM * 0.80),
  "10RM": Math.round(oneRM * 0.75),
  "12RM": Math.round(oneRM * 0.70),
});

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
  
  const navigate = useNavigate();
  const { saveRecord, getProgressData, isAuthenticated, fetchRecords, records } = useOneRMRecords();
  
  // 1RM Calculator state (independent from registration)
  const [calcExercise, setCalcExercise] = useState("");
  const [calcWeight, setCalcWeight] = useState("");
  const [calcReps, setCalcReps] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [savingRM, setSavingRM] = useState(false);
  const [savedRM, setSavedRM] = useState(false);

  // Fetch records when exercise changes
  useEffect(() => {
    if (calcExercise) {
      fetchRecords(calcExercise);
    }
  }, [calcExercise]);

  // Calculate 1RM for the calculator slide
  const calculatedRM = useMemo(() => {
    const w = parseFloat(calcWeight) || 0;
    const r = parseInt(calcReps) || 0;
    return calculate1RM(w, r);
  }, [calcWeight, calcReps]);

  const trainingZones = useMemo(() => {
    if (calculatedRM) {
      return getTrainingZones(calculatedRM.average);
    }
    return null;
  }, [calculatedRM]);

  const xrmProjections = useMemo(() => {
    if (calculatedRM) {
      return getXRMProjections(calculatedRM.average);
    }
    return null;
  }, [calculatedRM]);

  const handleCalculate = () => {
    if (calcWeight && calcReps) {
      setShowResults(true);
    }
  };

  const resetCalculator = () => {
    setShowResults(false);
    setCalcExercise("");
    setCalcWeight("");
    setCalcReps("");
    setSavedRM(false);
  };

  const handleSaveRM = async () => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    
    if (!calcExercise || !calculatedRM) return;
    
    setSavingRM(true);
    const success = await saveRecord(
      calcExercise,
      parseFloat(calcWeight),
      parseInt(calcReps),
      calculatedRM.average
    );
    setSavingRM(false);
    
    if (success) {
      setSavedRM(true);
    }
  };

  // Get progress data for current exercise
  const progressData = useMemo(() => {
    if (calcExercise && showResults) {
      return getProgressData(calcExercise);
    }
    return null;
  }, [calcExercise, showResults, getProgressData]);

  const slides = [
    { id: "register", icon: Dumbbell, title: "Registar Exercício" },
    { id: "1rm", icon: Calculator, title: "Calculadora 1RM" },
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
                <div className="space-y-4">
                  {!showResults ? (
                    <>
                      {/* Input Form */}
                      <div className="text-center mb-4">
                        <p className="text-gray-400 text-sm">Insere os dados do teu melhor set para calcular o 1RM</p>
                      </div>

                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Exercício</label>
                        <input
                          type="text"
                          list="calc-exercise-options"
                          value={calcExercise}
                          onChange={(e) => setCalcExercise(e.target.value)}
                          placeholder="Ex: Supino Reto, Agachamento..."
                          className="w-full bg-[#2A2A2A]/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                        <datalist id="calc-exercise-options">
                          {todayExercises.map((exercise) => (
                            <option key={exercise.name} value={exercise.name} />
                          ))}
                        </datalist>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">Peso levantado (kg)</label>
                          <input
                            type="number"
                            value={calcWeight}
                            onChange={(e) => setCalcWeight(e.target.value)}
                            placeholder="80"
                            className="w-full bg-[#2A2A2A]/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">Repetições feitas</label>
                          <input
                            type="number"
                            value={calcReps}
                            onChange={(e) => setCalcReps(e.target.value)}
                            placeholder="8"
                            className="w-full bg-[#2A2A2A]/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                          />
                        </div>
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCalculate}
                        disabled={!calcWeight || !calcReps}
                        className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                          calcWeight && calcReps
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                            : "bg-[#2A2A2A]/50 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        <Calculator className="w-5 h-5" />
                        Calcular 1RM
                      </motion.button>
                    </>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-4"
                    >
                      {/* Results Header */}
                      <div className="text-center">
                        {calcExercise && (
                          <p className="text-primary text-sm font-medium mb-1">{calcExercise}</p>
                        )}
                        <p className="text-gray-400 text-xs mb-2">
                          Baseado em {calcWeight}kg × {calcReps} reps
                        </p>
                        <motion.p
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className="text-5xl font-bold text-white"
                        >
                          {calculatedRM?.average}
                          <span className="text-xl text-gray-400 ml-1">kg</span>
                        </motion.p>
                        <p className="text-xs text-gray-500 mt-1">Média de 5 fórmulas científicas</p>
                      </div>

                      {/* Training Zones */}
                      <div className="bg-[#2A2A2A]/40 rounded-xl p-3">
                        <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                          <Target className="w-3 h-3" /> Zonas de Treino
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Zap className="w-3 h-3 text-red-400" />
                              <span className="text-xs text-gray-300">Força (85-95%)</span>
                            </div>
                            <span className="text-xs font-semibold text-red-400">
                              {trainingZones?.strength.min}-{trainingZones?.strength.max}kg
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-3 h-3 text-primary" />
                              <span className="text-xs text-gray-300">Hipertrofia (65-85%)</span>
                            </div>
                            <span className="text-xs font-semibold text-primary">
                              {trainingZones?.hypertrophy.min}-{trainingZones?.hypertrophy.max}kg
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Activity className="w-3 h-3 text-green-400" />
                              <span className="text-xs text-gray-300">Resistência (50-65%)</span>
                            </div>
                            <span className="text-xs font-semibold text-green-400">
                              {trainingZones?.endurance.min}-{trainingZones?.endurance.max}kg
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* XRM Projections */}
                      <div className="bg-[#2A2A2A]/40 rounded-xl p-3">
                        <p className="text-xs text-gray-400 mb-2">Projeções XRM</p>
                        <div className="grid grid-cols-5 gap-1">
                          {xrmProjections && Object.entries(xrmProjections).map(([key, value]) => (
                            <div key={key} className="text-center bg-[#1E1E1E]/50 rounded-lg py-2">
                              <p className="text-[10px] text-gray-500">{key}</p>
                              <p className="text-xs font-bold text-white">{value}kg</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Progress Chart */}
                      {calcExercise && isAuthenticated && (
                        <OneRMProgressChart 
                          records={records} 
                          exerciseName={calcExercise} 
                        />
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={handleSaveRM}
                          disabled={savingRM || savedRM || !calcExercise}
                          className={`flex-1 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                            savedRM
                              ? "bg-green-500 text-white"
                              : !calcExercise
                              ? "bg-[#2A2A2A]/50 text-gray-600 cursor-not-allowed"
                              : "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                          }`}
                        >
                          {savingRM ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : savedRM ? (
                            <>
                              <Check className="w-4 h-4" />
                              Guardado!
                            </>
                          ) : !isAuthenticated ? (
                            <>
                              <User className="w-4 h-4" />
                              Login para guardar
                            </>
                          ) : (
                            <>
                              <BookmarkPlus className="w-4 h-4" />
                              Guardar 1RM
                            </>
                          )}
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={resetCalculator}
                          className="px-4 py-3 rounded-xl font-medium text-sm bg-[#2A2A2A]/50 text-gray-400 hover:bg-[#2A2A2A]/80 transition-all"
                        >
                          Novo
                        </motion.button>
                      </div>
                    </motion.div>
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
