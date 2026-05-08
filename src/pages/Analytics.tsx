import { useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart3, TrendingUp, Target, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { MuscleVolumeChart } from "@/components/tracking/MuscleVolumeChart";
import { ConsistencyRing } from "@/components/tracking/ConsistencyRing";
import { DeloadAlertCard } from "@/components/tracking/DeloadAlertCard";
import { WeeklyReportCard } from "@/components/tracking/WeeklyReportCard";
import { usePerformanceMetrics } from "@/hooks/usePerformanceMetrics";

const SECTION_STYLE: React.CSSProperties = {
  background: "#1A1A1A", borderRadius: 0, border: "none",
  borderBottom: "1px solid #2A2A2A", padding: "20px 16px", width: "100%",
};

const SectionTitle = ({ icon: Icon, label }: { icon: typeof BarChart3; label: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
    <Icon size={15} color="rgba(255,255,255,0.50)" />
    <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.30)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
      {label}
    </span>
  </div>
);

export default function Analytics() {
  const navigate = useNavigate();
  const { data: metrics } = usePerformanceMetrics();

  return (
    <div className="min-h-screen bg-black pb-32">

      {/* ── Header ── */}
      <div style={{ background: "#141414", borderBottom: "1px solid #1A1A1A", padding: "52px 20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(255,255,255,0.07)", border: "none",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <ArrowLeft size={18} color="rgba(255,255,255,0.70)" />
          </button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: "white", lineHeight: 1.1 }}>Analytics</h1>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.30)", marginTop: 1 }}>Progresso & volume</p>
          </div>
        </div>

        {/* Quick metrics strip */}
        {metrics && (
          <div style={{ display: "flex", gap: 10, marginTop: 16, overflowX: "auto", paddingBottom: 2 }}>
            {[
              { label: "Volume semanal", value: metrics.weeklyVolume > 0 ? `${(metrics.weeklyVolume / 1000).toFixed(1)}t` : "—", color: "#60A5FA" },
              { label: "Sessões / semana", value: String(metrics.weeklyFrequency), color: "#4ADE80" },
              { label: "Perf. média 30d", value: metrics.avgPerformance30d !== null ? `${metrics.avgPerformance30d}%` : "—", color: "#FBBF24" },
              { label: "Fadiga", value: metrics.fatigueIndex !== null ? String(metrics.fatigueIndex) : "—", color: metrics.fatigueIndex !== null && metrics.fatigueIndex >= 61 ? "#F87171" : "#A78BFA" },
            ].map((m) => (
              <div key={m.label} style={{
                flexShrink: 0, background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12,
                padding: "10px 14px", minWidth: 90,
              }}>
                <p style={{ fontSize: 18, fontWeight: 900, color: m.color, lineHeight: 1 }}>{m.value}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.30)", marginTop: 3 }}>{m.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Alerta de Deload ── */}
      <div style={SECTION_STYLE}>
        <SectionTitle icon={Bell} label="Alerta de recuperação" />
        <DeloadAlertCard />
      </div>

      {/* ── Gráfico de Volume por Músculo ── */}
      <div style={SECTION_STYLE}>
        <SectionTitle icon={TrendingUp} label="Volume por músculo" />
        <MuscleVolumeChart />
      </div>

      {/* ── Índice de Consistência ── */}
      <div style={SECTION_STYLE}>
        <SectionTitle icon={Target} label="Consistência mensal" />
        <ConsistencyRing />
      </div>

      {/* ── Relatório Semanal ── */}
      <div style={{ ...SECTION_STYLE, padding: 0 }}>
        <div style={{ padding: "20px 16px 8px" }}>
          <SectionTitle icon={BarChart3} label="Relatório semanal" />
        </div>
        <WeeklyReportCard />
      </div>

      <BottomNav />
    </div>
  );
}
