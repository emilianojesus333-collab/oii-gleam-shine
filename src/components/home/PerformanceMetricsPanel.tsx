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


  return;

























































































};