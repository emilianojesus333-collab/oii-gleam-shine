import { useNavigate } from "react-router-dom";
import { Settings, RotateCcw, X, Brain, Target, Heart, ChevronRight, Trophy } from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useMemo, useRef, useState, useEffect } from "react";
import gymBackground from "@/assets/gym-background.jpeg";
import { toast } from "sonner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi } from
"@/components/ui/carousel";
import { getSuggestedExercise, getRecoverySuggestion, getExercisesForGroups } from "@/data/exerciseDatabase";
import { getTodayStats } from "@/data/workoutHistory";
import { BottomNav } from "@/components/BottomNav";
import { FavoritesWidget } from "@/components/home/FavoritesWidget";
import { WeeklyPerformanceWidget } from "@/components/home/WeeklyPerformanceWidget";
import { AIInsightsWidget } from "@/components/home/AIInsightsWidget";
import { TodayWorkoutCard } from "@/components/home/TodayWorkoutCard";
import { WeeklyProgressCard } from "@/components/home/WeeklyProgressCard";
import { WeeklyStatsGrid } from "@/components/home/WeeklyStatsGrid";
import { NameAIBanner } from "@/components/home/NameAIBanner";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";

const weekDaysMap: Record<number, string> = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado"
};

const shortDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const Home = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Load user settings from database (per-user data)
  const { settings, isLoading: settingsLoading } = useUserSettings();
  const { user } = useAuth();

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

  const { todayWorkout, todayMuscleGroups, weekSchedule, aiSuggestions, trainingStimulus } = useMemo(() => {
    // Load schedule from user settings (database) - per-user data
    const userSchedule = settings?.onboarding_data?.schedule || {};
    const userGoal = settings?.onboarding_data?.goal || null;

    const today = new Date();
    const todayName = weekDaysMap[today.getDay()];
    const muscleGroups = userSchedule[todayName] || null;

    // Format workout display with bullet separator
    const workout = muscleGroups ?
    Array.isArray(muscleGroups) ? muscleGroups.join(" • ") : muscleGroups :
    null;

    // Derive training stimulus from user goal
    const stimulusMap: Record<string, string> = {
      "Ganhar massa muscular": "Hoje é dia de volume",
      "Perder gordura": "Hoje é dia de intensidade",
      "Ganhar força": "Hoje é dia de força",
      "Melhorar resistência": "Hoje é dia de resistência",
      "Manter forma": "Hoje é dia de treino",
      "Recomposição corporal": "Hoje é dia de intensidade"
    };
    const stimulus = userGoal ? stimulusMap[userGoal] || "Hoje é dia de treino" : "Hoje é dia de treino";

    // Get current week schedule (Mon-Sun)
    const schedule = [];
    const currentDayOfWeek = today.getDay();
    const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() + mondayOffset + i);
      const dayIndex = date.getDay();
      const dayName = weekDaysMap[dayIndex];
      const dayGroups = userSchedule[dayName] || null;
      const dayWorkout = dayGroups ?
      Array.isArray(dayGroups) ? dayGroups.join(" + ") : dayGroups :
      null;
      schedule.push({
        shortDay: shortDays[dayIndex],
        fullDay: dayName,
        workout: dayWorkout,
        date: date.getDate(),
        isToday: date.toDateString() === today.toDateString()
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
      allExercises: allExercises
    };

    return {
      todayWorkout: workout,
      todayMuscleGroups: muscleGroups,
      weekSchedule: schedule,
      aiSuggestions: suggestions,
      trainingStimulus: stimulus
    };
  }, [settings]);

  const handleResetOnboarding = () => {
    localStorage.removeItem("liftmate_onboarding");
    localStorage.removeItem("liftmate_onboarded");
    toast.success("Onboarding resetado!");
    navigate("/");
  };

  // Light flicker animation state
  const [isFlickering, setIsFlickering] = useState(false);

  // Trigger flicker every 30 seconds
  useEffect(() => {
    const flickerInterval = setInterval(() => {
      setIsFlickering(true);
      setTimeout(() => setIsFlickering(false), 100);
      setTimeout(() => setIsFlickering(true), 150);
      setTimeout(() => setIsFlickering(false), 200);
      setTimeout(() => setIsFlickering(true), 350);
      setTimeout(() => setIsFlickering(false), 400);
    }, 30000);

    return () => clearInterval(flickerInterval);
  }, []);

  const isRestDay = !todayWorkout || todayWorkout === "Descanso";

  return (
    <div ref={containerRef} className="flex min-h-screen flex-col bg-black pb-20 sm:pb-24 mobile-scroll">
      {/* Hero Background Image with Parallax and Flicker Effect */}
      <div className="absolute inset-x-0 top-0 h-64 sm:h-80 overflow-hidden">
        <motion.img
          src={gymBackground}
          alt=""
          className="h-full w-full object-cover"
          style={{
            y: imageY,
            scale: imageScale,
            opacity: imageOpacity,
            filter: isFlickering ? 'brightness(0.3)' : 'brightness(1)'
          }}
          animate={{
            filter: isFlickering ? 'brightness(0.3)' : 'brightness(1)'
          }}
          transition={{ duration: 0.05 }} />

        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/70 to-black" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 px-4 sm:px-6 pt-10 sm:pt-12 pb-3 sm:pb-4 safe-area-top flex items-start justify-between">

        <div className="flex items-center gap-2 sm:gap-3">
          <h1 className="text-xl font-black text-secondary-foreground sm:text-3xl">LiftMate</h1>
          <SubscriptionBadge variant="compact" />
        </div>
        <div className="gap-2 sm:gap-3 flex items-center justify-start">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/settings")}
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-[#1E1E1E]/50 backdrop-blur-sm touch-target flex items-center justify-center">

            <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-white/70" />
          </motion.button>
        </div>
      </motion.header>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings &&
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowSettings(false)}>

            <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-t-3xl bg-card p-6 pb-10">

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Configurações</h2>
                <button
                onClick={() => setShowSettings(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">

                  <X className="h-4 w-4 text-foreground" />
                </button>
              </div>
              
              <button
              onClick={handleResetOnboarding}
              className="flex w-full items-center gap-4 rounded-2xl bg-secondary p-4 transition-colors hover:bg-secondary/80">

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
        }
      </AnimatePresence>

      {/* Week Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-10 px-4 sm:px-6 py-3 sm:py-4">

        <div className="flex justify-between gap-1">
          {weekSchedule.map((item, index) =>
          <motion.div
            key={item.fullDay}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + index * 0.03 }}
            className="flex-col flex-1 flex items-center justify-start">

              <span className="text-[10px] sm:text-xs text-gray-400/70 mb-1.5 sm:mb-2">{item.shortDay}</span>
              <div
              className={`flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center transition-all ${
              item.isToday ?
              "rounded-lg sm:rounded-xl bg-[#1E1E1E]/50" :
              item.workout && item.workout !== "Descanso" ?
              "rounded-lg sm:rounded-xl border border-dashed border-gray-500/40" :
              ""}`
              }>

                <span className="text-base sm:text-lg font-semibold text-white/70">
                  {item.date}
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      <main className="relative z-10 flex-1 px-4 sm:px-6 space-y-4 sm:space-y-5">
        {/* Name AI Banner */}
        <NameAIBanner />

        {/* Today Workout Card (blue) */}
        <TodayWorkoutCard
          workout={todayWorkout}
          stimulus={trainingStimulus}
          isRestDay={isRestDay}
        />

        {/* Stats Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}>

          <Carousel className="w-full" setApi={setCarouselApi}>
            <CarouselContent>
              {/* State 1: Stats */}
              <CarouselItem>
                <motion.div
                  className="grid grid-cols-3 gap-2 sm:gap-3"
                  animate={{ opacity: currentSlide === 0 ? 1 : 0.3 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}>

                  {(() => {
                    const todayStats = getTodayStats();
                    return [
                    { value: todayStats.totalSets.toString(), label: t("home.seriesDone") },
                    { value: todayStats.totalReps.toString(), label: t("home.totalReps") },
                    { value: todayStats.totalMinutes.toString(), label: t("home.trainingMin") }];

                  })().map((stat, index) =>
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
                    className="rounded-xl sm:rounded-2xl p-3 sm:p-4 bg-[#111311]">

                      <p className="text-xl sm:text-2xl font-black text-secondary-foreground">
                        {stat.value}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-400/70 mt-0.5 sm:mt-1">{stat.label}</p>
                    </motion.div>
                  )}
                </motion.div>
              </CarouselItem>

              {/* State 2: AI Suggestions */}
              <CarouselItem>
                <motion.div
                  className="grid grid-cols-3 gap-2 sm:gap-3"
                  animate={{ opacity: currentSlide === 1 ? 1 : 0.3 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}>

                  <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.4, type: "spring", stiffness: 120, damping: 12 }}
                    className="rounded-xl sm:rounded-2xl bg-[#1E1E1E]/50 p-3 sm:p-4">

                    <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-primary mb-1.5 sm:mb-2" />
                    <p className="text-xs sm:text-sm font-bold text-white/70 leading-tight">
                      {aiSuggestions.exercise}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-400/70 mt-0.5 sm:mt-1">{t("home.suggestedExercise")}</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.4, type: "spring", stiffness: 120, damping: 12 }}
                    className="rounded-xl sm:rounded-2xl bg-[#1E1E1E]/50 p-3 sm:p-4">

                    <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary mb-1.5 sm:mb-2" />
                    <p className="text-xs sm:text-sm font-bold text-white/70 leading-tight">
                      {aiSuggestions.focus}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-400/70 mt-0.5 sm:mt-1">{t("home.focusOn")}</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.4, type: "spring", stiffness: 120, damping: 12 }}
                    className="rounded-xl sm:rounded-2xl bg-[#1E1E1E]/50 p-3 sm:p-4">

                    <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-primary mb-1.5 sm:mb-2" />
                    <p className="text-xs sm:text-sm font-bold text-white/70 leading-tight">
                      {aiSuggestions.recovery}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-400/70 mt-0.5 sm:mt-1">{t("home.recovery")}</p>
                  </motion.div>
                </motion.div>
              </CarouselItem>
            </CarouselContent>
          </Carousel>
          
          {/* Carousel Indicators */}
          <div className="flex justify-center gap-1 mt-2">
            <button
              onClick={() => carouselApi?.scrollTo(0)}
              className={`w-1 h-1 rounded-full transition-opacity ${currentSlide === 0 ? 'bg-white/50' : 'bg-white/15'}`} />
            <button
              onClick={() => carouselApi?.scrollTo(1)}
              className={`w-1 h-1 rounded-full transition-opacity ${currentSlide === 1 ? 'bg-white/50' : 'bg-white/15'}`} />
          </div>
        </motion.div>

        {/* Weekly Progress Card */}
        <WeeklyProgressCard />

        {/* AI Insights Widget */}
        <AIInsightsWidget />

        {/* Volume + Trend Grid */}
        <WeeklyStatsGrid />

        {/* Weekly Performance Widget */}
        <WeeklyPerformanceWidget />

        {/* Favorites Widget */}
        <FavoritesWidget />
      </main>

      <BottomNav />
    </div>);

};

export default Home;