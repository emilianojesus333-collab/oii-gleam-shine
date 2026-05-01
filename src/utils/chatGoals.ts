export interface ChatGoal {
  id: string;
  title: string;
  description?: string;
  targetDate?: string;
  progress: number; // 0-100
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

function storageKey(userId: string): string {
  return `liftmate_chat_goals_${userId}`;
}

function loadGoals(userId: string): ChatGoal[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGoals(userId: string, goals: ChatGoal[]): void {
  localStorage.setItem(storageKey(userId), JSON.stringify(goals));
}

export function createGoal(userId: string, goal: Omit<ChatGoal, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'completed'>): ChatGoal {
  const goals = loadGoals(userId);
  const now = new Date().toISOString();
  const newGoal: ChatGoal = {
    ...goal,
    id: `goal_${Date.now()}`,
    progress: 0,
    completed: false,
    createdAt: now,
    updatedAt: now,
  };
  goals.push(newGoal);
  saveGoals(userId, goals);
  return newGoal;
}

export function updateGoalProgress(userId: string, goalId: string, progress: number): ChatGoal | null {
  const goals = loadGoals(userId);
  const idx = goals.findIndex(g => g.id === goalId);
  if (idx === -1) return null;
  goals[idx] = { ...goals[idx], progress: Math.min(100, Math.max(0, progress)), updatedAt: new Date().toISOString() };
  saveGoals(userId, goals);
  return goals[idx];
}

export function completeGoal(userId: string, goalId: string): ChatGoal | null {
  const goals = loadGoals(userId);
  const idx = goals.findIndex(g => g.id === goalId);
  if (idx === -1) return null;
  goals[idx] = { ...goals[idx], progress: 100, completed: true, updatedAt: new Date().toISOString() };
  saveGoals(userId, goals);
  return goals[idx];
}

export function deleteGoal(userId: string, goalId: string): boolean {
  const goals = loadGoals(userId);
  const filtered = goals.filter(g => g.id !== goalId);
  if (filtered.length === goals.length) return false;
  saveGoals(userId, filtered);
  return true;
}

export function formatGoalsForAI(userId: string): string {
  const goals = loadGoals(userId).filter(g => !g.completed);
  if (goals.length === 0) return '';

  const lines = goals.map(g => {
    const deadline = g.targetDate ? ` (prazo: ${g.targetDate})` : '';
    return `- ${g.title}${deadline}: ${g.progress}% concluído${g.description ? ` — ${g.description}` : ''}`;
  });

  return `\n🎯 METAS CONVERSACIONAIS ATIVAS:\n${lines.join('\n')}`;
}
