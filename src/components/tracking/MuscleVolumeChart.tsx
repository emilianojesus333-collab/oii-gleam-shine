import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { useMuscleVolume, MUSCLE_COLORS, ALL_MUSCLES } from "@/hooks/useMuscleVolume";

const SkeletonBar = ({ w }: { w: number }) => (
  <div style={{ height: 12, width: `${w}%`, borderRadius: 6, background: "rgba(255,255,255,0.06)", animation: "pulse 1.5s infinite" }} />
);

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 10, padding: "10px 14px", minWidth: 140,
    }}>
      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 3 }}>
          <span style={{ fontSize: 12, color: p.color, fontWeight: 600 }}>{p.name}</span>
          <span style={{ fontSize: 12, color: "white", fontWeight: 700 }}>
            {p.value > 0 ? `${(p.value / 1000).toFixed(1)}t` : "—"}
          </span>
        </div>
      ))}
    </div>
  );
};

export const MuscleVolumeChart = () => {
  const { weeks, muscles, loading } = useMuscleVolume(8);
  const [active, setActive] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ALL_MUSCLES.map((m) => [m, true]))
  );

  const toggle = (muscle: string) =>
    setActive((prev) => ({ ...prev, [muscle]: !prev[muscle] }));

  const visibleMuscles = muscles.filter((m) => active[m]);

  return (
    <div style={{
      background: "#141414", borderRadius: 16, padding: "20px 16px",
      border: "1px solid rgba(255,255,255,0.06)",
    }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <TrendingUp size={16} color="#60A5FA" />
        <span style={{ fontSize: 14, fontWeight: 800, color: "white" }}>Volume por músculo</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginLeft: "auto" }}>últimas 8 semanas</span>
      </div>

      {/* Muscle toggles */}
      {!loading && muscles.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {muscles.map((m) => {
            const on = active[m];
            const color = MUSCLE_COLORS[m] ?? "#60A5FA";
            return (
              <button
                key={m}
                type="button"
                onClick={() => toggle(m)}
                style={{
                  padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                  cursor: "pointer", transition: "all 0.15s",
                  background: on ? `${color}1A` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${on ? color + "40" : "rgba(255,255,255,0.07)"}`,
                  color: on ? color : "rgba(255,255,255,0.3)",
                }}
              >
                {m}
              </button>
            );
          })}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "12px 0" }}>
          <SkeletonBar w={80} />
          <div style={{ height: 180, background: "rgba(255,255,255,0.03)", borderRadius: 10, animation: "pulse 1.5s infinite" }} />
        </div>
      )}

      {/* Empty state */}
      {!loading && muscles.length === 0 && (
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <TrendingUp size={32} color="rgba(255,255,255,0.12)" style={{ margin: "0 auto 10px" }} />
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Ainda sem dados de volume</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>Completa alguns treinos para ver o gráfico</p>
        </div>
      )}

      {/* Chart */}
      {!loading && muscles.length > 0 && (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={weeks} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="weekLabel"
              tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 9, fill: "rgba(255,255,255,0.25)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
            />
            <Tooltip content={<CustomTooltip />} />
            {visibleMuscles.map((m) => (
              <Line
                key={m}
                type="monotone"
                dataKey={m}
                stroke={MUSCLE_COLORS[m] ?? "#60A5FA"}
                strokeWidth={2}
                dot={{ r: 3, fill: MUSCLE_COLORS[m] ?? "#60A5FA", strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Legend */}
      {!loading && visibleMuscles.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, marginTop: 12 }}>
          {visibleMuscles.map((m) => (
            <div key={m} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 20, height: 2, borderRadius: 1, background: MUSCLE_COLORS[m] ?? "#60A5FA" }} />
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{m}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
