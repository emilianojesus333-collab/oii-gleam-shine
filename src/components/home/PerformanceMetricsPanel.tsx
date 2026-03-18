import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Activity, TrendingUp, Dumbbell, Calendar, Heart } from "lucide-react";
import { usePerformanceMetrics } from "@/hooks/usePerformanceMetrics";

const getPerformanceColor = (score: number) => {
  if (score >= 90) return "hsl(142, 71%, 45%)";
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
  if (fi <= 20) return { label: "Recuperado", color: "hsl(142, 71%, 45%)" };
  if (fi <= 40) return { label: "Fadiga leve", color: "hsl(217, 91%, 60%)" };
  if (fi <= 60) return { label: "Moderada", color: "hsl(48, 96%, 53%)" };
  if (fi <= 80) return { label: "Alta", color: "hsl(25, 95%, 53%)" };
  return { label: "Muito alta", color: "hsl(0, 84%, 60%)" };
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border/50 bg-card px-3 py-2 shadow-xl">
      <p className="text-[10px] text-muted-foreground">{d.label}</p>
      <p className="text-sm font-semibold" style={{ color: getPerformanceColor(d.score) }}>
        {d.score}/100 — {getPerformanceLabel(d.score)}
      </p>
    </div>
  );
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
      color: avgPerformance30d != null ? getPerformanceColor(avgPerformance30d) : undefined,
    },
    {
      icon: Dumbbell,
      label: "Volume",
      value: formatVolume(weeklyVolume),
      sub: "kg esta semana",
      color: "hsl(var(--primary))",
    },
    {
      icon: Calendar,
      label: "Frequência",
      value: `${weeklyFrequency}`,
      sub: "treinos / 7d",
      color: "hsl(var(--primary))",
    },
    {
      icon: Heart,
      label: "Recuperação",
      value: fatigueIndex != null ? `${fatigueIndex}` : "—",
      sub: fatigue?.label || "sem dados",
      color: fatigue?.color || "hsl(var(--muted-foreground))",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="rounded-2xl bg-card/60 backdrop-blur-sm border border-border/30 p-4 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
          <Activity className="h-4 w-4 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Resumo de Performance</h3>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45 + i * 0.05 }}
            className="rounded-xl bg-secondary/40 p-3"
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <card.icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{card.label}</span>
            </div>
            <p className="text-xl font-black text-foreground" style={{ color: card.color }}>
              {card.value}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Performance Trend Chart */}
      {performanceTrend.length >= 3 ? (
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            Tendência de Performance
          </p>
          <div className="h-[100px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                  domain={[0, 100]}
                  ticks={[0, 50, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#perfGrad)"
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }}
                  activeDot={{ fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2, r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center py-4">
          <p className="text-xs text-muted-foreground text-center">
            Completa mais treinos para ver a tendência de performance.
          </p>
        </div>
      )}
    </motion.div>
  );
};
