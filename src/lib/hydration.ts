export const HYDRATION_BOTTLE_SIZES = [500, 750, 1000, 1500] as const;
export const DEFAULT_HYDRATION_GOAL_LITERS = 3;

export type WorkoutIntensity = "none" | "light" | "moderate" | "intense";
export type HydrationStatus = "low" | "adequate" | "optimal";

export interface HydrationSummary {
  currentIntakeLiters: number;
  goalLiters: number;
  baseGoalLiters: number;
  bonusLiters: number;
  percentage: number;
  status: HydrationStatus;
  message: string;
  recoveryRatePerHour: number;
  bottleSizeMl: number;
  bottleConsumedMl: number;
  bottleRemainingMl: number;
  bottleFillPercentage: number;
  workoutIntensity: WorkoutIntensity;
}

export const roundToOneDecimal = (value: number) => Math.round(value * 10) / 10;

export function formatLiters(value: number): string {
  const rounded = roundToOneDecimal(value);
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
}

export function formatBottleSize(sizeMl: number): string {
  if (sizeMl >= 1000) {
    return `${formatLiters(sizeMl / 1000)} L`;
  }

  return `${sizeMl} ml`;
}

export function parseWeightKg(onboardingData: unknown): number | null {
  const data = onboardingData as Record<string, any> | null;
  const rawWeight = data?.personal?.weight ?? data?.personalData?.weight ?? data?.weight;
  const weight = typeof rawWeight === "string" ? parseFloat(rawWeight) : Number(rawWeight);

  return Number.isFinite(weight) && weight > 0 ? weight : null;
}

export function extractExerciseLogs(sessions: Array<{ exercise_logs?: unknown }> = []): Array<Record<string, any>> {
  return sessions.flatMap((session) =>
    Array.isArray(session.exercise_logs)
      ? (session.exercise_logs as Array<Record<string, any>>)
      : []
  );
}

export function estimateWorkoutIntensityFromLogs(logs: Array<Record<string, any>>): WorkoutIntensity {
  if (!logs.length) return "none";

  const totals = logs.reduce(
    (acc, log) => {
      const sets = Number(log.sets) || 0;
      const reps = Number(log.reps) || 0;
      const weight = Number(log.weight) || 0;
      const rpe = Number(log.rpe) || 0;

      acc.totalSets += sets;
      acc.totalVolume += sets * reps * weight;
      if (rpe > 0) {
        acc.rpeSum += rpe;
        acc.rpeCount += 1;
      }

      return acc;
    },
    { totalSets: 0, totalVolume: 0, rpeSum: 0, rpeCount: 0 }
  );

  const avgRpe = totals.rpeCount > 0 ? totals.rpeSum / totals.rpeCount : 0;

  if (totals.totalVolume >= 8000 || totals.totalSets >= 20 || avgRpe >= 8.5) {
    return "intense";
  }

  if (totals.totalVolume >= 3000 || totals.totalSets >= 10 || avgRpe >= 7) {
    return "moderate";
  }

  return "light";
}

export function getWorkoutHydrationBonusLiters(intensity: WorkoutIntensity): number {
  switch (intensity) {
    case "light":
      return 0.3;
    case "moderate":
      return 0.5;
    case "intense":
      return 0.8;
    default:
      return 0;
  }
}

export const MAX_HYDRATION_GOAL_LITERS = 5;

export function clampHydrationGoalLiters(value: number | null | undefined): number | null {
  const numericValue = typeof value === "string" ? parseFloat(value) : Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) return null;

  return Math.min(roundToOneDecimal(numericValue), MAX_HYDRATION_GOAL_LITERS);
}

export function calculateBaseHydrationGoalLiters(weightKg: number | null): number {
  if (!weightKg) return DEFAULT_HYDRATION_GOAL_LITERS;
  return Math.min(roundToOneDecimal((weightKg * 35) / 1000), MAX_HYDRATION_GOAL_LITERS);
}

export function calculateDynamicHydrationGoalLiters(
  weightKg: number | null,
  intensity: WorkoutIntensity
): { baseGoalLiters: number; bonusLiters: number; goalLiters: number } {
  const baseGoalLiters = calculateBaseHydrationGoalLiters(weightKg);
  const bonusLiters = getWorkoutHydrationBonusLiters(intensity);

  return {
    baseGoalLiters,
    bonusLiters,
    goalLiters: Math.min(roundToOneDecimal(baseGoalLiters + bonusLiters), MAX_HYDRATION_GOAL_LITERS),
  };
}

export function getHydrationStatus(currentIntakeLiters: number, goalLiters: number): HydrationStatus {
  if (goalLiters <= 0) return "adequate";

  const percentage = (currentIntakeLiters / goalLiters) * 100;

  if (percentage < 50) return "low";
  if (percentage <= 80) return "adequate";
  return "optimal";
}

export function getHydrationContextMessage(status: HydrationStatus): string {
  switch (status) {
    case "low":
      return "Hidratação baixa. A recuperação muscular pode estar mais lenta.";
    case "adequate":
      return "Hidratação adequada. O corpo está a recuperar normalmente.";
    case "optimal":
      return "Hidratação ideal. Recuperação muscular otimizada.";
  }
}

export function getRecoveryRatePerHour(status: HydrationStatus): number {
  switch (status) {
    case "low":
      return 2;
    case "adequate":
      return 3;
    case "optimal":
      return 4;
  }
}

export function buildHydrationSummary(
  currentIntakeLiters: number,
  bottleSizeMl: number,
  weightKg: number | null,
  intensity: WorkoutIntensity,
  customGoalLiters?: number | null
): HydrationSummary {
  const safeBottleSizeMl = HYDRATION_BOTTLE_SIZES.includes(bottleSizeMl as (typeof HYDRATION_BOTTLE_SIZES)[number])
    ? bottleSizeMl
    : 1000;
  const goalLiters = clampHydrationGoalLiters(customGoalLiters) ?? DEFAULT_HYDRATION_GOAL_LITERS;
  const baseGoalLiters = goalLiters;
  const bonusLiters = 0;
  const safeCurrentIntake = Math.max(0, roundToOneDecimal(currentIntakeLiters));
  const percentage = goalLiters > 0 ? Math.min((safeCurrentIntake / goalLiters) * 100, 150) : 0;
  const status = getHydrationStatus(safeCurrentIntake, goalLiters);
  const consumedMl = Math.round(safeCurrentIntake * 1000);
  const bottleConsumedMl = consumedMl % safeBottleSizeMl;
  const bottleRemainingMl = bottleConsumedMl === 0 ? safeBottleSizeMl : safeBottleSizeMl - bottleConsumedMl;
  const bottleFillPercentage = Math.max(8, Math.round((bottleRemainingMl / safeBottleSizeMl) * 100));

  return {
    currentIntakeLiters: safeCurrentIntake,
    goalLiters,
    baseGoalLiters,
    bonusLiters,
    percentage,
    status,
    message: getHydrationContextMessage(status),
    recoveryRatePerHour: getRecoveryRatePerHour(status),
    bottleSizeMl: safeBottleSizeMl,
    bottleConsumedMl,
    bottleRemainingMl,
    bottleFillPercentage,
    workoutIntensity: intensity,
  };
}
