import { useNavigate } from "react-router-dom";
import { MessageCircle, Flame, Settings, RotateCcw, X, Brain, Target, Heart } from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import gymBackground from "@/assets/gym-background.jpeg";
import { toast } from "sonner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
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
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };

    carouselApi.on("select", onSelect);
    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);
  
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
          <h1 className="text-2xl font-black text-white/70">LiftMate</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-[#1E1E1E]/50 backdrop-blur-sm px-4 py-2">
            <Flame className="h-5 w-5 text-blue-400" />
            <span className="font-bold text-white/70">7</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSettings(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1E1E1E]/50 backdrop-blur-sm"
          >
            <Settings className="h-5 w-5 text-white/70" />
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
              <span className="text-xs text-gray-400/70 mb-2">{item.shortDay}</span>
              <div
                className={`flex h-11 w-11 items-center justify-center transition-all ${
                  item.isToday
                    ? "rounded-xl bg-[#1E1E1E]/50"
                    : item.workout && item.workout !== "Descanso"
                    ? "rounded-xl border border-dashed border-gray-500/40"
                    : ""
                }`}
              >
                <span className="text-lg font-semibold text-white/70">
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
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            delay: 0.2, 
            duration: 0.5,
            type: "spring",
            stiffness: 100,
            damping: 15
          }}
          whileHover={{ scale: 1.02 }}
          className="rounded-3xl bg-[#1E1E1E]/50 p-6"
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="text-center"
          >
            <p className="text-4xl font-black text-white/70">
              {todayWorkout || "Descanso"}
            </p>
            <p className="text-gray-400/70 mt-1">
              {todayWorkout && todayWorkout !== "Descanso" 
                ? "Treino de hoje" 
                : "Dia de recuperação"}
            </p>
          </motion.div>

          {todayWorkout && todayWorkout !== "Descanso" && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate("/chat")}
              className="mt-6 w-full rounded-2xl bg-primary py-4 font-semibold text-primary-foreground transition-all hover:opacity-90"
            >
              Iniciar Treino
            </motion.button>
          )}
        </motion.div>

        {/* Stats Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Carousel className="w-full" setApi={setCarouselApi}>
            <CarouselContent>
              {/* State 1: Stats */}
              <CarouselItem>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "0", label: "Séries feitas" },
                    { value: "0", label: "Reps totais" },
                    { value: "0", label: "Min treino" },
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 30, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        delay: 0.3 + index * 0.1,
                        duration: 0.4,
                        type: "spring",
                        stiffness: 120,
                        damping: 12
                      }}
                      className="rounded-2xl bg-[#1E1E1E]/50 p-4"
                    >
                      <p className="text-2xl font-black text-white/70">
                        {stat.value}
                      </p>
                      <p className="text-xs text-gray-400/70 mt-1">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>
              </CarouselItem>

              {/* State 2: AI Suggestions */}
              <CarouselItem>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: Brain, title: "Barra em V", label: "Treino Sugerido" },
                    { icon: Target, title: "Contração", label: "Foco" },
                    { icon: Heart, title: "90s descanso", label: "Recovery Coach" },
                  ].map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 30, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        delay: 0.3 + index * 0.1,
                        duration: 0.4,
                        type: "spring",
                        stiffness: 120,
                        damping: 12
                      }}
                      className="rounded-2xl bg-[#1E1E1E]/50 p-4"
                    >
                      <item.icon className="h-5 w-5 text-primary mb-2" />
                      <p className="text-sm font-bold text-white/70 leading-tight">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-400/70 mt-1">{item.label}</p>
                    </motion.div>
                  ))}
                </div>
              </CarouselItem>
            </CarouselContent>
          </Carousel>
          
          {/* Carousel Indicators */}
          <div className="flex justify-center gap-2 mt-3">
            <button 
              onClick={() => carouselApi?.scrollTo(0)}
              className={`h-1.5 w-6 rounded-full transition-colors ${currentSlide === 0 ? 'bg-primary/60' : 'bg-white/20'}`} 
            />
            <button 
              onClick={() => carouselApi?.scrollTo(1)}
              className={`h-1.5 w-6 rounded-full transition-colors ${currentSlide === 1 ? 'bg-primary/60' : 'bg-white/20'}`} 
            />
          </div>
        </motion.div>

        {/* Recent Workouts Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.h3 
            className="text-xl font-bold text-white/70 mb-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.55 }}
          >
            Próximos treinos
          </motion.h3>
          
          <div className="space-y-3">
            {weekSchedule
              .filter(d => !d.isToday && d.workout && d.workout !== "Descanso")
              .slice(0, 3)
              .map((item, index) => (
                <motion.div
                  key={item.fullDay}
                  initial={{ opacity: 0, x: -40, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ 
                    delay: 0.6 + index * 0.1,
                    duration: 0.4,
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                  }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  className="flex items-center gap-4 rounded-2xl bg-[#1E1E1E]/50 p-4"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-white/70">{item.workout}</p>
                    <p className="text-sm text-gray-400/70">{item.fullDay}</p>
                  </div>
                </motion.div>
              ))}

            {weekSchedule.filter(d => !d.isToday && d.workout && d.workout !== "Descanso").length === 0 && (
              <motion.div 
                className="rounded-2xl bg-[#1E1E1E]/50 p-6 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, type: "spring" }}
              >
                <p className="text-gray-400/70">
                  Nenhum treino agendado para esta semana
                </p>
              </motion.div>
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
