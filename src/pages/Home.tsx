import { useNavigate } from "react-router-dom";
import { MessageCircle, Flame, Dumbbell, Target, Timer, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";
import gymBackground from "@/assets/gym-background.jpeg";

const weekDaysMap: Record<number, string> = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
};

const shortDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const Home = () => {
  const navigate = useNavigate();

  const { todayWorkout, weekSchedule, todayIndex } = useMemo(() => {
    const onboardingData = localStorage.getItem("liftmate_onboarding");
    const data = onboardingData ? JSON.parse(onboardingData) : { schedule: {} };
    
    const today = new Date();
    const todayName = weekDaysMap[today.getDay()];
    const workout = data.schedule?.[todayName] || null;

    // Get current week schedule (Mon-Sun)
    const schedule = [];
    const currentDayOfWeek = today.getDay();
    const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    
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
      });
    }

    const todayIdx = schedule.findIndex(d => d.isToday);

    return {
      todayWorkout: workout,
      weekSchedule: schedule,
      todayIndex: todayIdx,
    };
  }, []);

  const workoutProgress = todayWorkout && todayWorkout !== "Descanso" ? 0 : 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (workoutProgress / 100) * circumference;

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      {/* Hero Background Image */}
      <div className="absolute inset-x-0 top-0 h-80 overflow-hidden">
        <img 
          src={gymBackground} 
          alt="" 
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex items-center justify-between px-6 pt-12 pb-4"
      >
        <div className="flex items-center gap-2">
          <Dumbbell className="h-7 w-7 text-foreground" />
          <h1 className="text-2xl font-black text-foreground">LiftMate</h1>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-card/80 backdrop-blur-sm px-4 py-2 shadow-sm">
          <Flame className="h-5 w-5 text-orange-500" />
          <span className="font-bold text-foreground">7</span>
        </div>
      </motion.header>

      {/* Week Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-10 px-6 py-4"
      >
        <div className="flex justify-between">
          {weekSchedule.map((item, index) => (
            <motion.div
              key={item.fullDay}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + index * 0.03 }}
              className="flex flex-col items-center"
            >
              <span className="text-xs text-muted-foreground mb-2">{item.shortDay}</span>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all ${
                  item.isToday
                    ? "bg-card shadow-md"
                    : item.workout && item.workout !== "Descanso"
                    ? "border-2 border-dashed border-muted-foreground/30"
                    : ""
                }`}
              >
                <span
                  className={`text-lg font-bold ${
                    item.isToday ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {item.date}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <main className="relative z-10 flex-1 px-6 space-y-5">
        {/* Main Workout Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl bg-card p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-black text-foreground">
                {todayWorkout || "Descanso"}
              </p>
              <p className="text-muted-foreground mt-1">
                {todayWorkout && todayWorkout !== "Descanso" 
                  ? "Treino de hoje" 
                  : "Dia de recuperação"}
              </p>
            </div>
            
            {/* Progress Ring */}
            <div className="relative">
              <svg className="h-24 w-24 -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-secondary"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="text-foreground transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Dumbbell className="h-8 w-8 text-foreground" />
              </div>
            </div>
          </div>

          {todayWorkout && todayWorkout !== "Descanso" && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/chat")}
              className="mt-6 w-full rounded-2xl bg-primary py-4 font-semibold text-primary-foreground transition-all hover:opacity-90"
            >
              Iniciar Treino
            </motion.button>
          )}
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="rounded-2xl bg-card p-4 shadow-sm">
            <p className="text-2xl font-black text-foreground">0</p>
            <p className="text-xs text-muted-foreground mt-1">Séries feitas</p>
            <div className="mt-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
              <Target className="h-6 w-6 text-rose-500" />
            </div>
          </div>
          
          <div className="rounded-2xl bg-card p-4 shadow-sm">
            <p className="text-2xl font-black text-foreground">0</p>
            <p className="text-xs text-muted-foreground mt-1">Reps totais</p>
            <div className="mt-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <TrendingUp className="h-6 w-6 text-amber-500" />
            </div>
          </div>
          
          <div className="rounded-2xl bg-card p-4 shadow-sm">
            <p className="text-2xl font-black text-foreground">0</p>
            <p className="text-xs text-muted-foreground mt-1">Min treino</p>
            <div className="mt-3 flex h-12 w-12 items-center justify-center rounded-full bg-sky-100">
              <Timer className="h-6 w-6 text-sky-500" />
            </div>
          </div>
        </motion.div>

        {/* Recent Workouts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-xl font-bold text-foreground mb-4">Próximos treinos</h3>
          
          <div className="space-y-3">
            {weekSchedule
              .filter(d => !d.isToday && d.workout && d.workout !== "Descanso")
              .slice(0, 3)
              .map((item) => (
                <div
                  key={item.fullDay}
                  className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                    <Dumbbell className="h-6 w-6 text-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{item.workout}</p>
                    <p className="text-sm text-muted-foreground">{item.fullDay}</p>
                  </div>
                </div>
              ))}

            {weekSchedule.filter(d => !d.isToday && d.workout && d.workout !== "Descanso").length === 0 && (
              <div className="rounded-2xl bg-card p-6 text-center shadow-sm">
                <p className="text-muted-foreground">
                  Nenhum treino agendado para esta semana
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* Chat FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        onClick={() => navigate("/chat")}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <MessageCircle className="h-6 w-6" />
      </motion.button>
    </div>
  );
};

export default Home;
