import { useState } from "react";
import { AlertTriangle, ShieldAlert, Info, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useDeloadAlert, type DeloadSeverity } from "@/hooks/useDeloadAlert";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";

const SEVERITY_CONFIG: Record<
  DeloadSeverity,
  { color: string; bg: string; border: string; icon: typeof AlertTriangle; label: string }
> = {
  none:        { color: "#34D399", bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.15)",  icon: Info,         label: "Volume normal" },
  consider:    { color: "#FBBF24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.15)",  icon: Info,         label: "Atenção ao volume" },
  recommended: { color: "#FB923C", bg: "rgba(251,146,60,0.08)",  border: "rgba(251,146,60,0.15)",  icon: AlertTriangle, label: "Deload recomendado" },
  urgent:      { color: "#F87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.15)", icon: ShieldAlert,   label: "Deload urgente" },
};

const WEEK_LABELS = ["S-5", "S-4", "S-3", "S-2", "S-1", "Esta"];

export const DeloadAlertCard = () => {
  const alert = useDeloadAlert();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  if (alert.loading) {
    return (
      <div style={{ background: "#141414", borderRadius: 16, padding: "16px", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ height: 14, width: "55%", background: "rgba(255,255,255,0.06)", borderRadius: 6, animation: "pulse 1.5s infinite" }} />
      </div>
    );
  }

  const cfg = SEVERITY_CONFIG[alert.severity];
  const Icon = cfg.icon;

  const chartData = alert.weeklyVolumes.map((v, i) => ({
    label: WEEK_LABELS[i],
    volume: Math.round(v / 1000),
  }));

  const avgBaseline = alert.weeklyVolumes.slice(0, 3).reduce((s, v) => s + v, 0) / 3;

  return (
    <div style={{
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: 16, padding: "16px",
      overflow: "hidden",
    }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: `${cfg.color}1A`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={17} color={cfg.color} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: "white", marginBottom: 1 }}>{cfg.label}</p>
          {alert.severity === "none" ? (
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Volume dentro do esperado</p>
          ) : (
            <p style={{ fontSize: 11, color: cfg.color }}>{alert.message}</p>
          )}
        </div>
        {alert.severity !== "none" && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
          >
            <ChevronRight
              size={16} color="rgba(255,255,255,0.35)"
              style={{ transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}
            />
          </button>
        )}
      </div>

      {/* Volume mini-bar chart */}
      {alert.weeklyVolumes.some((v) => v > 0) && (
        <div style={{ marginTop: 14 }}>
          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", marginBottom: 8 }}>
            VOLUME SEMANAL (toneladas)
          </p>
          <ResponsiveContainer width="100%" height={70}>
            <BarChart data={chartData} barSize={28} margin={{ top: 0, right: 0, left: -32, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }} axisLine={false} tickLine={false} />
              <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => {
                  const isHigh = i >= 3 && avgBaseline > 0 && entry.volume * 1000 > avgBaseline * 1.15;
                  const isLast = i === 5;
                  return (
                    <Cell
                      key={i}
                      fill={isLast && isHigh ? cfg.color : isLast ? "#60A5FA" : "rgba(255,255,255,0.12)"}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Expanded recommendation */}
      <AnimatePresence>
        {expanded && alert.severity !== "none" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              marginTop: 14, paddingTop: 14,
              borderTop: `1px solid ${cfg.border}`,
            }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: 12 }}>
                💡 {alert.recommendation}
              </p>
              {alert.fatigueIndex !== null && (
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 12 }}>
                  Índice de fadiga atual: <span style={{ color: cfg.color, fontWeight: 700 }}>{alert.fatigueIndex}</span>
                </p>
              )}
              <button
                type="button"
                onClick={() => navigate("/chat", {
                  state: { prefill: "O meu volume está elevado. Sugere um treino de deload para esta semana." }
                })}
                style={{
                  width: "100%", padding: "10px 0", borderRadius: 10, cursor: "pointer",
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                Pedir plano de deload ao Coach IA
                <ChevronRight size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
