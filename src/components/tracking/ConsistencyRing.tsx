import { useConsistencyIndex } from "@/hooks/useConsistencyIndex";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ringColor(pct: number): string {
  if (pct >= 80) return "#4ADE80";
  if (pct >= 50) return "#FBBF24";
  return "#F87171";
}

const Ring = ({
  percentage, color, size = 140,
}: { percentage: number; color: string; size?: number }) => {
  const offset = CIRCUMFERENCE * (1 - percentage / 100);
  return (
    <svg width={size} height={size} viewBox="0 0 140 140">
      {/* Track */}
      <circle cx="70" cy="70" r={RADIUS} fill="none"
        stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
      {/* Progress */}
      <circle cx="70" cy="70" r={RADIUS} fill="none"
        stroke={color} strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        transform="rotate(-90 70 70)"
        style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.3s ease" }}
      />
      {/* Center text */}
      <text x="70" y="65" textAnchor="middle"
        fill="white" fontSize="26" fontWeight="900" fontFamily="inherit">
        {percentage}
      </text>
      <text x="70" y="82" textAnchor="middle"
        fill="rgba(255,255,255,0.35)" fontSize="11" fontFamily="inherit">
        %
      </text>
    </svg>
  );
};

export const ConsistencyRing = () => {
  const ci = useConsistencyIndex();
  const color = ringColor(ci.currentMonth.percentage);

  if (ci.loading) {
    return (
      <div style={{ background: "#141414", borderRadius: 16, padding: "20px 16px", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ height: 14, width: "50%", background: "rgba(255,255,255,0.06)", borderRadius: 6, marginBottom: 16, animation: "pulse 1.5s infinite" }} />
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.04)", animation: "pulse 1.5s infinite" }} />
        </div>
      </div>
    );
  }

  const deltaAbs = Math.abs(ci.delta);
  const DeltaIcon = ci.delta > 0 ? TrendingUp : ci.delta < 0 ? TrendingDown : Minus;
  const deltaColor = ci.delta > 0 ? "#4ADE80" : ci.delta < 0 ? "#F87171" : "rgba(255,255,255,0.4)";

  return (
    <div style={{ background: "#141414", borderRadius: 16, padding: "20px 16px", border: "1px solid rgba(255,255,255,0.06)" }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: "white" }}>Consistência mensal</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{ci.currentMonth.label}</span>
      </div>

      {/* Ring centered */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        <Ring percentage={ci.currentMonth.percentage} color={color} />
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 14 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 22, fontWeight: 900, color: "white", lineHeight: 1 }}>{ci.currentMonth.completed}</p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>treinos feitos</p>
        </div>
        <div style={{ width: 1, background: "rgba(255,255,255,0.08)" }} />
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 22, fontWeight: 900, color: "rgba(255,255,255,0.5)", lineHeight: 1 }}>{ci.currentMonth.planned}</p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>planeados</p>
        </div>
      </div>

      {/* Delta vs previous month */}
      <div style={{
        background: "rgba(255,255,255,0.04)", borderRadius: 10,
        padding: "10px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
          vs {ci.previousMonth.label} ({ci.previousMonth.percentage}%)
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <DeltaIcon size={13} color={deltaColor} />
          <span style={{ fontSize: 12, fontWeight: 700, color: deltaColor }}>
            {ci.delta > 0 ? "+" : ""}{ci.delta}%
          </span>
        </div>
      </div>
    </div>
  );
};
