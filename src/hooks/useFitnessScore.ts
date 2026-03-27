export interface FitnessMetric {
  label: string;
  value: number; // 0–10
  fullMark: 10;
}

export interface FitnessScoreData {
  metrics: FitnessMetric[];
  totalScore: number; // 0–1000
}

interface FitnessScoreInput {
  weeklyVolume: number;
  weeklyFrequency: number;
  completedSessions: number;
  plannedSessions: number;
  hydrationPercentage: number;
  todayCalories: number;
  goalCalories: number;
}

export function computeFitnessScore(input: FitnessScoreInput): FitnessScoreData {
  const { weeklyVolume, weeklyFrequency, completedSessions, plannedSessions, hydrationPercentage, todayCalories, goalCalories } = input;

  const volume = Math.min(10, (weeklyVolume / 50000) * 10);
  const frequency = Math.min(10, (weeklyFrequency / 5) * 10);
  const consistency = plannedSessions > 0 ? Math.min(10, (completedSessions / plannedSessions) * 10) : 0;
  const hydration = Math.min(10, (hydrationPercentage / 100) * 10);

  const proteinGoal = goalCalories > 0 ? goalCalories : 150; // goalCalories is actually goalProtein here
  const nutrition = Math.min(10, (todayCalories / Math.max(proteinGoal, 1)) * 10);

  const metrics: FitnessMetric[] = [
    { label: "Volume", value: round(volume), fullMark: 10 },
    { label: "Frequência", value: round(frequency), fullMark: 10 },
    { label: "Consistência", value: round(consistency), fullMark: 10 },
    { label: "Hidratação", value: round(hydration), fullMark: 10 },
    { label: "Nutrição", value: round(nutrition), fullMark: 10 },
  ];

  const totalScore = Math.round(metrics.reduce((sum, m) => sum + m.value, 0) * 20);

  return { metrics, totalScore };
}

function round(v: number): number {
  return Math.round(v * 10) / 10;
}
