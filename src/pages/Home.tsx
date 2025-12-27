import { useNavigate } from "react-router-dom";
import { MessageCircle, Play, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";

const weekDaysMap: Record<number, string> = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
};

const shortDays = ["D", "S", "T", "Q", "Q", "S", "S"];

// Exercise database by muscle group
const exercisesByGroup: Record<string, { name: string; duration: string; sets: string }[]> = {
  "Pernas": [
    { name: "Agachamento", duration: "12 min", sets: "4x12" },
    { name: "Leg Press", duration: "10 min", sets: "4x15" },
    { name: "Extensora", duration: "8 min", sets: "3x12" },
    { name: "Stiff", duration: "10 min", sets: "4x10" },
  ],
  "Peito": [
    { name: "Supino Reto", duration: "12 min", sets: "4x10" },
    { name: "Supino Inclinado", duration: "10 min", sets: "4x10" },
    { name: "Crucifixo", duration: "8 min", sets: "3x12" },
    { name: "Crossover", duration: "8 min", sets: "3x15" },
  ],
  "Costas": [
    { name: "Puxada Frontal", duration: "10 min", sets: "4x12" },
    { name: "Remada Curvada", duration: "12 min", sets: "4x10" },
    { name: "Remada Unilateral", duration: "10 min", sets: "3x12" },
    { name: "Pulldown", duration: "8 min", sets: "3x15" },
  ],
  "Ombros": [
    { name: "Desenvolvimento", duration: "12 min", sets: "4x10" },
    { name: "Elevação Lateral", duration: "8 min", sets: "4x15" },
    { name: "Elevação Frontal", duration: "8 min", sets: "3x12" },
    { name: "Face Pull", duration: "8 min", sets: "3x15" },
  ],
  "Braços": [
    { name: "Rosca Direta", duration: "10 min", sets: "4x12" },
    { name: "Tríceps Corda", duration: "8 min", sets: "4x15" },
    { name: "Rosca Martelo", duration: "8 min", sets: "3x12" },
    { name: "Tríceps Testa", duration: "10 min", sets: "3x10" },
  ],
  "Abdômen": [
    { name: "Prancha", duration: "8 min", sets: "3x45s" },
    { name: "Crunch", duration: "8 min", sets: "4x20" },
    { name: "Elevação de Pernas", duration: "8 min", sets: "3x15" },
    { name: "Russian Twist", duration: "6 min", sets: "3x20" },
  ],
  "Glúteos": [
    { name: "Hip Thrust", duration: "12 min", sets: "4x12" },
    { name: "Elevação Pélvica", duration: "8 min", sets: "4x15" },
    { name: "Abdução", duration: "8 min", sets: "3x15" },
    { name: "Kickback", duration: "8 min", sets: "3x12" },
  ],
};

const restDayTips = [
  { name: "Alongamento Geral", duration: "15 min", sets: "—" },
  { name: "Mobilidade Articular", duration: "10 min", sets: "—" },
  { name: "Caminhada Leve", duration: "20 min", sets: "—" },
];

const Home = () => {
  const navigate = useNavigate();
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean | null>>({});

  const { todayWorkout, weekSchedule, exercises, greeting } = useMemo(() => {
    const onboardingData = localStorage.getItem("liftmate_onboarding");
    const data = onboardingData ? JSON.parse(onboardingData) : { schedule: {} };
    
    const today = new Date();
    const todayName = weekDaysMap[today.getDay()];
    const workout = data.schedule?.[todayName] || null;

    // Get current week schedule
    const currentDayOfWeek = today.getDay();
    const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    
    const schedule = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() + mondayOffset + i);
      const dayIndex = date.getDay();
      const dayName = weekDaysMap[dayIndex];
      const dayWorkout = data.schedule?.[dayName] || null;
      schedule.push({
        shortDay: shortDays[dayIndex],
        fullDay: dayName,
        workout: dayWorkout,
        date: date.getDate(),
        isToday: date.toDateString() === today.toDateString(),
        hasWorkout: dayWorkout && dayWorkout !== "Descanso",
      });
    }

    // Get exercises for today
    const todayExercises = workout && workout !== "Descanso" 
      ? exercisesByGroup[workout] || []
      : restDayTips;

    // Greeting based on time
    const hour = today.getHours();
    let greet = "Bom dia";
    if (hour >= 12 && hour < 18) greet = "Boa tarde";
    else if (hour >= 18) greet = "Boa noite";

    return {
      todayWorkout: workout,
      weekSchedule: schedule,
      exercises: todayExercises,
      greeting: greet,
    };
  }, []);

  const isRestDay = !todayWorkout || todayWorkout === "Descanso";

  const handleExerciseAction = (exerciseName: string, completed: boolean) => {
    setCompletedExercises(prev => ({ ...prev, [exerciseName]: completed }));
    
    // Store for chat context
    const history = JSON.parse(localStorage.getItem("liftmate_exercise_log") || "[]");
    history.push({
      exercise: exerciseName,
      completed,
      date: new Date().toISOString(),
      workout: todayWorkout,
    });
    localStorage.setItem("liftmate_exercise_log", JSON.stringify(history));
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Minimal Header */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-6 pt-14 pb-2"
      >
        <p className="text-muted-foreground text-sm">{greeting}</p>
        <h1 className="text-3xl font-bold text-foreground mt-1">
          {isRestDay ? "Dia de Descanso" : todayWorkout}
        </h1>
      </motion.header>

      {/* Week Pills - Ultra Minimal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="px-6 py-6"
      >
        <div className="flex justify-between">
          {weekSchedule.map((item, index) => (
            <motion.div
              key={item.fullDay}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
              className="flex flex-col items-center gap-2"
            >
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {item.shortDay}
              </span>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                  item.isToday
                    ? "bg-foreground text-background"
                    : item.hasWorkout
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                <span className="text-sm font-medium">{item.date}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Main CTA - The Focus */}
      {!isRestDay && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-6 mb-6"
        >
          <button
            onClick={() => navigate("/chat")}
            className="w-full flex items-center justify-between bg-foreground text-background rounded-2xl p-5 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background/10">
                <Play className="h-5 w-5 fill-current" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Iniciar Treino</p>
                <p className="text-sm opacity-70">{exercises.length} exercícios</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 opacity-50" />
          </button>
        </motion.div>
      )}

      {/* Exercise List - Clean Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex-1 px-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {isRestDay ? "Sugestões para hoje" : "Exercícios sugeridos"}
          </h2>
        </div>

        <div className="space-y-2">
          <AnimatePresence>
            {exercises.map((exercise, index) => {
              const status = completedExercises[exercise.name];
              const isDone = status === true;
              const isSkipped = status === false;

              return (
                <motion.div
                  key={exercise.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className={`flex items-center justify-between py-4 border-b border-border last:border-0 ${
                    isDone ? "opacity-50" : isSkipped ? "opacity-30" : ""
                  }`}
                >
                  <div className="flex-1">
                    <p className={`font-medium text-foreground ${isDone ? "line-through" : ""}`}>
                      {exercise.name}
                    </p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">{exercise.duration}</span>
                      <span className="text-xs text-muted-foreground">{exercise.sets}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {status === undefined || status === null ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleExerciseAction(exercise.name, true)}
                        className="px-4 py-2 text-xs font-medium text-foreground bg-secondary rounded-full hover:bg-secondary/80 transition-colors"
                      >
                        Fiz ✓
                      </button>
                      <button
                        onClick={() => handleExerciseAction(exercise.name, false)}
                        className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Não fiz
                      </button>
                    </div>
                  ) : (
                    <span className={`text-xs font-medium ${isDone ? "text-foreground" : "text-muted-foreground"}`}>
                      {isDone ? "Feito ✓" : "Pulado"}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Bottom Spacer for FAB */}
      <div className="h-24" />

      {/* Chat FAB - Subtle */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        onClick={() => navigate("/chat")}
        className="fixed bottom-8 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background shadow-lg active:scale-95 transition-transform"
      >
        <MessageCircle className="h-5 w-5" />
      </motion.button>
    </div>
  );
};

export default Home;
