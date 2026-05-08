import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserSettings } from "@/hooks/useUserSettings";
import { toast } from "sonner";

const LOADING_MESSAGES = [
  "A analisar os teus objetivos...",
  "A calcular as tuas necessidades...",
  "A definir o teu plano de treino...",
  "A configurar o teu plano alimentar...",
  "A finalizar o teu plano personalizado...",
];

const DAYS = [
  "Segunda-feira", "Terça-feira", "Quarta-feira",
  "Quinta-feira", "Sexta-feira", "Sábado", "Domingo",
];

const DAY_SHORT: Record<string, string> = {
  "Segunda-feira": "Seg", "Terça-feira": "Ter", "Quarta-feira": "Qua",
  "Quinta-feira": "Qui", "Sexta-feira": "Sex", "Sábado": "Sáb", "Domingo": "Dom",
};

interface MealPlan {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  reason: string;
}

interface DayPlan {
  principal: string;
  secundario: string | null;
}

type WeeklyPlan = Record<string, DayPlan | "descanso">;

function calcMealPlan(
  goal: string | null,
  weight: number,
  height: number,
  age: number,
  gender: string
): MealPlan {
  const bmr =
    gender === "Feminino"
      ? 10 * weight + 6.25 * height - 5 * age - 161
      : 10 * weight + 6.25 * height - 5 * age + 5;
  const tdee = Math.round(bmr * 1.55);

  const configs: Record<string, { delta: number; p: number; c: number; f: number; name: string; reason: string }> = {
    "Ganhar massa muscular": { delta: 300, p: 2.2, c: 4.0, f: 1.0, name: "Plano de Volume", reason: "Superavit calórico para maximizar o crescimento muscular" },
    "Perder gordura":        { delta: -400, p: 2.4, c: 2.5, f: 0.8, name: "Plano de Definição", reason: "Défice calórico moderado preservando massa muscular" },
    "Ganhar força":          { delta: 150, p: 2.0, c: 3.5, f: 1.2, name: "Plano de Força", reason: "Suporte calórico para adaptações neuromusculares" },
    "Melhorar resistência":  { delta: 100, p: 1.8, c: 5.0, f: 0.9, name: "Plano de Resistência", reason: "Carbohidratos elevados para suportar treino aeróbico" },
    "Manter forma":          { delta: 0,   p: 1.8, c: 3.0, f: 1.0, name: "Plano de Manutenção", reason: "Calorias balanceadas para manter a composição atual" },
    "Recomposição corporal": { delta: 0,   p: 2.5, c: 2.5, f: 0.9, name: "Plano de Recomposição", reason: "Proteína elevada para perder gordura e ganhar músculo simultaneamente" },
  };

  const cfg = configs[goal || "Manter forma"] || configs["Manter forma"];

  return {
    name: cfg.name,
    calories: tdee + cfg.delta,
    protein: Math.round(weight * cfg.p),
    carbs:   Math.round(weight * cfg.c),
    fat:     Math.round(weight * cfg.f),
    reason: cfg.reason,
  };
}

function buildWeeklyPlan(schedule: Record<string, string[]>): WeeklyPlan {
  const plan: WeeklyPlan = {};
  for (const day of DAYS) {
    const muscles = schedule[day] || [];
    const isRest = muscles.length === 0 || (muscles.length === 1 && muscles[0] === "Descanso");
    plan[day] = isRest
      ? "descanso"
      : { principal: muscles[0], secundario: muscles[1] ?? null };
  }
  return plan;
}

export default function AvaliacaoInicial() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings, updateSettings } = useUserSettings();

  const [phase, setPhase] = useState<"loading" | "result">("loading");
  const [msgIdx, setMsgIdx] = useState(0);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan>({});
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const generated = useRef(false);

  // Rotate loading messages
  useEffect(() => {
    if (phase !== "loading") return;
    const id = setInterval(() => {
      setMsgIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 700);
    return () => clearInterval(id);
  }, [phase]);

  // Generate plan once settings are ready
  useEffect(() => {
    if (!settings || generated.current) return;
    generated.current = true;

    const timer = setTimeout(() => {
      const data = settings.onboarding_data as any;
      const personal = data?.personal || data?.personalData || {};
      const goal = data?.goal || null;
      const schedule = data?.schedule || {};
      const gender = personal.gender || "Masculino";
      const weight = parseFloat(personal.weight) || 75;
      const height = parseFloat(personal.height) || 175;
      const birthYear = parseInt(personal.birthYear) || 2000;
      const age = new Date().getFullYear() - birthYear;

      setWeeklyPlan(buildWeeklyPlan(schedule));
      setMealPlan(calcMealPlan(goal, weight, height, age, gender));
      setPhase("result");
    }, 3000);

    return () => clearTimeout(timer);
  }, [settings]);

  const savePlan = async (redirect: string) => {
    if (!user?.id || !mealPlan) return;
    setSaving(true);
    try {
      const currentData = (settings?.onboarding_data as any) || {};
      await updateSettings({
        onboarding_data: { ...currentData, mealPlan },
      });
      await supabase
        .from("user_settings")
        .update({ has_completed_onboarding: true } as any)
        .eq("user_id", user.id);
      localStorage.setItem(`liftmate_initial_evaluation_done_${user.id}`, "true");
      navigate(redirect, { replace: true });
    } catch {
      toast.error("Erro ao guardar o plano. Tenta novamente.");
    } finally {
      setSaving(false);
    }
  };

  const cardStyle = {
    background: "#141414",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  };

  if (phase === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ background: "#000" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-8 text-center">
          {/* Spinner */}
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-white/10" />
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          </div>

          <div>
            <p className="text-xl font-bold text-white mb-2">
              A criar o teu plano personalizado...
            </p>
            <AnimatePresence mode="wait">
              <motion.p
                key={msgIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="text-sm text-white/50">
                {LOADING_MESSAGES[msgIdx]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Animated dots */}
          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-blue-500"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-32"
      style={{ background: "#000", overflowY: "auto" }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-14 pb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 mb-1">
          Plano Gerado
        </p>
        <h1 className="text-2xl font-black text-white">O teu plano está pronto</h1>
        <p className="text-sm text-white/50 mt-1">
          A IA criou um plano personalizado com base nos teus dados
        </p>
      </motion.div>

      <div className="px-4 flex-1">

        {/* Weekly Plan Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={cardStyle}>
          <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">
            Plano de Treino
          </p>
          <div className="space-y-2">
            {DAYS.map(day => {
              const plan = weeklyPlan[day];
              const isRest = plan === "descanso";
              return (
                <div key={day} className="flex items-center justify-between py-1">
                  <span className="text-xs font-semibold text-white/40 w-8">
                    {DAY_SHORT[day]}
                  </span>
                  {isRest ? (
                    <span className="text-xs text-white/25 flex-1 ml-3">Descanso</span>
                  ) : (
                    <div className="flex gap-2 flex-1 ml-3 flex-wrap">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: "rgba(22,163,74,0.15)", color: "#16A34A", border: "1px solid rgba(22,163,74,0.3)" }}>
                        {(plan as DayPlan).principal}
                      </span>
                      {(plan as DayPlan).secundario && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: "rgba(37,99,235,0.15)", color: "#60A5FA", border: "1px solid rgba(37,99,235,0.3)" }}>
                          {(plan as DayPlan).secundario}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Meal Plan Card */}
        {mealPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={cardStyle}>
            <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">
              Plano Alimentar
            </p>
            <p className="text-base font-bold text-white mb-1">{mealPlan.name}</p>
            <p className="text-2xl font-black text-white mb-3">
              {mealPlan.calories} <span className="text-sm font-normal text-white/40">kcal/dia</span>
            </p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { label: "Proteína", value: mealPlan.protein, unit: "g" },
                { label: "Carbs", value: mealPlan.carbs, unit: "g" },
                { label: "Gordura", value: mealPlan.fat, unit: "g" },
              ].map(m => (
                <div key={m.label}
                  className="flex flex-col items-center py-2 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.04)" }}>
                  <span className="text-base font-black text-white">{m.value}<span className="text-xs font-normal text-white/40">{m.unit}</span></span>
                  <span className="text-[10px] text-white/40 mt-0.5">{m.label}</span>
                </div>
              ))}
            </div>
            <p className="text-xs italic text-white/35">{mealPlan.reason}</p>
          </motion.div>
        )}
      </div>

      {/* Bottom Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-4"
        style={{ background: "linear-gradient(to top, #000 70%, transparent)" }}>
        <div className="flex flex-col gap-3 max-w-lg mx-auto">
          <button
            disabled={saving}
            onClick={() => savePlan("/plano-semanal")}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-white"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)" }}>
            Fazer alterações
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            disabled={saving}
            onClick={() => savePlan("/home")}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white"
            style={{ background: saving ? "rgba(37,99,235,0.5)" : "#2563EB" }}>
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {saving ? "A guardar..." : "Continuar"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
