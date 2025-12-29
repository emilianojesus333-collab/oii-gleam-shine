import { useNavigate } from "react-router-dom";
import { MessageCircle, Flame, Settings, RotateCcw, X, Brain, Target, Heart, Dumbbell, ChevronRight, Check, Trophy } from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import gymBackground from "@/assets/gym-background.jpeg";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getSuggestedExercise, getRecoverySuggestion, getExercisesForGroups, type Exercise } from "@/data/exerciseDatabase";
import { saveWorkoutSession, getTodayStats } from "@/data/workoutHistory";
import { BottomNav } from "@/components/BottomNav";
import { FavoritesWidget } from "@/components/home/FavoritesWidget";
import { AIInsightsWidget } from "@/components/home/AIInsightsWidget";
import { NameAIBanner } from "@/components/home/NameAIBanner";

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
  const [showExercises, setShowExercises] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(() => {
    // Load from localStorage on init
    const saved = localStorage.getItem("liftmate_completed_exercises");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Check if it's from today
        if (parsed.date === new Date().toDateString()) {
          return new Set(parsed.exercises);
        }
      } catch (e) {
        console.error("Error parsing completed exercises:", e);
      }
    }
    return new Set();
  });
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Celebration function
  const triggerCelebration = useCallback(() => {
    // Fire confetti from both sides
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: colors
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());

    // Show success toast
    toast.success("Treino completo! 💪", {
      description: "Parabéns, completaste todos os exercícios de hoje!",
      duration: 5000,
    });
  }, []);

  const toggleExerciseComplete = (exerciseName: string) => {
    setCompletedExercises(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseName)) {
        newSet.delete(exerciseName);
      } else {
        newSet.add(exerciseName);
      }
      
      // Save to localStorage with today's date
      const toSave = {
        date: new Date().toDateString(),
        exercises: Array.from(newSet),
        workout: todayWorkout,
        muscleGroups: todayMuscleGroups,
      };
      localStorage.setItem("liftmate_completed_exercises", JSON.stringify(toSave));
      
      // Also save to workout history for long-term tracking
      const today = new Date();
      const totalExercises = aiSuggestions.allExercises.length;
      saveWorkoutSession({
        date: today.toISOString().split("T")[0],
        dayOfWeek: weekDaysMap[today.getDay()],
        muscleGroups: todayMuscleGroups || [],
        exercisesCompleted: Array.from(newSet),
        exerciseLogs: [],
        totalExercises: totalExercises,
        completionRate: totalExercises > 0 ? Math.round((newSet.size / totalExercises) * 100) : 0,
      });

      // Trigger celebration when all exercises are completed
      if (newSet.size === totalExercises && totalExercises > 0 && !prev.has(exerciseName)) {
        setTimeout(() => triggerCelebration(), 300);
      }
      
      return newSet;
    });
  };

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

  const { todayWorkout, todayMuscleGroups, weekSchedule, aiSuggestions } = useMemo(() => {
    const onboardingData = localStorage.getItem("liftmate_onboarding");
    const data = onboardingData ? JSON.parse(onboardingData) : { schedule: {} };
    
    const today = new Date();
    const todayName = weekDaysMap[today.getDay()];
    const muscleGroups = data.schedule?.[todayName] || null;
    
    // Format workout display (join muscle groups)
    const workout = muscleGroups 
      ? (Array.isArray(muscleGroups) ? muscleGroups.join(" + ") : muscleGroups)
      : null;

    // Get current week schedule (Mon-Sun)
    const schedule = [];
    const currentDayOfWeek = today.getDay();
    const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() + mondayOffset + i);
      const dayIndex = date.getDay();
      const dayName = weekDaysMap[dayIndex];
      const dayGroups = data.schedule?.[dayName] || null;
      const dayWorkout = dayGroups 
        ? (Array.isArray(dayGroups) ? dayGroups.join(" + ") : dayGroups)
        : null;
      schedule.push({
        shortDay: shortDays[dayIndex],
        fullDay: dayName,
        workout: dayWorkout,
        date: date.getDate(),
        isToday: date.toDateString() === today.toDateString(),
      });
    }

    // Generate AI suggestions based on today's muscle groups
    const { exercise, focus } = getSuggestedExercise(muscleGroups);
    const recovery = getRecoverySuggestion(muscleGroups);
    
    // Get all exercises for today's muscle groups
    const allExercises = muscleGroups ? getExercisesForGroups(muscleGroups) : [];
    
    const suggestions = {
      exercise: exercise?.name || "Alongamentos",
      focus: focus,
      recovery: recovery,
      allExercises: allExercises,
    };

    return {
      todayWorkout: workout,
      todayMuscleGroups: muscleGroups,
      weekSchedule: schedule,
      aiSuggestions: suggestions,
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
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/settings")}
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
        {/* Name AI Banner */}
        <NameAIBanner />

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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-6"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400/70">Progresso</span>
                <button
                  onClick={() => setShowExercises(true)}
                  className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  <span className="font-semibold">{completedExercises.size}/{aiSuggestions.allExercises.length}</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="h-2 w-full rounded-full bg-[#2A2A2A]/50 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ 
                    width: aiSuggestions.allExercises.length > 0 
                      ? `${(completedExercises.size / aiSuggestions.allExercises.length) * 100}%` 
                      : "0%" 
                  }}
                  transition={{ delay: 0.8, duration: 0.5, ease: "easeOut" }}
                  className="h-full rounded-full bg-primary"
                />
              </div>
            </motion.div>
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
                <motion.div 
                  className="grid grid-cols-3 gap-3"
                  animate={{ opacity: currentSlide === 0 ? 1 : 0.3 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  {(() => {
                    const todayStats = getTodayStats();
                    return [
                      { value: todayStats.totalSets.toString(), label: "Séries feitas" },
                      { value: todayStats.totalReps.toString(), label: "Reps totais" },
                      { value: todayStats.totalMinutes.toString(), label: "Min treino" },
                    ];
                  })().map((stat, index) => (
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
                </motion.div>
              </CarouselItem>

              {/* State 2: AI Suggestions */}
              <CarouselItem>
                <motion.div 
                  className="grid grid-cols-3 gap-3"
                  animate={{ opacity: currentSlide === 1 ? 1 : 0.3 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  {/* Treino Sugerido - Clickable */}
                  <motion.button
                    initial={{ opacity: 0, y: 30, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      delay: 0.3,
                      duration: 0.4,
                      type: "spring",
                      stiffness: 120,
                      damping: 12
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowExercises(true)}
                    className="rounded-2xl bg-[#1E1E1E]/50 p-4 text-left relative group"
                  >
                    <Brain className="h-5 w-5 text-primary mb-2" />
                    <p className="text-sm font-bold text-white/70 leading-tight">
                      {aiSuggestions.exercise}
                    </p>
                    <p className="text-xs text-gray-400/70 mt-1">Treino Sugerido</p>
                    <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-hover:text-primary transition-colors" />
                  </motion.button>

                  {/* Foco */}
                  <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      delay: 0.4,
                      duration: 0.4,
                      type: "spring",
                      stiffness: 120,
                      damping: 12
                    }}
                    className="rounded-2xl bg-[#1E1E1E]/50 p-4"
                  >
                    <Target className="h-5 w-5 text-primary mb-2" />
                    <p className="text-sm font-bold text-white/70 leading-tight">
                      {aiSuggestions.focus}
                    </p>
                    <p className="text-xs text-gray-400/70 mt-1">Foco</p>
                  </motion.div>

                  {/* Recovery Coach */}
                  <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      delay: 0.5,
                      duration: 0.4,
                      type: "spring",
                      stiffness: 120,
                      damping: 12
                    }}
                    className="rounded-2xl bg-[#1E1E1E]/50 p-4"
                  >
                    <Heart className="h-5 w-5 text-primary mb-2" />
                    <p className="text-sm font-bold text-white/70 leading-tight">
                      {aiSuggestions.recovery}
                    </p>
                    <p className="text-xs text-gray-400/70 mt-1">Recovery Coach</p>
                  </motion.div>
                </motion.div>
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

        {/* AI Insights Widget */}
        <AIInsightsWidget />

        {/* Favorites Widget */}
        <FavoritesWidget />

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

      {/* Exercises Sheet */}
      <Sheet open={showExercises} onOpenChange={setShowExercises}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl bg-card border-t-0">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              Exercícios Sugeridos
            </SheetTitle>
            <p className="text-sm text-muted-foreground">
              {todayWorkout || "Dia de descanso"}
            </p>
          </SheetHeader>
          
          <div className="overflow-y-auto h-[calc(100%-80px)] pb-6 -mx-2 px-2">
            {/* Progress indicator */}
            {aiSuggestions.allExercises.length > 0 && (
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-semibold text-primary">
                  {completedExercises.size}/{aiSuggestions.allExercises.length} concluídos
                </span>
              </div>
            )}
            
            <div className="space-y-3">
              {aiSuggestions.allExercises.length > 0 ? (
                aiSuggestions.allExercises.map((exercise: Exercise, index: number) => {
                  const isCompleted = completedExercises.has(exercise.name);
                  return (
                    <motion.button
                      key={`${exercise.name}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => toggleExerciseComplete(exercise.name)}
                      className={`flex items-center gap-4 rounded-2xl p-4 w-full text-left transition-all ${
                        isCompleted 
                          ? 'bg-primary/20 border border-primary/30' 
                          : 'bg-secondary/50 hover:bg-secondary/70'
                      }`}
                    >
                      <motion.div 
                        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                          isCompleted ? 'bg-primary' : 'bg-primary/20'
                        }`}
                        animate={{ scale: isCompleted ? [1, 1.2, 1] : 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {isCompleted ? (
                          <Check className="h-5 w-5 text-primary-foreground" />
                        ) : (
                          <Dumbbell className="h-5 w-5 text-primary" />
                        )}
                      </motion.div>
                      <div className="flex-1">
                        <p className={`font-semibold transition-all ${
                          isCompleted ? 'text-primary line-through' : 'text-foreground'
                        }`}>
                          {exercise.name}
                        </p>
                        <p className={`text-sm flex items-center gap-1 ${
                          isCompleted ? 'text-primary/60' : 'text-muted-foreground'
                        }`}>
                          <Target className="h-3 w-3" />
                          {exercise.focus}
                        </p>
                      </div>
                      {isCompleted && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-xs text-primary font-medium"
                        >
                          ✓ Feito
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Dia de descanso - aproveita para recuperar!</p>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <BottomNav />
    </div>
  );
};

export default Home;
