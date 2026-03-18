import { motion } from "framer-motion";
import { AlertTriangle, Clock3, Droplets } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useMuscleFatigue, getStatusLabel, getMuscleLabel } from "@/hooks/useMuscleFatigue";

const cardBase =
  "flex h-[172px] w-full flex-col justify-between rounded-2xl border border-border/50 bg-card p-5";

interface StatusSlideProps {
  title: string;
  value: string;
  status: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "destructive" | "secondary";
  onClick?: () => void;
}

const toneClasses = {
  primary: "bg-primary/10 text-primary",
  destructive: "bg-destructive/10 text-destructive",
  secondary: "bg-secondary text-foreground",
} satisfies Record<StatusSlideProps["tone"], string>;

const StatusSlide = ({ title, value, status, icon: Icon, tone, onClick }: StatusSlideProps) => {
  const content = (
    <div className={cardBase}>
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="truncate text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {title}
        </p>
      </div>

      <div className="flex flex-1 items-center py-3">
        <p className="truncate text-4xl font-black tracking-tight text-foreground">{value}</p>
      </div>

      <p className="truncate text-sm text-muted-foreground">{status}</p>
    </div>
  );

  if (!onClick) return content;

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left"
    >
      {content}
    </motion.button>
  );
};

export const StatusCarousel = () => {
  const navigate = useNavigate();
  const { muscles, fatigued, mostRecovered, hydrationContext, loading } = useMuscleFatigue();

  if (loading) return null;

  const fatigueLead = [...muscles].sort((a, b) => b.current_fatigue - a.current_fatigue)[0];
  const nextRecovered = [...muscles]
    .filter((muscle) => muscle.current_fatigue > 0)
    .sort((a, b) => a.hours_to_recovery - b.hours_to_recovery)[0];

  const hydrationRatio = hydrationContext.goalLiters > 0
    ? hydrationContext.currentIntakeLiters / hydrationContext.goalLiters
    : 0;

  const hydrationStatus = hydrationRatio < 0.5
    ? "Baixa · recuperação mais lenta"
    : hydrationRatio < 0.8
      ? "Adequada · recuperação normal"
      : "Ideal · recuperação otimizada";

  const slides = [
    {
      key: "fatigue",
      node: (
        <StatusSlide
          title="Fadiga"
          value={`${Math.round(fatigueLead?.current_fatigue ?? 0)}%`}
          status={
            fatigueLead
              ? `${getMuscleLabel(fatigueLead.muscle_group)} · ${getStatusLabel(fatigueLead.status)}`
              : "Sem fadiga relevante hoje"
          }
          icon={AlertTriangle}
          tone={fatigued.length > 0 ? "destructive" : "secondary"}
          onClick={
            fatigued.length > 0
              ? () =>
                  navigate("/chat", {
                    state: {
                      prefill: `Os meus músculos com fadiga alta são: ${fatigued
                        .map((muscle) => `${getMuscleLabel(muscle.muscle_group)} (${muscle.current_fatigue}%)`)
                        .join(", ")}. Que treino recomendam para hoje?`,
                    },
                  })
              : undefined
          }
        />
      ),
    },
    {
      key: "recovery",
      node: (
        <StatusSlide
          title="Recuperação"
          value={nextRecovered ? `~${Math.ceil(nextRecovered.hours_to_recovery)}h` : "100%"}
          status={
            nextRecovered
              ? `${getMuscleLabel(nextRecovered.muscle_group)} recupera primeiro`
              : `Prontos hoje: ${mostRecovered.map((muscle) => getMuscleLabel(muscle.muscle_group)).join(", ") || "todos"}`
          }
          icon={Clock3}
          tone="primary"
        />
      ),
    },
    {
      key: "hydration",
      node: (
        <StatusSlide
          title="Hidratação"
          value={`${hydrationContext.currentIntakeLiters.toFixed(1)}L`}
          status={hydrationStatus}
          icon={Droplets}
          tone="primary"
        />
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Carousel opts={{ align: "start", loop: false }} className="w-full">
        <CarouselContent className="-ml-3">
          {slides.map((slide) => (
            <CarouselItem key={slide.key} className="basis-full pl-3">
              {slide.node}
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <div className="mt-3 flex justify-center gap-1.5">
        {slides.map((slide) => (
          <div key={slide.key} className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
        ))}
      </div>
    </motion.div>
  );
};
