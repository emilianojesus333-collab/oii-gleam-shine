import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { useAuth } from './useAuth';
import { invalidateCachePattern } from './useDataCache';
import { registerCacheCleaner, unregisterCacheCleaner } from './cacheUtils';
import { hapticFeedback } from '@/lib/haptics';

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
  weight: number;
  height: number;
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
  loading: boolean;
  synced: boolean;
}

const defaultProfile: UserProfile = {
  weight: 75,
  height: 175,
  age: 25,
  gender: 'male',
  activityLevel: 'active',
  goal: 'maintain',
};

const STORAGE_KEY_PREFIX = 'nutrition_data_';

// Get user-specific storage key
const getStorageKey = (userId: string) => `${STORAGE_KEY_PREFIX}${userId}`;

// Cache with TTL
interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

const localCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCached = <T>(key: string): T | null => {
  const entry = localCache.get(key);
  if (entry && Date.now() < entry.expiresAt) {
    return entry.data as T;
  }
  localCache.delete(key);
  return null;
};

const setCache = <T>(key: string, data: T): void => {
  localCache.set(key, {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + CACHE_TTL,
  });
};

// Clear cache for a specific user
export const clearNutritionCache = (userId?: string) => {
  if (userId) {
    localCache.delete(`nutrition_${userId}`);
  } else {
    localCache.clear();
  }
};

// Register cache cleaner globally
registerCacheCleaner(() => localCache.clear());

// Harris-Benedict BMR calculation
const calculateBMR = (profile: UserProfile): number => {
  if (profile.gender === 'male') {
    return 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age);
  }
  return 447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * profile.age);
};

const activityMultipliers = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const goalAdjustments = {
  cut: -500,
  maintain: 0,
  bulk: 300,
};

const calculateMacroGoals = (profile: UserProfile): MacroGoals => {
  const bmr = calculateBMR(profile);
  const tdee = bmr * activityMultipliers[profile.activityLevel];
  const targetCalories = Math.round(tdee + goalAdjustments[profile.goal]);

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

// Confetti animation for achievements
const triggerConfetti = () => {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  const fire = (particleRatio: number, opts: confetti.Options) => {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  };

  fire(0.25, { spread: 26, startVelocity: 55, colors: ['#10b981', '#34d399', '#6ee7b7'] });
  fire(0.2, { spread: 60, colors: ['#f59e0b', '#fbbf24', '#fcd34d'] });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ['#8b5cf6', '#a78bfa', '#c4b5fd'] });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: ['#ec4899', '#f472b6', '#f9a8d4'] });
  fire(0.1, { spread: 120, startVelocity: 45, colors: ['#3b82f6', '#60a5fa', '#93c5fd'] });
};

export const useNutrition = () => {
  const { user } = useAuth();
  const [state, setState] = useState<NutritionState>(() => {
    const goals = calculateMacroGoals(defaultProfile);
    return {
      profile: defaultProfile,
      goals,
      dailyLogs: [],
      currentDate: getToday(),
      weeklyGoals: [],
      achievements: [],
      notifiedAchievements: [],
      loading: false,
      synced: false,
    };
  });

  // Load user-specific data when user changes
  useEffect(() => {
    if (!user) {
      // Reset to default state when no user
      const goals = calculateMacroGoals(defaultProfile);
      setState({
        profile: defaultProfile,
        goals,
        dailyLogs: [],
        currentDate: getToday(),
        weeklyGoals: [],
        achievements: [],
        notifiedAchievements: [],
        loading: false,
        synced: false,
      });
      return;
    }

    // Load from user-specific localStorage
    const saved = localStorage.getItem(getStorageKey(user.id));
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(prev => ({
          ...prev,
          ...parsed,
          currentDate: getToday(),
          weeklyGoals: parsed.weeklyGoals || [],
          achievements: parsed.achievements || [],
          notifiedAchievements: parsed.notifiedAchievements || [],
          loading: false,
          synced: false,
        }));
      } catch {
        // Ignore parse errors
      }
    }
  }, [user?.id]);

  const hasShownAchievementRef = useRef<Set<string>>(new Set(state.notifiedAchievements));
  const syncInProgressRef = useRef(false);

  // Sync with Supabase when user is logged in
  useEffect(() => {
    if (!user || syncInProgressRef.current) return;

    const syncWithSupabase = async () => {
      syncInProgressRef.current = true;
      setState(prev => ({ ...prev, loading: true }));

      try {
        // Check cache first
        const cacheKey = `nutrition_${user.id}`;
        const cachedLogs = getCached<DailyLog[]>(cacheKey);
        
        if (cachedLogs) {
          setState(prev => ({
            ...prev,
            dailyLogs: cachedLogs,
            loading: false,
            synced: true,
          }));
          return;
        }

        // Fetch from Supabase with pagination (last 90 days)
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        
        const { data: logs, error } = await supabase
          .from('nutrition_logs')
          .select('*')
          .gte('date', ninetyDaysAgo.toISOString().split('T')[0])
          .order('date', { ascending: false })
          .limit(90);

        if (error) throw error;

        const formattedLogs: DailyLog[] = (logs || []).map(log => ({
          date: log.date,
          meals: (log.meals as unknown as Meal[]) || [],
          totals: (log.totals as unknown as DailyLog['totals']) || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
        }));

        // Merge with local data (prefer remote for same dates)
        const localLogs = state.dailyLogs.filter(
          local => !formattedLogs.some(remote => remote.date === local.date)
        );
        const mergedLogs = [...formattedLogs, ...localLogs].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // Cache the result
        setCache(cacheKey, mergedLogs);

        setState(prev => ({
          ...prev,
          dailyLogs: mergedLogs,
          loading: false,
          synced: true,
        }));

        // Fetch profile
        const { data: profile } = await supabase
          .from('nutrition_profiles')
          .select('*')
          .maybeSingle();

        if (profile) {
          const userProfile: UserProfile = {
            weight: profile.weight || defaultProfile.weight,
            height: profile.height || defaultProfile.height,
            age: profile.age || defaultProfile.age,
            gender: (profile.gender as UserProfile['gender']) || defaultProfile.gender,
            activityLevel: (profile.activity_level as UserProfile['activityLevel']) || defaultProfile.activityLevel,
            goal: (profile.goal as UserProfile['goal']) || defaultProfile.goal,
          };

          const goals: MacroGoals = profile.goal_calories ? {
            calories: profile.goal_calories,
            protein: profile.goal_protein || 0,
            carbs: profile.goal_carbs || 0,
            fat: profile.goal_fat || 0,
            fiber: 30,
          } : calculateMacroGoals(userProfile);

          setState(prev => ({
            ...prev,
            profile: userProfile,
            goals,
          }));
        }
      } catch (error) {
        console.error('Error syncing nutrition:', error);
      } finally {
        syncInProgressRef.current = false;
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    syncWithSupabase();
  }, [user]);

  // Persist to user-specific localStorage (backup)
  useEffect(() => {
    if (!user) return;
    localStorage.setItem(getStorageKey(user.id), JSON.stringify(state));
  }, [state, user]);

  // Save to Supabase (debounced)
  const saveToSupabase = useCallback(async (log: DailyLog) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('nutrition_logs')
        .upsert({
          user_id: user.id,
          date: log.date,
          meals: log.meals as unknown as any,
          totals: log.totals as unknown as any,
        }, { onConflict: 'user_id,date' });

      if (error) throw error;

      // Invalidate cache
      invalidateCachePattern(`nutrition_${user.id}`);
      localCache.delete(`nutrition_${user.id}`);
    } catch (error) {
      console.error('Error saving to Supabase:', error);
    }
  }, [user]);

  const todayLog = useMemo((): DailyLog => {
    const existing = state.dailyLogs.find(log => log.date === state.currentDate);
    if (existing) return existing;
    
    return {
      date: state.currentDate,
      meals: [],
      totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    };
  }, [state.dailyLogs, state.currentDate]);

  const calculateTotals = useCallback((meals: Meal[]) => {
    return meals.reduce((acc, meal) => ({
      calories: acc.calories + meal.total.calories,
      protein: acc.protein + meal.total.protein,
      carbs: acc.carbs + meal.total.carbs,
      fat: acc.fat + meal.total.fat,
      fiber: acc.fiber + (meal.total.fiber || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  }, []);


  const checkAchievements = useCallback((updatedLogs: DailyLog[], updatedTotals: DailyLog['totals']) => {
    const newAchievements: Achievement[] = [];
    const today = getToday();
    let shouldTriggerConfetti = false;

    if (updatedTotals.calories >= state.goals.calories * 0.9 && updatedTotals.calories <= state.goals.calories * 1.1) {
      const achievementId = `daily_calories_${today}`;
      if (!hasShownAchievementRef.current.has(achievementId)) {
        hasShownAchievementRef.current.add(achievementId);
        shouldTriggerConfetti = true;
        toast.success('🎯 Calorie Goal Reached!', {
          description: `You consumed ${updatedTotals.calories} kcal today. Excellent!`,
        });
        newAchievements.push({
          id: achievementId,
          type: 'daily_goal',
          title: 'Daily Calorie Goal',
          description: `Reached the goal of ${state.goals.calories} kcal`,
          unlockedAt: today,
          icon: '🎯',
        });
      }
    }

    if (updatedTotals.protein >= state.goals.protein) {
      const achievementId = `daily_protein_${today}`;
      if (!hasShownAchievementRef.current.has(achievementId)) {
        hasShownAchievementRef.current.add(achievementId);
        shouldTriggerConfetti = true;
        toast.success('💪 Protein Goal Reached!', {
          description: `${updatedTotals.protein}g of protein consumed. Your muscles thank you!`,
        });
        newAchievements.push({
          id: achievementId,
          type: 'protein_champion',
          title: 'Protein Champion',
          description: `Reached ${state.goals.protein}g of protein`,
          unlockedAt: today,
          icon: '💪',
        });
      }
    }

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
        shouldTriggerConfetti = true;
        toast.success('🔥 Full Week!', {
          description: 'You logged meals for all 7 days this week!',
        });
        newAchievements.push({
          id: achievementId,
          type: 'weekly_streak',
          title: 'Perfect Week',
          description: 'Logged meals for 7 consecutive days',
          unlockedAt: today,
          icon: '🔥',
        });
      }
    }

    // Trigger confetti and haptic feedback for any new achievement
    if (shouldTriggerConfetti) {
      triggerConfetti();
      hapticFeedback('success');
    }

    if (newAchievements.length > 0) {
      setState(prev => ({
        ...prev,
        achievements: [...prev.achievements, ...newAchievements],
        notifiedAchievements: [...prev.notifiedAchievements, ...newAchievements.map(a => a.id)],
      }));
    }
  }, [state.goals]);

  const addMeal = useCallback((meal: Omit<Meal, 'id'>) => {
    // Haptic feedback when adding a meal
    hapticFeedback('medium');
    
    setState(prev => {
      const newMeal: Meal = {
        ...meal,
        id: Date.now().toString(),
      };

      const existingLogIndex = prev.dailyLogs.findIndex(log => log.date === prev.currentDate);
      let updatedLogs: DailyLog[];
      let updatedTotals: DailyLog['totals'];
      let updatedLog: DailyLog;

      if (existingLogIndex >= 0) {
        const updatedMeals = [...prev.dailyLogs[existingLogIndex].meals, newMeal];
        updatedTotals = calculateTotals(updatedMeals);
        updatedLog = { ...prev.dailyLogs[existingLogIndex], meals: updatedMeals, totals: updatedTotals };
        updatedLogs = prev.dailyLogs.map((log, i) => i === existingLogIndex ? updatedLog : log);
      } else {
        updatedTotals = calculateTotals([newMeal]);
        updatedLog = {
          date: prev.currentDate,
          meals: [newMeal],
          totals: updatedTotals,
        };
        updatedLogs = [...prev.dailyLogs, updatedLog];
      }

      // Save to Supabase
      saveToSupabase(updatedLog);

      setTimeout(() => checkAchievements(updatedLogs, updatedTotals), 100);

      return { ...prev, dailyLogs: updatedLogs };
    });
  }, [calculateTotals, checkAchievements, saveToSupabase]);

  const removeMeal = useCallback((mealId: string) => {
    setState(prev => {
      const updatedLogs = prev.dailyLogs.map(log => {
        if (log.date !== prev.currentDate) return log;
        const updatedMeals = log.meals.filter(m => m.id !== mealId);
        const updatedLog = { ...log, meals: updatedMeals, totals: calculateTotals(updatedMeals) };
        saveToSupabase(updatedLog);
        return updatedLog;
      });
      return { ...prev, dailyLogs: updatedLogs };
    });
  }, [calculateTotals, saveToSupabase]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    const newProfile = { ...state.profile, ...updates };
    const newGoals = calculateMacroGoals(newProfile);
    
    setState(prev => ({ ...prev, profile: newProfile, goals: newGoals }));

    if (user) {
      try {
        await supabase
          .from('nutrition_profiles')
          .upsert({
            user_id: user.id,
            weight: newProfile.weight,
            height: newProfile.height,
            age: newProfile.age,
            gender: newProfile.gender,
            activity_level: newProfile.activityLevel,
            goal: newProfile.goal,
            goal_calories: newGoals.calories,
            goal_protein: newGoals.protein,
            goal_carbs: newGoals.carbs,
            goal_fat: newGoals.fat,
          }, { onConflict: 'user_id' });
      } catch (error) {
        console.error('Error saving profile:', error);
      }
    }
  }, [state.profile, user]);

  const setCustomGoals = useCallback((goals: Partial<MacroGoals>) => {
    setState(prev => ({ ...prev, goals: { ...prev.goals, ...goals } }));
  }, []);

  const progress = useMemo(() => ({
    calories: Math.min((todayLog.totals.calories / state.goals.calories) * 100, 100),
    protein: Math.min((todayLog.totals.protein / state.goals.protein) * 100, 100),
    carbs: Math.min((todayLog.totals.carbs / state.goals.carbs) * 100, 100),
    fat: Math.min((todayLog.totals.fat / state.goals.fat) * 100, 100),
    fiber: Math.min((todayLog.totals.fiber / state.goals.fiber) * 100, 100),
  }), [todayLog.totals, state.goals]);

  const remaining = useMemo(() => ({
    calories: Math.max(state.goals.calories - todayLog.totals.calories, 0),
    protein: Math.max(state.goals.protein - todayLog.totals.protein, 0),
    carbs: Math.max(state.goals.carbs - todayLog.totals.carbs, 0),
    fat: Math.max(state.goals.fat - todayLog.totals.fat, 0),
    fiber: Math.max(state.goals.fiber - todayLog.totals.fiber, 0),
  }), [todayLog.totals, state.goals]);

  const weeklyData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const log = state.dailyLogs.find(l => l.date === dateStr);
      
      days.push({
        date: dateStr,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        calories: log?.totals.calories || 0,
        protein: log?.totals.protein || 0,
        carbs: log?.totals.carbs || 0,
        fat: log?.totals.fat || 0,
        goalCalories: state.goals.calories,
      });
    }
    return days;
  }, [state.dailyLogs, state.goals.calories]);

  const weeklyStats = useMemo(() => {
    const weekStart = getWeekStart();
    const weekLogs = state.dailyLogs.filter(log => log.date >= weekStart);
    
    const totalCalories = weekLogs.reduce((sum, log) => sum + log.totals.calories, 0);
    const totalProtein = weekLogs.reduce((sum, log) => sum + log.totals.protein, 0);
    const daysLogged = weekLogs.filter(log => log.meals.length > 0).length;
    const avgCalories = daysLogged > 0 ? Math.round(totalCalories / daysLogged) : 0;
    const avgProtein = daysLogged > 0 ? Math.round(totalProtein / daysLogged) : 0;
    
    const daysMetCalorieGoal = weekLogs.filter(log => 
      log.totals.calories >= state.goals.calories * 0.9 && 
      log.totals.calories <= state.goals.calories * 1.1
    ).length;
    
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

  const allLogs = useMemo(() => {
    return [...state.dailyLogs].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [state.dailyLogs]);

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
    loading: state.loading,
    synced: state.synced,
    addMeal,
    removeMeal,
    updateProfile,
    setCustomGoals,
  };
};

export const mealTypeLabels: Record<Meal['type'], string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
  pre_workout: 'Pre-Workout',
  post_workout: 'Post-Workout',
};

export const mealTypeIcons: Record<Meal['type'], string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
  pre_workout: '⚡',
  post_workout: '🥤',
};
