import { motion } from "framer-motion";
import { Activity, AlertTriangle, Clock, Droplets } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import {
  useMuscleFatigue,
  getStatusLabel,
  getStatusColor,
  getStatusDotColor,
  getMuscleLabel,
} from "@/hooks/useMuscleFatigue";

const cardBase =
  "flex h-[172px] w-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card p-4";

const cardTitleClass = "text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground";
const footerClass = "truncate text-xs text-muted-foreground";

export const StatusCarousel = () => {
  const navigate = useNavigate();
  const { muscles, fatigued, mostRecovered, hydrationContext, loading } = useMuscleFatigue();

  if (loading) return null;

  const recoveredCount = muscles.filter((muscle) => getStatusLabel(muscle.status) === "Recuperado").length;
  const recoveryQueue = [...muscles]
    .filter((muscle) => muscle.current_fatigue > 0)
    .sort((a, b) => b.hours_to_recovery - a.hours_to_recovery);
  const slowestRecovery = recoveryQueue[0];
  const topFatigued = [...fatigued].sort((a, b) => b.current_fatigue - a.current_fatigue)[0];

  const slides: React.ReactNode[] = [];

  slides.push(
    <div key="muscle-status" className={cardBase}>
      <div className="flex items-center justify-between gap-3">
        <p className={cardTitleClass}>Estado muscular</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
          <Activity className="h-4 w-4 text-primary" />
        </div>
      </div>

      <div className="mt-4 flex-1 space-y-2 overflow-hidden">
        {muscles.slice(0, 5).map((muscle) => (
          <div key={muscle.muscle_group} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex min-w-0 items-center gap-2">
              <div className={`h-2 w-2 shrink-0 rounded-full ${getStatusDotColor(muscle.status)}`} />
              <span className="truncate text-foreground">{getMuscleLabel(muscle.muscle_group)}</span>
            </div>
            <span className={`shrink-0 truncate text-xs font-medium ${getStatusColor(muscle.status)}`}>
              {getStatusLabel(muscle.status)}
            </span>
          </div>
        ))}
      </div>

      <p className={footerClass}>
        {recoveredCount === muscles.length
          ? "Todos os grupos estão recuperados hoje."
          : `${recoveredCount}/${muscles.length} grupos com recuperação avançada.`}
      </p>
    </div>
  );

  slides.push(
    <div key="recovery-trend" className={cardBase}>
      <div className="flex items-center justify-between gap-3">
        <p className={cardTitleClass}>Recuperação</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary">
          <Clock className="h-4 w-4 text-foreground" />
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center overflow-hidden text-center">
        <p className="text-4xl font-black leading-none text-foreground">
          {slowestRecovery ? `${Math.round(slowestRecovery.hours_to_recovery)}h` : "0h"}
        </p>
        <p className="mt-2 truncate text-sm text-muted-foreground">
          {slowestRecovery
            ? `${getMuscleLabel(slowestRecovery.muscle_group)} em recuperação total`
            : "Recuperação equilibrada"}
        </p>
        <p className="mt-2 w-full truncate text-xs text-primary">
          {mostRecovered.length > 0
            ? `Sugestão: ${mostRecovered.map((muscle) => getMuscleLabel(muscle.muscle_group)).join(", ")}`
            : "Bom momento para manter o plano de treino."}
        </p>
      </div>

      <p className={footerClass}>{hydrationContext.message}</p>
    </div>
  );

  if (fatigued.length > 0 && topFatigued) {
    slides.push(
      <motion.button
        type="button"
        key="fatigue-alert"
        whileTap={{ scale: 0.98 }}
        onClick={() =>
          navigate("/chat", {
            state: {
              prefill: `Os meus músculos com fadiga alta são: ${fatigued
                .map((muscle) => `${getMuscleLabel(muscle.muscle_group)} (${muscle.current_fatigue}%)`)
                .join(", ")}. Que treino recomendam para hoje?`,
            },
          })
        }
        className={`${cardBase} cursor-pointer text-left`}
      >
        <div className="flex items-center justify-between gap-3">
          <p className={cardTitleClass}>Fadiga</p>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center overflow-hidden text-center">
          <p className="text-4xl font-black leading-none text-foreground">
            {Math.round(topFatigued.current_fatigue)}%
          </p>
          <p className="mt-2 truncate text-sm text-muted-foreground">
            {getMuscleLabel(topFatigued.muscle_group)} com fadiga alta
          </p>
          <p className="mt-2 truncate text-xs text-primary">Toque para pedir sugestão à IA</p>
        </div>

        <p className={footerClass}>Evita repetir este grupo agora para proteger o desempenho.</p>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Carousel opts={{ align: "start", loop: false }} className="w-full">
        <CarouselContent className="-ml-3">
          {slides.map((slide, index) => (
            <CarouselItem key={index} className="basis-[84%] pl-3 sm:basis-[380px]">
              {slide}
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      {slides.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {slides.map((_, index) => (
            <div key={index} className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
          ))}
        </div>
      )}
    </motion.div>
  );
};
