import { usePerformanceMetrics } from "./usePerformanceMetrics";
import { useWeeklyStats } from "./useWeeklyStats";
import { useAlerts } from "./useAlerts";
import { useNutrition } from "./useNutrition";

export interface FitnessMetric {
  label: string;
  value: number; // 0–10
  fullMark: 10;
}

export interface FitnessScoreData {
  metrics: FitnessMetric[];
  totalScore: number; // 0–1000
  loading: boolean;
}

export function useFitnessScore(): FitnessScoreData {
  const { data: perfData, isLoading: perfLoading } = usePerformanceMetrics();
  const { data: weeklyData, loading: weeklyLoading } = useWeeklyStats();
  const { hydrationSummary } = useAlerts();
  const { todayLog, goals } = useNutrition();

  const loading = perfLoading || weeklyLoading;

  // --- Volume (0-10): weekly volume normalized (50k kg = 10) ---
  const weeklyVolume = perfData?.weeklyVolume ?? 0;
  const volume = Math.min(10, (weeklyVolume / 50000) * 10);

  // --- Frequência (0-10): sessions this week, 5+ = 10 ---
  const frequency = Math.min(10, ((perfData?.weeklyFrequency ?? 0) / 5) * 10);

  // --- Consistência (0-10): completed/planned ratio ---
  const completed = weeklyData?.completedSessions ?? 0;
  const planned = weeklyData?.plannedSessions ?? 1;
  const consistency = planned > 0 ? Math.min(10, (completed / planned) * 10) : 0;

  // --- Hidratação (0-10): today's hydration percentage ---
  const hydrationPct = hydrationSummary?.percentage ?? 0;
  const hydration = Math.min(10, (hydrationPct / 100) * 10);

  // --- Nutrição (0-10): today's calorie intake vs goal ---
  const todayCalories = todayLog?.totals?.calories ?? 0;
  const goalCalories = goals?.calories ?? 2000;
  const nutritionRatio = goalCalories > 0 ? todayCalories / goalCalories : 0;
  // Penalize both under and over eating: closer to 1.0 = better
  const nutritionScore = nutritionRatio <= 1
    ? nutritionRatio * 10
    : Math.max(0, 10 - (nutritionRatio - 1) * 10);
  const nutrition = Math.min(10, Math.max(0, nutritionScore));

  const metrics: FitnessMetric[] = [
    { label: "Volume", value: round(volume), fullMark: 10 },
    { label: "Frequência", value: round(frequency), fullMark: 10 },
    { label: "Consistência", value: round(consistency), fullMark: 10 },
    { label: "Hidratação", value: round(hydration), fullMark: 10 },
    { label: "Nutrição", value: round(nutrition), fullMark: 10 },
  ];

  const totalScore = Math.round(
    metrics.reduce((sum, m) => sum + m.value, 0) * 20
  );

  return { metrics, totalScore, loading };
}

function round(v: number): number {
  return Math.round(v * 10) / 10;
}
