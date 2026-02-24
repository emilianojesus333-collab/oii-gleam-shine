import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';

interface WeeklyChartProps {
  data: {
    date: string;
    dayName: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    goalCalories: number;
  }[];
}

export const WeeklyChart = ({ data }: WeeklyChartProps) => {
  const maxValue = Math.max(...data.map((d) => Math.max(d.calories, d.goalCalories))) * 1.1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl border border-white/10 bg-stone-900">

      <h3 className="font-semibold mb-4 text-white">Últimos 7 dias</h3>
      
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="dayName"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />

            <YAxis
              hide
              domain={[0, maxValue]} />

            <ReferenceLine
              y={data[0]?.goalCalories}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="3 3"
              strokeOpacity={0.5} />

            <Area
              type="monotone"
              dataKey="calories"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#colorCalories)"
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 4 }} />

          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-primary rounded" />
          <span>Calorias</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-gray-500 rounded" style={{ borderStyle: 'dashed' }} />
          <span>Meta</span>
        </div>
      </div>
    </motion.div>);

};