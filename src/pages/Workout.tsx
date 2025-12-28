import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Dumbbell, 
  Target,
  Zap,
  TrendingUp,
  Clock
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { getExercisesForGroups } from "@/data/exerciseDatabase";

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

const trainingTypeConfig: Record<TrainingType, { icon: typeof Zap; description: string; restTime: number }> = {
  "Força": { icon: Zap, description: "Cargas altas, poucas reps", restTime: 180 },
  "Hipertrofia": { icon: TrendingUp, description: "Volume moderado", restTime: 90 },
  "Resistência": { icon: Clock, description: "Mais reps, menos descanso", restTime: 45 },
};

const Workout = () => {
  const [trainingType, setTrainingType] = useState<TrainingType>("Hipertrofia");
  const [weight, setWeight] = useState("80");
  const [reps, setReps] = useState("10");
  const [sets, setSets] = useState("3");
  const [restTime, setRestTime] = useState("90");
  
  // Rest timer state
  const [isRestRunning, setIsRestRunning] = useState(false);
  const [restRemaining, setRestRemaining] = useState(90);

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

  // Update rest time when training type changes
  useEffect(() => {
    const newRestTime = trainingTypeConfig[trainingType].restTime;
    setRestTime(String(newRestTime));
    setRestRemaining(newRestTime);
  }, [trainingType]);

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

  const isRestDay = !todayWorkout || todayWorkout === "Descanso";

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Dumbbell className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {isRestDay ? "Dia de Descanso" : todayWorkout}
            </h1>
            <p className="text-sm text-muted-foreground">
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
          <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center mx-auto mb-6 border border-border/50">
            <Target className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Recuperação Ativa</h3>
          <p className="text-muted-foreground max-w-xs mx-auto">
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
            className="bg-card rounded-[20px] p-5 border border-border/30"
          >
            <span className="text-sm font-medium text-muted-foreground mb-4 block">
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
                        : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-border/50"
                    }`}
                  >
                    {type}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Exercise Registration Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-[20px] p-5 border border-border/30"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <span className="text-primary text-lg font-bold">+</span>
              </div>
              <h2 className="text-lg font-semibold text-foreground">Registar Exercício</h2>
            </div>

            {/* Exercise selector */}
            <div className="mb-4">
              <label className="text-sm text-muted-foreground mb-2 block">Nome do Exercício</label>
              <select className="w-full bg-muted/20 border border-border/50 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all">
                <option value="">Selecionar exercício...</option>
                {todayExercises.map((exercise) => (
                  <option key={exercise.name} value={exercise.name}>
                    {exercise.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Input Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Peso (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-muted/20 border border-border/50 rounded-xl px-4 py-3 text-foreground text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="80"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Repetições</label>
                <input
                  type="number"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  className="w-full bg-muted/20 border border-border/50 rounded-xl px-4 py-3 text-foreground text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="10"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Séries</label>
                <input
                  type="number"
                  value={sets}
                  onChange={(e) => setSets(e.target.value)}
                  className="w-full bg-muted/20 border border-border/50 rounded-xl px-4 py-3 text-foreground text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="3"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Descanso (seg)</label>
                <input
                  type="number"
                  value={restTime}
                  onChange={(e) => setRestTime(e.target.value)}
                  className="w-full bg-muted/20 border border-border/50 rounded-xl px-4 py-3 text-foreground text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="90"
                />
              </div>
            </div>
          </motion.div>

          {/* Rest Timer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-primary/10 via-primary/5 to-card rounded-[20px] p-6 border border-primary/20"
          >
            <span className="text-sm font-medium text-muted-foreground text-center block mb-4">
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
                  isRestRunning ? "text-primary" : "text-foreground"
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
                    ? "bg-destructive/90 text-destructive-foreground"
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
                className="w-14 h-14 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-all"
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
