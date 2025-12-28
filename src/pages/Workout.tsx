import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Dumbbell, 
  Target,
  Zap,
  TrendingUp,
  Clock,
  Save,
  Check
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { getExercisesForGroups } from "@/data/exerciseDatabase";
import { getWorkoutHistory, type ExerciseLog } from "@/data/workoutHistory";
import { toast } from "sonner";
import { MainWorkoutCarousel } from "@/components/workout/MainWorkoutCarousel";

const weekDaysMap: Record<number, string> = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
};

type TrainingType = "Força" | "Hipertrofia" | "Resistência";

const trainingTypeConfig: Record<TrainingType, { icon: typeof Zap; description: string }> = {
  "Força": { icon: Zap, description: "Cargas altas, poucas reps" },
  "Hipertrofia": { icon: TrendingUp, description: "Volume moderado" },
  "Resistência": { icon: Clock, description: "Mais reps, menos descanso" },
};

// Calculate rest time based on exercise parameters with breakdown
const calculateRestTime = (weight: number, reps: number, sets: number): { total: number; breakdown: RestBreakdown } => {
  const breakdown: RestBreakdown = {
    base: 60,
    weightBonus: 0,
    repsAdjustment: 0,
    setsBonus: 0,
    repsCategory: "Hipertrofia",
  };
  
  // Higher weight = more rest (every 10kg adds 10 seconds)
  breakdown.weightBonus = Math.floor(weight / 10) * 10;
  
  // Lower reps = more rest (strength training needs more recovery)
  if (reps <= 5) {
    breakdown.repsAdjustment = 60;
    breakdown.repsCategory = "Força máxima";
  } else if (reps <= 8) {
    breakdown.repsAdjustment = 30;
    breakdown.repsCategory = "Força/Hipertrofia";
  } else if (reps <= 12) {
    breakdown.repsAdjustment = 0;
    breakdown.repsCategory = "Hipertrofia";
  } else {
    breakdown.repsAdjustment = -15;
    breakdown.repsCategory = "Resistência";
  }
  
  // More sets = slightly more rest
  if (sets >= 4) {
    breakdown.setsBonus = 15;
  }
  
  const total = breakdown.base + breakdown.weightBonus + breakdown.repsAdjustment + breakdown.setsBonus;
  
  // Clamp between 30 seconds and 5 minutes
  return { 
    total: Math.max(30, Math.min(300, total)),
    breakdown 
  };
};

interface RestBreakdown {
  base: number;
  weightBonus: number;
  repsAdjustment: number;
  setsBonus: number;
  repsCategory: string;
}

const Workout = () => {
  const [trainingType, setTrainingType] = useState<TrainingType>("Hipertrofia");
  const [selectedExercise, setSelectedExercise] = useState("");
  const [weight, setWeight] = useState("30");
  const [reps, setReps] = useState("7");
  const [sets, setSets] = useState("3");
  const [restTime, setRestTime] = useState("90");
  const [restBreakdown, setRestBreakdown] = useState<RestBreakdown>({
    base: 60,
    weightBonus: 30,
    repsAdjustment: 30,
    setsBonus: 0,
    repsCategory: "Força/Hipertrofia",
  });
  
  // Rest timer state
  const [isRestRunning, setIsRestRunning] = useState(false);
  const [restRemaining, setRestRemaining] = useState(90);
  
  // Saved exercises state
  const [savedExercises, setSavedExercises] = useState<ExerciseLog[]>([]);
  const [justSaved, setJustSaved] = useState(false);
  
  // Load today's saved exercises on mount
  useEffect(() => {
    const history = getWorkoutHistory();
    const today = new Date().toISOString().split("T")[0];
    const todaySession = history.sessions.find(s => s.date === today);
    if (todaySession?.exerciseLogs) {
      setSavedExercises(todaySession.exerciseLogs);
    }
  }, []);

  // Get today's workout from the same source as Home.tsx
  const todayWorkout = useMemo(() => {
    const onboardingData = localStorage.getItem("liftmate_onboarding");
    const data = onboardingData ? JSON.parse(onboardingData) : { schedule: {} };
    
    const today = new Date();
    const todayName = weekDaysMap[today.getDay()];
    const muscleGroups = data.schedule?.[todayName] || null;
    
    // Format workout display (join muscle groups)
    return muscleGroups 
      ? (Array.isArray(muscleGroups) ? muscleGroups.join(" + ") : muscleGroups)
      : null;
  }, []);

  // Get exercises for today
  const todayExercises = useMemo(() => {
    if (!todayWorkout || todayWorkout === "Descanso") return [];
    const muscleGroups = todayWorkout.split(" + ");
    return getExercisesForGroups(muscleGroups);
  }, [todayWorkout]);

  // Auto-calculate rest time when exercise parameters change
  useEffect(() => {
    const weightNum = parseInt(weight) || 0;
    const repsNum = parseInt(reps) || 0;
    const setsNum = parseInt(sets) || 0;
    
    if (weightNum > 0 && repsNum > 0 && setsNum > 0) {
      const { total, breakdown } = calculateRestTime(weightNum, repsNum, setsNum);
      setRestTime(String(total));
      setRestBreakdown(breakdown);
      if (!isRestRunning) {
        setRestRemaining(total);
      }
    }
  }, [weight, reps, sets, isRestRunning]);

  // Rest timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRestRunning && restRemaining > 0) {
      interval = setInterval(() => {
        setRestRemaining((prev) => {
          if (prev <= 1) {
            setIsRestRunning(false);
            return parseInt(restTime);
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRestRunning, restRemaining, restTime]);

  const formatRestTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const startRestTimer = () => {
    setRestRemaining(parseInt(restTime));
    setIsRestRunning(true);
  };

  const resetRestTimer = () => {
    setIsRestRunning(false);
    setRestRemaining(parseInt(restTime));
  };

  const saveExercise = () => {
    if (!selectedExercise.trim()) {
      toast.error("Seleciona um exercício primeiro");
      return;
    }
    
    const newLog: ExerciseLog = {
      name: selectedExercise,
      weight: parseInt(weight) || 0,
      reps: parseInt(reps) || 0,
      sets: parseInt(sets) || 0,
      restTime: parseInt(restTime) || 0,
      timestamp: Date.now(),
    };
    
    // Update local state
    const updatedExercises = [...savedExercises, newLog];
    setSavedExercises(updatedExercises);
    
    // Save to localStorage
    const history = getWorkoutHistory();
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];
    
    const existingIndex = history.sessions.findIndex(s => s.date === dateStr);
    
    if (existingIndex >= 0) {
      history.sessions[existingIndex].exerciseLogs = updatedExercises;
      history.sessions[existingIndex].exercisesCompleted = updatedExercises.map(e => e.name);
      history.sessions[existingIndex].timestamp = Date.now();
    } else {
      const muscleGroups = todayWorkout?.split(" + ") || [];
      history.sessions.push({
        date: dateStr,
        dayOfWeek: weekDaysMap[today.getDay()],
        muscleGroups,
        exercisesCompleted: [selectedExercise],
        exerciseLogs: updatedExercises,
        totalExercises: todayExercises.length,
        completionRate: Math.round((updatedExercises.length / todayExercises.length) * 100),
        timestamp: Date.now(),
      });
    }
    
    history.lastUpdated = Date.now();
    localStorage.setItem("liftmate_workout_history", JSON.stringify(history));
    
    // Show feedback
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
    toast.success(`${selectedExercise} guardado!`);
    
    // Clear form for next exercise
    setSelectedExercise("");
  };

  const isRestDay = !todayWorkout || todayWorkout === "Descanso";

  return (
    <div className="min-h-screen bg-black pb-32">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#1E1E1E]/50 flex items-center justify-center">
            <Dumbbell className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white/70">
              {isRestDay ? "Dia de Descanso" : todayWorkout}
            </h1>
            <p className="text-sm text-gray-400/70">
              {weekDaysMap[new Date().getDay()]}
            </p>
          </div>
        </motion.div>
      </div>

      {isRestDay ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-5 py-12 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-[#1E1E1E]/50 flex items-center justify-center mx-auto mb-6">
            <Target className="w-10 h-10 text-gray-400/70" />
          </div>
          <h3 className="text-xl font-semibold text-white/70 mb-2">Recuperação Ativa</h3>
          <p className="text-gray-400/70 max-w-xs mx-auto">
            O descanso é tão importante quanto o treino. Aproveita para recuperar!
          </p>
        </motion.div>
      ) : (
        <div className="px-5 space-y-5">
          {/* Training Type Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#1E1E1E]/50 rounded-[20px] p-5"
          >
            <span className="text-sm font-medium text-gray-400/70 mb-4 block">
              Tipo de Treino
            </span>
            <div className="flex gap-2">
              {(Object.keys(trainingTypeConfig) as TrainingType[]).map((type) => {
                const isSelected = trainingType === type;
                return (
                  <motion.button
                    key={type}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setTrainingType(type)}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                        : "bg-[#2A2A2A]/50 text-gray-400/70 hover:bg-[#2A2A2A]/80"
                    }`}
                  >
                    {type}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Main Carousel Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1E1E1E]/50 rounded-[20px] overflow-hidden"
          >
            <MainWorkoutCarousel
              selectedExercise={selectedExercise}
              setSelectedExercise={setSelectedExercise}
              weight={weight}
              setWeight={setWeight}
              reps={reps}
              setReps={setReps}
              sets={sets}
              setSets={setSets}
              restTime={restTime}
              setRestTime={setRestTime}
              todayExercises={todayExercises}
              saveExercise={saveExercise}
              justSaved={justSaved}
            />
          </motion.div>

          {/* Saved Exercises Today */}
          {savedExercises.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-[#1E1E1E]/50 rounded-[20px] p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-400/70">Exercícios Guardados Hoje</span>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">
                  {savedExercises.length}
                </span>
              </div>
              
              <div className="space-y-2">
                {savedExercises.map((exercise, index) => (
                  <motion.div
                    key={exercise.timestamp}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between bg-[#2A2A2A]/50 rounded-xl px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-white/70">{exercise.name}</p>
                      <p className="text-xs text-gray-400/70">
                        {new Date(exercise.timestamp).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-primary">{exercise.weight}kg</p>
                      <p className="text-xs text-gray-400/70">{exercise.sets}x{exercise.reps}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Rest Time Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#1E1E1E]/50 rounded-[20px] p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-400/70">Cálculo do Descanso</span>
              <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">
                {restBreakdown.repsCategory}
              </span>
            </div>
            
            <div className="space-y-3">
              {/* Base time */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-500" />
                  <span className="text-sm text-gray-400/70">Tempo base</span>
                </div>
                <span className="text-sm font-medium text-white/70">{restBreakdown.base}s</span>
              </div>
              
              {/* Weight bonus */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm text-gray-400/70">Peso ({weight}kg)</span>
                </div>
                <span className={`text-sm font-medium ${restBreakdown.weightBonus > 0 ? "text-primary" : "text-gray-400/70"}`}>
                  +{restBreakdown.weightBonus}s
                </span>
              </div>
              
              {/* Reps adjustment */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${restBreakdown.repsAdjustment >= 0 ? "bg-amber-500" : "bg-green-500"}`} />
                  <span className="text-sm text-gray-400/70">Repetições ({reps})</span>
                </div>
                <span className={`text-sm font-medium ${restBreakdown.repsAdjustment > 0 ? "text-amber-500" : restBreakdown.repsAdjustment < 0 ? "text-green-500" : "text-gray-400/70"}`}>
                  {restBreakdown.repsAdjustment >= 0 ? "+" : ""}{restBreakdown.repsAdjustment}s
                </span>
              </div>
              
              {/* Sets bonus */}
              {restBreakdown.setsBonus > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-sm text-gray-400/70">Séries altas ({sets})</span>
                  </div>
                  <span className="text-sm font-medium text-blue-400">+{restBreakdown.setsBonus}s</span>
                </div>
              )}
              
              {/* Divider */}
              <div className="border-t border-gray-700/50 my-2" />
              
              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white/70">Total recomendado</span>
                <span className="text-lg font-bold text-primary">{restTime}s</span>
              </div>
            </div>
          </motion.div>

          {/* Rest Timer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-primary/10 via-[#1E1E1E]/50 to-[#1E1E1E]/50 rounded-[20px] p-6 border border-primary/20"
          >
            <span className="text-sm font-medium text-gray-400/70 text-center block mb-4">
              Timer de Descanso
            </span>
            
            {/* Timer Display */}
            <motion.div
              key={restRemaining}
              initial={{ scale: 1.02 }}
              animate={{ scale: 1 }}
              className="text-center mb-6"
            >
              <span 
                className={`text-7xl font-mono font-bold tracking-tight ${
                  isRestRunning ? "text-primary" : "text-white/70"
                }`}
              >
                {formatRestTime(restRemaining)}
              </span>
            </motion.div>

            {/* Timer Controls */}
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={isRestRunning ? () => setIsRestRunning(false) : startRestTimer}
                className={`flex-1 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                  isRestRunning
                    ? "bg-red-500/90 text-white"
                    : "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                }`}
              >
                {isRestRunning ? (
                  <>
                    <Pause className="w-5 h-5" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Iniciar Descanso
                  </>
                )}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={resetRestTimer}
                className="w-14 h-14 rounded-xl bg-[#2A2A2A]/50 flex items-center justify-center text-gray-400/70 hover:bg-[#2A2A2A]/80 transition-all"
              >
                <RotateCcw className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Workout;
