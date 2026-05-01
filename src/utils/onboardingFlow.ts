export interface DayTask {
  day: number;
  title: string;
  description: string;
  route: string;
  routeState?: Record<string, unknown>;
  completionKey: string; // localStorage key that signals completion
}

export interface DayFlowProgress {
  startDate: string; // ISO date string of account/onboarding completion
  completedKeys: string[];
}

export const DAY_TASKS: DayTask[] = [
  {
    day: 1,
    title: "Completa o teu primeiro treino gerado pela IA",
    description: "Vai ao Treino e deixa a IA criar o plano perfeito para ti",
    route: "/workout",
    completionKey: "first_workout_done",
  },
  {
    day: 2,
    title: "Regista a tua primeira refeição",
    description: "Abre Nutrição e adiciona o que comeste hoje",
    route: "/nutrition",
    completionKey: "first_meal_done",
  },
  {
    day: 3,
    title: "Define o teu objetivo de peso no Chat",
    description: "Fala com o Coach IA sobre os teus objetivos",
    route: "/chat",
    routeState: {
      prefill: "Quero definir o meu objetivo de peso. Podes ajudar-me a criar um plano?",
    },
    completionKey: "chat_goal_done",
  },
  {
    day: 4,
    title: "Completa o segundo treino",
    description: "Mantém a consistência — dois treinos na primeira semana",
    route: "/workout",
    completionKey: "second_workout_done",
  },
  {
    day: 5,
    title: "Regista a tua hidratação durante o dia",
    description: "Abre Nutrição e usa o tracker de água",
    route: "/nutrition",
    completionKey: "hydration_done",
  },
  {
    day: 6,
    title: "Vê o teu Score de Forma no Home",
    description: "Descobre como está a tua condição física atual",
    route: "/home",
    completionKey: "fitness_score_seen",
  },
  {
    day: 7,
    title: "Faz o balanço da semana com o Coach IA",
    description: "Pergunta ao Coach como correu a tua primeira semana",
    route: "/chat",
    routeState: {
      prefill: "Acabei a minha primeira semana de treino. Podes fazer um balanço e dizer-me como posso melhorar?",
    },
    completionKey: "week_review_done",
  },
];

const FLOW_KEY = (userId: string) => `liftmate_day_flow_${userId}`;

export function getDayFlowProgress(userId: string): DayFlowProgress | null {
  const raw = localStorage.getItem(FLOW_KEY(userId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DayFlowProgress;
  } catch {
    return null;
  }
}

export function initDayFlow(userId: string, startDate?: string): DayFlowProgress {
  const existing = getDayFlowProgress(userId);
  if (existing) return existing;
  const progress: DayFlowProgress = {
    startDate: startDate || new Date().toISOString().split("T")[0],
    completedKeys: [],
  };
  localStorage.setItem(FLOW_KEY(userId), JSON.stringify(progress));
  return progress;
}

export function markTaskComplete(userId: string, completionKey: string): void {
  const progress = getDayFlowProgress(userId);
  if (!progress) return;
  if (!progress.completedKeys.includes(completionKey)) {
    progress.completedKeys.push(completionKey);
    localStorage.setItem(FLOW_KEY(userId), JSON.stringify(progress));
  }
}

export function getCurrentDayTask(userId: string): {
  task: DayTask | null;
  dayNumber: number;
  completedCount: number;
  isWithin7Days: boolean;
} {
  const progress = getDayFlowProgress(userId);
  if (!progress) return { task: null, dayNumber: 0, completedCount: 0, isWithin7Days: false };

  const start = new Date(progress.startDate + "T00:00:00");
  const now = new Date();
  const dayNumber = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const isWithin7Days = dayNumber >= 1 && dayNumber <= 7;

  const completedCount = progress.completedKeys.length;

  if (!isWithin7Days) return { task: null, dayNumber, completedCount, isWithin7Days: false };

  // Find first incomplete task up to current day
  const taskForToday = DAY_TASKS.find(
    (t) => t.day <= dayNumber && !progress.completedKeys.includes(t.completionKey)
  );

  return { task: taskForToday || null, dayNumber, completedCount, isWithin7Days };
}

export function isTaskComplete(userId: string, completionKey: string): boolean {
  const progress = getDayFlowProgress(userId);
  if (!progress) return false;
  return progress.completedKeys.includes(completionKey);
}
