import { motion } from "framer-motion";
import {
  useMuscleFatigue,
  getMuscleLabel,
  type MuscleGroup,
} from "@/hooks/useMuscleFatigue";

const RING_COLORS = ["#3B82F6", "#8B5CF6", "#22C55E", "#06B6D4"];
const RING_RADII = [70, 52, 36, 21];
const STROKE_WIDTH = 11;
const SVG_SIZE = 160;
const CENTER = SVG_SIZE / 2;

function getRecoveryPct(fatigue: number) {
  return Math.max(0, Math.min(100, 100 - fatigue));
}

function getStatusLabel(pct: number): string {
  if (pct >= 100) return "Pronto para treinar";
  if (pct >= 70) return "Em recuperação";
  return "Precisa descanso";
}

function getStatusColor(pct: number): string {
  if (pct >= 100) return "#22C55E";
  if (pct >= 70) return "#F59E0B";
  return "#EF4444";
}

function arcPath(cx: number, cy: number, r: number, pct: number): string {
  if (pct <= 0) return "";
  if (pct >= 100) {
    // Full circle — two semicircles
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
  const readyCount = recoveries.filter((r) => r >= 100).length;
  const readyNames = display
    .filter((_, i) => recoveries[i] >= 100)
    .map((m) => getMuscleLabel(m.muscle_group));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="mb-4"
      style={{
        background: "#0D1118",
        borderRadius: 28,
        border: "1px solid rgba(255,255,255,0.07)",
        padding: "20px 20px 16px",
      }}
    >
      {/* Header */}
      <p
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.08em",
          color: "rgba(255,255,255,0.4)",
          textTransform: "uppercase",
          marginBottom: 2,
        }}
      >
        Recuperação Muscular
      </p>
      <p style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Hoje</p>

      {/* Rings + Legend */}
      <div className="flex items-center gap-4">
        {/* SVG Rings */}
        <svg width={SVG_SIZE} height={SVG_SIZE} className="flex-shrink-0">
          {display.map((_, i) => {
            const r = RING_RADII[i];
            const color = RING_COLORS[i];
            const pct = recoveries[i];
            return (
              <g key={i}>
                {/* Track */}
                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={r}
                  fill="none"
                  stroke={color}
                  strokeOpacity={0.15}
                  strokeWidth={STROKE_WIDTH}
                />
                {/* Progress arc */}
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
              </g>
            );
          })}
          {/* Center text */}
          <text
            x={CENTER}
            y={CENTER - 4}
            textAnchor="middle"
            fill="#fff"
            fontWeight={800}
            fontSize={18}
          >
            {readyCount}/{display.length}
          </text>
          <text
            x={CENTER}
            y={CENTER + 12}
            textAnchor="middle"
            fill="rgba(255,255,255,0.35)"
            fontSize={9}
            fontWeight={600}
            textTransform="uppercase"
            letterSpacing="0.08em"
          >
            GRUPOS
          </text>
        </svg>

        {/* Legend */}
        <div className="flex flex-1 flex-col">
          {display.map((m, i) => {
            const pct = recoveries[i];
            const color = RING_COLORS[i];
            return (
              <div key={m.muscle_group}>
                {i > 0 && (
                  <div
                    style={{
                      height: 1,
                      background: "rgba(255,255,255,0.06)",
                      marginTop: 6,
                      marginBottom: 6,
                    }}
                  />
                )}
                <div className="flex items-center gap-1.5">
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
                    {getMuscleLabel(m.muscle_group)}
                  </span>
                </div>
                <p style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1.1, marginTop: 1 }}>
                  {pct}%
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: getStatusColor(pct),
                    fontStyle: "italic",
                    marginTop: 1,
                  }}
                >
                  {getStatusLabel(pct)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          height: 1,
          background: "rgba(255,255,255,0.06)",
          marginTop: 16,
          marginBottom: 12,
        }}
      />
      <div className="flex items-end justify-between">
        <div>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Média geral
          </p>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{avg}% recuperado</p>
        </div>
        {readyNames.length > 0 && (
          <p style={{ fontSize: 11, color: "#22C55E", textAlign: "right", maxWidth: 140 }}>
            Recomendado hoje: {readyNames.join(" & ")}
          </p>
        )}
      </div>
    </motion.div>
  );
}
