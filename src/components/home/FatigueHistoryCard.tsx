import { useMemo } from "react";
import * as RechartsPrimitive from "recharts";
import { Activity } from "lucide-react";
import { motion } from "framer-motion";

const CartesianGrid = RechartsPrimitive.CartesianGrid as any;
const Line = RechartsPrimitive.Line as any;
const LineChart = RechartsPrimitive.LineChart as any;
const ReferenceLine = RechartsPrimitive.ReferenceLine as any;
const ResponsiveContainer = RechartsPrimitive.ResponsiveContainer as any;
const Tooltip = RechartsPrimitive.Tooltip as any;
const XAxis = RechartsPrimitive.XAxis as any;
const YAxis = RechartsPrimitive.YAxis as any;
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const getFatigueLabel = (value: number) => {
  if (value <= 20) return "Recuperado";
  if (value <= 40) return "Fadiga leve";
  if (value <= 60) return "Fadiga moderada";
  if (value <= 80) return "Fadiga alta";
  return "Fadiga muito alta";
};

interface ChartDataPoint {
  xLabel: string;
  fatigue: number;
  fullDate: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload as ChartDataPoint;

  return (
    <div className="rounded-lg border border-border/50 bg-card px-3 py-2 shadow-xl">
      <p className="text-[10px] text-muted-foreground">{data.fullDate}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">
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

    const byDate = new Map<string, { fatigue: number; date: Date }>();

    for (const log of fatigueHistory) {
      if (log.fatigue_index_used == null) continue;
      const d = new Date(log.created_at);
      const key = d.toISOString().split("T")[0];
      byDate.set(key, { fatigue: log.fatigue_index_used, date: d });
    }

    const recent = Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-3)
      .map(([, { fatigue, date }]) => ({
        fatigue,
        fullDate: date.toLocaleDateString("pt-PT", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      }));

    const axisLabelsByLength: Record<number, string[]> = {
      1: ["Agora"],
      2: ["24h", "Agora"],
      3: ["48h", "24h", "Agora"],
    };

    const axisLabels = axisLabelsByLength[recent.length] || recent.map(() => "Agora");

    return recent.map((point, index) => ({
      ...point,
      xLabel: axisLabels[index],
    }));
  }, [fatigueHistory]);

  const trend = useMemo(() => {
    if (chartData.length < 2) return null;

    const first = chartData[0].fatigue;
    const last = chartData[chartData.length - 1].fatigue;
    const difference = last - first;

    if (Math.abs(difference) <= 3) {
      return { label: "Estável", detail: "variação baixa" };
    }

    return difference < 0
      ? { label: "A melhorar", detail: `${Math.abs(difference)} pts abaixo` }
      : { label: "A piorar", detail: `${Math.abs(difference)} pts acima` };
  }, [chartData]);

  if (isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="rounded-2xl border border-border/30 bg-card/70 p-4 backdrop-blur-sm"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Histórico de Recuperação</h3>
        </div>
        {trend && (
          <div className="rounded-full border border-border/50 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {trend.label}
          </div>
        )}
      </div>

      {chartData.length < 2 ? (
        <div className="flex items-center justify-center py-6">
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            Completa mais treinos para ver a tendência recente.
          </p>
        </div>
      ) : (
        <>
          <div className="h-[138px] w-full rounded-xl border border-border/30 bg-background/70 px-2 py-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 6, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.3} />
                <XAxis
                  dataKey="xLabel"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                />
                <YAxis hide domain={[0, 100]} />
                <ReferenceLine
                  y={35}
                  stroke="hsl(var(--muted-foreground))"
                  strokeOpacity={0.55}
                  strokeDasharray="4 4"
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="fatigue"
                  stroke="hsl(var(--foreground))"
                  strokeWidth={2}
                  dot={({ cx, cy, index }) => {
                    if (cx == null || cy == null) return null;
                    const isFirst = index === 0;
                    const isLast = index === chartData.length - 1;

                    if (!isFirst && !isLast) return null;

                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isLast ? 4.5 : 3}
                        fill={isLast ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))"}
                        stroke="hsl(var(--background))"
                        strokeWidth={isLast ? 2 : 1}
                      />
                    );
                  }}
                  activeDot={{
                    r: 5,
                    fill: "hsl(var(--foreground))",
                    stroke: "hsl(var(--background))",
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="truncate">Linha pontilhada = zona ideal</span>
            {trend && <span className="shrink-0">{trend.detail}</span>}
          </div>
        </>
      )}
    </motion.div>
  );
};
