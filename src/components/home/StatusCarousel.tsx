import { motion } from "framer-motion";
import { Activity, AlertTriangle, TrendingUp, Dumbbell, Clock } from "lucide-react";
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
  "w-full rounded-2xl border border-border/50 bg-card p-5 flex flex-col min-h-[180px]";

export const StatusCarousel = () => {
  const navigate = useNavigate();
  const { muscles, fatigued, mostRecovered, loading } = useMuscleFatigue();

  if (loading) return null;

  const slides: React.ReactNode[] = [];

  // Card 1 — Estado muscular hoje (always)
  slides.push(
    <div key="muscle-status" className={cardBase}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
          <Activity className="w-5 h-5 text-emerald-500" />
        </div>
        <p className="text-sm font-bold text-foreground">Estado muscular hoje</p>
      </div>

      <div className="space-y-2.5 flex-1">
        {muscles.map((m) => (
          <div key={m.muscle_group} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getStatusDotColor(m.status)}`} />
              <span className="text-sm text-foreground">{getMuscleLabel(m.muscle_group)}</span>
            </div>
            <span className={`text-xs font-medium ${getStatusColor(m.status)}`}>
              {getStatusLabel(m.status)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  // Card 2 — Tendência de recuperação (always)
  const recovering = muscles.filter((m) => m.current_fatigue > 0);
  slides.push(
    <div key="recovery-trend" className={cardBase}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-blue-500" />
        </div>
        <p className="text-sm font-bold text-foreground">Recuperação em progresso</p>
      </div>

      <div className="space-y-3 flex-1">
        {recovering.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todos os músculos estão recuperados. Bom treino!
          </p>
        ) : (
          recovering
            .sort((a, b) => b.hours_to_recovery - a.hours_to_recovery)
            .map((m) => (
              <div key={m.muscle_group} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm text-foreground">{getMuscleLabel(m.muscle_group)}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  ≈ {m.hours_to_recovery}h para recuperar
                </span>
              </div>
            ))
        )}

        {mostRecovered.length > 0 && recovering.length > 0 && (
          <div className="pt-2 mt-auto border-t border-border/30">
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-500">Sugestão de treino hoje</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Músculos mais recuperados:{" "}
              <span className="text-foreground font-medium">
                {mostRecovered.map((m) => getMuscleLabel(m.muscle_group)).join(", ")}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // Card 3 — Alerta de fadiga (condicional: apenas se algum músculo > 70%)
  if (fatigued.length > 0) {
    slides.push(
      <motion.div
        key="fatigue-alert"
        whileTap={{ scale: 0.97 }}
        onClick={() =>
          navigate("/chat", {
            state: {
              prefill: `Os meus músculos com fadiga alta são: ${fatigued
                .map((m) => `${getMuscleLabel(m.muscle_group)} (${m.current_fatigue}%)`)
                .join(", ")}. Que treino recomendam para hoje?`,
            },
          })
        }
        className={`${cardBase} cursor-pointer`}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-sm font-bold text-foreground">Fadiga elevada detectada</p>
        </div>

        <div className="space-y-2 mb-3">
          {fatigued.map((m) => (
            <p key={m.muscle_group} className="text-sm text-red-400">
              {getMuscleLabel(m.muscle_group)} com fadiga alta ({m.current_fatigue}%)
            </p>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Treinar novamente agora pode reduzir desempenho. Considera treinar outro grupo muscular
          hoje.
        </p>
        <p className="text-xs text-primary mt-2 font-medium">Toca para pedir conselho à IA →</p>
      </motion.div>
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
            <CarouselItem key={i} className="pl-3 basis-full">
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
