import { motion } from "framer-motion";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { computeFitnessScore } from "@/hooks/useFitnessScore";
import { usePerformanceMetrics } from "@/hooks/usePerformanceMetrics";
import { useWeeklyStats } from "@/hooks/useWeeklyStats";
import { useAlerts } from "@/hooks/useAlerts";
import { useNutrition } from "@/hooks/useNutrition";

const CustomAngleAxis = ({ payload, x, y, cx, cy, ...rest }: any) => {
  const metric = rest.metrics?.find((m: any) => m.label === payload.value);
  const val = metric?.value ?? 0;

  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const factor = 1.25;
  const nx = cx + (dx / dist) * dist * factor;
  const ny = cy + (dy / dist) * dist * factor;

  return (
    <g>
      <text
        x={nx}
        y={ny - 6}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-muted-foreground"
        style={{ fontSize: 10, fontWeight: 600 }}
      >
        {payload.value}
      </text>
      <text
        x={nx}
        y={ny + 8}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground"
        style={{ fontSize: 11, fontWeight: 700 }}
      >
        {val}/10
      </text>
    </g>
  );
};

export function FitnessScoreRadar() {
  const { data: perfData, isLoading: perfLoading } = usePerformanceMetrics();
  const { data: weeklyData, loading: weeklyLoading } = useWeeklyStats();
  const { hydrationSummary } = useAlerts();
  const { todayLog, goals } = useNutrition();

  const loading = perfLoading || weeklyLoading;

  const { metrics, totalScore } = computeFitnessScore({
    weeklyVolume: perfData?.weeklyVolume ?? 0,
    weeklyFrequency: perfData?.weeklyFrequency ?? 0,
    completedSessions: weeklyData?.completedSessions ?? 0,
    plannedSessions: weeklyData?.plannedSessions ?? 1,
    hydrationPercentage: hydrationSummary?.percentage ?? 0,
    todayCalories: todayLog?.totals?.calories ?? 0,
    goalCalories: goals?.calories ?? 2000,
  });

  if (loading) return null;

  const hasData = metrics.some((m) => m.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      {!hasData ? (
        <div className="flex items-center justify-center py-10">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            Completa alguns treinos para calcular o teu score.
          </p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="text-center -mt-2">
              <p className="text-[10px] font-semibold text-primary tracking-wider uppercase">
                Fitness Score
              </p>
              <p className="text-3xl font-black text-foreground leading-none">{totalScore}</p>
            </div>
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="60%" data={metrics}>
                <PolarGrid
                  stroke="hsl(var(--muted-foreground))"
                  strokeOpacity={0.15}
                  strokeDasharray="4 4"
                />
                <PolarAngleAxis
                  dataKey="label"
                  tick={(props: any) => <CustomAngleAxis {...props} metrics={metrics} />}
                />
                <Radar
                  name="score"
                  dataKey="value"
                  stroke="hsl(142, 71%, 45%)"
                  strokeWidth={2}
                  fill="hsl(142, 71%, 45%)"
                  fillOpacity={0.2}
                  dot={{
                    r: 3,
                    fill: "hsl(142, 71%, 45%)",
                    strokeWidth: 0,
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </motion.div>
  );
}
