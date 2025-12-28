import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Timer, Dumbbell, Target, Flame, ChevronRight, Check } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { getExercisesForGroups, type Exercise } from "@/data/exerciseDatabase";

const weekDaysMap: Record<number, string> = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
};

const Workout = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("liftmate_completed_exercises");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.date === new Date().toDateString()) {
          return new Set(parsed.exercises);
        }
      } catch (e) {
        console.error("Error parsing completed exercises:", e);
      }
    }
    return new Set();
  });

  // Get user data
  const userData = useMemo(() => {
    const saved = localStorage.getItem("liftmate_user_data");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  }, []);

  // Get today's workout
  const todayWorkout = useMemo(() => {
    if (!userData?.calendar) return null;
    const today = new Date().getDay();
    const dayName = weekDaysMap[today];
    return userData.calendar[dayName] || null;
  }, [userData]);

  // Get exercises for today
  const todayExercises = useMemo(() => {
    if (!todayWorkout || todayWorkout === "Descanso") return [];
    const muscleGroups = todayWorkout.split(" + ");
    return getExercisesForGroups(muscleGroups);
  }, [todayWorkout]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleExercise = (exerciseName: string) => {
    setCompletedExercises((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseName)) {
        newSet.delete(exerciseName);
      } else {
        newSet.add(exerciseName);
      }
      const toSave = {
        date: new Date().toDateString(),
        exercises: Array.from(newSet),
        workout: todayWorkout,
      };
      localStorage.setItem("liftmate_completed_exercises", JSON.stringify(toSave));
      return newSet;
    });
  };

  const completionRate = todayExercises.length > 0
    ? Math.round((completedExercises.size / todayExercises.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-background px-6 pt-12 pb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-3xl font-bold text-foreground">Treino de Hoje</h1>
          <p className="text-muted-foreground">
            {todayWorkout || "Sem treino definido"}
          </p>
        </motion.div>

        {/* Timer Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-6 bg-card/80 backdrop-blur-sm rounded-3xl p-6 border border-border/50"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Cronómetro</span>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">{completionRate}% concluído</span>
            </div>
          </div>

          {/* Timer Display */}
          <div className="text-center py-4">
            <motion.span
              key={elapsedTime}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              className="text-6xl font-mono font-bold text-foreground tracking-tight"
            >
              {formatTime(elapsedTime)}
            </motion.span>
          </div>

          {/* Timer Controls */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setElapsedTime(0)}
              className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsRunning(!isRunning)}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                isRunning
                  ? "bg-red-500 text-white shadow-red-500/30"
                  : "bg-primary text-primary-foreground shadow-primary/30"
              }`}
            >
              {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
            </motion.button>
            <div className="w-14 h-14" /> {/* Spacer for symmetry */}
          </div>
        </motion.div>
      </div>

      {/* Exercise List */}
      <div className="px-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Exercícios</h2>
          <span className="text-sm text-muted-foreground">
            {completedExercises.size}/{todayExercises.length}
          </span>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {todayExercises.length > 0 ? (
              todayExercises.map((exercise, index) => {
                const isCompleted = completedExercises.has(exercise.name);
                return (
                  <motion.button
                    key={exercise.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => toggleExercise(exercise.name)}
                    className={`w-full p-4 rounded-2xl border transition-all text-left ${
                      isCompleted
                        ? "bg-primary/10 border-primary/30"
                        : "bg-card border-border/50 hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                          isCompleted ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-6 h-6" />
                        ) : (
                          <Dumbbell className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3
                          className={`font-medium ${
                            isCompleted ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {exercise.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {exercise.focus}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            isCompleted
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {exercise.focus}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </motion.button>
                );
              })
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-foreground mb-1">Dia de Descanso</h3>
                <p className="text-sm text-muted-foreground">
                  Aproveita para recuperar e voltar mais forte!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Workout;
