import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  buildHydrationSummary,
  clampHydrationGoalLiters,
  DEFAULT_HYDRATION_GOAL_LITERS,
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
   customDailyGoalLiters?: number | null;
  currentIntake: number;
  bottleSizeMl: number;
  lastReminder: number | null;
  lastResetDate: string | null;
  weeklyHistory?: Record<string, number>;
}

export interface AlertsState {
  hydration: HydrationSettings;
}

const defaultState: AlertsState = {
  hydration: {
    enabled: true,
    intervalMinutes: 30,
    dailyGoalLiters: DEFAULT_HYDRATION_GOAL_LITERS,
    customDailyGoalLiters: DEFAULT_HYDRATION_GOAL_LITERS,
    currentIntake: 0,
    bottleSizeMl: 1000,
    lastReminder: null,
    lastResetDate: null,
    weeklyHistory: {},
  },
};

const STORAGE_KEY_PREFIX = 'gymAlerts_';

const mergeWithDefaults = (rawState: Partial<AlertsState> | null | undefined): AlertsState => ({
  ...defaultState,
  hydration: {
    ...defaultState.hydration,
    ...(rawState?.hydration ?? {}),
  },
});

export const useAlerts = () => {
  const { user } = useAuth();
  const [state, setState] = useState<AlertsState>(defaultState);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedRef = useRef(false);
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [workoutIntensity, setWorkoutIntensity] = useState<WorkoutIntensity>('none');

  const hydrationSummary = useMemo<HydrationSummary>(
    () =>
      buildHydrationSummary(
        state.hydration.currentIntake,
        state.hydration.bottleSizeMl,
        weightKg,
        workoutIntensity,
        state.hydration.customDailyGoalLiters,
      ),
    [state.hydration.currentIntake, state.hydration.bottleSizeMl, state.hydration.customDailyGoalLiters, weightKg, workoutIntensity]
  );

  const checkAndResetDailyHydration = useCallback((currentState: AlertsState): AlertsState => {
    const today = new Date().toISOString().split('T')[0];
    const lastResetDate = currentState.hydration.lastResetDate;

    if (lastResetDate !== today) {
      const weeklyHistory = { ...(currentState.hydration.weeklyHistory ?? {}) };
      if (lastResetDate && currentState.hydration.currentIntake > 0) {
        weeklyHistory[lastResetDate] = currentState.hydration.currentIntake;
      }
      // Keep only last 7 days
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 8);
      const cutoffStr = cutoff.toISOString().split('T')[0];
      Object.keys(weeklyHistory).forEach((k) => {
        if (k < cutoffStr) delete weeklyHistory[k];
      });

      return {
        ...currentState,
        hydration: {
          ...currentState.hydration,
          currentIntake: 0,
          lastResetDate: today,
          weeklyHistory,
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
        const persistedGoalLiters =
          clampHydrationGoalLiters(
            normalizedState.hydration.customDailyGoalLiters ?? normalizedState.hydration.dailyGoalLiters
          ) ?? DEFAULT_HYDRATION_GOAL_LITERS;
        const hydrationSummary = buildHydrationSummary(
          normalizedState.hydration.currentIntake,
          normalizedState.hydration.bottleSizeMl,
          parseWeightKg(settings?.onboarding_data),
          workoutIntensity,
          persistedGoalLiters,
        );

        setWeightKg(parseWeightKg(settings?.onboarding_data));
        setState({
          ...normalizedState,
          hydration: {
            ...normalizedState.hydration,
            customDailyGoalLiters: persistedGoalLiters,
            dailyGoalLiters: hydrationSummary.goalLiters,
          },
        });
      } catch (error) {
        console.error('Error loading alerts:', error);
        setState(defaultState);
      }
      hasLoadedRef.current = true;
      setIsLoading(false);
    };

    loadAlerts();
  }, [user, checkAndResetDailyHydration]);

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
    if (!user || isLoading || !hasLoadedRef.current) return;

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

  const updateHydration = useCallback((updates: Partial<HydrationSettings>) => {
    const normalizedCustomGoal = updates.customDailyGoalLiters !== undefined
      ? clampHydrationGoalLiters(updates.customDailyGoalLiters) ?? DEFAULT_HYDRATION_GOAL_LITERS
      : undefined;

    setState((prev) => ({
      ...prev,
      hydration: {
        ...prev.hydration,
        ...updates,
        ...(normalizedCustomGoal !== undefined
          ? {
              customDailyGoalLiters: normalizedCustomGoal,
              dailyGoalLiters: normalizedCustomGoal,
              currentIntake: Math.min(prev.hydration.currentIntake, normalizedCustomGoal),
            }
          : {}),
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
      const previousSummary = buildHydrationSummary(
        currentIntake,
        bottleSizeMl,
        weightKg,
        workoutIntensity,
        prev.hydration.customDailyGoalLiters,
      );
      const goalLimit = previousSummary.goalLiters;
      if (liters > 0 && currentIntake >= goalLimit) {
        feedbackMessages.push('Meta atingida');
        return prev;
      }
      const nextIntake = Math.max(
        0,
        Math.min(
          roundToOneDecimal(currentIntake + liters),
          goalLimit
        )
      );
      const nextSummary = buildHydrationSummary(
        nextIntake,
        bottleSizeMl,
        weightKg,
        workoutIntensity,
        prev.hydration.customDailyGoalLiters,
      );

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

  const weeklyHistory = useMemo(() => {
    const history: { date: string; intake: number; goalLiters: number; metGoal: boolean }[] = [];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const weeklyData = state.hydration.weeklyHistory ?? {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      if (dateStr === todayStr) {
        history.push({
          date: dateStr,
          intake: state.hydration.currentIntake,
          goalLiters: hydrationSummary.goalLiters,
          metGoal: hydrationSummary.percentage >= 80,
        });
      } else {
        const intake = weeklyData[dateStr] ?? 0;
        history.push({
          date: dateStr,
          intake,
          goalLiters: hydrationSummary.goalLiters,
          metGoal: intake >= hydrationSummary.goalLiters * 0.8,
        });
      }
    }
    return history;
  }, [state.hydration.weeklyHistory, state.hydration.currentIntake, hydrationSummary.goalLiters, hydrationSummary.percentage]);

  return {
    state,
    isLoading,
    hydrationSummary,
    weeklyHistory,
    updateHydration,
    addWaterIntake,
    resetDailyHydration,
  };
};
