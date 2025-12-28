import { useState, useEffect, useCallback, useMemo } from 'react';

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

interface NutritionState {
  profile: UserProfile;
  goals: MacroGoals;
  dailyLogs: DailyLog[];
  currentDate: string;
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
    // High protein for muscle preservation during cut
    proteinRatio = 0.35;
    fatRatio = 0.30;
    carbRatio = 0.35;
  } else if (profile.goal === 'bulk') {
    // More carbs for energy and growth
    proteinRatio = 0.25;
    fatRatio = 0.25;
    carbRatio = 0.50;
  } else {
    // Balanced for maintenance
    proteinRatio = 0.30;
    fatRatio = 0.25;
    carbRatio = 0.45;
  }

  return {
    calories: targetCalories,
    protein: Math.round((targetCalories * proteinRatio) / 4), // 4 cal/g
    carbs: Math.round((targetCalories * carbRatio) / 4), // 4 cal/g
    fat: Math.round((targetCalories * fatRatio) / 9), // 9 cal/g
    fiber: 30, // Standard recommendation
  };
};

const getToday = () => new Date().toISOString().split('T')[0];

export const useNutrition = () => {
  const [state, setState] = useState<NutritionState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          currentDate: getToday(),
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
    };
  });

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

  // Add meal
  const addMeal = useCallback((meal: Omit<Meal, 'id'>) => {
    setState(prev => {
      const newMeal: Meal = {
        ...meal,
        id: Date.now().toString(),
      };

      const existingLogIndex = prev.dailyLogs.findIndex(log => log.date === prev.currentDate);
      let updatedLogs: DailyLog[];

      if (existingLogIndex >= 0) {
        const updatedMeals = [...prev.dailyLogs[existingLogIndex].meals, newMeal];
        updatedLogs = prev.dailyLogs.map((log, i) => 
          i === existingLogIndex 
            ? { ...log, meals: updatedMeals, totals: calculateTotals(updatedMeals) }
            : log
        );
      } else {
        const newLog: DailyLog = {
          date: prev.currentDate,
          meals: [newMeal],
          totals: calculateTotals([newMeal]),
        };
        updatedLogs = [...prev.dailyLogs, newLog];
      }

      return { ...prev, dailyLogs: updatedLogs };
    });
  }, [calculateTotals]);

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

  return {
    profile: state.profile,
    goals: state.goals,
    todayLog,
    progress,
    remaining,
    weeklyData,
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
