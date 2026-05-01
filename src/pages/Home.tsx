import { useNavigate } from "react-router-dom";
import { Settings, X, RotateCcw } from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useMemo, useRef, useState, useEffect } from "react";
import gymBackground from "@/assets/gym-background.jpeg";
import { toast } from "sonner";
import { BottomNav } from "@/components/BottomNav";
import { TodayWorkoutCard } from "@/components/home/TodayWorkoutCard";
import { UpcomingWorkouts } from "@/components/home/UpcomingWorkouts";
import { NameAIBanner } from "@/components/home/NameAIBanner";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useAuth } from "@/hooks/useAuth";
import { FitnessScoreRadar } from "@/components/home/FitnessScoreRadar";
import { StatusCarousel } from "@/components/home/StatusCarousel";
import { AIInsightsWidget } from "@/components/home/AIInsightsWidget";
import { HydrationWidget } from "@/components/home/HydrationWidget";
import { NutritionWidget } from "@/components/home/NutritionWidget";
import { HomeWeeklyReportCard } from "@/components/home/HomeWeeklyReportCard";
import { DeloadAlertBanner } from "@/components/home/DeloadAlertBanner";
import { DayFlowCard, DayFlowCompleted } from "@/components/home/DayFlowCard";
import { MilestoneModal } from "@/components/home/MilestoneModal";
import { getCurrentDayTask, initDayFlow, markTaskComplete } from "@/utils/onboardingFlow";
import { useMilestones } from "@/hooks/useMilestones";
import { useSmartNotifications } from "@/hooks/useSmartNotifications";

const weekDaysMap: Record<number, string> = {
  0: "Domingo", 1: "Segunda-feira", 2: "Terça-feira",
  3: "Quarta-feira", 4: "Quinta-feira", 5: "Sexta-feira", 6: "Sábado"
};

const Home = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const { settings } = useUserSettings();
  const { user } = useAuth();
  const { pendingMilestone, dismissMilestone } = useMilestones();

  const { scrollY } = useScroll();
  const imageY = useTransform(scrollY, [0, 300], [0, 100]);
  const imageScale = useTransform(scrollY, [0, 300], [1, 1.1]);
  const imageOpacity = useTransform(scrollY, [0, 200], [1, 0.3]);

  const [isFlickering, setIsFlickering] = useState(false);
  const [dayFlowState, setDayFlowState] = useState<ReturnType<typeof getCurrentDayTask> | null>(null);
  useEffect(() => {
    if (!user?.id || !settings) return;
    // Init day flow using account creation date if available
    const startDate = settings.created_at?.split("T")[0];
    initDayFlow(user.id, startDate);
    setDayFlowState(getCurrentDayTask(user.id));
  }, [user?.id, settings]);

  useEffect(() => {
    const id = setInterval(() => {
      setIsFlickering(true);
      setTimeout(() => setIsFlickering(false), 80);
      setTimeout(() => setIsFlickering(true), 120);
      setTimeout(() => setIsFlickering(false), 170);
    }, 60000);
    return () => clearInterval(id);
  }, []);

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
    return {
      todayWorkout: workout,
      trainingStimulus: userGoal ? stimulusMap[userGoal] || "Hoje é dia de treino" : "Hoje é dia de treino"
    };
  }, [settings]);

  const isRestDay = !todayWorkout || todayWorkout === "Descanso";

  // Smart notifications — schedules once per day based on real workout history
  useSmartNotifications({
    hasTodayWorkout: !isRestDay,
    plannedExerciseCount: 0, // conservative default; real count lives in workout page
    hydrationLiters: 0,       // would need useNutrition; keep 0 to avoid double-fetching
    hydrationGoalLiters: 2.5,
    currentStreak: 0,         // milestones hook already fetches sessions; avoid duplicate
    lastSessionDate: null,
  });

  const handleResetOnboarding = async () => {
    try {
      const keysToRemove = Object.keys(localStorage).filter(
        (k) => k.startsWith("liftmate_onboarding") || k.startsWith("liftmate_onboarded")
      );
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      if (user?.id) {
        await import("@/integrations/supabase/client").then(({ supabase }) =>
          supabase.from("user_settings")
            .update({ has_completed_onboarding: false, onboarding_data: null })
            .eq("user_id", user.id)
        );
      }
      toast.success("Onboarding resetado!");
      navigate("/onboarding", { replace: true });
    } catch {
      toast.error("Erro ao resetar onboarding.");
    }
  };

  return (
    <div ref={containerRef} className="flex min-h-screen flex-col pb-20 sm:pb-24 mobile-scroll" style={{ backgroundColor: "#000000", position: "relative", zIndex: 1 }}>

      {/* Hero Background */}
      <div className="absolute inset-x-0 top-0 h-64 sm:h-80 overflow-hidden">
        <motion.img
          src={gymBackground} alt=""
          className="h-full w-full object-cover"
          style={{ y: imageY, scale: imageScale, opacity: imageOpacity, filter: isFlickering ? "brightness(0.7)" : "brightness(1)" }}
          transition={{ duration: 0.05 }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/70 to-black" />
      </div>

      {/* Header */}
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="relative z-10 px-4 sm:px-6 pt-10 sm:pt-12 pb-1 safe-area-top">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white sm:text-3xl">LiftMate</h1>
            <SubscriptionBadge variant="compact" />
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate("/settings")}
            className="h-9 w-9 rounded-full bg-[#1E1E1E]/50 backdrop-blur-sm flex items-center justify-center">
            <Settings className="h-4 w-4 text-white/70" />
          </motion.button>
        </div>
        <div className="mt-3">
          <p className="text-xs text-white/50">{(() => {
            const h = new Date().getHours();
            return h < 12 ? "Bom dia," : h < 19 ? "Boa tarde," : "Boa noite,";
          })()}</p>
          <p className="text-lg font-bold text-white">
            {settings?.onboarding_data?.personal?.name || user?.email?.split("@")[0] || "Atleta"}
          </p>
        </div>
      </motion.header>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#111]/95 p-6 pb-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Configurações</h2>
                <button onClick={() => setShowSettings(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#222]">
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
              <button onClick={handleResetOnboarding}
                className="flex w-full items-center gap-4 rounded-2xl bg-[#222] p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
                  <RotateCcw className="h-6 w-6 text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-white">Refazer onboarding</p>
                  <p className="text-sm text-white/50">Redefine as tuas preferências de treino</p>
                </div>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <main className="relative z-10 flex-1">
        <NameAIBanner />

        {/* Weekly Date Strip */}
        <div className="px-4 pb-2">
          <div className="flex justify-between">
            {(() => {
              const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
              const today = new Date();
              const dow = today.getDay();
              const mondayOffset = dow === 0 ? -6 : 1 - dow;
              return days.map((d, i) => {
                const date = new Date(today);
                date.setDate(today.getDate() + mondayOffset + i);
                const isToday = date.toDateString() === today.toDateString();
                return (
                  <div key={d} className="flex flex-col items-center gap-1">
                    <span className="text-xs text-white/40">{d}</span>
                    <div className="w-9 h-9 flex items-center justify-center rounded-xl text-sm font-semibold"
                      style={{
                        background: isToday ? "rgba(255,255,255,0.15)" : "transparent",
                        border: isToday ? "none" : "1.5px dashed rgba(255,255,255,0.2)",
                        color: isToday ? "#fff" : "rgba(255,255,255,0.45)",
                      }}>
                      {date.getDate()}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        <TodayWorkoutCard workout={todayWorkout} stimulus={trainingStimulus} isRestDay={isRestDay} />

        {/* Day 1-7 flow */}
        {dayFlowState?.isWithin7Days && dayFlowState.task && (
          <DayFlowCard
            task={dayFlowState.task}
            dayNumber={dayFlowState.dayNumber}
            completedCount={dayFlowState.completedCount}
            onMarkComplete={() => {
              if (user?.id && dayFlowState.task) {
                markTaskComplete(user.id, dayFlowState.task.completionKey);
                setDayFlowState(getCurrentDayTask(user.id));
              }
            }}
          />
        )}
        {dayFlowState?.isWithin7Days && !dayFlowState.task && (
          <DayFlowCompleted completedCount={dayFlowState.completedCount} />
        )}

        <HomeWeeklyReportCard />
        <DeloadAlertBanner />
        <StatusCarousel />
        <FitnessScoreRadar />
        <AIInsightsWidget />
        <HydrationWidget />
        <NutritionWidget />
        <UpcomingWorkouts />
      </main>

      <BottomNav />

      <MilestoneModal milestone={pendingMilestone} onDismiss={dismissMilestone} />
    </div>
  );
};

export default Home;
