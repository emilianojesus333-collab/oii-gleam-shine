import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Activity, TrendingUp, Dumbbell, Calendar, Heart } from "lucide-react";
import { usePerformanceMetrics } from "@/hooks/usePerformanceMetrics";

const getPerformanceColor = (score: number) => {
  if (score >= 90) return "#2563EB";
  if (score >= 75) return "hsl(217, 91%, 60%)";
  if (score >= 60) return "hsl(48, 96%, 53%)";
  if (score >= 40) return "hsl(25, 95%, 53%)";
  return "hsl(0, 84%, 60%)";
};

const getPerformanceLabel = (score: number) => {
  if (score >= 90) return "Excelente";
  if (score >= 75) return "Muito Bom";
  if (score >= 60) return "Sólido";
  if (score >= 40) return "Moderado";
  return "Leve";
};

const getFatigueStatus = (fi: number) => {
  if (fi <= 20) return { label: "Recuperado", color: "#2563EB" };
  if (fi <= 40) return { label: "Fadiga leve", color: "hsl(217, 91%, 60%)" };
  if (fi <= 60) return { label: "Moderada", color: "hsl(48, 96%, 53%)" };
  if (fi <= 80) return { label: "Alta", color: "hsl(25, 95%, 53%)" };
  return { label: "Muito alta", color: "hsl(0, 84%, 60%)" };
};

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border/50 bg-card px-3 py-2 shadow-xl">
      <p className="text-[10px] text-muted-foreground">{d.label}</p>
      <p className="text-sm font-semibold" style={{ color: getPerformanceColor(d.score) }}>
        {d.score}/100 — {getPerformanceLabel(d.score)}
      </p>
    </div>);

};

export const PerformanceMetricsPanel = () => {
  const { data: metrics, isLoading } = usePerformanceMetrics();

  if (isLoading || !metrics) return null;

  const { avgPerformance30d, weeklyVolume, weeklyFrequency, fatigueIndex, performanceTrend } = metrics;
  const fatigue = fatigueIndex != null ? getFatigueStatus(fatigueIndex) : null;

  const formatVolume = (v: number) => {
    if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
    return v.toString();
  };

  const statCards = [
  {
    icon: TrendingUp,
    label: "Performance",
    value: avgPerformance30d != null ? `${avgPerformance30d}` : "—",
    sub: "média 30d",
    color: avgPerformance30d != null ? getPerformanceColor(avgPerformance30d) : undefined
  },
  {
    icon: Dumbbell,
    label: "Volume",
    value: formatVolume(weeklyVolume),
    sub: "kg esta semana",
    color: "hsl(var(--primary))"
  },
  {
    icon: Calendar,
    label: "Frequência",
    value: `${weeklyFrequency}`,
    sub: "treinos / 7d",
    color: "hsl(var(--primary))"
  },
  {
    icon: Heart,
    label: "Recuperação",
    value: fatigueIndex != null ? `${fatigueIndex}` : "—",
    sub: fatigue?.label || "sem dados",
    color: fatigue?.color || "hsl(var(--muted-foreground))"
  }];


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.42 }}
      style={{ background: "#1A1A1A", borderRadius: 0, border: "none", borderBottom: "1px solid #2A2A2A", padding: "20px 16px", width: "100%", margin: 0 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <Activity size={16} color="rgba(255,255,255,0.4)" />
        <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.6)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Métricas
        </span>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              style={{ background: "#111111", borderRadius: 8, padding: "12px 14px", border: "1px solid #2A2A2A" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Icon size={12} color={card.color || "rgba(255,255,255,0.4)"} />
                <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {card.label}
                </span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: card.color || "#fff", lineHeight: 1 }}>
                {card.value}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>{card.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Performance trend chart */}
      {performanceTrend && performanceTrend.length > 0 && (
        <div>
          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Tendência 30 dias
          </span>
          <div style={{ marginTop: 8, height: 80 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceTrend} margin={{ top: 0, right: 0, left: -32, bottom: 0 }}>
                <defs>
                  <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.25)" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "rgba(255,255,255,0.25)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="score" stroke="#2563EB" strokeWidth={1.5} fill="url(#perfGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </motion.div>
  );

























































































};