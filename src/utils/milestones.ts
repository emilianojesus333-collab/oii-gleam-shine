export type MilestoneId =
  | "first_workout"
  | "week_streak"
  | "month_active"
  | "ten_workouts"
  | "first_pr";

export interface Milestone {
  id: MilestoneId;
  emoji: string;
  title: string;
  description: string;
  color: string;
}

export const MILESTONES: Record<MilestoneId, Milestone> = {
  first_workout: {
    id: "first_workout",
    emoji: "🥇",
    title: "Primeiro Treino",
    description: "Completaste o teu primeiro treino! A jornada começa agora.",
    color: "#FBBF24",
  },
  week_streak: {
    id: "week_streak",
    emoji: "🔥",
    title: "1 Semana Ativa",
    description: "Uma semana completa com treinos registados. Estás a criar hábito!",
    color: "#FB923C",
  },
  month_active: {
    id: "month_active",
    emoji: "💪",
    title: "1 Mês de Treino",
    description: "30 dias de conta ativa com treinos. És um atleta de verdade!",
    color: "#60A5FA",
  },
  ten_workouts: {
    id: "ten_workouts",
    emoji: "⚡",
    title: "10 Treinos",
    description: "Dez sessões completadas! A consistência é o teu superpoder.",
    color: "#A78BFA",
  },
  first_pr: {
    id: "first_pr",
    emoji: "🏆",
    title: "Primeiro Recorde",
    description: "Estabeleceste o teu primeiro recorde pessoal (1RM). Força!",
    color: "#34D399",
  },
};

const MILESTONES_KEY = (userId: string) => `liftmate_milestones_${userId}`;

export interface MilestonesState {
  achieved: MilestoneId[];
  pendingShow: MilestoneId | null; // next milestone to display in modal
}

function getMilestonesState(userId: string): MilestonesState {
  const raw = localStorage.getItem(MILESTONES_KEY(userId));
  if (!raw) return { achieved: [], pendingShow: null };
  try {
    return JSON.parse(raw) as MilestonesState;
  } catch {
    return { achieved: [], pendingShow: null };
  }
}

function saveMilestonesState(userId: string, state: MilestonesState): void {
  localStorage.setItem(MILESTONES_KEY(userId), JSON.stringify(state));
}

export function checkMilestones(
  userId: string,
  stats: {
    totalSessions: number;
    accountCreatedAt: string; // ISO date
    daysWithWorkoutsLast7: number;
    hasNewPR: boolean;
  }
): MilestoneId | null {
  const state = getMilestonesState(userId);

  const check = (id: MilestoneId, condition: boolean): boolean => {
    if (condition && !state.achieved.includes(id)) {
      state.achieved.push(id);
      state.pendingShow = id;
      saveMilestonesState(userId, state);
      return true;
    }
    return false;
  };

  const accountAgeDays = Math.floor(
    (Date.now() - new Date(stats.accountCreatedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Check in priority order (most impactful first)
  if (check("first_pr", stats.hasNewPR)) return "first_pr";
  if (check("month_active", accountAgeDays >= 30 && stats.totalSessions >= 4)) return "month_active";
  if (check("ten_workouts", stats.totalSessions >= 10)) return "ten_workouts";
  if (check("week_streak", stats.daysWithWorkoutsLast7 >= 3 && accountAgeDays >= 7)) return "week_streak";
  if (check("first_workout", stats.totalSessions >= 1)) return "first_workout";

  return null;
}

export function getPendingMilestone(userId: string): Milestone | null {
  const state = getMilestonesState(userId);
  if (!state.pendingShow) return null;
  return MILESTONES[state.pendingShow] || null;
}

export function clearPendingMilestone(userId: string): void {
  const state = getMilestonesState(userId);
  state.pendingShow = null;
  saveMilestonesState(userId, state);
}

export function hasAchievedMilestone(userId: string, id: MilestoneId): boolean {
  const state = getMilestonesState(userId);
  return state.achieved.includes(id);
}
