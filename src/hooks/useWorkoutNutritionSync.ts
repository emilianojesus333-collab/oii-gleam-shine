import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// States for workout timing
export type WorkoutPhase = 'none' | 'pre_workout' | 'during' | 'post_workout' | 'recovery';

interface WorkoutNutritionContext {
  phase: WorkoutPhase;
  isWorkoutDay: boolean;
  todayMuscleGroups: string[];
  hasWorkedOutToday: boolean;
  lastWorkoutTime: Date | null;
  minutesSinceWorkout: number | null;
  suggestedMealType: 'pre_workout' | 'post_workout' | 'snack' | 'lunch';
  nutritionTip: string;
  // New fields
  trainedToday: boolean;
  trainedRecently: boolean;
  workoutInProgress: boolean;
  lastWorkoutDate: string | null;
  loading: boolean;
}

interface SessionRow {
  id: string;
  date: string;
  status: string;
  muscle_groups: string[] | null;
  created_at: string;
  updated_at: string;
}

export const useWorkoutNutritionSync = (): WorkoutNutritionContext => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }

    const fetchSessions = async () => {
      setLoading(true);
      const today = new Date();
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const { data, error } = await supabase
        .from('workout_sessions')
        .select('id, date, status, muscle_groups, created_at, updated_at')
        .eq('user_id', user.id)
        .gte('date', twoDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(10);

      if (!error && data) {
        setSessions(data as SessionRow[]);
      }
      setLoading(false);
    };

    fetchSessions();
  }, [user]);

  // Also read schedule from onboarding for planned workout detection
  const schedule = useMemo(() => {
    try {
      const onboardingData = localStorage.getItem('liftmate_onboarding');
      return onboardingData ? JSON.parse(onboardingData).schedule || {} : {};
    } catch {
      return {};
    }
  }, []);

  return useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const todayStr = now.toISOString().split('T')[0];

    const weekDaysMap: Record<number, string> = {
      0: 'Domingo',
      1: 'Segunda-feira',
      2: 'Terça-feira',
      3: 'Quarta-feira',
      4: 'Quinta-feira',
      5: 'Sexta-feira',
      6: 'Sábado',
    };

    // --- Supabase-based workout detection ---
    const todayCompleted = sessions.find(s => s.date === todayStr && s.status === 'completed');
    const todayInProgress = sessions.find(s => s.date === todayStr && s.status === 'in_progress');
    const todayPlanned = sessions.find(s => s.date === todayStr && s.status === 'planned');

    const trainedToday = !!todayCompleted;
    const workoutInProgress = !!todayInProgress;

    // Find most recent completed session
    const lastCompleted = sessions.find(s => s.status === 'completed');
    const lastWorkoutDate = lastCompleted?.date || null;

    // "Recently" = completed within last 24h
    let trainedRecently = false;
    let lastWorkoutTime: Date | null = null;
    let minutesSinceWorkout: number | null = null;

    if (lastCompleted) {
      // Use updated_at as proxy for when the workout ended
      lastWorkoutTime = new Date(lastCompleted.updated_at);
      const diffMs = now.getTime() - lastWorkoutTime.getTime();
      minutesSinceWorkout = Math.floor(diffMs / 60000);
      trainedRecently = diffMs < 24 * 60 * 60 * 1000;
    }

    // Muscle groups from today's session (any status)
    const todaySession = todayCompleted || todayInProgress || todayPlanned;
    const todayMuscleGroups = todaySession?.muscle_groups || [];

    // Schedule-based detection (fallback for planned days without a session row)
    const todayName = weekDaysMap[now.getDay()];
    const scheduledGroups = schedule[todayName];
    const isScheduledDay = scheduledGroups && scheduledGroups !== 'Descanso' &&
      (Array.isArray(scheduledGroups) ? scheduledGroups.length > 0 : true);

    const isWorkoutDay = trainedToday || workoutInProgress || !!todayPlanned || isScheduledDay;
    const hasWorkedOutToday = trainedToday;

    // Use schedule groups if no session muscle groups
    const effectiveMuscleGroups = todayMuscleGroups.length > 0
      ? todayMuscleGroups
      : (isScheduledDay
        ? (Array.isArray(scheduledGroups) ? scheduledGroups : [scheduledGroups])
        : []);

    // --- Determine phase & tips ---
    let phase: WorkoutPhase = 'none';
    let suggestedMealType: 'pre_workout' | 'post_workout' | 'snack' | 'lunch' = 'lunch';
    let nutritionTip = '';

    if (workoutInProgress) {
      phase = 'during';
      suggestedMealType = 'snack';
      nutritionTip = 'Treino em curso! Mantém a hidratação e energia.';
    } else if (trainedToday && minutesSinceWorkout !== null) {
      if (minutesSinceWorkout <= 120) {
        phase = 'post_workout';
        suggestedMealType = 'post_workout';
        nutritionTip = `Janela anabólica! Há ${minutesSinceWorkout} min terminaste o treino. Prioriza proteína + carbs rápidos.`;
      } else {
        phase = 'recovery';
        nutritionTip = `Recuperação ativa após treino de ${effectiveMuscleGroups.join(' + ')}. Mantém a proteína elevada.`;
        suggestedMealType = 'lunch';
      }
    } else if (isWorkoutDay) {
      if (currentHour < 10) {
        phase = 'pre_workout';
        suggestedMealType = 'pre_workout';
        nutritionTip = `Dia de ${effectiveMuscleGroups.join(' + ')}! Foca em carbs complexos para energia.`;
      } else if (currentHour < 16) {
        phase = 'pre_workout';
        suggestedMealType = 'pre_workout';
        nutritionTip = `Prepara-te para ${effectiveMuscleGroups.join(' + ')}. Carbs + proteína moderada 1-2h antes.`;
      } else {
        phase = 'pre_workout';
        suggestedMealType = 'snack';
        nutritionTip = `Ainda vais treinar ${effectiveMuscleGroups.join(' + ')} hoje? Snack leve antes do treino.`;
      }
    } else {
      phase = 'none';
      nutritionTip = 'Dia de descanso. Mantém a proteína para recuperação muscular.';
      suggestedMealType = currentHour < 12 ? 'snack' : 'lunch';
    }

    return {
      phase,
      isWorkoutDay,
      todayMuscleGroups: effectiveMuscleGroups,
      hasWorkedOutToday,
      lastWorkoutTime,
      minutesSinceWorkout,
      suggestedMealType,
      nutritionTip,
      trainedToday,
      trainedRecently,
      workoutInProgress,
      lastWorkoutDate,
      loading,
    };
  }, [sessions, schedule, loading]);
};

// Nutrition tips based on muscle groups trained
export const getMuscleSpecificTips = (muscleGroups: string[]): string[] => {
  const tips: string[] = [];

  muscleGroups.forEach(group => {
    const normalizedGroup = group.toLowerCase();

    if (normalizedGroup.includes('perna') || normalizedGroup.includes('leg') || normalizedGroup.includes('quadriceps') || normalizedGroup.includes('hamstrings') || normalizedGroup.includes('glutes') || normalizedGroup.includes('calves')) {
      tips.push('Treino de pernas requer mais carbs para recuperação.');
    }
    if (normalizedGroup.includes('peito') || normalizedGroup.includes('chest')) {
      tips.push('Pós-peito: foca em proteína para reparação muscular.');
    }
    if (normalizedGroup.includes('costa') || normalizedGroup.includes('back')) {
      tips.push('Costas usam muita energia - reabastece os glicogénios.');
    }
    if (normalizedGroup.includes('ombro') || normalizedGroup.includes('shoulder')) {
      tips.push('Ombros são grupos pequenos - proteína moderada é suficiente.');
    }
    if (normalizedGroup.includes('braço') || normalizedGroup.includes('arm') || normalizedGroup.includes('bicep') || normalizedGroup.includes('tricep')) {
      tips.push('Braços recuperam rápido - não exageres nas calorias.');
    }
  });

  return tips.slice(0, 2);
};
