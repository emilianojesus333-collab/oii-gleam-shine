import { useMemo } from 'react';

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  nutrition: {
    avgCalories: number;
    avgProtein: number;
    avgCarbs: number;
    avgFat: number;
    daysLogged: number;
    daysMetCalorieGoal: number;
    daysMetProteinGoal: number;
    totalMeals: number;
  };
  workout: {
    totalSessions: number;
    totalExercises: number;
    muscleGroupsHit: string[];
    avgCompletionRate: number;
    currentStreak: number;
  };
  measurements: {
    startWeight?: number;
    endWeight?: number;
    weightChange?: number;
  };
  hydration: {
    avgIntake: number;
    daysMetGoal: number;
  };
  sleep: {
    avgBedtime: string;
    avgWakeTime: string;
  };
  highlights: string[];
  areasToImprove: string[];
  overallScore: number; // 0-100
}

const getWeekDates = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset - 7); // Last week's Monday
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
  };
};

// Hook that requires userId to load user-specific data
export const useWeeklyReport = (userId?: string): WeeklyReport | null => {
  const report = useMemo(() => {
    if (!userId) return null;
    
    const { start, end } = getWeekDates();
    const startDate = new Date(start);
    const endDate = new Date(end);

    // Initialize report
    const report: WeeklyReport = {
      weekStart: start,
      weekEnd: end,
      nutrition: {
        avgCalories: 0,
        avgProtein: 0,
        avgCarbs: 0,
        avgFat: 0,
        daysLogged: 0,
        daysMetCalorieGoal: 0,
        daysMetProteinGoal: 0,
        totalMeals: 0,
      },
      workout: {
        totalSessions: 0,
        totalExercises: 0,
        muscleGroupsHit: [],
        avgCompletionRate: 0,
        currentStreak: 0,
      },
      measurements: {},
      hydration: {
        avgIntake: 0,
        daysMetGoal: 0,
      },
      sleep: {
        avgBedtime: '22:30',
        avgWakeTime: '06:30',
      },
      highlights: [],
      areasToImprove: [],
      overallScore: 0,
    };

    // Load nutrition data - USER SPECIFIC
    try {
      const nutritionData = localStorage.getItem(`nutrition_data_${userId}`);
      if (nutritionData) {
        const parsed = JSON.parse(nutritionData);
        const goals = parsed.goals || { calories: 2000, protein: 150 };
        const weekLogs = (parsed.dailyLogs || []).filter((log: any) => {
          const logDate = new Date(log.date);
          return logDate >= startDate && logDate <= endDate;
        });

        if (weekLogs.length > 0) {
          const totalCals = weekLogs.reduce((sum: number, log: any) => sum + (log.totals?.calories || 0), 0);
          const totalProt = weekLogs.reduce((sum: number, log: any) => sum + (log.totals?.protein || 0), 0);
          const totalCarbs = weekLogs.reduce((sum: number, log: any) => sum + (log.totals?.carbs || 0), 0);
          const totalFat = weekLogs.reduce((sum: number, log: any) => sum + (log.totals?.fat || 0), 0);
          const totalMeals = weekLogs.reduce((sum: number, log: any) => sum + (log.meals?.length || 0), 0);

          report.nutrition = {
            avgCalories: Math.round(totalCals / weekLogs.length),
            avgProtein: Math.round(totalProt / weekLogs.length),
            avgCarbs: Math.round(totalCarbs / weekLogs.length),
            avgFat: Math.round(totalFat / weekLogs.length),
            daysLogged: weekLogs.length,
            daysMetCalorieGoal: weekLogs.filter((log: any) => 
              log.totals?.calories >= goals.calories * 0.9 && log.totals?.calories <= goals.calories * 1.1
            ).length,
            daysMetProteinGoal: weekLogs.filter((log: any) => log.totals?.protein >= goals.protein).length,
            totalMeals,
          };
        }
      }
    } catch (e) {
      console.error('Error loading nutrition data for report:', e);
    }

    // Load workout data - USER SPECIFIC
    try {
      const workoutHistory = localStorage.getItem(`liftmate_workout_history_${userId}`);
      if (workoutHistory) {
        const parsed = JSON.parse(workoutHistory);
        const weekSessions = (parsed.sessions || []).filter((session: any) => {
          const sessionDate = new Date(session.date);
          return sessionDate >= startDate && sessionDate <= endDate;
        });

        const allMuscleGroups = new Set<string>();
        let totalCompletion = 0;
        let totalExercises = 0;

        weekSessions.forEach((session: any) => {
          session.muscleGroups?.forEach((mg: string) => allMuscleGroups.add(mg));
          totalCompletion += session.completionRate || 0;
          totalExercises += session.exercisesCompleted?.length || 0;
        });

        report.workout = {
          totalSessions: weekSessions.length,
          totalExercises,
          muscleGroupsHit: Array.from(allMuscleGroups),
          avgCompletionRate: weekSessions.length > 0 ? Math.round(totalCompletion / weekSessions.length) : 0,
          currentStreak: 0,
        };
      }

      // Load streak from alerts - USER SPECIFIC
      const alertsData = localStorage.getItem(`gymAlerts_${userId}`);
      if (alertsData) {
        const parsed = JSON.parse(alertsData);
        report.workout.currentStreak = parsed.streak?.currentStreak || 0;
        report.hydration.avgIntake = parsed.hydration?.currentIntake || 0;
      }
    } catch (e) {
      console.error('Error loading workout data for report:', e);
    }

    // Load measurements - USER SPECIFIC
    try {
      const measurementsData = localStorage.getItem(`liftmate_body_measurements_${userId}`);
      if (measurementsData) {
        const parsed = JSON.parse(measurementsData);
        const weekMeasurements = (parsed.measurements || []).filter((m: any) => {
          const mDate = new Date(m.date);
          return mDate >= startDate && mDate <= endDate;
        }).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (weekMeasurements.length >= 1) {
          report.measurements.endWeight = weekMeasurements[weekMeasurements.length - 1].weight;
          if (weekMeasurements.length >= 2) {
            report.measurements.startWeight = weekMeasurements[0].weight;
            report.measurements.weightChange = report.measurements.endWeight - report.measurements.startWeight;
          }
        }
      }
    } catch (e) {
      console.error('Error loading measurements for report:', e);
    }

    // Generate highlights
    if (report.nutrition.daysMetProteinGoal >= 5) {
      report.highlights.push('Excelente consistência na proteína! 💪');
    }
    if (report.workout.totalSessions >= 4) {
      report.highlights.push('4+ treinos na semana - ótima dedicação! 🏋️');
    }
    if (report.workout.currentStreak >= 7) {
      report.highlights.push(`Streak de ${report.workout.currentStreak} dias! 🔥`);
    }
    if (report.nutrition.daysLogged >= 6) {
      report.highlights.push('Registaste refeições quase todos os dias! 📝');
    }

    // Generate areas to improve
    if (report.nutrition.daysMetProteinGoal < 4) {
      report.areasToImprove.push('Tenta atingir a meta de proteína mais vezes');
    }
    if (report.workout.totalSessions < 3) {
      report.areasToImprove.push('Aumenta a frequência de treinos');
    }
    if (report.nutrition.daysLogged < 5) {
      report.areasToImprove.push('Regista as refeições mais consistentemente');
    }
    if (report.workout.avgCompletionRate < 80) {
      report.areasToImprove.push('Completa mais exercícios em cada treino');
    }

    // Calculate overall score
    let score = 0;
    score += Math.min(report.nutrition.daysLogged / 7, 1) * 20; // 20 points for logging
    score += Math.min(report.nutrition.daysMetProteinGoal / 7, 1) * 20; // 20 points for protein
    score += Math.min(report.workout.totalSessions / 5, 1) * 25; // 25 points for workouts
    score += Math.min(report.workout.avgCompletionRate / 100, 1) * 15; // 15 points for completion
    score += Math.min(report.workout.currentStreak / 7, 1) * 20; // 20 points for streak
    report.overallScore = Math.round(score);

    return report;
  }, [userId]);

  return report;
};
