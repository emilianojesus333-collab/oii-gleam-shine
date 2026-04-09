import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
  YAxis,
} from "recharts";
import { HexBadge } from "@/components/ui/HexBadge";
import type { DailyLog, MacroGoals } from "@/hooks/useNutrition";

type FilterType = "Calorias" | "Proteína" | "Carbs" | "Gordura";

const FILTERS: FilterType[] = ["Calorias", "Proteína", "Carbs", "Gordura"];
const ACCENT = "#E8650A";

const PT_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface WeeklyEntry {
  date: string;
  dayName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  goalCalories: number;
}

interface NutritionChartProps {
  weeklyData: WeeklyEntry[];
  goals: MacroGoals;
  allLogs: DailyLog[];
}

const DATA_KEY: Record<FilterType, keyof WeeklyEntry> = {
  Calorias: "calories",
  Proteína: "protein",
  Carbs: "carbs",
  Gordura: "fat",
};

const UNIT: Record<FilterType, string> = {
  Calorias: "kcal",
  Proteína: "g",
  Carbs: "g",
  Gordura: "g",
};

// Custom dot — last point gets a glow ring, others standard
const makeDotRenderer = (total: number) => (props: any) => {
  const { cx, cy, index } = props;
  if (cx == null || cy == null) return <g key={`dot-${index}`} />;
  const isLast = index === total - 1;
  if (isLast) {
    return (
      <g key={`glow-dot-${index}`}>
        <circle cx={cx} cy={cy} r={12} fill={`rgba(232,101,10,0.12)`} />
        <circle cx={cx} cy={cy} r={7} fill={ACCENT} stroke="#1A1A1A" strokeWidth={2.5} />
      </g>
    );
  }
  return (
    <circle
      key={`dot-${index}`}
      cx={cx}
      cy={cy}
      r={4.5}
      fill={ACCENT}
      stroke="#1A1A1A"
      strokeWidth={2}
    />
  );
};

const CustomTooltip = ({ active, payload, unit }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "rgba(10,18,28,0.96)",
        border: "1px solid rgba(232,101,10,0.3)",
        borderRadius: 8,
        padding: "8px 12px",
      }}
    >
      <span style={{ color: "white", fontWeight: 800, fontSize: 13 }}>
        {payload[0].value}
        {unit}
      </span>
    </div>
  );
};

const STAT_LABEL: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "rgba(255,255,255,0.3)",
  display: "block",
  marginBottom: 3,
};

const STAT_VALUE: React.CSSProperties = {
  fontSize: 19,
  fontWeight: 900,
  color: "white",
  letterSpacing: "-0.02em",
  lineHeight: 1,
};

const STAT_SUB: React.CSSProperties = {
  fontSize: 9,
  color: "rgba(255,255,255,0.25)",
  marginTop: 3,
  display: "block",
};

export const NutritionChart = ({ weeklyData, goals, allLogs }: NutritionChartProps) => {
  const [filter, setFilter] = useState<FilterType>("Calorias");

  const data = weeklyData.length > 0 ? weeklyData : Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d.toISOString().split("T")[0],
      dayName: PT_SHORT[d.getDay()],
      calories: 0, protein: 0, carbs: 0, fat: 0,
      goalCalories: goals.calories,
    };
  });

  const chartData = data.map((d, i) => ({
    ...d,
    value: (d[DATA_KEY[filter]] as number) || 0,
    shortDay: i === data.length - 1 ? "Hoje" : PT_SHORT[new Date(d.date).getDay()],
  }));

  const metaValue = {
    Calorias: goals.calories,
    Proteína: goals.protein,
    Carbs: goals.carbs,
    Gordura: goals.fat,
  }[filter];

  // Stats computations
  const avgCalories = useMemo(() => {
    if (!data.length) return 0;
    return Math.round(data.reduce((s, d) => s + d.calories, 0) / data.length);
  }, [data]);

  const avgProtein = useMemo(() => {
    if (!data.length) return 0;
    return Math.round(data.reduce((s, d) => s + d.protein, 0) / data.length);
  }, [data]);

  const daysOnGoal = useMemo(
    () => data.filter((d) => d.calories >= goals.calories * 0.9).length,
    [data, goals.calories]
  );

  const prevWeekGoalDays = useMemo(() => {
    if (!allLogs.length) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let count = 0;
    for (let i = 7; i < 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const log = allLogs.find((l) => l.date === dateStr);
      if (log && log.totals.calories >= goals.calories * 0.9) count++;
    }
    return count;
  }, [allLogs, goals.calories]);

  const goalDiff = prevWeekGoalDays !== null ? daysOnGoal - prevWeekGoalDays : null;

  const maxVal = Math.max(...chartData.map((d) => d.value), metaValue) * 1.15 || 100;

  const dotRenderer = makeDotRenderer(chartData.length);

  return (
    <div
      style={{
        background: "#1A1A1A",
        borderRadius: 0,
        border: "none",
        borderBottom: "1px solid #2A2A2A",
        padding: "18px 16px",
        width: "100%",
      }}
    >
      {/* Section label + title */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <HexBadge label="NU" />
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.25)",
          }}
        >
          NUTRIÇÃO
        </span>
      </div>
      <h3
        style={{
          fontSize: 18,
          fontWeight: 900,
          color: "white",
          letterSpacing: "-0.01em",
          margin: "0 0 14px 0",
        }}
      >
        Últimos 7 dias
      </h3>

      {/* Stats row */}
      <div style={{ display: "flex", marginBottom: 16 }}>
        {/* Avg calories */}
        <div style={{ flex: 1, paddingRight: 14 }}>
          <span style={STAT_LABEL}>Média Diária</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
            <span style={STAT_VALUE}>{avgCalories}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)" }}>kcal</span>
          </div>
          <span style={STAT_SUB}>Meta: {goals.calories}kcal</span>
        </div>

        <div style={{ width: 1, background: "rgba(255,255,255,0.06)", margin: "0 14px" }} />

        {/* Days on goal */}
        <div style={{ flex: 1, paddingLeft: 0, paddingRight: 14 }}>
          <span style={STAT_LABEL}>Dias no Objectivo</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
            <span style={STAT_VALUE}>{daysOnGoal}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)" }}>/ 7</span>
          </div>
          {goalDiff !== null ? (
            <span style={{ ...STAT_SUB, color: goalDiff >= 0 ? ACCENT : "rgba(255,255,255,0.25)" }}>
              {goalDiff >= 0 ? "↑" : "↓"} {goalDiff >= 0 ? "+" : ""}{goalDiff} vs sem. ant.
            </span>
          ) : (
            <span style={STAT_SUB}>—</span>
          )}
        </div>

        <div style={{ width: 1, background: "rgba(255,255,255,0.06)", margin: "0 14px" }} />

        {/* Avg protein */}
        <div style={{ flex: 1 }}>
          <span style={STAT_LABEL}>Proteína Média</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
            <span style={STAT_VALUE}>{avgProtein}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)" }}>g</span>
          </div>
          <span style={STAT_SUB}>Meta: {goals.protein}g</span>
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              style={{
                background: active ? "rgba(232,101,10,0.15)" : "rgba(255,255,255,0.05)",
                color: active ? ACCENT : "rgba(255,255,255,0.35)",
                border: active ? `1px solid rgba(232,101,10,0.35)` : "1px solid rgba(255,255,255,0.08)",
                borderRadius: 20,
                padding: "6px 13px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div style={{ height: 130 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 12, right: 16, left: 16, bottom: 0 }}>
            <YAxis hide domain={[0, maxVal]} />
            <ReferenceLine
              y={metaValue}
              stroke="rgba(255,255,255,0.18)"
              strokeDasharray="5 4"
              strokeWidth={1.5}
            />
            <Tooltip
              content={(props) => (
                <CustomTooltip {...props} unit={UNIT[filter]} />
              )}
              cursor={{ stroke: "rgba(255,255,255,0.08)", strokeWidth: 1 }}
            />
            <Line
              key={filter}
              type="monotone"
              dataKey="value"
              stroke={ACCENT}
              strokeWidth={2.5}
              dot={dotRenderer}
              activeDot={{ r: 7, fill: ACCENT }}
              animationDuration={500}
              isAnimationActive
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Day labels */}
      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 6 }}>
        {chartData.map((d, i) => (
          <span
            key={i}
            style={{
              fontSize: 10,
              fontWeight: d.shortDay === "Hoje" ? 800 : 600,
              color: d.shortDay === "Hoje" ? ACCENT : "rgba(255,255,255,0.22)",
            }}
          >
            {d.shortDay}
          </span>
        ))}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          marginTop: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: ACCENT,
              boxShadow: `0 0 6px rgba(232,101,10,0.5)`,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)" }}>
            {filter}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 18,
              borderTop: "2px dashed rgba(255,255,255,0.3)",
            }}
          />
          <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)" }}>
            Meta
          </span>
        </div>
      </div>
    </div>
  );
};
