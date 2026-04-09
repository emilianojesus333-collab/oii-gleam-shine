import { useNavigate } from "react-router-dom";
import { Settings, RotateCcw, X } from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useMemo, useRef, useState, useEffect } from "react";
import gymBackground from "@/assets/gym-background.jpeg";
import { toast } from "sonner";
import { getTodayStats } from "@/data/workoutHistory";
import { BottomNav } from "@/components/BottomNav";
import { FavoritesWidget } from "@/components/home/FavoritesWidget";
import { WeeklyPerformanceWidget } from "@/components/home/WeeklyPerformanceWidget";
import { AIInsightsWidget } from "@/components/home/AIInsightsWidget";
import { TodayWorkoutCard } from "@/components/home/TodayWorkoutCard";
import { HexBadge } from "@/components/ui/HexBadge";

import { UpcomingWorkouts } from "@/components/home/UpcomingWorkouts";
import { NameAIBanner } from "@/components/home/NameAIBanner";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { FitnessScoreRadar } from "@/components/home/FitnessScoreRadar";
import { PerformanceMetricsPanel } from "@/components/home/PerformanceMetricsPanel";
import { StatusCarousel } from "@/components/home/StatusCarousel";
import { RecoveryRingsCard } from "@/components/home/RecoveryRingsCard";



const weekDaysMap: Record<number, string> = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado"
};

const Home = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Load user settings from database (per-user data)
  const { settings, isLoading: settingsLoading } = useUserSettings();
  const { user } = useAuth();
  

  const { scrollY } = useScroll();
  const imageY = useTransform(scrollY, [0, 300], [0, 100]);
  const imageScale = useTransform(scrollY, [0, 300], [1, 1.1]);
  const imageOpacity = useTransform(scrollY, [0, 200], [1, 0.3]);

  const { todayWorkout, trainingStimulus } = useMemo(() => {
    const userSchedule = settings?.onboarding_data?.schedule || {};
    const userGoal = settings?.onboarding_data?.goal || null;

    const today = new Date();
    const todayName = weekDaysMap[today.getDay()];
    const muscleGroups = userSchedule[todayName] || null;

    const workout = muscleGroups
      ? Array.isArray(muscleGroups) ? muscleGroups.join(" • ") : muscleGroups
      : null;

    const stimulusMap: Record<string, string> = {
      "Ganhar massa muscular": "Hoje é dia de volume",
      "Perder gordura": "Hoje é dia de intensidade",
      "Ganhar força": "Hoje é dia de força",
      "Melhorar resistência": "Hoje é dia de resistência",
      "Manter forma": "Hoje é dia de treino",
      "Recomposição corporal": "Hoje é dia de intensidade"
    };
    const stimulus = userGoal ? stimulusMap[userGoal] || "Hoje é dia de treino" : "Hoje é dia de treino";

    return {
      todayWorkout: workout,
      trainingStimulus: stimulus
    };
  }, [settings]);

  const handleResetOnboarding = async () => {
    try {
      // Clear localStorage
      const keysToRemove = Object.keys(localStorage).filter(
        (key) => key.startsWith("liftmate_onboarding") || key.startsWith("liftmate_onboarded")
      );
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      // Reset in Supabase so the redirect actually works
      if (user?.id) {
        await import("@/integrations/supabase/client").then(({ supabase }) =>
          supabase
            .from("user_settings")
            .update({ has_completed_onboarding: false, onboarding_data: null })
            .eq("user_id", user.id)
        );
      }

      toast.success("Onboarding resetado!");
      navigate("/onboarding", { replace: true });
    } catch (error) {
      console.error("Error resetting onboarding:", error);
      toast.error("Erro ao resetar onboarding.");
    }
  };

  // Light flicker animation state
  const [isFlickering, setIsFlickering] = useState(false);

  useEffect(() => {
    const flickerInterval = setInterval(() => {
      setIsFlickering(true);
      setTimeout(() => setIsFlickering(false), 80);
      setTimeout(() => setIsFlickering(true), 120);
      setTimeout(() => setIsFlickering(false), 170);
    }, 60000);

    return () => clearInterval(flickerInterval);
  }, []);

  const isRestDay = !todayWorkout || todayWorkout === "Descanso";
  const fatigueIndex = settings?.fatigue_index ?? 0;
  const todayStats = getTodayStats();




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
            filter: isFlickering ? 'brightness(0.7)' : 'brightness(1)'
          }}
          transition={{ duration: 0.05 }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/70 to-black" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 px-4 sm:px-6 pt-10 sm:pt-12 pb-1 sm:pb-2 safe-area-top"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <HexBadge label="TR" size={34} />
            <h1 className="text-xl font-black text-secondary-foreground sm:text-3xl">LiftMate</h1>
            <SubscriptionBadge variant="compact" />
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/settings")}
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-[#1E1E1E]/50 backdrop-blur-sm touch-target flex items-center justify-center"
          >
            <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-white/70" />
          </motion.button>
        </div>

        {/* Time-based greeting */}
        <div className="mt-3">
          <p className="text-xs text-muted-foreground/70">{(() => {
            const hour = new Date().getHours();
            if (hour < 12) return "Bom dia,";
            if (hour < 19) return "Boa tarde,";
            return "Boa noite,";
          })()}</p>
          <p className="text-lg sm:text-xl font-bold text-muted-foreground">
            {settings?.onboarding_data?.personal?.name || user?.email?.split("@")[0] || "Atleta"}
          </p>
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
              className="w-full max-w-lg bg-[#111]/95 p-6 pb-10"
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

      {/* Content sections */}
      <main className="relative z-10 flex-1">
        <NameAIBanner />
        <TodayWorkoutCard
          workout={todayWorkout}
          stimulus={trainingStimulus}
          isRestDay={isRestDay}
        />
        <RecoveryRingsCard />
        <StatusCarousel />
        <FitnessScoreRadar />
        <PerformanceMetricsPanel />
        <AIInsightsWidget />
        <WeeklyPerformanceWidget />
        <FavoritesWidget />
        <UpcomingWorkouts />
      </main>

      <BottomNav />
    </div>
  );
};

export default Home;
