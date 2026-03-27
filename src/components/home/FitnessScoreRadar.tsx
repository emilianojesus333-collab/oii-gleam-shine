import { motion } from "framer-motion";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { Trophy } from "lucide-react";
import { useFitnessScore } from "@/hooks/useFitnessScore";

const CustomAngleAxis = ({ payload, x, y, cx, cy, ...rest }: any) => {
  const metric = rest.metrics?.find((m: any) => m.label === payload.value);
  const val = metric?.value ?? 0;

  // Push label outward
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
  const { metrics, totalScore, loading } = useFitnessScore();

  if (loading) return null;

  // If all zeros, show empty state
  const hasData = metrics.some((m) => m.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="rounded-2xl bg-card/60 backdrop-blur-sm border border-border/30 p-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
          <Trophy className="h-4 w-4 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Fitness Score</h3>
      </div>

      {!hasData ? (
        <div className="flex items-center justify-center py-10">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            Completa alguns treinos para calcular o teu score.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Central score overlay */}
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="text-center -mt-2">
              <p className="text-[10px] font-semibold text-primary tracking-wider uppercase">
                Fitness Score
              </p>
              <p className="text-3xl font-black text-foreground leading-none">{totalScore}</p>
            </div>
          </div>

          {/* Radar */}
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
