import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Leaf, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import gymBackground from "@/assets/gym-background.jpeg";

interface TodayWorkoutCardProps {
  workout: string | null;
  stimulus: string;
  isRestDay: boolean;
}

const tips: Record<string, string[]> = {
  peito: [
    "Começa pelo composto mais pesado enquanto estás fresco.",
    "Controla a descida no supino — a excêntrica é onde o músculo mais cresce.",
    "Varia o ângulo: inclinado recruta mais a porção clavicular.",
  ],
  costas: [
    "Foca a retração escapular para ativar as costas corretamente.",
    "Puxa com os cotovelos, não com as mãos — sente a contração.",
    "Alterna entre puxadas verticais e horizontais para desenvolvimento completo.",
  ],
  pernas: [
    "Não tenhas pressa na descida e foca na amplitude máxima.",
    "Aquece bem os joelhos — agachamento com barra vazia antes de carregar.",
    "Mantém os pés bem assentes e empurra pelo calcanhar.",
  ],
  ombros: [
    "Prioriza a técnica no overhead press para evitar lesões.",
    "Elevações laterais: controla o peso, não uses impulso.",
    "Aquece a coifa dos rotadores antes de pressões pesadas.",
  ],
  braços: [
    "Supersets de bíceps e tríceps maximizam o pump e poupam tempo.",
    "Controla a fase excêntrica — é onde o músculo mais cresce.",
    "Varia a pega: supinada, pronada e neutra para estímulos diferentes.",
  ],
  bíceps: [
    "Controla a fase excêntrica — é onde o músculo mais cresce.",
    "Rosca inclinada abre mais o bíceps para maior alongamento.",
    "Não balances o corpo — isola o movimento no cotovelo.",
  ],
  tríceps: [
    "Extensões overhead primeiro, depois isolamento por cabeça.",
    "Fundos em paralelas são o rei do desenvolvimento de tríceps.",
    "Mantém os cotovelos fixos e próximos do corpo.",
  ],
  glúteos: [
    "Hip thrust é o exercício mais eficaz — aperta no topo.",
    "Ativa os glúteos com bandas elásticas antes de começar.",
    "Mantém a tensão constante, sem repousar na posição inicial.",
  ],
  abdominais: [
    "Foca na contração, não na velocidade das repetições.",
    "Combina exercícios de flexão com anti-extensão para core completo.",
    "Respira corretamente: expira na contração, inspira no alongamento.",
  ],
};

function getMuscleTips(groups: string[]): { primary: string; extras: string[] } {
  for (const g of groups) {
    const key = g.toLowerCase();
    for (const [muscle, tipList] of Object.entries(tips)) {
      if (key.includes(muscle)) {
        return { primary: tipList[0], extras: tipList.slice(1) };
      }
    }
  }
  return {
    primary: "Mantém o foco e controla cada repetição.",
    extras: ["Aquece bem antes de começar.", "Hidrata-te entre séries."],
  };
}

function getMuscleLabel(workout: string | null): string {
  if (!workout) return "Treino";
  const parts = workout.split(/[•+,]/);
  const first = parts[0]?.trim();
  if (!first) return "Treino";

  const labelMap: Record<string, string> = {
    costas: "Back day",
    peito: "Chest day",
    pernas: "Leg day",
    ombros: "Shoulder day",
    braços: "Arm day",
    bíceps: "Arm day",
    tríceps: "Arm day",
    glúteos: "Glute day",
    abdominais: "Core day",
  };

  const lower = first.toLowerCase();
  for (const [key, label] of Object.entries(labelMap)) {
    if (lower.includes(key)) return label;
  }
  return first;
}

export function TodayWorkoutCard({ workout, stimulus, isRestDay }: TodayWorkoutCardProps) {
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);

  const muscleGroups = workout ? workout.split(/[•+,]/).map((s) => s.trim()) : [];
  const { primary, extras } = getMuscleTips(muscleGroups);
  const label = isRestDay ? "Dia de descanso" : getMuscleLabel(workout);

  return (
    <div className="space-y-3">
      {/* Main card — dark with gym background */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 120, damping: 18 }}
        className="relative overflow-hidden rounded-2xl"
        style={{ minHeight: 180 }}
      >
        {/* Background image */}
        <img
          src={gymBackground}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-end p-5 pb-6" style={{ minHeight: 180 }}>
          {isRestDay ? (
            <>
              <Leaf className="h-8 w-8 text-emerald-400 mb-3" />
              <h2 className="text-2xl font-black text-white leading-tight font-serif">
                {label}
              </h2>
              <p className="mt-1.5 text-sm text-white/70 font-serif italic leading-relaxed">
                O teu corpo precisa de descanso para crescer.
              </p>
            </>
          ) : (
            <>
              {/* Dumbbell icon */}
              <Dumbbell className="h-8 w-8 text-primary mb-3" />

              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h2 className="text-[26px] font-black text-white leading-tight font-serif">
                    {label}
                  </h2>
                  <p className="mt-1.5 text-sm text-white/70 font-serif italic leading-relaxed max-w-[75%]">
                    {primary}
                  </p>
                </div>

                {/* Ver mais */}
                <button
                  onClick={() => setShowMore(!showMore)}
                  className="flex items-center gap-0.5 text-xs text-white/60 hover:text-white/90 transition-colors mt-1 shrink-0"
                >
                  <span>{showMore ? "ver menos" : "ver mais"}</span>
                </button>
              </div>

              {/* Extra tips */}
              <AnimatePresence>
                {showMore && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                      {extras.map((tip, i) => (
                        <p key={i} className="text-xs text-white/60 font-serif italic leading-relaxed">
                          • {tip}
                        </p>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </motion.div>

      {/* Separate CTA button */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate("/workout")}
        className="w-full rounded-xl py-4 font-semibold text-[15px] flex items-center justify-center gap-2 transition-all"
        style={{
          backgroundColor: isRestDay ? "hsl(var(--muted))" : "#3B82F6",
          color: isRestDay ? "hsl(var(--muted-foreground))" : "#FFFFFF",
          boxShadow: isRestDay ? "none" : "0 4px 20px rgba(59,130,246,0.35)",
        }}
      >
        {isRestDay ? (
          <>
            <Leaf className="h-4 w-4" />
            Ver sugestão leve
          </>
        ) : (
          <>
            <Dumbbell className="h-4 w-4" />
            Iniciar treino
          </>
        )}
      </motion.button>
    </div>
  );
}
