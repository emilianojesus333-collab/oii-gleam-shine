import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useUserSettings } from "@/hooks/useUserSettings";

interface MacroGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealPlan {
  id: string;
  emoji: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  accentColor: string;
  ideal: string;
  eat: string[];
  avoid: string[];
}

const PLANS: MealPlan[] = [
  {
    id: "definicao",
    emoji: "🔥",
    name: "Plano de Definição",
    description: "Défice calórico · Alta proteína",
    calories: 2200,
    protein: 200,
    carbs: 180,
    fat: 70,
    accentColor: "#4ADE80",
    ideal: "Perda de gordura com manutenção muscular",
    eat: ["Frango", "Ovos", "Batata-doce", "Arroz integral", "Atum"],
    avoid: ["Álcool", "Açúcar", "Fritos", "Fast food"],
  },
  {
    id: "lowcarb",
    emoji: "🥑",
    name: "Plano Low-Carb",
    description: "Baixo em hidratos · Alta gordura",
    calories: 1900,
    protein: 180,
    carbs: 50,
    fat: 100,
    accentColor: "#A78BFA",
    ideal: "Perda de gordura rápida com treinos de força",
    eat: ["Frango", "Ovos", "Abacate", "Salmão", "Brócolos"],
    avoid: ["Pão", "Arroz", "Massa", "Açúcar", "Sumos"],
  },
  {
    id: "manutencao",
    emoji: "⚖️",
    name: "Plano de Manutenção",
    description: "Calorias equilibradas",
    calories: 2800,
    protein: 180,
    carbs: 280,
    fat: 90,
    accentColor: "#FBBF24",
    ideal: "Manter peso e composição corporal",
    eat: ["Arroz", "Frango", "Frutas", "Vegetais", "Ovos"],
    avoid: ["Álcool excessivo", "Ultra-processados"],
  },
  {
    id: "vegetariano",
    emoji: "🌱",
    name: "Plano Vegetariano",
    description: "Baseado em plantas",
    calories: 2400,
    protein: 150,
    carbs: 280,
    fat: 80,
    accentColor: "#4ADE80",
    ideal: "Alimentação plant-based equilibrada",
    eat: ["Tofu", "Leguminosas", "Quinoa", "Nozes", "Vegetais"],
    avoid: ["Carnes", "Peixe", "Lacticínios em excesso"],
  },
];

const SVG_PATH = "M10,0 L350,0 Q360,0 360,10 L360,78 Q360,88 350,88 L10,88 Q0,88 0,76 L0,12 Q0,0 10,0 Z";

const MacroBar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.50)", fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: "white" }}>{value}g</span>
      </div>
      <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
};

interface Props {
  onActivate?: (goals: Partial<MacroGoals>) => void;
}

export const MealPlanCards = ({ onActivate }: Props) => {
  const { settings, updateSettings } = useUserSettings();

  const storedPlan = (settings?.onboarding_data as Record<string, unknown> | null)?.nutrition_plan as string | undefined;
  const [activePlan, setActivePlan] = useState<string>(storedPlan ?? "definicao");
  const [detailPlan, setDetailPlan] = useState<MealPlan | null>(null);

  const tapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapCount = useRef(0);
  const tapPlan = useRef<MealPlan | null>(null);

  const activatePlan = async (plan: MealPlan) => {
    setActivePlan(plan.id);
    onActivate?.({ calories: plan.calories, protein: plan.protein, carbs: plan.carbs, fat: plan.fat });
    try {
      await updateSettings({
        onboarding_data: {
          ...(settings?.onboarding_data ?? {}),
          nutrition_plan: plan.id,
        } as Parameters<typeof updateSettings>[0]["onboarding_data"],
      });
    } catch {
      setActivePlan(activePlan);
    }
  };

  const handlePlanTap = (plan: MealPlan) => {
    if (tapPlan.current?.id !== plan.id) {
      if (tapTimeout.current) clearTimeout(tapTimeout.current);
      tapCount.current = 0;
    }
    tapPlan.current = plan;
    tapCount.current += 1;

    if (tapCount.current === 1) {
      tapTimeout.current = setTimeout(() => {
        tapCount.current = 0;
        activatePlan(plan);
      }, 300);
    } else if (tapCount.current >= 2) {
      if (tapTimeout.current) clearTimeout(tapTimeout.current);
      tapCount.current = 0;
      setDetailPlan(plan);
    }
  };

  return (
    <div>
      {/* Section title */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: "white", letterSpacing: "-0.01em", margin: 0 }}>
          Planos Alimentares
        </h2>
      </div>

      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.30)", marginBottom: 10, marginTop: -8 }}>
        1 toque para ativar · 2 toques para detalhes
      </p>

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {PLANS.map((plan) => {
          const isActive = activePlan === plan.id;
          return (
            <motion.button
              key={plan.id}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePlanTap(plan)}
              style={{
                position: "relative", height: 88, width: "100%",
                background: "transparent", border: "none", padding: 0,
                cursor: "pointer", display: "block",
              }}
            >
              <svg viewBox="0 0 360 88" preserveAspectRatio="none"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
                <path d={SVG_PATH} fill="#1A1A1A" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
                <rect x="0" y="16" width="3" height="56" rx="1.5" fill={plan.accentColor} />
              </svg>

              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center",
                padding: "0 18px 0 20px", gap: 14,
              }}>
                <span style={{ fontSize: 28, flexShrink: 0, lineHeight: 1 }}>{plan.emoji}</span>

                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: "white", letterSpacing: "-0.01em" }}>
                      {plan.name}
                    </span>
                    {isActive && (
                      <span style={{
                        fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 20,
                        letterSpacing: "0.06em", textTransform: "uppercase",
                        background: "rgba(74,222,128,0.15)", color: "#4ADE80",
                        border: "1px solid rgba(74,222,128,0.28)", flexShrink: 0,
                      }}>
                        Activo
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.30)" }}>{plan.description}</span>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span style={{
                    fontSize: 18, fontWeight: 900, lineHeight: 1, display: "block",
                    color: isActive ? plan.accentColor : "rgba(255,255,255,0.50)",
                  }}>
                    {plan.calories}
                  </span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.30)", marginTop: 1, display: "block" }}>
                    kcal/dia
                  </span>
                  <div style={{ display: "flex", gap: 4, marginTop: 5, justifyContent: "flex-end" }}>
                    {[
                      { color: "#60A5FA", value: plan.protein, max: 250 },
                      { color: "#FBBF24", value: plan.carbs, max: 350 },
                      { color: "#F87171", value: plan.fat, max: 130 },
                    ].map((bar, i) => (
                      <div key={i} style={{
                        height: 3, width: Math.round((bar.value / bar.max) * 32) + 8,
                        borderRadius: 2, background: bar.color,
                        opacity: isActive ? 1 : 0.45,
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {detailPlan && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailPlan(null)}
              style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
                zIndex: 50, backdropFilter: "blur(4px)",
              }}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              style={{
                position: "fixed", bottom: 0, left: 0, right: 0,
                background: "#141414", borderRadius: "20px 20px 0 0",
                zIndex: 51, maxHeight: "85vh", overflowY: "auto",
                paddingBottom: 32,
              }}
            >
              {/* Handle */}
              <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 8px" }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
              </div>

              {/* Close */}
              <button
                onClick={() => setDetailPlan(null)}
                style={{
                  position: "absolute", top: 14, right: 16,
                  background: "rgba(255,255,255,0.07)", border: "none",
                  borderRadius: "50%", width: 32, height: 32,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={16} color="rgba(255,255,255,0.50)" />
              </button>

              <div style={{ padding: "0 20px" }}>
                {/* Header */}
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: 40, display: "block", marginBottom: 8 }}>{detailPlan.emoji}</span>
                  <h3 style={{ fontSize: 22, fontWeight: 900, color: "white", margin: "0 0 6px" }}>
                    {detailPlan.name}
                  </h3>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.50)", margin: 0 }}>
                    {detailPlan.description}
                  </p>
                </div>

                {/* Calories card */}
                <div style={{
                  background: "#1A1A1A", borderRadius: 14,
                  padding: "16px", marginBottom: 14, textAlign: "center",
                  border: `1px solid ${detailPlan.accentColor}33`,
                }}>
                  <span style={{ fontSize: 42, fontWeight: 900, color: detailPlan.accentColor, lineHeight: 1 }}>
                    {detailPlan.calories}
                  </span>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.50)", margin: "4px 0 0" }}>kcal por dia</p>
                </div>

                {/* Macro bars */}
                <div style={{
                  background: "#1A1A1A", borderRadius: 14,
                  padding: "16px", marginBottom: 14,
                  display: "flex", flexDirection: "column", gap: 12,
                }}>
                  <MacroBar label="Proteína" value={detailPlan.protein} max={250} color="#60A5FA" />
                  <MacroBar label="Hidratos" value={detailPlan.carbs} max={350} color="#FBBF24" />
                  <MacroBar label="Gordura" value={detailPlan.fat} max={130} color="#F87171" />
                </div>

                {/* Ideal para */}
                <div style={{
                  background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)",
                  borderRadius: 12, padding: "12px 14px", marginBottom: 14,
                }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.50)", letterSpacing: "0.1em", marginBottom: 4 }}>
                    IDEAL PARA
                  </p>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.90)", margin: 0, fontWeight: 600 }}>
                    {detailPlan.ideal}
                  </p>
                </div>

                {/* Comer mais */}
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.50)", letterSpacing: "0.08em", marginBottom: 8 }}>
                    ✅ COMER MAIS
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {detailPlan.eat.map((item) => (
                      <span key={item} style={{
                        fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 20,
                        background: "rgba(74,222,128,0.1)", color: "#4ADE80",
                        border: "1px solid rgba(74,222,128,0.2)",
                      }}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Evitar */}
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.50)", letterSpacing: "0.08em", marginBottom: 8 }}>
                    ❌ EVITAR
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {detailPlan.avoid.map((item) => (
                      <span key={item} style={{
                        fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 20,
                        background: "rgba(248,113,113,0.1)", color: "#F87171",
                        border: "1px solid rgba(248,113,113,0.2)",
                      }}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* CTA button */}
                {activePlan === detailPlan.id ? (
                  <button style={{
                    width: "100%", height: 52, borderRadius: 14, cursor: "pointer",
                    background: "transparent", border: "2px solid #16A34A",
                    color: "#4ADE80", fontSize: 15, fontWeight: 800,
                  }}>
                    ✓ Plano já ativo
                  </button>
                ) : (
                  <button
                    onClick={() => { activatePlan(detailPlan); setDetailPlan(null); }}
                    style={{
                      width: "100%", height: 52, borderRadius: 14, cursor: "pointer",
                      background: "#16A34A", border: "none",
                      color: "white", fontSize: 15, fontWeight: 800,
                    }}
                  >
                    Ativar este plano
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
