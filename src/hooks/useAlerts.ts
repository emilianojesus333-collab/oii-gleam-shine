import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useTimerNotification } from './useTimerNotification';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  buildHydrationSummary,
  estimateWorkoutIntensityFromLogs,
  extractExerciseLogs,
  formatBottleSize,
  parseWeightKg,
  roundToOneDecimal,
  type HydrationSummary,
  type WorkoutIntensity,
} from '@/lib/hydration';

export interface HydrationSettings {
  enabled: boolean;
  intervalMinutes: number;
  dailyGoalLiters: number;
  currentIntake: number;
  bottleSizeMl: number;
  lastReminder: number | null;
  lastResetDate: string | null;
}

export interface SupplementReminder {
  id: string;
  name: string;
  time: string;
  enabled: boolean;
  days: number[];
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
  bedtime: string;
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
    bottleSizeMl: 1000,
    lastReminder: null,
    lastResetDate: null,
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

const mergeWithDefaults = (rawState: Partial<AlertsState> | null | undefined): AlertsState => ({
  ...defaultState,
  ...rawState,
  hydration: {
    ...defaultState.hydration,
    ...(rawState?.hydration ?? {}),
  },
  workout: {
    ...defaultState.workout,
    ...(rawState?.workout ?? {}),
  },
  sleep: {
    ...defaultState.sleep,
    ...(rawState?.sleep ?? {}),
  },
  streak: {
    ...defaultState.streak,
    ...(rawState?.streak ?? {}),
  },
  supplements: rawState?.supplements ?? defaultState.supplements,
  quickTimers: rawState?.quickTimers ?? defaultState.quickTimers,
});

export const useAlerts = () => {
  const { user } = useAuth();
  const [state, setState] = useState<AlertsState>(defaultState);
  const [isLoading, setIsLoading] = useState(true);
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [workoutIntensity, setWorkoutIntensity] = useState<WorkoutIntensity>('none');

  const [activeQuickTimer, setActiveQuickTimer] = useState<number | null>(null);
  const [quickTimerRemaining, setQuickTimerRemaining] = useState<number>(0);
  const { notifyTimerEnd } = useTimerNotification();

  const hydrationSummary = useMemo<HydrationSummary>(
    () =>
      buildHydrationSummary(
        state.hydration.currentIntake,
        state.hydration.bottleSizeMl,
        weightKg,
        workoutIntensity,
      ),
    [state.hydration.currentIntake, state.hydration.bottleSizeMl, weightKg, workoutIntensity]
  );

  const checkAndResetDailyHydration = useCallback((currentState: AlertsState): AlertsState => {
    const today = new Date().toISOString().split('T')[0];
    const lastResetDate = currentState.hydration.lastResetDate;

    if (lastResetDate !== today) {
      return {
        ...currentState,
        hydration: {
          ...currentState.hydration,
          currentIntake: 0,
          lastResetDate: today,
        },
      };
    }
    return currentState;
  }, []);

  const refreshWorkoutHydrationContext = useCallback(async () => {
    if (!user) {
      setWorkoutIntensity('none');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('exercise_logs')
        .eq('user_id', user.id)
        .eq('date', today)
        .eq('status', 'completed');

      setWorkoutIntensity(estimateWorkoutIntensityFromLogs(extractExerciseLogs(sessions ?? [])));
    } catch (error) {
      console.error('Error loading workout hydration context:', error);
      setWorkoutIntensity('none');
    }
  }, [user]);

  useEffect(() => {
    const loadAlerts = async () => {
      if (!user) {
        setState(defaultState);
        setWeightKg(null);
        setWorkoutIntensity('none');
        setIsLoading(false);
        return;
      }

      try {
        const { data: settings } = await supabase
          .from('user_settings')
          .select('alerts_config, onboarding_data')
          .eq('user_id', user.id)
          .maybeSingle();

        let loadedState = defaultState;

        if (settings?.alerts_config) {
          loadedState = mergeWithDefaults(settings.alerts_config as unknown as Partial<AlertsState>);
        } else {
          const userKey = `${STORAGE_KEY_PREFIX}${user.id}`;
          const saved = localStorage.getItem(userKey);
          if (saved) {
            loadedState = mergeWithDefaults(JSON.parse(saved) as Partial<AlertsState>);
          }
        }

        const normalizedState = checkAndResetDailyHydration(loadedState);
        const dynamicSummary = buildHydrationSummary(
          normalizedState.hydration.currentIntake,
          normalizedState.hydration.bottleSizeMl,
          parseWeightKg(settings?.onboarding_data),
          workoutIntensity,
        );

        setWeightKg(parseWeightKg(settings?.onboarding_data));
        setState({
          ...normalizedState,
          hydration: {
            ...normalizedState.hydration,
            dailyGoalLiters: dynamicSummary.goalLiters,
          },
        });
      } catch (error) {
        console.error('Error loading alerts:', error);
        setState(defaultState);
      }

      setIsLoading(false);
    };

    loadAlerts();
  }, [user, checkAndResetDailyHydration, workoutIntensity]);

  useEffect(() => {
    refreshWorkoutHydrationContext();
    const interval = setInterval(refreshWorkoutHydrationContext, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshWorkoutHydrationContext]);

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      hydration: {
        ...prev.hydration,
        dailyGoalLiters: hydrationSummary.goalLiters,
      },
    }));
  }, [hydrationSummary.goalLiters]);

  useEffect(() => {
    if (!user || isLoading) return;

    const saveAlerts = async () => {
      try {
        const userKey = `${STORAGE_KEY_PREFIX}${user.id}`;
        localStorage.setItem(userKey, JSON.stringify(state));

        await supabase
          .from('user_settings')
          .upsert(
            {
              user_id: user.id,
              alerts_config: JSON.parse(JSON.stringify(state)),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );
      } catch (error) {
        console.error('Error saving alerts:', error);
      }
    };

    const timeoutId = setTimeout(saveAlerts, 500);
    return () => clearTimeout(timeoutId);
  }, [state, user, isLoading]);

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

  const updateHydration = useCallback((updates: Partial<HydrationSettings>) => {
    setState((prev) => ({
      ...prev,
      hydration: {
        ...prev.hydration,
        ...updates,
      },
    }));
  }, []);

  const addWaterIntake = useCallback((liters: number) => {
    const today = new Date().toISOString().split('T')[0];
    const feedbackMessages: string[] = [];

    setState((prev) => {
      const needsReset = prev.hydration.lastResetDate !== today;
      const currentIntake = needsReset ? 0 : prev.hydration.currentIntake;
      const bottleSizeMl = prev.hydration.bottleSizeMl || 1000;
      const previousSummary = buildHydrationSummary(currentIntake, bottleSizeMl, weightKg, workoutIntensity);
      const nextIntake = Math.max(
        0,
        Math.min(
          roundToOneDecimal(currentIntake + liters),
          Math.max(previousSummary.goalLiters * 1.5, 6)
        )
      );
      const nextSummary = buildHydrationSummary(nextIntake, bottleSizeMl, weightKg, workoutIntensity);

      const previousBottleCount = Math.floor(Math.round(currentIntake * 1000) / bottleSizeMl);
      const nextBottleCount = Math.floor(Math.round(nextIntake * 1000) / bottleSizeMl);
      const previousWholeLiters = Math.floor(currentIntake);
      const nextWholeLiters = Math.floor(nextIntake);

      if (liters > 0 && nextBottleCount > previousBottleCount) {
        feedbackMessages.push(`${formatBottleSize(bottleSizeMl)} registado`);
      }

      if (liters > 0 && nextWholeLiters > previousWholeLiters) {
        feedbackMessages.push(`${nextWholeLiters} L concluído`);
      }

      if (liters > 0 && previousSummary.percentage < 50 && nextSummary.percentage >= 50) {
        feedbackMessages.push('50% da hidratação diária concluída');
      }

      if (liters > 0 && previousSummary.percentage < 100 && nextSummary.percentage >= 100) {
        feedbackMessages.push('Meta diária de hidratação concluída');
      }

      return {
        ...prev,
        hydration: {
          ...prev.hydration,
          currentIntake: nextIntake,
          dailyGoalLiters: nextSummary.goalLiters,
          lastResetDate: today,
        },
      };
    });

    feedbackMessages.slice(0, 2).forEach((message) => toast.success(message));
  }, [weightKg, workoutIntensity]);

  const resetDailyHydration = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setState((prev) => ({
      ...prev,
      hydration: {
        ...prev.hydration,
        currentIntake: 0,
        lastResetDate: today,
      },
    }));
  }, []);

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

  const updateWorkoutReminder = useCallback((updates: Partial<WorkoutReminder>) => {
    setState((prev) => ({
      ...prev,
      workout: { ...prev.workout, ...updates },
    }));
  }, []);

  const updateSleep = useCallback((updates: Partial<SleepSettings>) => {
    setState((prev) => ({
      ...prev,
      sleep: { ...prev.sleep, ...updates },
    }));
  }, []);

  const recordWorkout = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setState((prev) => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = prev.streak.currentStreak;

      if (prev.streak.lastWorkoutDate === today) {
        return prev;
      } else if (prev.streak.lastWorkoutDate === yesterdayStr) {
        newStreak += 1;
      } else if (prev.streak.lastWorkoutDate === null) {
        newStreak = 1;
      } else {
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

  const getSleepHours = useCallback(() => {
    const [bedH, bedM] = state.sleep.bedtime.split(':').map(Number);
    const [wakeH, wakeM] = state.sleep.wakeTime.split(':').map(Number);

    let bedMinutes = bedH * 60 + bedM;
    let wakeMinutes = wakeH * 60 + wakeM;

    if (wakeMinutes < bedMinutes) {
      wakeMinutes += 24 * 60;
    }

    return (wakeMinutes - bedMinutes) / 60;
  }, [state.sleep]);

  return {
    state,
    isLoading,
    hydrationSummary,
    updateHydration,
    addWaterIntake,
    resetDailyHydration,
    updateSupplement,
    addSupplement,
    removeSupplement,
    updateWorkoutReminder,
    updateSleep,
    getSleepHours,
    recordWorkout,
    startQuickTimer,
    stopQuickTimer,
    activeQuickTimer,
    quickTimerRemaining,
    updateQuickTimers,
  };
};
