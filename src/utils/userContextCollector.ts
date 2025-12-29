// Collects all user data to provide context to the AI chat

import { supabase } from "@/integrations/supabase/client";

export interface UserContext {
  // Profile & Goals
  profile: {
    weight?: number;
    height?: number;
    age?: number;
    gender?: string;
    activityLevel?: string;
    goal?: string;
    aiName?: string;
    experience?: string;
    focusMuscles?: string[];
    trainingDays?: string[];
  };
  
  // Nutrition Data
  nutrition: {
    todayCalories: number;
    todayProtein: number;
    todayCarbs: number;
    todayFat: number;
    todayFiber: number;
    goalCalories: number;
    goalProtein: number;
    goalCarbs: number;
    goalFat: number;
    mealsToday: number;
    weeklyAvgCalories: number;
    weeklyAvgProtein: number;
    daysMetGoal: number;
  };
  
  // Workout Data
  workout: {
    todayExercises: string[];
    todayWorkoutType: string | null;
    todayMuscleGroups: string[];
    totalSessions: number;
    weekSessions: number;
    currentStreak: number;
    longestStreak: number;
    mostTrainedMuscles: { muscle: string; count: number }[];
  };
  
  // 1RM Records
  oneRM: {
    records: {
      exercise: string;
      weight: number;
      date: string;
    }[];
    recentPRs: {
      exercise: string;
      weight: number;
      improvement: number;
    }[];
  };
  
  // Alerts & Reminders
  alerts: {
    hydrationGoal: number;
    hydrationCurrent: number;
    supplements: { name: string; time: string; enabled: boolean }[];
    sleepBedtime: string;
    sleepWakeTime: string;
  };
  
  // Calendar/Schedule
  schedule: {
    nextTrainingDays: string[];
    scheduledWorkouts: { day: string; type: string }[];
  };
}

const getToday = () => new Date().toISOString().split('T')[0];

export const collectUserContext = async (userId?: string): Promise<UserContext> => {
  const context: UserContext = {
    profile: {},
    nutrition: {
      todayCalories: 0,
      todayProtein: 0,
      todayCarbs: 0,
      todayFat: 0,
      todayFiber: 0,
      goalCalories: 0,
      goalProtein: 0,
      goalCarbs: 0,
      goalFat: 0,
      mealsToday: 0,
      weeklyAvgCalories: 0,
      weeklyAvgProtein: 0,
      daysMetGoal: 0,
    },
    workout: {
      todayExercises: [],
      todayWorkoutType: null,
      todayMuscleGroups: [],
      totalSessions: 0,
      weekSessions: 0,
      currentStreak: 0,
      longestStreak: 0,
      mostTrainedMuscles: [],
    },
    oneRM: {
      records: [],
      recentPRs: [],
    },
    alerts: {
      hydrationGoal: 3,
      hydrationCurrent: 0,
      supplements: [],
      sleepBedtime: "22:30",
      sleepWakeTime: "06:30",
    },
    schedule: {
      nextTrainingDays: [],
      scheduledWorkouts: [],
    },
  };

  try {
    // 1. Profile & Onboarding data from localStorage
    const onboardingData = localStorage.getItem("liftmate_onboarding");
    if (onboardingData) {
      const parsed = JSON.parse(onboardingData);
      context.profile = {
        goal: parsed.goal,
        experience: parsed.experience,
        focusMuscles: parsed.focusMuscles,
        trainingDays: parsed.trainingDays,
      };
      context.schedule.nextTrainingDays = parsed.trainingDays || [];
    }

    // AI Name
    context.profile.aiName = localStorage.getItem("liftmate_ai_name") || "LiftMate";

    // 2. Nutrition data from localStorage
    const nutritionData = localStorage.getItem("nutrition_data");
    if (nutritionData) {
      const parsed = JSON.parse(nutritionData);
      const today = getToday();
      
      // Profile info
      if (parsed.profile) {
        context.profile.weight = parsed.profile.weight;
        context.profile.height = parsed.profile.height;
        context.profile.age = parsed.profile.age;
        context.profile.gender = parsed.profile.gender;
        context.profile.activityLevel = parsed.profile.activityLevel;
        if (parsed.profile.goal) {
          context.profile.goal = parsed.profile.goal;
        }
      }
      
      // Goals
      if (parsed.goals) {
        context.nutrition.goalCalories = parsed.goals.calories || 0;
        context.nutrition.goalProtein = parsed.goals.protein || 0;
        context.nutrition.goalCarbs = parsed.goals.carbs || 0;
        context.nutrition.goalFat = parsed.goals.fat || 0;
      }
      
      // Today's log
      const todayLog = parsed.dailyLogs?.find((log: any) => log.date === today);
      if (todayLog) {
        context.nutrition.todayCalories = todayLog.totals?.calories || 0;
        context.nutrition.todayProtein = todayLog.totals?.protein || 0;
        context.nutrition.todayCarbs = todayLog.totals?.carbs || 0;
        context.nutrition.todayFat = todayLog.totals?.fat || 0;
        context.nutrition.todayFiber = todayLog.totals?.fiber || 0;
        context.nutrition.mealsToday = todayLog.meals?.length || 0;
      }
      
      // Weekly stats
      if (parsed.dailyLogs?.length > 0) {
        const last7Days = parsed.dailyLogs.slice(-7);
        const daysWithData = last7Days.filter((log: any) => log.meals?.length > 0);
        if (daysWithData.length > 0) {
          const totalCals = daysWithData.reduce((sum: number, log: any) => sum + (log.totals?.calories || 0), 0);
          const totalProt = daysWithData.reduce((sum: number, log: any) => sum + (log.totals?.protein || 0), 0);
          context.nutrition.weeklyAvgCalories = Math.round(totalCals / daysWithData.length);
          context.nutrition.weeklyAvgProtein = Math.round(totalProt / daysWithData.length);
          context.nutrition.daysMetGoal = daysWithData.filter((log: any) => 
            log.totals?.calories >= context.nutrition.goalCalories * 0.9
          ).length;
        }
      }
    }

    // 3. Workout data from localStorage
    const workoutHistory = localStorage.getItem("liftmate_workout_history");
    if (workoutHistory) {
      const parsed = JSON.parse(workoutHistory);
      context.workout.totalSessions = parsed.sessions?.length || 0;
      
      // This week's sessions
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      context.workout.weekSessions = parsed.sessions?.filter((s: any) => 
        new Date(s.date) >= oneWeekAgo
      ).length || 0;
      
      // Most trained muscles
      const muscleCount: Record<string, number> = {};
      parsed.sessions?.forEach((s: any) => {
        s.muscleGroups?.forEach((m: string) => {
          muscleCount[m] = (muscleCount[m] || 0) + 1;
        });
      });
      context.workout.mostTrainedMuscles = Object.entries(muscleCount)
        .map(([muscle, count]) => ({ muscle, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    }

    // Today's exercises
    const completedExercises = localStorage.getItem("liftmate_completed_exercises");
    if (completedExercises) {
      const parsed = JSON.parse(completedExercises);
      if (parsed.date === new Date().toDateString()) {
        context.workout.todayExercises = parsed.exercises || [];
        context.workout.todayWorkoutType = parsed.workout || null;
        context.workout.todayMuscleGroups = parsed.muscleGroups || [];
      }
    }

    // 4. Alerts data from localStorage
    const alertsData = localStorage.getItem("gymAlerts");
    if (alertsData) {
      const parsed = JSON.parse(alertsData);
      
      if (parsed.hydration) {
        context.alerts.hydrationGoal = parsed.hydration.dailyGoalLiters || 3;
        context.alerts.hydrationCurrent = parsed.hydration.currentIntake || 0;
      }
      
      if (parsed.supplements) {
        context.alerts.supplements = parsed.supplements.map((s: any) => ({
          name: s.name,
          time: s.time,
          enabled: s.enabled,
        }));
      }
      
      if (parsed.sleep) {
        context.alerts.sleepBedtime = parsed.sleep.bedtime || "22:30";
        context.alerts.sleepWakeTime = parsed.sleep.wakeTime || "06:30";
      }
      
      if (parsed.streak) {
        context.workout.currentStreak = parsed.streak.currentStreak || 0;
        context.workout.longestStreak = parsed.streak.longestStreak || 0;
      }
    }

    // 5. 1RM records from Supabase (if user is authenticated)
    if (userId) {
      const { data: oneRMRecords } = await supabase
        .from("one_rm_records")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (oneRMRecords && oneRMRecords.length > 0) {
        // Get latest record per exercise
        const exerciseMap = new Map<string, any>();
        oneRMRecords.forEach((record) => {
          if (!exerciseMap.has(record.exercise_name)) {
            exerciseMap.set(record.exercise_name, record);
          }
        });

        context.oneRM.records = Array.from(exerciseMap.values()).map((r) => ({
          exercise: r.exercise_name,
          weight: r.calculated_1rm,
          date: r.created_at.split("T")[0],
        }));

        // Find recent PRs (improvements in the last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentRecords = oneRMRecords.filter((r) => new Date(r.created_at) >= thirtyDaysAgo);
        const exercisePRs: Record<string, { current: number; previous: number }> = {};
        
        recentRecords.forEach((r) => {
          if (!exercisePRs[r.exercise_name]) {
            exercisePRs[r.exercise_name] = { current: r.calculated_1rm, previous: 0 };
          } else if (r.calculated_1rm < exercisePRs[r.exercise_name].current) {
            exercisePRs[r.exercise_name].previous = r.calculated_1rm;
          }
        });

        context.oneRM.recentPRs = Object.entries(exercisePRs)
          .filter(([_, v]) => v.previous > 0)
          .map(([exercise, v]) => ({
            exercise,
            weight: v.current,
            improvement: Math.round(((v.current - v.previous) / v.previous) * 100),
          }));
      }
    }

  } catch (error) {
    console.error("Error collecting user context:", error);
  }

  return context;
};

// Format context for AI system prompt
export const formatContextForAI = (ctx: UserContext): string => {
  const parts: string[] = [];
  const today = new Date().toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" });

  parts.push(`📅 DATA ATUAL: ${today}`);

  // Profile
  if (ctx.profile.goal || ctx.profile.experience) {
    parts.push(`\n🎯 PERFIL DO UTILIZADOR:
- Objetivo: ${ctx.profile.goal || "Não definido"}
- Experiência: ${ctx.profile.experience || "Não definida"}
- Peso: ${ctx.profile.weight ? `${ctx.profile.weight}kg` : "Não definido"}
- Músculos foco: ${ctx.profile.focusMuscles?.join(", ") || "Não definido"}
- Dias de treino: ${ctx.profile.trainingDays?.join(", ") || "Não definido"}`);
  }

  // Today's Nutrition
  if (ctx.nutrition.mealsToday > 0 || ctx.nutrition.goalCalories > 0) {
    const calPercent = ctx.nutrition.goalCalories > 0 
      ? Math.round((ctx.nutrition.todayCalories / ctx.nutrition.goalCalories) * 100) 
      : 0;
    const protPercent = ctx.nutrition.goalProtein > 0 
      ? Math.round((ctx.nutrition.todayProtein / ctx.nutrition.goalProtein) * 100) 
      : 0;

    parts.push(`\n🍽️ NUTRIÇÃO DE HOJE:
- Calorias: ${ctx.nutrition.todayCalories} / ${ctx.nutrition.goalCalories} kcal (${calPercent}%)
- Proteína: ${ctx.nutrition.todayProtein}g / ${ctx.nutrition.goalProtein}g (${protPercent}%)
- Carbs: ${ctx.nutrition.todayCarbs}g / ${ctx.nutrition.goalCarbs}g
- Gordura: ${ctx.nutrition.todayFat}g / ${ctx.nutrition.goalFat}g
- Fibra: ${ctx.nutrition.todayFiber}g
- Refeições registadas: ${ctx.nutrition.mealsToday}
${calPercent >= 90 && calPercent <= 110 ? "✅ Meta de calorias atingida!" : ""}
${protPercent >= 100 ? "✅ Meta de proteína atingida!" : ""}`);

    if (ctx.nutrition.weeklyAvgCalories > 0) {
      parts.push(`\n📊 MÉDIA SEMANAL:
- Média calorias: ${ctx.nutrition.weeklyAvgCalories} kcal/dia
- Média proteína: ${ctx.nutrition.weeklyAvgProtein}g/dia
- Dias que atingiu meta: ${ctx.nutrition.daysMetGoal}/7`);
    }
  }

  // Today's Workout
  if (ctx.workout.todayExercises.length > 0) {
    parts.push(`\n💪 TREINO DE HOJE:
- Tipo: ${ctx.workout.todayWorkoutType || "Treino personalizado"}
- Grupos musculares: ${ctx.workout.todayMuscleGroups.join(", ") || "Vários"}
- Exercícios feitos: ${ctx.workout.todayExercises.slice(0, 5).join(", ")}${ctx.workout.todayExercises.length > 5 ? ` e mais ${ctx.workout.todayExercises.length - 5}` : ""}`);
  }

  // Workout Stats
  if (ctx.workout.totalSessions > 0 || ctx.workout.currentStreak > 0) {
    parts.push(`\n📈 ESTATÍSTICAS DE TREINO:
- Total de sessões: ${ctx.workout.totalSessions}
- Sessões esta semana: ${ctx.workout.weekSessions}
- Streak atual: ${ctx.workout.currentStreak} dias 🔥
- Maior streak: ${ctx.workout.longestStreak} dias`);
    
    if (ctx.workout.mostTrainedMuscles.length > 0) {
      parts.push(`- Músculos mais treinados: ${ctx.workout.mostTrainedMuscles.map(m => `${m.muscle} (${m.count}x)`).join(", ")}`);
    }
  }

  // 1RM Records
  if (ctx.oneRM.records.length > 0) {
    parts.push(`\n🏋️ RECORDES DE 1RM:
${ctx.oneRM.records.slice(0, 5).map(r => `- ${r.exercise}: ${r.weight}kg`).join("\n")}`);
    
    if (ctx.oneRM.recentPRs.length > 0) {
      parts.push(`\n🎉 PRs RECENTES (últimos 30 dias):
${ctx.oneRM.recentPRs.map(r => `- ${r.exercise}: ${r.weight}kg (+${r.improvement}%)`).join("\n")}`);
    }
  }

  // Hydration
  const hydrationPercent = ctx.alerts.hydrationGoal > 0 
    ? Math.round((ctx.alerts.hydrationCurrent / ctx.alerts.hydrationGoal) * 100) 
    : 0;
  parts.push(`\n💧 HIDRATAÇÃO HOJE:
- Consumido: ${ctx.alerts.hydrationCurrent.toFixed(1)}L / ${ctx.alerts.hydrationGoal}L (${hydrationPercent}%)`);

  // Sleep
  parts.push(`\n😴 SONO:
- Hora de dormir: ${ctx.alerts.sleepBedtime}
- Hora de acordar: ${ctx.alerts.sleepWakeTime}`);

  // Supplements
  if (ctx.alerts.supplements.length > 0) {
    const enabledSupps = ctx.alerts.supplements.filter(s => s.enabled);
    if (enabledSupps.length > 0) {
      parts.push(`\n💊 SUPLEMENTOS CONFIGURADOS:
${enabledSupps.map(s => `- ${s.name} às ${s.time}`).join("\n")}`);
    }
  }

  return parts.join("\n");
};
