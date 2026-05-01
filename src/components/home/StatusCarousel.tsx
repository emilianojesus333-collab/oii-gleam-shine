import { motion } from "framer-motion";
import { Activity, AlertTriangle, TrendingUp, Dumbbell, Clock, Droplets } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import {
  useMuscleFatigue,
  getStatusLabel,
  getStatusColor,
  getStatusDotColor,
  getMuscleLabel } from
"@/hooks/useMuscleFatigue";
import { useWeeklyStats } from "@/hooks/useWeeklyStats";

const cardBase =
"flex min-h-[320px] w-full flex-col rounded-2xl border border-border/50 bg-card p-5";

export const StatusCarousel = () => {
  const navigate = useNavigate();
  const { muscles, fatigued, mostRecovered, hydrationContext, loading } = useMuscleFatigue();
  const { data: weeklyData, loading: weeklyLoading } = useWeeklyStats();

  if (loading) return null;

  const slides: React.ReactNode[] = [];

  const getBarColor = (status: string) => {
    switch (status) {
      case "recovered":return "bg-[hsl(142,71%,45%)]";
      case "almost_recovered":return "bg-[hsl(45,93%,47%)]";
      case "recovering":return "bg-[hsl(270,60%,55%)]";
      case "fatigued":return "bg-destructive";
      default:return "bg-[hsl(142,71%,45%)]";
    }
  };

  const getBarWidth = (muscle: typeof muscles[0]) => {
    return Math.max(100 - muscle.current_fatigue, 10);
  };

  const displayMuscles = muscles.slice(0, 4);

  // Weekly progress ring params
  const completedSessions = weeklyData?.completedSessions ?? 0;
  const plannedSessions = weeklyData?.plannedSessions ?? 0;
  const totalSets = weeklyData?.totalSets ?? 0;
  const totalReps = weeklyData?.totalReps ?? 0;
  const totalMinutes = weeklyData?.totalMinutes ?? 0;
  const dailyActivity = weeklyData?.dailyActivity ?? [false, false, false, false, false, false, false];
  const planned = Math.max(plannedSessions, 1);
  const pct = Math.min(Math.round(completedSessions / planned * 100), 100);
  const ringSize = 56;
  const ringStroke = 5;
  const ringRadius = (ringSize - ringStroke) / 2;
  const circumference = 2 * Math.PI * ringRadius;
  const offset = circumference - pct / 100 * circumference;

  slides.push(
    <div key="weekly-progress" className="space-y-3">
      {/* Weekly Progress */}
      <div className="rounded-2xl p-4 shadow-lg shadow-black/20 bg-[#380439]/[0.43]">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <svg width={ringSize} height={ringSize} className="-rotate-90">
              <circle cx={ringSize / 2} cy={ringSize / 2} r={ringRadius} fill="none" stroke="hsl(220,10%,20%)" strokeWidth={ringStroke} />
              <motion.circle
                cx={ringSize / 2} cy={ringSize / 2} r={ringRadius} fill="none"
                stroke="hsl(142,71%,45%)" strokeWidth={ringStroke} strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-black text-foreground leading-none">
                {completedSessions}/{plannedSessions}
              </span>
            </div>
          </div>
          <div className="flex-1 space-y-0.5">
            <p className="text-sm font-bold text-foreground">
              {completedSessions} de {plannedSessions} treinos
            </p>
            <p className="text-xs text-muted-foreground">
              {totalSets} séries · {totalReps} reps · {totalMinutes} min
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-3">
          {dailyActivity.map((active, i) =>
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-all"
            style={{ backgroundColor: active ? "hsl(142,71%,45%)" : "hsl(220,10%,20%)" }} />
          )}
        </div>
      </div>
    </div>
  );

  const recovering = muscles.filter((muscle) => muscle.current_fatigue > 0);
  slides.push(
    <div key="recovery-trend" className={cardBase}>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
          <TrendingUp className="h-5 w-5 text-foreground" />
        </div>
        <p className="text-sm font-bold text-foreground">Recuperação em progresso</p>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        {recovering.length === 0 ?
        <p className="text-sm text-muted-foreground">
            Todos os músculos estão recuperados. Bom treino!
          </p> :

        recovering.
        sort((a, b) => b.hours_to_recovery - a.hours_to_recovery).
        map((muscle) =>
        <div key={muscle.muscle_group} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm text-foreground">{getMuscleLabel(muscle.muscle_group)}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  ≈ {muscle.hours_to_recovery}h para recuperar
                </span>
              </div>
        )
        }

        <div className="mt-auto space-y-2 pt-2">
          {mostRecovered.length > 0 &&
          <div className="border-t border-border/30 pt-2">
              <div className="mb-1 flex items-center gap-2">
                <Dumbbell className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">Sugestão de treino hoje</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Músculos mais recuperados:{" "}
                <span className="font-medium text-foreground">
                  {mostRecovered.map((muscle) => getMuscleLabel(muscle.muscle_group)).join(", ")}
                </span>
              </p>
            </div>
          }

          <div className="rounded-xl border border-border/40 bg-background/40 p-3">
            <div className="flex items-start gap-2">
              <Droplets className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-xs font-medium text-foreground">Contexto de hidratação</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {hydrationContext.message}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {hydrationContext.currentIntakeLiters.toFixed(1)} / {hydrationContext.goalLiters.toFixed(1)} L · recuperação a {hydrationContext.recoveryRatePerHour}%/h
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (fatigued.length > 0) {
    slides.push(
      <motion.div
        key="fatigue-alert"
        whileTap={{ scale: 0.97 }}
        onClick={() =>
        navigate("/chat", {
          state: {
            prefill: `Os meus músculos com fadiga alta são: ${fatigued.
            map((muscle) => `${getMuscleLabel(muscle.muscle_group)} (${muscle.current_fatigue}%)`).
            join(", ")}. Que treino recomendam para hoje?`
          }
        })
        }
        className={`${cardBase} cursor-pointer`}>
        
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <p className="text-sm font-bold text-foreground">Fadiga elevada detectada</p>
        </div>

        <div className="mb-3 space-y-2">
          {fatigued.map((muscle) =>
          <p key={muscle.muscle_group} className="text-sm text-destructive">
              {getMuscleLabel(muscle.muscle_group)} com fadiga alta ({muscle.current_fatigue}%)
            </p>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Treinar novamente agora pode reduzir desempenho. Considera treinar outro grupo muscular hoje.
        </p>
        <p className="mt-2 text-xs font-medium text-primary">Toca para pedir conselho à IA →</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}>
      
      <Carousel opts={{ align: "start", loop: false }} className="w-full">
        <CarouselContent className="-ml-3">
          {slides.map((slide, index) =>
          <CarouselItem key={index} className="basis-full pl-3">
              {slide}
            </CarouselItem>
          )}
        </CarouselContent>
      </Carousel>
      {slides.length > 1 &&
      <div className="mt-3 flex justify-center gap-1.5">
          {slides.map((_, index) =>
        <div key={index} className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
        )}
        </div>
      }
    </motion.div>);

};