import { motion } from "framer-motion";
import { Play, Dumbbell, Activity, AlertTriangle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useActiveSession } from "@/hooks/useActiveSession";

interface StatusCarouselProps {
  fatigueIndex: number;
}

const cardBase =
  "w-full rounded-2xl border border-border/50 bg-card p-5 flex flex-col min-h-[180px]";

export const StatusCarousel = ({ fatigueIndex }: StatusCarouselProps) => {
  const navigate = useNavigate();
  const { activeSession, loading } = useActiveSession();
  const hasActiveSession =
    !loading &&
    !!activeSession &&
    (activeSession.status === "in_progress" || activeSession.status === "planned");

  const getFatigueLabel = () => {
    if (fatigueIndex >= 80) return "Fadiga muito alta";
    if (fatigueIndex >= 60) return "Fadiga alta";
    if (fatigueIndex >= 40) return "Fadiga moderada";
    return "Fadiga baixa";
  };

  const getFatigueDescription = () => {
    if (fatigueIndex >= 80)
      return "Recomenda-se descanso ou treino leve de mobilidade.";
    if (fatigueIndex >= 60)
      return "Considera reduzir intensidade ou treinar outro grupo.";
    if (fatigueIndex >= 40)
      return "Podes treinar com ligeira redução de volume.";
    return "Recuperação boa. Podes treinar normalmente.";
  };

  const slides: React.ReactNode[] = [];

  // Card 1: Continue workout (only if active session)
  if (hasActiveSession) {
    const planned =
      activeSession!.planned_exercises?.filter((e: any) => e.source === "ai") || [];
    const completed = planned.filter((e: any) => e.completed).length;
    const total = planned.length;

    slides.push(
      <div key="continue" className={cardBase}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Treino em andamento</p>
            <p className="text-xs text-muted-foreground">
              {activeSession!.muscle_groups?.join(" + ")} · {completed}/{total}{" "}
              exercícios
            </p>
          </div>
        </div>

        <div className="w-full h-1.5 bg-muted rounded-full mb-3 overflow-hidden">
          <div
            className="h-full bg-foreground/60 rounded-full transition-all"
            style={{
              width: `${total > 0 ? (completed / total) * 100 : 0}%`,
            }}
          />
        </div>

        <div className="mt-auto">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/workout")}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-muted text-foreground font-semibold text-sm"
          >
            <Play className="w-4 h-4" />
            Continuar Treino
          </motion.button>
        </div>
      </div>
    );
  }

  // Card 2: Recovery state
  slides.push(
    <div key="recovery" className={cardBase}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
          <Activity className="w-5 h-5 text-foreground" />
        </div>
        <p className="text-sm font-bold text-foreground">Estado de Recuperação</p>
      </div>

      <p className="text-4xl font-black text-foreground mb-1">{fatigueIndex}%</p>
      <p className="text-sm font-semibold text-muted-foreground">
        {getFatigueLabel()}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{getFatigueDescription()}</p>
    </div>
  );

  // Card 3: Fatigue alert / Ready
  if (fatigueIndex >= 60) {
    slides.push(
      <motion.div
        key="fatigue"
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate("/chat")}
        className={`${cardBase} cursor-pointer`}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-foreground" />
          </div>
          <p className="text-sm font-bold text-foreground">Alerta de Fadiga</p>
        </div>

        <p className="text-lg font-bold text-foreground mb-1">
          ⚠ Fadiga alta — {fatigueIndex}%
        </p>
        <p className="text-xs text-muted-foreground">
          Considera reduzir a intensidade ou focar em recuperação. Toca para pedir
          conselho à IA.
        </p>
      </motion.div>
    );
  } else {
    slides.push(
      <div key="ready" className={cardBase}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-foreground" />
          </div>
          <p className="text-sm font-bold text-foreground">Pronto para treinar</p>
        </div>

        <p className="text-lg font-bold text-foreground mb-1">✓ Tudo em ordem</p>
        <p className="text-xs text-muted-foreground">
          Os teus níveis de recuperação estão bons. Bom treino!
        </p>
      </div>
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
          {slides.map((slide, i) => (
            <CarouselItem key={i} className="pl-3 basis-[92%]">
              {slide}
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      {slides.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {slides.map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30"
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};
