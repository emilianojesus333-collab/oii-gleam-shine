import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Dumbbell, Leaf } from "lucide-react";

interface TodayWorkoutCardProps {
  workout: string | null;
  stimulus: string;
  isRestDay: boolean;
}

const MUSCLE_TIPS: Record<string, string[]> = {
  "Peito": ["Mantém os ombros retraídos durante todo o movimento.", "Desce controlado — o excêntrico constrói mais músculo.", "Experimenta uma pegada mais larga para mais ativação peitoral."],
  "Costas": ["Foca a retração escapular para ativar as costas corretamente.", "Puxa com o cotovelo, não com a mão.", "Controla a descida para maximizar o alongamento do dorsal."],
  "Pernas": ["Não tenhas pressa na descida e foca na amplitude máxima.", "Mantém o peso no calcanhar durante o agachamento.", "Activa o glúteo no topo do movimento para maior estabilidade."],
  "Ombros": ["Evita elevar os trapézios durante o desenvolvimento.", "Inclui movimentos laterais para um ombro mais redondo.", "Controla o excêntrico nas elevações laterais — 3 segundos."],
  "Bíceps": ["Mantém os cotovelos fixos ao longo de todo o curl.", "O pico de contração vale mais do que o peso.", "Varia a pegada para desenvolvimento completo."],
  "Tríceps": ["Bloqueia os cotovelos junto ao corpo para isolar o tríceps.", "A extensão acima da cabeça alonga mais a cabeça longa.", "Faz o lockout completo para ativar todo o músculo."],
  "Abdominais": ["Respira fundo e contrai o core antes de cada repetição.", "A tensão importa mais do que a amplitude.", "Varia entre flexão, rotação e anti-rotação para desenvolvimento total."],
  "Glúteos": ["Activa o glúteo antes de começar — ponte com pausa de 2s.", "No hip thrust, empurra com os calcanhares.", "Faz squeeze no topo e mantém 1 segundo."],
  "Descanso": ["O crescimento acontece na recuperação. Descansa bem.", "Hidratação e sono são parte do treino.", "Um dia de descanso ativo acelera a recuperação."],
};

const DEFAULT_TIPS = ["Aquece bem — 10 minutos previnem lesões.", "Foca na técnica primeiro, a carga vem depois.", "Regista o treino para acompanhar a progressão."];

function getTodayTip(muscleGroups: string | null): string {
  const dayIdx = new Date().getDay();
  if (!muscleGroups) return DEFAULT_TIPS[dayIdx % DEFAULT_TIPS.length];
  const firstMuscle = muscleGroups.split(/[•+,]/)[0].trim();
  const tips = MUSCLE_TIPS[firstMuscle] || DEFAULT_TIPS;
  return tips[dayIdx % tips.length];
}

function getWorkoutName(workout: string | null, isRestDay: boolean): string {
  if (isRestDay) return "Rest day";
  if (!workout) return "Treino livre";
  const parts = workout.split(/[•+]/).map((s) => s.trim()).filter(Boolean);
  if (parts.length === 1) return `${parts[0]} day`;
  if (parts.length === 2) return `${parts[0]} & ${parts[1]} day`;
  return parts.join(" · ") + " day";
}

export function TodayWorkoutCard({ workout, stimulus, isRestDay }: TodayWorkoutCardProps) {
  const navigate = useNavigate();
  const tip = getTodayTip(workout);
  const workoutName = getWorkoutName(workout, isRestDay);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }} className="px-1 mb-2">
      <motion.h2 key={workoutName} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-black leading-tight text-white" style={{ fontSize: 36, letterSpacing: "-0.02em", marginBottom: 10 }}>
        {workoutName}
      </motion.h2>
      <motion.p key={tip} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className="leading-relaxed" style={{ fontSize: 15, color: "rgba(255,255,255,0.52)", fontStyle: "italic", marginBottom: 28, maxWidth: 300 }}>
        {tip}
      </motion.p>
      <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate("/workout")} className="flex items-center justify-center gap-2 font-semibold" style={{ width: 312, height: 56, borderRadius: 16, backgroundColor: isRestDay ? "#1F2937" : "#2563EB", color: isRestDay ? "rgba(255,255,255,0.5)" : "#fff", fontSize: 15, border: "none", cursor: "pointer", boxShadow: isRestDay ? "none" : "0 4px 20px rgba(37,99,235,0.35)" }}>
        {isRestDay ? (<><Leaf style={{ width: 16, height: 16 }} />Ver sugestão leve</>) : (<><Dumbbell style={{ width: 16, height: 16 }} />Iniciar treino</>)}
      </motion.button>
    </motion.div>
  );
}
