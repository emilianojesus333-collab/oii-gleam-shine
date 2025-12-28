import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

interface OneRMRecord {
  id: string;
  exercise_name: string;
  weight_used: number;
  reps_performed: number;
  calculated_1rm: number;
  created_at: string;
}

interface OneRMProgressChartProps {
  records: OneRMRecord[];
  exerciseName: string;
}

export const OneRMProgressChart = ({ records, exerciseName }: OneRMProgressChartProps) => {
  const chartData = useMemo(() => {
    const filtered = records
      .filter((r) => r.exercise_name.toLowerCase() === exerciseName.toLowerCase())
      .reverse() // oldest first for chart
      .map((r, index) => ({
        date: new Date(r.created_at).toLocaleDateString("pt-PT", {
          day: "2-digit",
          month: "short",
        }),
        "1RM": r.calculated_1rm,
        fullDate: new Date(r.created_at).toLocaleDateString("pt-PT", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        index,
      }));
    return filtered;
  }, [records, exerciseName]);

  const progressStats = useMemo(() => {
    if (chartData.length < 2) return null;

    const first = chartData[0]["1RM"];
    const last = chartData[chartData.length - 1]["1RM"];
    const difference = last - first;
    const percentageChange = ((difference / first) * 100).toFixed(1);

    return {
      difference,
      percentageChange,
      isImprovement: difference > 0,
      totalRecords: chartData.length,
    };
  }, [chartData]);

  if (chartData.length === 0) {
    return null;
  }

  if (chartData.length === 1) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#2A2A2A]/40 rounded-xl p-3"
      >
        <p className="text-xs text-gray-400 mb-1">Primeiro registo</p>
        <p className="text-sm text-gray-300">
          Guarda mais registos para ver a evolução
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#2A2A2A]/40 rounded-xl p-3"
    >
      {/* Header with stats */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> Evolução
        </p>
        {progressStats && (
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
              progressStats.isImprovement
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {progressStats.isImprovement ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {progressStats.isImprovement ? "+" : ""}
            {progressStats.percentageChange}%
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-[100px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRM" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6B7280", fontSize: 9 }}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6B7280", fontSize: 9 }}
              tickFormatter={(value) => `${value}kg`}
              domain={["dataMin - 5", "dataMax + 5"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1E1E1E",
                border: "1px solid #374151",
                borderRadius: "8px",
                padding: "8px 12px",
              }}
              labelStyle={{ color: "#9CA3AF", fontSize: 10 }}
              formatter={(value: number) => [`${value} kg`, "1RM"]}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate || ""}
            />
            <Area
              type="monotone"
              dataKey="1RM"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRM)"
              dot={{
                fill: "hsl(var(--primary))",
                strokeWidth: 0,
                r: 3,
              }}
              activeDot={{
                fill: "hsl(var(--primary))",
                stroke: "#fff",
                strokeWidth: 2,
                r: 5,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer stats */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700/30">
        <span className="text-[10px] text-gray-500">
          {progressStats?.totalRecords} registos
        </span>
        {progressStats && (
          <span className="text-[10px] text-gray-500">
            {chartData[0]["1RM"]}kg → {chartData[chartData.length - 1]["1RM"]}kg
          </span>
        )}
      </div>
    </motion.div>
  );
};
