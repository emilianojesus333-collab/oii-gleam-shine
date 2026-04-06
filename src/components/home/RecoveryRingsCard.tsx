import { motion } from "framer-motion";
import {
  useMuscleFatigue,
  getMuscleLabel,
} from "@/hooks/useMuscleFatigue";

const RING_COLORS = ["#F87171", "#FBBF24", "#4ADE80", "#818CF8"];
const RING_RADII = [49, 37, 27, 17];
const STROKE_WIDTH = 8;
const SVG_SIZE = 112;
const CENTER = SVG_SIZE / 2;

function getRecoveryPct(fatigue: number) {
  return Math.max(0, Math.min(100, 100 - fatigue));
}

function getStatusLabel(pct: number): string {
  if (pct >= 100) return "Pronto";
  if (pct >= 70) return "Recuperando";
  return "Descansa";
}

function arcPath(cx: number, cy: number, r: number, pct: number): string {
  if (pct <= 0) return "";
  if (pct >= 100) {
    return [
      `M ${cx} ${cy - r}`,
      `A ${r} ${r} 0 1 1 ${cx} ${cy + r}`,
      `A ${r} ${r} 0 1 1 ${cx} ${cy - r}`,
    ].join(" ");
  }
  const angle = (pct / 100) * 360;
  const rad = ((angle - 90) * Math.PI) / 180;
  const startRad = (-90 * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(rad);
  const y2 = cy + r * Math.sin(rad);
  const largeArc = angle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

export function RecoveryRingsCard() {
  const { muscles, loading } = useMuscleFatigue();

  if (loading) return null;

  const display = muscles.slice(0, 4);
  const recoveries = display.map((m) => getRecoveryPct(m.current_fatigue));
  const avg = Math.round(recoveries.reduce((a, b) => a + b, 0) / (recoveries.length || 1));
  const readyNames = display
    .filter((_, i) => recoveries[i] >= 100)
    .map((m) => getMuscleLabel(m.muscle_group));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="mb-4 opacity-65"
      style={{
        background: "#0F1923",
        borderRadius: 22,
        border: "1px solid rgba(255,255,255,0.07)",
        padding: "20px 18px 18px",
      }}
    >
      {/* Header */}
      <p
        style={{
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: "0.1em",
          color: "rgba(255,255,255,0.25)",
          textTransform: "uppercase",
          marginBottom: 2,
        }}
      >
        Recuperação Muscular
      </p>
      <p style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 16 }}>Hoje</p>

      {/* Rings + Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {/* SVG Rings */}
        <svg width={SVG_SIZE} height={SVG_SIZE} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} style={{ flexShrink: 0 }}>
          {display.map((_, i) => {
            const r = RING_RADII[i];
            const color = RING_COLORS[i];
            const pct = recoveries[i];
            return (
              <g key={i}>
                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={r}
                  fill="none"
                  stroke={color}
                  strokeOpacity={0.13}
                  strokeWidth={STROKE_WIDTH}
                />
                {pct > 0 && (
                  <motion.path
                    d={arcPath(CENTER, CENTER, r, pct)}
                    fill="none"
                    stroke={color}
                    strokeWidth={STROKE_WIDTH}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 + i * 0.1 }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {display.map((m, i) => {
            const pct = recoveries[i];
            const color = RING_COLORS[i];
            return (
              <div key={m.muscle_group}>
                {i > 0 && (
                  <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "7px 0" }} />
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        backgroundColor: color,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>
                      {getMuscleLabel(m.muscle_group)}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 15, fontWeight: 900, color, lineHeight: 1.1 }}>
                      {pct}%
                    </p>
                    <p style={{ fontSize: 9, color, opacity: 0.65, marginTop: 1 }}>
                      {getStatusLabel(pct)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginTop: 16, marginBottom: 12 }} />
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Média geral
          </p>
          <p style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{avg}% recuperado</p>
        </div>
        {readyNames.length > 0 ? (
          <p style={{ fontSize: 10, fontWeight: 600, color: "#4ADE80", textAlign: "right", maxWidth: 140 }}>
            Recomendado: {readyNames.join(" & ")}
          </p>
        ) : (
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textAlign: "right" }}>
            Descansa hoje
          </p>
        )}
      </div>
    </motion.div>
  );
}
