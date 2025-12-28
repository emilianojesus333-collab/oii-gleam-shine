// Workout history management

export interface WorkoutSession {
  date: string; // ISO date string (YYYY-MM-DD)
  dayOfWeek: string;
  muscleGroups: string[];
  exercisesCompleted: string[];
  totalExercises: number;
  completionRate: number; // percentage
  timestamp: number;
}

export interface WorkoutHistory {
  sessions: WorkoutSession[];
  lastUpdated: number;
}

const HISTORY_KEY = "liftmate_workout_history";
const MAX_HISTORY_DAYS = 90; // Keep 90 days of history

// Get workout history from localStorage
export const getWorkoutHistory = (): WorkoutHistory => {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed;
    }
  } catch (e) {
    console.error("Error loading workout history:", e);
  }
  return { sessions: [], lastUpdated: Date.now() };
};

// Save a workout session to history
export const saveWorkoutSession = (session: Omit<WorkoutSession, "timestamp">): void => {
  try {
    const history = getWorkoutHistory();
    
    // Check if session for this date already exists
    const existingIndex = history.sessions.findIndex(s => s.date === session.date);
    
    const newSession: WorkoutSession = {
      ...session,
      timestamp: Date.now(),
    };
    
    if (existingIndex >= 0) {
      // Update existing session
      history.sessions[existingIndex] = newSession;
    } else {
      // Add new session
      history.sessions.push(newSession);
    }
    
    // Sort by date descending
    history.sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Keep only last 90 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_HISTORY_DAYS);
    history.sessions = history.sessions.filter(
      s => new Date(s.date) >= cutoffDate
    );
    
    history.lastUpdated = Date.now();
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.error("Error saving workout session:", e);
  }
};

// Get stats for AI context
export const getWorkoutStats = (): {
  totalSessions: number;
  thisWeekSessions: number;
  currentStreak: number;
  mostTrainedMuscles: { muscle: string; count: number }[];
  averageCompletionRate: number;
  recentSessions: WorkoutSession[];
} => {
  const history = getWorkoutHistory();
  const sessions = history.sessions;
  
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      thisWeekSessions: 0,
      currentStreak: 0,
      mostTrainedMuscles: [],
      averageCompletionRate: 0,
      recentSessions: [],
    };
  }
  
  // This week sessions
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeekSessions = sessions.filter(
    s => new Date(s.date) >= weekAgo
  ).length;
  
  // Current streak
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split("T")[0];
    
    const hasSession = sessions.some(s => s.date === dateStr && s.exercisesCompleted.length > 0);
    
    if (hasSession) {
      currentStreak++;
    } else if (i > 0) {
      // Allow one day gap for rest days, but break on second gap
      const previousDate = new Date(today);
      previousDate.setDate(previousDate.getDate() - i + 1);
      const previousDateStr = previousDate.toISOString().split("T")[0];
      const hadPreviousSession = sessions.some(s => s.date === previousDateStr);
      
      if (!hadPreviousSession) {
        break;
      }
    }
  }
  
  // Most trained muscles
  const muscleCounts: Record<string, number> = {};
  sessions.forEach(s => {
    s.muscleGroups.forEach(muscle => {
      muscleCounts[muscle] = (muscleCounts[muscle] || 0) + 1;
    });
  });
  
  const mostTrainedMuscles = Object.entries(muscleCounts)
    .map(([muscle, count]) => ({ muscle, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  // Average completion rate
  const averageCompletionRate = sessions.length > 0
    ? Math.round(sessions.reduce((acc, s) => acc + s.completionRate, 0) / sessions.length)
    : 0;
  
  // Recent sessions (last 7)
  const recentSessions = sessions.slice(0, 7);
  
  return {
    totalSessions: sessions.length,
    thisWeekSessions,
    currentStreak,
    mostTrainedMuscles,
    averageCompletionRate,
    recentSessions,
  };
};

// Generate AI context string
export const generateAIContext = (): string => {
  const stats = getWorkoutStats();
  
  if (stats.totalSessions === 0) {
    return "O utilizador ainda não tem histórico de treinos registado.";
  }
  
  let context = `HISTÓRICO DO UTILIZADOR:\n`;
  context += `- Total de sessões: ${stats.totalSessions}\n`;
  context += `- Sessões esta semana: ${stats.thisWeekSessions}\n`;
  context += `- Streak atual: ${stats.currentStreak} dias\n`;
  context += `- Taxa média de conclusão: ${stats.averageCompletionRate}%\n`;
  
  if (stats.mostTrainedMuscles.length > 0) {
    context += `- Músculos mais treinados: ${stats.mostTrainedMuscles.map(m => `${m.muscle} (${m.count}x)`).join(", ")}\n`;
  }
  
  if (stats.recentSessions.length > 0) {
    context += `\nÚLTIMAS SESSÕES:\n`;
    stats.recentSessions.slice(0, 5).forEach(session => {
      const date = new Date(session.date).toLocaleDateString("pt-PT", { weekday: "short", day: "numeric", month: "short" });
      context += `- ${date}: ${session.muscleGroups.join("+")} - ${session.exercisesCompleted.length} exercícios (${session.completionRate}%)\n`;
    });
  }
  
  return context;
};
