import { useState, useEffect, useCallback } from 'react';
import { useTimerNotification } from './useTimerNotification';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface HydrationSettings {
  enabled: boolean;
  intervalMinutes: number;
  dailyGoalLiters: number;
  currentIntake: number;
  lastReminder: number | null;
}

export interface SupplementReminder {
  id: string;
  name: string;
  time: string; // HH:MM format
  enabled: boolean;
  days: number[]; // 0-6, Sunday = 0
  icon: 'pill' | 'shake' | 'powder' | 'capsule';
  color: string;
}

export interface WorkoutReminder {
  enabled: boolean;
  minutesBefore: number;
  motivationalMessage: boolean;
}

export interface SleepSettings {
  enabled: boolean;
  bedtime: string; // HH:MM format
  wakeTime: string;
  reminderMinutesBefore: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string | null;
  totalWorkouts: number;
}

export interface QuickTimer {
  seconds: number;
  label: string;
}

export interface AlertsState {
  hydration: HydrationSettings;
  supplements: SupplementReminder[];
  workout: WorkoutReminder;
  sleep: SleepSettings;
  streak: StreakData;
  quickTimers: QuickTimer[];
}

const defaultState: AlertsState = {
  hydration: {
    enabled: true,
    intervalMinutes: 30,
    dailyGoalLiters: 3,
    currentIntake: 0,
    lastReminder: null,
  },
  supplements: [],
  workout: {
    enabled: true,
    minutesBefore: 60,
    motivationalMessage: true,
  },
  sleep: {
    enabled: true,
    bedtime: '22:30',
    wakeTime: '06:30',
    reminderMinutesBefore: 30,
  },
  streak: {
    currentStreak: 0,
    longestStreak: 0,
    lastWorkoutDate: null,
    totalWorkouts: 0,
  },
  quickTimers: [
    { seconds: 60, label: '1 min' },
    { seconds: 90, label: '1:30' },
    { seconds: 120, label: '2 min' },
    { seconds: 180, label: '3 min' },
  ],
};

const STORAGE_KEY_PREFIX = 'gymAlerts_';

export const useAlerts = () => {
  const { user } = useAuth();
  const [state, setState] = useState<AlertsState>(defaultState);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeQuickTimer, setActiveQuickTimer] = useState<number | null>(null);
  const [quickTimerRemaining, setQuickTimerRemaining] = useState<number>(0);
  const { notifyTimerEnd } = useTimerNotification();

  // Load alerts from database (user_settings.alerts_config) or user-specific localStorage
  useEffect(() => {
    const loadAlerts = async () => {
      if (!user) {
        setState(defaultState);
        setIsLoading(false);
        return;
      }

      try {
        // Try to load from database first
        const { data: settings } = await supabase
          .from('user_settings')
          .select('alerts_config')
          .eq('user_id', user.id)
          .maybeSingle();

        if (settings?.alerts_config) {
          const alertsConfig = settings.alerts_config as unknown as AlertsState;
          setState({ ...defaultState, ...alertsConfig });
        } else {
          // Fallback to user-specific localStorage
          const userKey = `${STORAGE_KEY_PREFIX}${user.id}`;
          const saved = localStorage.getItem(userKey);
          if (saved) {
            setState({ ...defaultState, ...JSON.parse(saved) });
          } else {
            setState(defaultState);
          }
        }
      } catch (error) {
        console.error('Error loading alerts:', error);
        setState(defaultState);
      }
      setIsLoading(false);
    };

    loadAlerts();
  }, [user]);

  // Persist state to database and localStorage
  useEffect(() => {
    if (!user || isLoading) return;

    const saveAlerts = async () => {
      try {
        // Save to user-specific localStorage as backup
        const userKey = `${STORAGE_KEY_PREFIX}${user.id}`;
        localStorage.setItem(userKey, JSON.stringify(state));

        // Save to database
        await supabase
          .from('user_settings')
          .update({
            alerts_config: JSON.parse(JSON.stringify(state)),
          })
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Error saving alerts:', error);
      }
    };

    // Debounce save
    const timeoutId = setTimeout(saveAlerts, 500);
    return () => clearTimeout(timeoutId);
  }, [state, user, isLoading]);

  // Quick timer logic
  useEffect(() => {
    if (activeQuickTimer === null) return;

    const interval = setInterval(() => {
      setQuickTimerRemaining((prev) => {
        if (prev <= 1) {
          notifyTimerEnd();
          setActiveQuickTimer(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeQuickTimer, notifyTimerEnd]);

  // Hydration
  const updateHydration = useCallback((updates: Partial<HydrationSettings>) => {
    setState((prev) => ({
      ...prev,
      hydration: { ...prev.hydration, ...updates },
    }));
  }, []);

  const addWaterIntake = useCallback((liters: number) => {
    setState((prev) => ({
      ...prev,
      hydration: {
        ...prev.hydration,
        currentIntake: Math.min(prev.hydration.currentIntake + liters, prev.hydration.dailyGoalLiters * 1.5),
      },
    }));
  }, []);

  const resetDailyHydration = useCallback(() => {
    setState((prev) => ({
      ...prev,
      hydration: { ...prev.hydration, currentIntake: 0 },
    }));
  }, []);

  // Supplements
  const updateSupplement = useCallback((id: string, updates: Partial<SupplementReminder>) => {
    setState((prev) => ({
      ...prev,
      supplements: prev.supplements.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  }, []);

  const addSupplement = useCallback((supplement: Omit<SupplementReminder, 'id'>) => {
    setState((prev) => ({
      ...prev,
      supplements: [...prev.supplements, { ...supplement, id: Date.now().toString() }],
    }));
  }, []);

  const removeSupplement = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      supplements: prev.supplements.filter((s) => s.id !== id),
    }));
  }, []);

  // Workout
  const updateWorkoutReminder = useCallback((updates: Partial<WorkoutReminder>) => {
    setState((prev) => ({
      ...prev,
      workout: { ...prev.workout, ...updates },
    }));
  }, []);

  // Sleep
  const updateSleep = useCallback((updates: Partial<SleepSettings>) => {
    setState((prev) => ({
      ...prev,
      sleep: { ...prev.sleep, ...updates },
    }));
  }, []);

  // Streak
  const recordWorkout = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setState((prev) => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = prev.streak.currentStreak;
      
      if (prev.streak.lastWorkoutDate === today) {
        // Already recorded today
        return prev;
      } else if (prev.streak.lastWorkoutDate === yesterdayStr) {
        // Consecutive day
        newStreak += 1;
      } else if (prev.streak.lastWorkoutDate === null) {
        // First workout
        newStreak = 1;
      } else {
        // Streak broken, start over
        newStreak = 1;
      }

      return {
        ...prev,
        streak: {
          currentStreak: newStreak,
          longestStreak: Math.max(prev.streak.longestStreak, newStreak),
          lastWorkoutDate: today,
          totalWorkouts: prev.streak.totalWorkouts + 1,
        },
      };
    });
  }, []);

  // Quick Timer
  const startQuickTimer = useCallback((seconds: number) => {
    setActiveQuickTimer(seconds);
    setQuickTimerRemaining(seconds);
  }, []);

  const stopQuickTimer = useCallback(() => {
    setActiveQuickTimer(null);
    setQuickTimerRemaining(0);
  }, []);

  const updateQuickTimers = useCallback((timers: QuickTimer[]) => {
    setState((prev) => ({ ...prev, quickTimers: timers }));
  }, []);

  // Calculate sleep hours
  const getSleepHours = useCallback(() => {
    const [bedH, bedM] = state.sleep.bedtime.split(':').map(Number);
    const [wakeH, wakeM] = state.sleep.wakeTime.split(':').map(Number);
    
    let bedMinutes = bedH * 60 + bedM;
    let wakeMinutes = wakeH * 60 + wakeM;
    
    if (wakeMinutes < bedMinutes) {
      wakeMinutes += 24 * 60; // Next day
    }
    
    return (wakeMinutes - bedMinutes) / 60;
  }, [state.sleep]);

  return {
    state,
    isLoading,
    // Hydration
    updateHydration,
    addWaterIntake,
    resetDailyHydration,
    // Supplements
    updateSupplement,
    addSupplement,
    removeSupplement,
    // Workout
    updateWorkoutReminder,
    // Sleep
    updateSleep,
    getSleepHours,
    // Streak
    recordWorkout,
    // Quick Timer
    startQuickTimer,
    stopQuickTimer,
    activeQuickTimer,
    quickTimerRemaining,
    updateQuickTimers,
  };
};
