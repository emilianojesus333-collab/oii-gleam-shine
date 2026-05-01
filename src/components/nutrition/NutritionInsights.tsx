import { motion } from "framer-motion";
import { Zap, Info } from "lucide-react";
import { HexBadge } from "@/components/ui/HexBadge";
import { useWorkoutNutritionSync } from "@/hooks/useWorkoutNutritionSync";

interface NutritionInsightsProps {
  proteinConsumed: number;
  proteinGoal: number;
}

export const NutritionInsights = ({ proteinConsumed, proteinGoal }: NutritionInsightsProps) => {
  const { phase, minutesSinceWorkout, nutritionTip } = useWorkoutNutritionSync();

  // Card 1 — post-workout / time-sensitive
  const card1Description = (() => {
    if (phase === "post_workout" && minutesSinceWorkout !== null && minutesSinceWorkout <= 120) {
      return nutritionTip;
    }
    if (phase === "recovery") {
      return nutritionTip;
    }
    if (phase === "during") {
      return nutritionTip;
    }
    return "Consumir 30g de proteína nas próximas 2h melhora recuperação.";
  })();

  // Card 2 — protein distribution tip
  const proteinPct = proteinGoal > 0 ? proteinConsumed / proteinGoal : 0;
  const card2Description = (() => {
    if (proteinPct >= 1) {
      return `Atingiste a meta de ${proteinGoal}g de proteína hoje! Excelente trabalho.`;
    }
    if (proteinPct < 0.5) {
      return `Ainda longe da meta (${proteinConsumed}g / ${proteinGoal}g). Adiciona uma refeição rica em proteína.`;
    }
    return "20–40g por refeição melhora absorção e recuperação.";
  })();

  return (
    <div>
      {/* Section title */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 24, marginBottom: 16 }}>
        <HexBadge label="NU" />
        <h2
          style={{
            fontSize: 20,
            fontWeight: 900,
            color: "white",
            letterSpacing: "-0.01em",
            margin: 0,
          }}
        >
          Insights De Hoje
        </h2>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

        {/* Card 1 — Pós-treino (urgent/active) */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          style={{
            background: "#1A1A1A",
            borderBottom: "1px solid #2A2A2A",
            borderRadius: 0,
            padding: "16px",
            marginBottom: 12,
            cursor: "pointer",
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
          }}
        >
          {/* Icon box */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(232,101,10,0.15)",
              flexShrink: 0,
              marginTop: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Zap size={17} color="#E8650A" />
          </div>

          {/* Content */}
          <div style={{ flex: 1 }}>
            {/* Title row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 800, color: "white" }}>
                Pós-treino
              </span>
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 800,
                  padding: "2px 7px",
                  borderRadius: 20,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  background: "rgba(232,101,10,0.15)",
                  color: "#E8650A",
                  border: "1px solid rgba(232,101,10,0.25)",
                  flexShrink: 0,
                }}
              >
                Agora
              </span>
            </div>

            {/* Description */}
            <p
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.4)",
                lineHeight: 1.6,
                margin: 0,
                marginTop: 6,
              }}
            >
              {card1Description}
            </p>
          </div>
        </motion.div>

        {/* Card 2 — Distribui a proteína (info) */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          style={{
            background: "#1A1A1A",
            borderBottom: "1px solid #2A2A2A",
            borderRadius: 0,
            padding: "16px",
            marginBottom: 12,
            cursor: "pointer",
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
          }}
        >
          {/* Icon box */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(96,165,250,0.12)",
              flexShrink: 0,
              marginTop: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Info size={17} color="#60A5FA" />
          </div>

          {/* Content */}
          <div style={{ flex: 1 }}>
            {/* Title row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 800, color: "white" }}>
                Distribui a proteína
              </span>
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 800,
                  padding: "2px 7px",
                  borderRadius: 20,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  background: "rgba(96,165,250,0.12)",
                  color: "#60A5FA",
                  border: "1px solid rgba(96,165,250,0.22)",
                  flexShrink: 0,
                }}
              >
                Dica
              </span>
            </div>

            {/* Description */}
            <p
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.4)",
                lineHeight: 1.6,
                margin: 0,
                marginTop: 6,
              }}
            >
              {card2Description}
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  );
};
