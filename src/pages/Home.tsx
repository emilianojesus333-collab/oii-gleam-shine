import { useNavigate } from "react-router-dom";
import { MessageCircle, Flame, Dumbbell, Target, Timer, TrendingUp, Settings, RotateCcw, X } from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import gymBackground from "@/assets/gym-background.jpeg";
import { toast } from "sonner";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  const { scrollY } = useScroll();
  const imageY = useTransform(scrollY, [0, 300], [0, 100]);
  const imageScale = useTransform(scrollY, [0, 300], [1, 1.1]);
  const imageOpacity = useTransform(scrollY, [0, 200], [1, 0.3]);

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

  const handleResetOnboarding = () => {
    localStorage.removeItem("liftmate_onboarding");
    localStorage.removeItem("liftmate_onboarded");
    toast.success("Onboarding resetado!");
    navigate("/");
  };

  return (
    <div ref={containerRef} className="flex min-h-screen flex-col bg-black pb-24">
      {/* Hero Background Image with Parallax */}
      <div className="absolute inset-x-0 top-0 h-80 overflow-hidden">
        <motion.img 
          src={gymBackground} 
          alt="" 
          className="h-full w-full object-cover"
          style={{ 
            y: imageY, 
            scale: imageScale,
            opacity: imageOpacity 
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/70 to-black" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex items-center justify-between px-6 pt-12 pb-4"
      >
        <div className="flex items-center gap-2">
          <Dumbbell className="h-7 w-7 text-white" />
          <h1 className="text-2xl font-black text-white">LiftMate</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-[#1E1E1E]/90 backdrop-blur-sm px-4 py-2">
            <Flame className="h-5 w-5 text-blue-400" />
            <span className="font-bold text-white">7</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSettings(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1E1E1E]/90 backdrop-blur-sm"
          >
            <Settings className="h-5 w-5 text-white" />
          </motion.button>
        </div>
      </motion.header>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-t-3xl bg-card p-6 pb-10"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Configurações</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary"
                >
                  <X className="h-4 w-4 text-foreground" />
                </button>
              </div>
              
              <button
                onClick={handleResetOnboarding}
                className="flex w-full items-center gap-4 rounded-2xl bg-secondary p-4 transition-colors hover:bg-secondary/80"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                  <RotateCcw className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">Refazer onboarding</p>
                  <p className="text-sm text-muted-foreground">Redefine as tuas preferências de treino</p>
                </div>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <span className="text-xs text-gray-400 mb-2">{item.shortDay}</span>
              <div
                className={`flex h-11 w-11 items-center justify-center transition-all ${
                  item.isToday
                    ? "rounded-xl bg-[#1E1E1E]/90"
                    : item.workout && item.workout !== "Descanso"
                    ? "rounded-xl border border-dashed border-gray-500/40"
                    : ""
                }`}
              >
                <span className="text-lg font-semibold text-white">
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
          className="rounded-3xl bg-[#1E1E1E]/90 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-black text-white">
                {todayWorkout || "Descanso"}
              </p>
              <p className="text-gray-400 mt-1">
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
                  className="text-gray-700"
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
                  className="text-white transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Dumbbell className="h-8 w-8 text-white" />
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
          <div className="rounded-2xl bg-[#1E1E1E]/90 p-4">
            <p className="text-2xl font-black text-white">0</p>
            <p className="text-xs text-gray-400 mt-1">Séries feitas</p>
            <div className="mt-3 flex justify-center">
              <Target className="h-6 w-6 text-gray-500" />
            </div>
          </div>
          
          <div className="rounded-2xl bg-[#1E1E1E]/90 p-4">
            <p className="text-2xl font-black text-white">0</p>
            <p className="text-xs text-gray-400 mt-1">Reps totais</p>
            <div className="mt-3 flex justify-center">
              <Dumbbell className="h-6 w-6 text-gray-500" />
            </div>
          </div>
          
          <div className="rounded-2xl bg-[#1E1E1E]/90 p-4">
            <p className="text-2xl font-black text-white">0</p>
            <p className="text-xs text-gray-400 mt-1">Min treino</p>
            <div className="mt-3 flex justify-center">
              <Timer className="h-6 w-6 text-gray-500" />
            </div>
          </div>
        </motion.div>

        {/* Recent Workouts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-xl font-bold text-white mb-4">Próximos treinos</h3>
          
          <div className="space-y-3">
            {weekSchedule
              .filter(d => !d.isToday && d.workout && d.workout !== "Descanso")
              .slice(0, 3)
              .map((item) => (
                <div
                  key={item.fullDay}
                  className="flex items-center gap-4 rounded-2xl bg-[#1E1E1E]/90 p-4"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-700/50">
                    <Dumbbell className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{item.workout}</p>
                    <p className="text-sm text-gray-400">{item.fullDay}</p>
                  </div>
                </div>
              ))}

            {weekSchedule.filter(d => !d.isToday && d.workout && d.workout !== "Descanso").length === 0 && (
              <div className="rounded-2xl bg-[#1E1E1E]/90 p-6 text-center">
                <p className="text-gray-400">
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
