import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Activity } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const getFatigueColor = (value: number) => {
  if (value <= 20) return "#2563EB";
  if (value <= 40) return "hsl(217, 91%, 60%)";
  if (value <= 60) return "hsl(48, 96%, 53%)";
  if (value <= 80) return "hsl(25, 95%, 53%)";
  return "hsl(0, 84%, 60%)";
};

const getFatigueLabel = (value: number) => {
  if (value <= 20) return "Recuperado";
  if (value <= 40) return "Fadiga leve";
  if (value <= 60) return "Fadiga moderada";
  if (value <= 80) return "Fadiga alta";
  return "Fadiga muito alta";
};

interface ChartDataPoint {
  date: string;
  fatigue: number;
  fullDate: string;
  color: string;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload as ChartDataPoint;
  return (
    <div className="rounded-lg border border-border/50 bg-card px-3 py-2 shadow-xl">
      <p className="text-[10px] text-muted-foreground">{data.fullDate}</p>
      <p className="text-sm font-semibold" style={{ color: data.color }}>
        {data.fatigue}/100 — {getFatigueLabel(data.fatigue)}
      </p>
    </div>
  );
};

export const FatigueHistoryCard = () => {
  const { user } = useAuth();

  const { data: fatigueHistory, isLoading } = useQuery({
    queryKey: ["fatigue-history", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("progression_logs")
        .select("fatigue_index_used, created_at, session_id")
        .eq("user_id", user.id)
        .not("fatigue_index_used", "is", null)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!fatigueHistory?.length) return [];

    // Group by date, keep last value per day
    const byDate = new Map<string, { fatigue: number; date: Date }>();

    for (const log of fatigueHistory) {
      if (log.fatigue_index_used == null) continue;
      const d = new Date(log.created_at);
      const key = d.toISOString().split("T")[0];
      byDate.set(key, { fatigue: log.fatigue_index_used, date: d });
    }

    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, { fatigue, date }]) => ({
        date: date.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" }),
        fatigue,
        fullDate: date.toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" }),
        color: getFatigueColor(fatigue),
      }));
  }, [fatigueHistory]);

  if (isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="rounded-2xl bg-card/60 backdrop-blur-sm border border-border/30 p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
          <Activity className="h-4 w-4 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Histórico de Recuperação</h3>
      </div>

      {chartData.length < 3 ? (
        <div className="flex items-center justify-center py-6">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            Completa alguns treinos para ver a evolução da recuperação.
          </p>
        </div>
      ) : (
        <>
          <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fatigueGrad" x1="0" y1="0" x2="0" y2="1">
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
                  dataKey="fatigue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#fatigueGrad)"
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }}
                  activeDot={{ fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2, r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Color legend */}
          <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
            {[
              { label: "Recuperado", color: "#2563EB" },
              { label: "Leve", color: "hsl(217, 91%, 60%)" },
              { label: "Moderada", color: "hsl(48, 96%, 53%)" },
              { label: "Alta", color: "hsl(25, 95%, 53%)" },
              { label: "Muito alta", color: "hsl(0, 84%, 60%)" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[9px] text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
};
