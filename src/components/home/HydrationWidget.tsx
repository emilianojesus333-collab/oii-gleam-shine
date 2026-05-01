import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAlerts } from "@/hooks/useAlerts";
import { formatLiters, roundToOneDecimal } from "@/lib/hydration";

function hydrationContextText(currentIntakeLiters: number, goalLiters: number, pct: number): string {
  const remaining = roundToOneDecimal(Math.max(0, goalLiters - currentIntakeLiters));
  if (pct >= 100) return "Objetivo atingido! Excelente hidratação hoje. 💧";
  if (pct > 70)   return `Quase lá! Faltam apenas ${formatLiters(remaining)}L para atingir o objetivo.`;
  if (pct >= 30)  return `Estás a ${formatLiters(remaining)}L do objetivo diário de ${formatLiters(goalLiters)}L.`;
  return `Ainda precisas de ${formatLiters(remaining)}L — começa a beber agora.`;
}

const RING_SIZE = 64;
const RING_STROKE = 5;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export const HydrationWidget = () => {
  const navigate = useNavigate();
  const { hydrationSummary, addWaterIntake } = useAlerts();

  const { currentIntakeLiters, goalLiters, percentage } = hydrationSummary;
  const clampedPct = Math.min(percentage, 100);
  const dashOffset = CIRCUMFERENCE - (clampedPct / 100) * CIRCUMFERENCE;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      style={{
        background: "#121212",
        border: "1px solid rgba(56,189,248,0.55)",
        borderRadius: 20,
        boxShadow: "0 0 32px rgba(56,189,248,0.18), 0 0 8px rgba(56,189,248,0.1)",
        padding: 18,
        margin: "0 16px 10px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Clarão decorativo superior esquerdo */}
      <div style={{
        position: "absolute", top: -60, left: -60,
        width: 200, height: 200, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* Conteúdo */}
      <div style={{ position: "relative", zIndex: 1 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>💧</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Hidratação</span>
        </div>
        <button
          onClick={() => navigate("/hydration")}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#60A5FA" }}
        >
          Ver tudo →
        </button>
      </div>

      {/* Contexto */}
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 500, marginBottom: 12, lineHeight: 1.5 }}>
        {hydrationContextText(currentIntakeLiters, goalLiters, clampedPct)}
      </p>

      {/* Anel + valores */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <svg width={RING_SIZE} height={RING_SIZE} style={{ transform: "rotate(-90deg)" }}>
            <circle
              cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
              fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={RING_STROKE}
            />
            <motion.circle
              cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
              fill="none" stroke="#60A5FA" strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800, color: "#60A5FA",
          }}>
            {Math.round(clampedPct)}%
          </div>
        </div>

        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>
            {formatLiters(currentIntakeLiters)}L
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
            de {formatLiters(goalLiters)}L hoje
          </div>
        </div>
      </div>

      {/* Barra de progresso */}
      <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden", marginBottom: 14 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedPct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ height: "100%", background: "linear-gradient(90deg, #38BDF8, #60A5FA)", borderRadius: 2 }}
        />
      </div>

      {/* Botões */}
      <div style={{ display: "flex", gap: 8 }}>
        {[{ label: "+150ml", liters: 0.15 }, { label: "+250ml", liters: 0.25 }].map(({ label, liters }) => (
          <button
            key={label}
            onClick={() => addWaterIntake(liters)}
            style={{
              flex: 1, height: 36, borderRadius: 10,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => navigate("/hydration")}
          style={{
            flex: 1, height: 36, borderRadius: 10,
            background: "#2563EB", border: "none",
            color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}
        >
          + Adicionar
        </button>
      </div>

      </div>{/* fim conteúdo */}
    </motion.div>
  );
};
