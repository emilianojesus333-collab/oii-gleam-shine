import { useMemo } from 'react';
import { getWorkoutHistory } from '@/data/workoutHistory';

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
}

const weekDaysMap: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado',
};

export const useWorkoutNutritionSync = (): WorkoutNutritionContext => {
  return useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const todayStr = now.toISOString().split('T')[0];
    
    // Get today's scheduled workout
    const onboardingData = localStorage.getItem('liftmate_onboarding');
    const schedule = onboardingData ? JSON.parse(onboardingData).schedule || {} : {};
    const todayName = weekDaysMap[now.getDay()];
    const scheduledGroups = schedule[todayName];
    
    const isWorkoutDay = scheduledGroups && scheduledGroups !== 'Descanso' && 
      (Array.isArray(scheduledGroups) ? scheduledGroups.length > 0 : true);
    
    const todayMuscleGroups = isWorkoutDay
      ? (Array.isArray(scheduledGroups) ? scheduledGroups : [scheduledGroups])
      : [];
    
    // Check if user has worked out today
    const history = getWorkoutHistory();
    const todaySession = history.sessions.find(s => s.date === todayStr);
    const hasWorkedOutToday = todaySession && todaySession.exerciseLogs && todaySession.exerciseLogs.length > 0;
    
    // Get last workout timestamp
    let lastWorkoutTime: Date | null = null;
    let minutesSinceWorkout: number | null = null;
    
    if (hasWorkedOutToday && todaySession?.exerciseLogs?.length) {
      const lastLog = todaySession.exerciseLogs[todaySession.exerciseLogs.length - 1];
      lastWorkoutTime = new Date(lastLog.timestamp);
      minutesSinceWorkout = Math.floor((now.getTime() - lastWorkoutTime.getTime()) / 60000);
    }
    
    // Determine workout phase
    let phase: WorkoutPhase = 'none';
    let suggestedMealType: 'pre_workout' | 'post_workout' | 'snack' | 'lunch' = 'lunch';
    let nutritionTip = '';
    
    if (hasWorkedOutToday && minutesSinceWorkout !== null) {
      if (minutesSinceWorkout <= 120) {
        // Within 2 hours of workout
        phase = 'post_workout';
        suggestedMealType = 'post_workout';
        nutritionTip = `Janela anabólica! Há ${minutesSinceWorkout} min terminaste o treino. Prioriza proteína + carbs rápidos.`;
      } else {
        phase = 'recovery';
        nutritionTip = `Recuperação ativa após treino de ${todayMuscleGroups.join(' + ')}. Mantém a proteína elevada.`;
        suggestedMealType = 'lunch';
      }
    } else if (isWorkoutDay) {
      // Workout scheduled but not done yet
      if (currentHour < 10) {
        // Morning - could be pre-workout
        phase = 'pre_workout';
        suggestedMealType = 'pre_workout';
        nutritionTip = `Dia de ${todayMuscleGroups.join(' + ')}! Foca em carbs complexos para energia.`;
      } else if (currentHour < 16) {
        // Afternoon - probably pre-workout
        phase = 'pre_workout';
        suggestedMealType = 'pre_workout';
        nutritionTip = `Prepara-te para ${todayMuscleGroups.join(' + ')}. Carbs + proteína moderada 1-2h antes.`;
      } else {
        // Evening - likely training soon or done
        phase = 'pre_workout';
        suggestedMealType = 'snack';
        nutritionTip = `Ainda vais treinar ${todayMuscleGroups.join(' + ')} hoje? Snack leve antes do treino.`;
      }
    } else {
      // Rest day
      phase = 'none';
      nutritionTip = 'Dia de descanso. Mantém a proteína para recuperação muscular.';
      
      // Suggest based on time
      if (currentHour < 12) {
        suggestedMealType = 'snack';
      } else {
        suggestedMealType = 'lunch';
      }
    }
    
    return {
      phase,
      isWorkoutDay,
      todayMuscleGroups,
      hasWorkedOutToday: !!hasWorkedOutToday,
      lastWorkoutTime,
      minutesSinceWorkout,
      suggestedMealType,
      nutritionTip,
    };
  }, []);
};

// Nutrition tips based on muscle groups trained
export const getMuscleSpecificTips = (muscleGroups: string[]): string[] => {
  const tips: string[] = [];
  
  muscleGroups.forEach(group => {
    const normalizedGroup = group.toLowerCase();
    
    if (normalizedGroup.includes('perna') || normalizedGroup.includes('leg')) {
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
  
  return tips.slice(0, 2); // Max 2 tips
};
