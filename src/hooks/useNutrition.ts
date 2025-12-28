import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'sonner';

export interface MacroGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface FoodItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

export interface Meal {
  id: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout';
  time: string;
  foods: FoodItem[];
  total: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  tips?: string;
  imageUrl?: string;
}

export interface DailyLog {
  date: string;
  meals: Meal[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

export interface UserProfile {
  weight: number; // kg
  height: number; // cm
  age: number;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'cut' | 'maintain' | 'bulk';
}

export interface WeeklyGoal {
  id: string;
  type: 'calories' | 'protein' | 'carbs' | 'fat' | 'fiber';
  target: number;
  achieved: boolean;
  achievedDate?: string;
}

export interface Achievement {
  id: string;
  type: 'daily_goal' | 'weekly_streak' | 'protein_champion' | 'consistency';
  title: string;
  description: string;
  unlockedAt: string;
  icon: string;
}

interface NutritionState {
  profile: UserProfile;
  goals: MacroGoals;
  dailyLogs: DailyLog[];
  currentDate: string;
  weeklyGoals: WeeklyGoal[];
  achievements: Achievement[];
  notifiedAchievements: string[];
}

const defaultProfile: UserProfile = {
  weight: 75,
  height: 175,
  age: 25,
  gender: 'male',
  activityLevel: 'active',
  goal: 'maintain',
};

const STORAGE_KEY = 'nutrition_data';

// Harris-Benedict BMR calculation
const calculateBMR = (profile: UserProfile): number => {
  if (profile.gender === 'male') {
    return 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age);
  }
  return 447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * profile.age);
};

// Activity multipliers
const activityMultipliers = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

// Goal adjustments
const goalAdjustments = {
  cut: -500,
  maintain: 0,
  bulk: 300,
};

const calculateMacroGoals = (profile: UserProfile): MacroGoals => {
  const bmr = calculateBMR(profile);
  const tdee = bmr * activityMultipliers[profile.activityLevel];
  const targetCalories = Math.round(tdee + goalAdjustments[profile.goal]);

  // Macro split based on goal
  let proteinRatio: number, carbRatio: number, fatRatio: number;

  if (profile.goal === 'cut') {
    proteinRatio = 0.35;
    fatRatio = 0.30;
    carbRatio = 0.35;
  } else if (profile.goal === 'bulk') {
    proteinRatio = 0.25;
    fatRatio = 0.25;
    carbRatio = 0.50;
  } else {
    proteinRatio = 0.30;
    fatRatio = 0.25;
    carbRatio = 0.45;
  }

  return {
    calories: targetCalories,
    protein: Math.round((targetCalories * proteinRatio) / 4),
    carbs: Math.round((targetCalories * carbRatio) / 4),
    fat: Math.round((targetCalories * fatRatio) / 9),
    fiber: 30,
  };
};

const getToday = () => new Date().toISOString().split('T')[0];

const getWeekStart = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  return new Date(today.setDate(diff)).toISOString().split('T')[0];
};

export const useNutrition = () => {
  const [state, setState] = useState<NutritionState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          currentDate: getToday(),
          weeklyGoals: parsed.weeklyGoals || [],
          achievements: parsed.achievements || [],
          notifiedAchievements: parsed.notifiedAchievements || [],
        };
      } catch {
        // Fall through to default
      }
    }
    
    const goals = calculateMacroGoals(defaultProfile);
    return {
      profile: defaultProfile,
      goals,
      dailyLogs: [],
      currentDate: getToday(),
      weeklyGoals: [],
      achievements: [],
      notifiedAchievements: [],
    };
  });

  const hasShownAchievementRef = useRef<Set<string>>(new Set(state.notifiedAchievements));

  // Persist state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Get or create today's log
  const todayLog = useMemo((): DailyLog => {
    const existing = state.dailyLogs.find(log => log.date === state.currentDate);
    if (existing) return existing;
    
    return {
      date: state.currentDate,
      meals: [],
      totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    };
  }, [state.dailyLogs, state.currentDate]);

  // Calculate totals from meals
  const calculateTotals = useCallback((meals: Meal[]) => {
    return meals.reduce((acc, meal) => ({
      calories: acc.calories + meal.total.calories,
      protein: acc.protein + meal.total.protein,
      carbs: acc.carbs + meal.total.carbs,
      fat: acc.fat + meal.total.fat,
      fiber: acc.fiber + (meal.total.fiber || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  }, []);

  // Check and trigger achievements
  const checkAchievements = useCallback((updatedLogs: DailyLog[], updatedTotals: { calories: number; protein: number; carbs: number; fat: number; fiber: number }) => {
    const newAchievements: Achievement[] = [];
    const today = getToday();

    // Check daily calorie goal
    if (updatedTotals.calories >= state.goals.calories * 0.9 && updatedTotals.calories <= state.goals.calories * 1.1) {
      const achievementId = `daily_calories_${today}`;
      if (!hasShownAchievementRef.current.has(achievementId)) {
        hasShownAchievementRef.current.add(achievementId);
        toast.success('🎯 Meta de Calorias Atingida!', {
          description: `Consumiste ${updatedTotals.calories} kcal hoje. Excelente!`,
        });
        newAchievements.push({
          id: achievementId,
          type: 'daily_goal',
          title: 'Meta Diária de Calorias',
          description: `Atingiste a meta de ${state.goals.calories} kcal`,
          unlockedAt: today,
          icon: '🎯',
        });
      }
    }

    // Check protein goal
    if (updatedTotals.protein >= state.goals.protein) {
      const achievementId = `daily_protein_${today}`;
      if (!hasShownAchievementRef.current.has(achievementId)) {
        hasShownAchievementRef.current.add(achievementId);
        toast.success('💪 Meta de Proteína Atingida!', {
          description: `${updatedTotals.protein}g de proteína consumidos. Músculos agradecem!`,
        });
        newAchievements.push({
          id: achievementId,
          type: 'protein_champion',
          title: 'Campeão da Proteína',
          description: `Atingiste ${state.goals.protein}g de proteína`,
          unlockedAt: today,
          icon: '💪',
        });
      }
    }

    // Check weekly streak (7 days with meals logged)
    const weekStart = getWeekStart();
    const daysWithMeals = updatedLogs.filter(log => {
      const logDate = new Date(log.date);
      const weekStartDate = new Date(weekStart);
      return logDate >= weekStartDate && log.meals.length > 0;
    }).length;

    if (daysWithMeals >= 7) {
      const achievementId = `weekly_streak_${weekStart}`;
      if (!hasShownAchievementRef.current.has(achievementId)) {
        hasShownAchievementRef.current.add(achievementId);
        toast.success('🔥 Semana Completa!', {
          description: 'Registaste refeições todos os 7 dias desta semana!',
        });
        newAchievements.push({
          id: achievementId,
          type: 'weekly_streak',
          title: 'Semana Perfeita',
          description: 'Registaste refeições durante 7 dias seguidos',
          unlockedAt: today,
          icon: '🔥',
        });
      }
    }

    if (newAchievements.length > 0) {
      setState(prev => ({
        ...prev,
        achievements: [...prev.achievements, ...newAchievements],
        notifiedAchievements: [...prev.notifiedAchievements, ...newAchievements.map(a => a.id)],
      }));
    }
  }, [state.goals]);

  // Add meal
  const addMeal = useCallback((meal: Omit<Meal, 'id'>) => {
    setState(prev => {
      const newMeal: Meal = {
        ...meal,
        id: Date.now().toString(),
      };

      const existingLogIndex = prev.dailyLogs.findIndex(log => log.date === prev.currentDate);
      let updatedLogs: DailyLog[];
      let updatedTotals: { calories: number; protein: number; carbs: number; fat: number; fiber: number };

      if (existingLogIndex >= 0) {
        const updatedMeals = [...prev.dailyLogs[existingLogIndex].meals, newMeal];
        updatedTotals = calculateTotals(updatedMeals);
        updatedLogs = prev.dailyLogs.map((log, i) => 
          i === existingLogIndex 
            ? { ...log, meals: updatedMeals, totals: updatedTotals }
            : log
        );
      } else {
        updatedTotals = calculateTotals([newMeal]);
        const newLog: DailyLog = {
          date: prev.currentDate,
          meals: [newMeal],
          totals: updatedTotals,
        };
        updatedLogs = [...prev.dailyLogs, newLog];
      }

      // Check achievements after adding meal
      setTimeout(() => checkAchievements(updatedLogs, updatedTotals), 100);

      return { ...prev, dailyLogs: updatedLogs };
    });
  }, [calculateTotals, checkAchievements]);

  // Remove meal
  const removeMeal = useCallback((mealId: string) => {
    setState(prev => {
      const updatedLogs = prev.dailyLogs.map(log => {
        if (log.date !== prev.currentDate) return log;
        const updatedMeals = log.meals.filter(m => m.id !== mealId);
        return { ...log, meals: updatedMeals, totals: calculateTotals(updatedMeals) };
      });
      return { ...prev, dailyLogs: updatedLogs };
    });
  }, [calculateTotals]);

  // Update profile and recalculate goals
  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setState(prev => {
      const newProfile = { ...prev.profile, ...updates };
      const newGoals = calculateMacroGoals(newProfile);
      return { ...prev, profile: newProfile, goals: newGoals };
    });
  }, []);

  // Set custom goals
  const setCustomGoals = useCallback((goals: Partial<MacroGoals>) => {
    setState(prev => ({ ...prev, goals: { ...prev.goals, ...goals } }));
  }, []);

  // Get progress percentages
  const progress = useMemo(() => ({
    calories: Math.min((todayLog.totals.calories / state.goals.calories) * 100, 100),
    protein: Math.min((todayLog.totals.protein / state.goals.protein) * 100, 100),
    carbs: Math.min((todayLog.totals.carbs / state.goals.carbs) * 100, 100),
    fat: Math.min((todayLog.totals.fat / state.goals.fat) * 100, 100),
    fiber: Math.min((todayLog.totals.fiber / state.goals.fiber) * 100, 100),
  }), [todayLog.totals, state.goals]);

  // Get remaining macros
  const remaining = useMemo(() => ({
    calories: Math.max(state.goals.calories - todayLog.totals.calories, 0),
    protein: Math.max(state.goals.protein - todayLog.totals.protein, 0),
    carbs: Math.max(state.goals.carbs - todayLog.totals.carbs, 0),
    fat: Math.max(state.goals.fat - todayLog.totals.fat, 0),
    fiber: Math.max(state.goals.fiber - todayLog.totals.fiber, 0),
  }), [todayLog.totals, state.goals]);

  // Get weekly data for chart
  const weeklyData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const log = state.dailyLogs.find(l => l.date === dateStr);
      
      days.push({
        date: dateStr,
        dayName: date.toLocaleDateString('pt-PT', { weekday: 'short' }),
        calories: log?.totals.calories || 0,
        protein: log?.totals.protein || 0,
        carbs: log?.totals.carbs || 0,
        fat: log?.totals.fat || 0,
        goalCalories: state.goals.calories,
      });
    }
    return days;
  }, [state.dailyLogs, state.goals.calories]);

  // Get weekly stats
  const weeklyStats = useMemo(() => {
    const weekStart = getWeekStart();
    const weekLogs = state.dailyLogs.filter(log => log.date >= weekStart);
    
    const totalCalories = weekLogs.reduce((sum, log) => sum + log.totals.calories, 0);
    const totalProtein = weekLogs.reduce((sum, log) => sum + log.totals.protein, 0);
    const daysLogged = weekLogs.filter(log => log.meals.length > 0).length;
    const avgCalories = daysLogged > 0 ? Math.round(totalCalories / daysLogged) : 0;
    const avgProtein = daysLogged > 0 ? Math.round(totalProtein / daysLogged) : 0;
    
    // Days meeting calorie goal
    const daysMetCalorieGoal = weekLogs.filter(log => 
      log.totals.calories >= state.goals.calories * 0.9 && 
      log.totals.calories <= state.goals.calories * 1.1
    ).length;
    
    // Days meeting protein goal
    const daysMetProteinGoal = weekLogs.filter(log => 
      log.totals.protein >= state.goals.protein
    ).length;

    return {
      totalCalories,
      totalProtein,
      daysLogged,
      avgCalories,
      avgProtein,
      daysMetCalorieGoal,
      daysMetProteinGoal,
      weeklyCalorieGoal: state.goals.calories * 7,
      weeklyProteinGoal: state.goals.protein * 7,
    };
  }, [state.dailyLogs, state.goals]);

  // Get all logs for history
  const allLogs = useMemo(() => {
    return [...state.dailyLogs].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [state.dailyLogs]);

  // Get monthly data
  const monthlyData = useMemo(() => {
    const today = new Date();
    const days = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const log = state.dailyLogs.find(l => l.date === dateStr);
      
      days.push({
        date: dateStr,
        day: date.getDate(),
        calories: log?.totals.calories || 0,
        protein: log?.totals.protein || 0,
        carbs: log?.totals.carbs || 0,
        fat: log?.totals.fat || 0,
        hasMeals: log?.meals.length ? log.meals.length > 0 : false,
      });
    }
    return days;
  }, [state.dailyLogs]);

  return {
    profile: state.profile,
    goals: state.goals,
    todayLog,
    progress,
    remaining,
    weeklyData,
    weeklyStats,
    monthlyData,
    allLogs,
    achievements: state.achievements,
    addMeal,
    removeMeal,
    updateProfile,
    setCustomGoals,
  };
};

// Meal type labels in Portuguese
export const mealTypeLabels: Record<Meal['type'], string> = {
  breakfast: 'Pequeno-almoço',
  lunch: 'Almoço',
  dinner: 'Jantar',
  snack: 'Lanche',
  pre_workout: 'Pré-treino',
  post_workout: 'Pós-treino',
};

// Meal type icons
export const mealTypeIcons: Record<Meal['type'], string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
  pre_workout: '💪',
  post_workout: '🥤',
};