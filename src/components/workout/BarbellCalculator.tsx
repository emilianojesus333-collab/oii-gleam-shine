import { useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

const PLATE_COLORS: Record<number, string> = {
  25: "#F87171",   // red
  20: "#60A5FA",   // blue
  15: "#FBBF24",   // yellow
  10: "#34D399",   // green
  5:  "#C084FC",   // purple
  2.5: "#FB923C",  // orange
  1.25: "#94A3B8", // gray
};

const PLATE_WIDTH: Record<number, number> = {
  25: 18, 20: 16, 15: 14, 10: 12, 5: 10, 2.5: 8, 1.25: 6,
};

const BAR_TYPES = [
  { label: "Barra olímpica", weight: 20 },
  { label: "Barra curta", weight: 10 },
  { label: "EZ bar", weight: 10 },
  { label: "Barra sem peso", weight: 0 },
];

function calcPlates(targetWeight: number, barWeight: number): number[] {
  const weightPerSide = (targetWeight - barWeight) / 2;
  if (weightPerSide < 0) return [];

  const result: number[] = [];
  let remaining = weightPerSide;

  for (const plate of PLATES) {
    while (remaining >= plate - 0.001) {
      result.push(plate);
      remaining = Math.round((remaining - plate) * 1000) / 1000;
    }
  }

  return result;
}

interface BarbellCalculatorProps {
  onClose: () => void;
  defaultWeight?: number;
}

export const BarbellCalculator = ({ onClose, defaultWeight = 80 }: BarbellCalculatorProps) => {
  const [targetWeight, setTargetWeight] = useState(defaultWeight);
  const [barTypeIdx, setBarTypeIdx] = useState(0);
  const barWeight = BAR_TYPES[barTypeIdx].weight;
  const plates = calcPlates(targetWeight, barWeight);
  const actualWeight = barWeight + plates.reduce((s, p) => s + p, 0) * 2;
  const diff = Math.round((targetWeight - actualWeight) * 100) / 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%", maxWidth: 480,
            background: "#111", borderRadius: "20px 20px 0 0",
            padding: "20px 20px 48px",
          }}
        >
          {/* Handle */}
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", margin: "0 auto 20px" }} />

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 16, fontWeight: 900, color: "white" }}>Calculadora de Barra</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Placas por lado</p>
            </div>
            <button
              onClick={onClose}
              style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, padding: 6, cursor: "pointer" }}
            >
              <X size={16} color="rgba(255,255,255,0.6)" />
            </button>
          </div>

          {/* Bar type selector */}
          <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
            {BAR_TYPES.map((bt, i) => (
              <button
                key={bt.label}
                onClick={() => setBarTypeIdx(i)}
                style={{
                  flexShrink: 0, padding: "6px 12px", borderRadius: 20, cursor: "pointer",
                  fontSize: 11, fontWeight: 700,
                  background: barTypeIdx === i ? "rgba(96,165,250,0.15)" : "#141414",
                  border: `1px solid ${barTypeIdx === i ? "rgba(96,165,250,0.4)" : "rgba(255,255,255,0.08)"}`,
                  color: barTypeIdx === i ? "#60A5FA" : "rgba(255,255,255,0.4)",
                }}
              >
                {bt.label} ({bt.weight}kg)
              </button>
            ))}
          </div>

          {/* Weight input */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8 }}>
              PESO ALVO
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => setTargetWeight((w) => Math.max(barWeight, Math.round((w - 2.5) * 100) / 100))}
                style={{ width: 48, height: 48, borderRadius: 12, background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 22, cursor: "pointer" }}
              >−</button>
              <div style={{
                flex: 1, height: 48, background: "#1A1A1A", borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                <span style={{ fontSize: 26, fontWeight: 900, color: "white" }}>{targetWeight}</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>kg</span>
              </div>
              <button
                onClick={() => setTargetWeight((w) => Math.round((w + 2.5) * 100) / 100)}
                style={{ width: 48, height: 48, borderRadius: 12, background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 22, cursor: "pointer" }}
              >+</button>
            </div>
          </div>

          {/* Barbell visual */}
          <div style={{
            background: "#141414", borderRadius: 16, padding: "20px 16px",
            border: "1px solid rgba(255,255,255,0.06)", marginBottom: 16,
          }}>
            {/* Bar + plates visual */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 60, gap: 0 }}>
              {/* Left collar */}
              <div style={{ width: 8, height: 28, background: "#374151", borderRadius: "4px 0 0 4px" }} />
              {/* Plates left side (reversed) */}
              {[...plates].reverse().map((p, i) => (
                <div key={`l-${i}`} style={{
                  width: PLATE_WIDTH[p],
                  height: 44 - (PLATES.indexOf(p) * 3),
                  background: PLATE_COLORS[p],
                  borderRadius: 2,
                  flexShrink: 0,
                  opacity: 0.9,
                }} />
              ))}
              {/* Bar */}
              <div style={{ flex: 1, height: 10, background: "#9CA3AF", borderRadius: 2, maxWidth: 80 }} />
              {/* Plates right side */}
              {plates.map((p, i) => (
                <div key={`r-${i}`} style={{
                  width: PLATE_WIDTH[p],
                  height: 44 - (PLATES.indexOf(p) * 3),
                  background: PLATE_COLORS[p],
                  borderRadius: 2,
                  flexShrink: 0,
                  opacity: 0.9,
                }} />
              ))}
              {/* Right collar */}
              <div style={{ width: 8, height: 28, background: "#374151", borderRadius: "0 4px 4px 0" }} />
            </div>

            {/* Weight summary */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 18, fontWeight: 900, color: "#60A5FA" }}>{actualWeight}kg</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Peso real</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 18, fontWeight: 900, color: diff === 0 ? "#34D399" : "#FBBF24" }}>
                  {diff === 0 ? "Exato" : `±${Math.abs(diff)}kg`}
                </p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Diferença</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 18, fontWeight: 900, color: "white" }}>{plates.length}</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Placas/lado</p>
              </div>
            </div>
          </div>

          {/* Plate list */}
          {plates.length > 0 ? (
            <div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>
                POR LADO
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Object.entries(
                  plates.reduce<Record<string, number>>((acc, p) => {
                    acc[String(p)] = (acc[String(p)] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([plate, count]) => (
                  <span key={plate} style={{
                    padding: "6px 12px", borderRadius: 20,
                    background: PLATE_COLORS[Number(plate)] + "22",
                    border: `1px solid ${PLATE_COLORS[Number(plate)]}44`,
                    color: PLATE_COLORS[Number(plate)],
                    fontSize: 12, fontWeight: 800,
                  }}>
                    {count > 1 ? `${count}×` : ""}{plate}kg
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
              Só a barra ({barWeight}kg)
            </p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
