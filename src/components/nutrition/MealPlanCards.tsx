import { useState } from "react";
import { motion } from "framer-motion";
import { useUserSettings } from "@/hooks/useUserSettings";
import { HexBadge } from "@/components/ui/HexBadge";

const PLANS = [
  {
    id: "definicao",
    emoji: "🔥",
    name: "Plano de Definição",
    description: "Défice calórico · Alta proteína",
    calories: 2200,
    accentColor: "#34D399",
    bars: [
      { color: "#60A5FA", width: 19 },
      { color: "#FBBF24", width: 14 },
      { color: "#F87171", width: 14 },
    ],
  },
  {
    id: "lowcarb",
    emoji: "🥑",
    name: "Plano Low-Carb",
    description: "Baixo em hidratos · Alta gordura",
    calories: 1900,
    accentColor: "#A78BFA",
    bars: [
      { color: "#60A5FA", width: 17 },
      { color: "#FBBF24", width: 7 },
      { color: "#F87171", width: 24 },
    ],
  },
  {
    id: "manutencao",
    emoji: "⚖️",
    name: "Plano de Manutenção",
    description: "Calorias equilibradas",
    calories: 2800,
    accentColor: "#FBBF24",
    bars: [
      { color: "#60A5FA", width: 14 },
      { color: "#FBBF24", width: 19 },
      { color: "#F87171", width: 14 },
    ],
  },
  {
    id: "vegetariano",
    emoji: "🌱",
    name: "Plano Vegetariano",
    description: "Baseado em plantas",
    calories: 2400,
    accentColor: "#34D399",
    bars: [
      { color: "#60A5FA", width: 12 },
      { color: "#FBBF24", width: 24 },
      { color: "#F87171", width: 12 },
    ],
  },
] as const;

const SVG_PATH = "M10,0 L350,0 Q360,0 360,10 L360,78 Q360,88 350,88 L10,88 Q0,88 0,76 L0,12 Q0,0 10,0 Z";

export const MealPlanCards = () => {
  const { settings, updateSettings } = useUserSettings();

  // Read active plan from onboarding_data (stored as nutrition_plan key)
  const storedPlan = (settings?.onboarding_data as Record<string, unknown> | null)?.nutrition_plan as string | undefined;
  const [activePlan, setActivePlan] = useState<string>(storedPlan ?? "definicao");

  const handleSelect = async (planId: string) => {
    setActivePlan(planId);
    try {
      await updateSettings({
        onboarding_data: {
          ...(settings?.onboarding_data ?? {}),
          nutrition_plan: planId,
        } as Parameters<typeof updateSettings>[0]["onboarding_data"],
      });
    } catch {
      // revert on failure
      setActivePlan(activePlan);
    }
  };

  return (
    <div>
      {/* Section title */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <HexBadge label="NU" />
        <h2 style={{
          fontSize: 20,
          fontWeight: 900,
          color: "white",
          letterSpacing: "-0.01em",
          margin: 0,
        }}>
          Planos Alimentares
        </h2>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {PLANS.map((plan) => {
          const isActive = activePlan === plan.id;
          return (
            <motion.button
              key={plan.id}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(plan.id)}
              style={{
                position: "relative",
                height: 88,
                width: "100%",
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
                display: "block",
              }}
            >
              {/* SVG card shape */}
              <svg
                viewBox="0 0 360 88"
                preserveAspectRatio="none"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
              >
                <path
                  d={SVG_PATH}
                  fill="#0F1923"
                  stroke="rgba(255,255,255,0.07)"
                  strokeWidth="1"
                />
                {/* Left accent bar */}
                <rect
                  x="0"
                  y="16"
                  width="3"
                  height="56"
                  rx="1.5"
                  fill={plan.accentColor}
                />
              </svg>

              {/* Content overlay */}
              <div style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                padding: "0 18px 0 20px",
                gap: 14,
              }}>
                {/* Emoji */}
                <span style={{ fontSize: 28, flexShrink: 0, lineHeight: 1 }}>
                  {plan.emoji}
                </span>

                {/* Middle */}
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{
                      fontSize: 14,
                      fontWeight: 900,
                      color: "white",
                      letterSpacing: "-0.01em",
                    }}>
                      {plan.name}
                    </span>
                    {isActive && (
                      <span style={{
                        fontSize: 8,
                        fontWeight: 800,
                        padding: "3px 8px",
                        borderRadius: 20,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        background: "rgba(52,211,153,0.15)",
                        color: "#34D399",
                        border: "1px solid rgba(52,211,153,0.28)",
                        flexShrink: 0,
                      }}>
                        Activo
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.32)" }}>
                    {plan.description}
                  </span>
                </div>

                {/* Right */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span style={{
                    fontSize: 18,
                    fontWeight: 900,
                    lineHeight: 1,
                    color: isActive ? plan.accentColor : "rgba(255,255,255,0.55)",
                    display: "block",
                  }}>
                    {plan.calories}
                  </span>
                  <span style={{
                    fontSize: 9,
                    color: "rgba(255,255,255,0.25)",
                    marginTop: 1,
                    display: "block",
                  }}>
                    kcal/dia
                  </span>
                  {/* Mini macro bars */}
                  <div style={{
                    display: "flex",
                    gap: 4,
                    marginTop: 5,
                    justifyContent: "flex-end",
                  }}>
                    {plan.bars.map((bar, i) => (
                      <div
                        key={i}
                        style={{
                          height: 3,
                          width: bar.width,
                          borderRadius: 2,
                          background: bar.color,
                          opacity: isActive ? 1 : 0.45,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
