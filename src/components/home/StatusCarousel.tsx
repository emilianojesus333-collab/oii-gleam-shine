import { motion } from "framer-motion";
import { Play, Dumbbell, Activity, AlertTriangle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useActiveSession } from "@/hooks/useActiveSession";

interface StatusCarouselProps {
  fatigueIndex: number;
}

export const StatusCarousel = ({ fatigueIndex }: StatusCarouselProps) => {
  const navigate = useNavigate();
  const { activeSession, loading } = useActiveSession();
  const hasActiveSession = !loading && !!activeSession && (activeSession.status === "in_progress" || activeSession.status === "planned");

  const getFatigueLabel = () => {
    if (fatigueIndex >= 80) return "Fadiga muito alta";
    if (fatigueIndex >= 60) return "Fadiga alta";
    if (fatigueIndex >= 40) return "Fadiga moderada";
    return "Fadiga baixa";
  };

  const getFatigueColor = () => {
    if (fatigueIndex >= 80) return "text-red-400";
    if (fatigueIndex >= 60) return "text-orange-400";
    if (fatigueIndex >= 40) return "text-yellow-400";
    return "text-green-400";
  };

  const getFatigueBg = () => {
    if (fatigueIndex >= 80) return "bg-red-500/10 border-red-500/20";
    if (fatigueIndex >= 60) return "bg-orange-500/10 border-orange-500/20";
    if (fatigueIndex >= 40) return "bg-yellow-500/10 border-yellow-500/20";
    return "bg-green-500/10 border-green-500/20";
  };

  const slides: React.ReactNode[] = [];

  // Card 1: Continue workout (only if active session)
  if (hasActiveSession) {
    const planned = activeSession!.planned_exercises?.filter((e: any) => e.source === "ai") || [];
    const completed = planned.filter((e: any) => e.completed).length;
    const total = planned.length;

    slides.push(
      <motion.button
        key="continue"
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate("/workout")}
        className="w-full rounded-2xl bg-primary/10 border border-primary/30 p-5 text-left"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Treino em andamento</p>
            <p className="text-xs text-muted-foreground">
              {activeSession!.muscle_groups?.join(" + ")} · {completed}/{total} exercícios
            </p>
          </div>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full mb-3 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
          />
        </div>
        <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-primary/20">
          <Play className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-primary">Continuar Treino</span>
        </div>
      </motion.button>
    );
  }

  // Card 2: Recovery state
  slides.push(
    <div key="recovery" className={`w-full rounded-2xl border p-5 ${getFatigueBg()}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          fatigueIndex >= 60 ? 'bg-orange-500/20' : 'bg-green-500/20'
        }`}>
          <Activity className={`w-5 h-5 ${getFatigueColor()}`} />
        </div>
        <p className="text-sm font-bold text-foreground">Estado de Recuperação</p>
      </div>
      <p className={`text-4xl font-black ${getFatigueColor()} mb-1`}>
        {fatigueIndex}%
      </p>
      <p className={`text-sm font-semibold ${getFatigueColor()}`}>
        {getFatigueLabel()}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {fatigueIndex >= 80
          ? "Recomenda-se descanso ou treino leve de mobilidade."
          : fatigueIndex >= 60
          ? "Considera reduzir intensidade ou treinar outro grupo."
          : fatigueIndex >= 40
          ? "Podes treinar com ligeira redução de volume."
          : "Recuperação boa. Podes treinar normalmente."}
      </p>
    </div>
  );

  // Card 3: Fatigue alert / Ready
  if (fatigueIndex >= 60) {
    slides.push(
      <motion.div
        key="fatigue"
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate("/chat")}
        className="w-full rounded-2xl bg-orange-500/10 border border-orange-500/20 p-5 cursor-pointer"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
          </div>
          <p className="text-sm font-bold text-foreground">Alerta de Fadiga</p>
        </div>
        <p className="text-lg font-bold text-orange-400 mb-1">
          ⚠ Fadiga alta — {fatigueIndex}%
        </p>
        <p className="text-xs text-muted-foreground">
          Considera reduzir a intensidade ou focar em recuperação. Toca para pedir conselho à IA.
        </p>
      </motion.div>
    );
  } else {
    slides.push(
      <div key="ready" className="w-full rounded-2xl bg-green-500/10 border border-green-500/20 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-sm font-bold text-foreground">Pronto para treinar</p>
        </div>
        <p className="text-lg font-bold text-green-400 mb-1">
          ✓ Tudo em ordem
        </p>
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
      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {slides.map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
          ))}
        </div>
      )}
    </motion.div>
  );
};
