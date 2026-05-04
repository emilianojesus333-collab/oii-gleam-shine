// Collects all user data to provide context to the AI chat

import { supabase } from "@/integrations/supabase/client";

export interface UserContext {
  // Profile & Goals
  profile: {
    userName?: string;
    weight?: number;
    height?: number;
    age?: number;
    birthYear?: number;
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
  
  // Workout Data (from database)
  workout: {
    todayExercises: string[];
    todayWorkoutType: string | null;
    todayMuscleGroups: string[];
    totalSessions: number;
    weekSessions: number;
    currentStreak: number;
    longestStreak: number;
    mostTrainedMuscles: { muscle: string; count: number }[];
    recentSessions: {
      date: string;
      muscleGroups: string[];
      exercisesCompleted: string[];
      completionRate: number;
    }[];
    recentExerciseVolume: {
      exercise: string;
      totalVolume: number;
      sessions: number;
    }[];
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

  // Body Measurements
  bodyMeasurements: {
    latest?: {
      weight?: number;
      bodyFat?: number;
      chest?: number;
      waist?: number;
      hips?: number;
      arms?: number;
      thighs?: number;
      date: string;
    };
    changes?: {
      weight?: number;
      bodyFat?: number;
      waist?: number;
    };
    goals?: {
      weight?: number;
      bodyFat?: number;
      waist?: number;
    };
  };

  // Challenges & Badges
  challenges: {
    active: {
      type: string;
      target: number;
      progress: number;
      completed: boolean;
    }[];
    completedThisWeek: number;
    totalBadges: number;
    recentBadges: string[];
  };

  // Progress Photos
  progressPhotos: {
    totalPhotos: number;
    latestPhotoDate?: string;
    daysSinceLastPhoto?: number;
    poses: string[];
  };

  // Weekly Report
  weeklyReport: {
    overallScore: number;
    nutritionScore: number;
    workoutScore: number;
    consistencyScore: number;
    highlights: string[];
    improvements: string[];
  };

  // Recovery State
  recovery: {
    fatigueIndex: number | null;
  };

  // Chat Personality Settings
  chatSettings: {
    personality: string;
    tone: string;
    focus: string;
  };

  // Physique Evaluations
  physiqueEvaluations: {
    evaluations: {
      date: string;
      daysAgo: number;
      score: number;
      bodyFatEstimate: string | null;
    }[];
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
      recentSessions: [],
      recentExerciseVolume: [],
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
    bodyMeasurements: {},
    challenges: {
      active: [],
      completedThisWeek: 0,
      totalBadges: 0,
      recentBadges: [],
    },
    progressPhotos: {
      totalPhotos: 0,
      poses: [],
    },
    weeklyReport: {
      overallScore: 0,
      nutritionScore: 0,
      workoutScore: 0,
      consistencyScore: 0,
      highlights: [],
      improvements: [],
    },
    recovery: {
      fatigueIndex: null,
    },
    chatSettings: {
      personality: "motivador",
      tone: "Casual",
      focus: "Tudo",
    },
    physiqueEvaluations: {
      evaluations: [],
    },
  };

  try {
    // Get current user if not provided
    let currentUserId = userId;
    if (!currentUserId) {
      const { data: { session } } = await supabase.auth.getSession();
      currentUserId = session?.user?.id;
    }

    // 1. Profile & Onboarding data from DATABASE (per-user)
    if (currentUserId) {
      const { data: userSettings } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", currentUserId)
        .maybeSingle();

      if (userSettings) {
        const onboardingData = userSettings.onboarding_data as {
          personal?: { name?: string; height?: string; weight?: string; gender?: string; birthYear?: string };
          goal?: string;
          experience?: string;
          focus?: string;
          schedule?: Record<string, string[]>;
        } | null;

        if (onboardingData) {
          const birthYear = onboardingData.personal?.birthYear ? parseInt(onboardingData.personal.birthYear) : undefined;
          const currentYear = new Date().getFullYear();
          
          context.profile = {
            userName: onboardingData.personal?.name || undefined,
            goal: onboardingData.goal || undefined,
            experience: onboardingData.experience || undefined,
            focusMuscles: onboardingData.focus ? [onboardingData.focus] : undefined,
            trainingDays: onboardingData.schedule ? Object.keys(onboardingData.schedule).filter(day => 
              onboardingData.schedule && onboardingData.schedule[day]?.length > 0
            ) : [],
            weight: onboardingData.personal?.weight ? parseFloat(onboardingData.personal.weight) : undefined,
            height: onboardingData.personal?.height ? parseFloat(onboardingData.personal.height) : undefined,
            gender: onboardingData.personal?.gender,
            birthYear: birthYear,
            age: birthYear ? currentYear - birthYear : undefined,
          };
          context.schedule.nextTrainingDays = context.profile.trainingDays || [];

          // Populate scheduledWorkouts (day → muscles mapping)
          if (onboardingData.schedule) {
            context.schedule.scheduledWorkouts = Object.entries(onboardingData.schedule)
              .filter(([, muscles]) => muscles != null && (Array.isArray(muscles) ? muscles.length > 0 : (muscles as string) !== "Descanso"))
              .map(([day, muscles]) => ({
                day,
                type: Array.isArray(muscles) ? muscles.join(" + ") : String(muscles),
              }));
          }
        }

        // AI Name from database
        context.profile.aiName = userSettings.ai_name || "LiftMate";

        // Fatigue Index from database
        context.recovery.fatigueIndex = userSettings.fatigue_index ?? null;

        // Chat personality settings from alerts_config
        const cfg = (userSettings.alerts_config as Record<string, string> | null) || {};
        context.chatSettings = {
          personality: cfg.chat_personality || localStorage.getItem("liftmate_chat_personality") || "motivador",
          tone: cfg.chat_tone || localStorage.getItem("liftmate_chat_tone") || "Casual",
          focus: cfg.chat_focus || localStorage.getItem("liftmate_chat_focus") || "Tudo",
        };
      }
    }

    // Fallback to localStorage for backward compatibility (will be removed later)
    if (!context.profile.goal) {
      const onboardingData = localStorage.getItem("liftmate_onboarding");
      if (onboardingData) {
        const parsed = JSON.parse(onboardingData);
        context.profile = {
          ...context.profile,
          goal: parsed.goal,
          experience: parsed.experience,
          focusMuscles: parsed.focusMuscles,
          trainingDays: parsed.trainingDays,
        };
        context.schedule.nextTrainingDays = parsed.trainingDays || [];
      }
    }

    // Fallback AI Name from localStorage
    if (!context.profile.aiName || context.profile.aiName === "LiftMate") {
      const localAiName = localStorage.getItem("liftmate_ai_name");
      if (localAiName) {
        context.profile.aiName = localAiName;
      }
    }

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
      const todayLog = parsed.dailyLogs?.find((log: { date: string; meals?: unknown[]; totals?: { calories?: number; protein?: number } }) => log.date === today);
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
        const daysWithData = last7Days.filter((log: { date: string; meals?: unknown[]; totals?: { calories?: number; protein?: number } }) => log.meals?.length > 0);
        if (daysWithData.length > 0) {
          const totalCals = daysWithData.reduce((sum: number, log: { totals?: { calories?: number; protein?: number } }) => sum + (log.totals?.calories || 0), 0);
          const totalProt = daysWithData.reduce((sum: number, log: { totals?: { calories?: number; protein?: number } }) => sum + (log.totals?.protein || 0), 0);
          context.nutrition.weeklyAvgCalories = Math.round(totalCals / daysWithData.length);
          context.nutrition.weeklyAvgProtein = Math.round(totalProt / daysWithData.length);
          context.nutrition.daysMetGoal = daysWithData.filter((log: { date: string; meals?: unknown[]; totals?: { calories?: number; protein?: number } }) => 
            log.totals?.calories >= context.nutrition.goalCalories * 0.9
          ).length;
        }
      }
    }

    // 3. Workout data from DATABASE (replaces localStorage)
    if (currentUserId) {
      try {
        const today = getToday();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weekAgoStr = oneWeekAgo.toISOString().split('T')[0];

        // Fetch recent sessions (last 30 days, max 50)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const { data: sessions } = await supabase
          .from("workout_sessions")
          .select("id, date, muscle_groups, exercises_completed, completion_rate, status, day_of_week")
          .eq("user_id", currentUserId)
          .eq("status", "completed")
          .gte("date", thirtyDaysAgo.toISOString().split('T')[0])
          .order("date", { ascending: false })
          .limit(50);

        if (sessions && sessions.length > 0) {
          context.workout.totalSessions = sessions.length;
          context.workout.weekSessions = sessions.filter(s => s.date >= weekAgoStr).length;

          // Today's session
          const todaySession = sessions.find(s => s.date === today);
          if (todaySession) {
            context.workout.todayExercises = todaySession.exercises_completed || [];
            context.workout.todayMuscleGroups = todaySession.muscle_groups || [];
            context.workout.todayWorkoutType = todaySession.muscle_groups?.join(" + ") || null;
          }

          // Recent sessions for context
          context.workout.recentSessions = sessions.slice(0, 7).map(s => ({
            date: s.date,
            muscleGroups: s.muscle_groups || [],
            exercisesCompleted: s.exercises_completed || [],
            completionRate: s.completion_rate || 0,
          }));

          // Most trained muscles
          const muscleCount: Record<string, number> = {};
          sessions.forEach(s => {
            (s.muscle_groups || []).forEach((m: string) => {
              muscleCount[m] = (muscleCount[m] || 0) + 1;
            });
          });
          context.workout.mostTrainedMuscles = Object.entries(muscleCount)
            .map(([muscle, count]) => ({ muscle, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

          // Calculate streak (consecutive days with workouts, allowing 1 rest day gap)
          let currentStreak = 0;
          const todayDate = new Date();
          todayDate.setHours(0, 0, 0, 0);
          const sessionDates = new Set(sessions.map(s => s.date));

          for (let i = 0; i < 30; i++) {
            const checkDate = new Date(todayDate);
            checkDate.setDate(checkDate.getDate() - i);
            const dateStr = checkDate.toISOString().split("T")[0];

            if (sessionDates.has(dateStr)) {
              currentStreak++;
            } else if (i > 0) {
              const prevDate = new Date(todayDate);
              prevDate.setDate(prevDate.getDate() - i + 1);
              if (!sessionDates.has(prevDate.toISOString().split("T")[0])) {
                break;
              }
            }
          }
          context.workout.currentStreak = currentStreak;

          // Recent exercise volume (from workout_sets, last 7 days)
          const weekSessionIds = sessions.filter(s => s.date >= weekAgoStr).map(s => s.id);
          if (weekSessionIds.length > 0) {
            const { data: recentSets } = await supabase
              .from("workout_sets")
              .select("exercise_id, weight, reps")
              .eq("set_type", "working")
              .in("session_id", weekSessionIds);

            if (recentSets && recentSets.length > 0) {
              const exerciseIds = [...new Set(recentSets.map(s => s.exercise_id))];
              const { data: exerciseNames } = await supabase
                .from("exercises")
                .select("id, name")
                .in("id", exerciseIds);

              const nameMap = new Map((exerciseNames || []).map(e => [e.id, e.name]));
              const volumeByExercise: Record<string, { volume: number; sessions: Set<string> }> = {};

              for (const set of recentSets) {
                const name = nameMap.get(set.exercise_id) || set.exercise_id;
                if (!volumeByExercise[name]) volumeByExercise[name] = { volume: 0, sessions: new Set() };
                volumeByExercise[name].volume += set.weight * set.reps;
              }

              context.workout.recentExerciseVolume = Object.entries(volumeByExercise)
                .map(([exercise, data]) => ({
                  exercise,
                  totalVolume: Math.round(data.volume),
                  sessions: data.sessions.size || 1,
                }))
                .sort((a, b) => b.totalVolume - a.totalVolume)
                .slice(0, 10);
            }
          }
        }
      } catch (err) {
        console.error("[UserContext] Error fetching workout data from DB:", err);
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
        context.alerts.supplements = parsed.supplements.map((s: { name?: string; time?: string; enabled?: boolean }) => ({
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

    // 6. Body Measurements from localStorage
    const measurementsData = localStorage.getItem("body_measurements");
    if (measurementsData) {
      const parsed = JSON.parse(measurementsData);
      
      if (parsed.measurements?.length > 0) {
        const sorted = [...parsed.measurements].sort((a: { date?: string }, b: { date?: string }) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        const latest = sorted[0];
        
        context.bodyMeasurements.latest = {
          weight: latest.weight,
          bodyFat: latest.bodyFat,
          chest: latest.chest,
          waist: latest.waist,
          hips: latest.hips,
          arms: latest.arms,
          thighs: latest.thighs,
          date: latest.date,
        };
        
        // Calculate changes from first to last
        if (sorted.length > 1) {
          const first = sorted[sorted.length - 1];
          context.bodyMeasurements.changes = {
            weight: latest.weight && first.weight ? latest.weight - first.weight : undefined,
            bodyFat: latest.bodyFat && first.bodyFat ? latest.bodyFat - first.bodyFat : undefined,
            waist: latest.waist && first.waist ? latest.waist - first.waist : undefined,
          };
        }
      }
      
      if (parsed.goals) {
        context.bodyMeasurements.goals = parsed.goals;
      }
    }

    // 7. Challenges from localStorage
    const challengesData = localStorage.getItem("fitness_challenges");
    if (challengesData) {
      const parsed = JSON.parse(challengesData);
      
      if (parsed.activeChallenges) {
        context.challenges.active = parsed.activeChallenges.map((c: any) => ({
          type: c.type,
          target: c.target,
          progress: c.progress || 0,
          completed: c.completed || false,
        }));
        context.challenges.completedThisWeek = parsed.activeChallenges.filter((c: { completed?: boolean }) => c.completed).length;
      }
      
      if (parsed.unlockedBadges) {
        context.challenges.totalBadges = parsed.unlockedBadges.length;
        context.challenges.recentBadges = parsed.unlockedBadges.slice(-3).map((b: any) => b.id || b);
      }
    }

    // 8. Progress Photos from localStorage
    const photosData = localStorage.getItem("progress_photos");
    if (photosData) {
      const parsed = JSON.parse(photosData);
      
      if (parsed.photos?.length > 0) {
        context.progressPhotos.totalPhotos = parsed.photos.length;
        
        const sorted = [...parsed.photos].sort((a: { date?: string }, b: { date?: string }) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        const latest = sorted[0];
        context.progressPhotos.latestPhotoDate = latest.date;
        
        const daysSince = Math.floor(
          (new Date().getTime() - new Date(latest.date).getTime()) / (1000 * 60 * 60 * 24)
        );
        context.progressPhotos.daysSinceLastPhoto = daysSince;
        
        // Unique poses
        const poses = new Set<string>();
        parsed.photos.forEach((p: { pose?: string }) => poses.add(p.pose));
        context.progressPhotos.poses = Array.from(poses);
      }
    }

    // 9. Weekly Report calculation
    const weeklyReportData = localStorage.getItem("weekly_report_cache");
    if (weeklyReportData) {
      const parsed = JSON.parse(weeklyReportData);
      context.weeklyReport = {
        overallScore: parsed.overallScore || 0,
        nutritionScore: parsed.nutritionScore || 0,
        workoutScore: parsed.workoutScore || 0,
        consistencyScore: parsed.consistencyScore || 0,
        highlights: parsed.highlights || [],
        improvements: parsed.improvements || [],
      };
    }

    // 10. Physique evaluations (last 3 from DB)
    if (currentUserId) {
      try {
        const { data: physData } = await supabase
          .from("physique_evaluations" as never)
          .select("created_at, score, body_fat_estimate")
          .eq("user_id", currentUserId)
          .order("created_at", { ascending: false })
          .limit(3);

        if (physData && (physData as Array<{created_at: string; score: number | null; body_fat_estimate: string | null}>).length > 0) {
          const now = Date.now();
          context.physiqueEvaluations.evaluations = (physData as Array<{created_at: string; score: number | null; body_fat_estimate: string | null}>).map((ev) => ({
            date: new Date(ev.created_at).toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" }),
            daysAgo: Math.round((now - new Date(ev.created_at).getTime()) / 86400000),
            score: ev.score ?? 0,
            bodyFatEstimate: ev.body_fat_estimate,
          }));
        }
      } catch { /* non-fatal */ }
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

  // Chat personality
  parts.push(`\n🎭 PERSONALIDADE E ESTILO DE COMUNICAÇÃO:
- Personalidade: ${ctx.chatSettings.personality}
- Tom: ${ctx.chatSettings.tone}
- Foco: ${ctx.chatSettings.focus}`);

  // User Name
  if (ctx.profile.userName) {
    parts.push(`\n👤 NOME DO UTILIZADOR: ${ctx.profile.userName}`);
  }

  // AI Name
  if (ctx.profile.aiName) {
    parts.push(`\n🤖 O TEU NOME (nome que o utilizador te deu): ${ctx.profile.aiName}`);
  }

  // Profile
  if (ctx.profile.goal || ctx.profile.experience || ctx.profile.userName) {
    parts.push(`\n🎯 PERFIL DO UTILIZADOR:
- Nome: ${ctx.profile.userName || "Não definido"}
- Objetivo: ${ctx.profile.goal || "Não definido"}
- Experiência: ${ctx.profile.experience || "Não definida"}
- Peso: ${ctx.profile.weight ? `${ctx.profile.weight}kg` : "Não definido"}
- Altura: ${ctx.profile.height ? `${ctx.profile.height}cm` : "Não definido"}
- Idade: ${ctx.profile.age ? `${ctx.profile.age} anos` : "Não definido"}
- Género: ${ctx.profile.gender === 'male' ? 'Masculino' : ctx.profile.gender === 'female' ? 'Feminino' : 'Não definido'}
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
- Total de sessões (30 dias): ${ctx.workout.totalSessions}
- Sessões esta semana: ${ctx.workout.weekSessions}
- Streak atual: ${ctx.workout.currentStreak} dias 🔥`);
    
    if (ctx.workout.mostTrainedMuscles.length > 0) {
      parts.push(`- Músculos mais treinados: ${ctx.workout.mostTrainedMuscles.map(m => `${m.muscle} (${m.count}x)`).join(", ")}`);
    }
  }

  // Weekly Schedule
  if (ctx.schedule.scheduledWorkouts.length > 0) {
    const lines = ctx.schedule.scheduledWorkouts.map(sw => `- ${sw.day}: ${sw.type}`).join("\n");
    parts.push(`\n📅 PLANO SEMANAL DE TREINOS:\n${lines}`);
  }

  // Recent Sessions
  if (ctx.workout.recentSessions.length > 0) {
    parts.push(`\nÚLTIMAS SESSÕES:`);
    ctx.workout.recentSessions.slice(0, 5).forEach(s => {
      const date = new Date(s.date + "T00:00:00").toLocaleDateString("pt-PT", { weekday: "short", day: "numeric", month: "short" });
      parts.push(`- ${date}: ${s.muscleGroups.join("+")} - ${s.exercisesCompleted.length} exercícios (${s.completionRate}%)`);
    });
  }

  // Per-muscle recovery (derived from session dates)
  if (ctx.workout.recentSessions.length > 0) {
    const muscleDays: Record<string, number> = {};
    const todayMs = new Date().setHours(0, 0, 0, 0);
    for (const s of ctx.workout.recentSessions) {
      const days = Math.round((todayMs - new Date(s.date + "T00:00:00").getTime()) / 86400000);
      for (const m of s.muscleGroups) {
        if (!(m in muscleDays) || days < muscleDays[m]) muscleDays[m] = days;
      }
    }
    const lines = Object.entries(muscleDays)
      .sort(([, a], [, b]) => a - b)
      .map(([muscle, days]) => {
        if (days === 0) return `- ${muscle}: treinou HOJE`;
        if (days === 1) return `- ${muscle}: treinou ontem — pode ainda estar a recuperar`;
        if (days <= 2) return `- ${muscle}: há ${days} dias — recuperação em curso`;
        if (days <= 4) return `- ${muscle}: há ${days} dias — provavelmente recuperado`;
        return `- ${muscle}: há ${days}+ dias — totalmente recuperado`;
      });
    parts.push(`\n💪 RECUPERAÇÃO POR MÚSCULO:\n${lines.join("\n")}`);
  }

  // Recent Exercise Volume
  if (ctx.workout.recentExerciseVolume.length > 0) {
    parts.push(`\n📊 VOLUME RECENTE POR EXERCÍCIO (7 dias):`);
    ctx.workout.recentExerciseVolume.slice(0, 8).forEach(e => {
      parts.push(`- ${e.exercise}: ${e.totalVolume}kg volume total`);
    });
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

  // Body Measurements
  if (ctx.bodyMeasurements.latest) {
    const m = ctx.bodyMeasurements.latest;
    parts.push(`\n📏 MEDIDAS CORPORAIS (${m.date}):
- Peso: ${m.weight ? `${m.weight}kg` : "Não registado"}
- Gordura corporal: ${m.bodyFat ? `${m.bodyFat}%` : "Não registado"}
- Cintura: ${m.waist ? `${m.waist}cm` : "Não registado"}
- Peito: ${m.chest ? `${m.chest}cm` : "Não registado"}
- Braços: ${m.arms ? `${m.arms}cm` : "Não registado"}`);

    if (ctx.bodyMeasurements.changes) {
      const c = ctx.bodyMeasurements.changes;
      parts.push(`\n📉 EVOLUÇÃO DAS MEDIDAS:
${c.weight !== undefined ? `- Peso: ${c.weight > 0 ? '+' : ''}${c.weight.toFixed(1)}kg` : ""}
${c.bodyFat !== undefined ? `- Gordura: ${c.bodyFat > 0 ? '+' : ''}${c.bodyFat.toFixed(1)}%` : ""}
${c.waist !== undefined ? `- Cintura: ${c.waist > 0 ? '+' : ''}${c.waist.toFixed(1)}cm` : ""}`);
    }

    if (ctx.bodyMeasurements.goals?.weight) {
      const diff = m.weight ? m.weight - ctx.bodyMeasurements.goals.weight : 0;
      parts.push(`- Meta de peso: ${ctx.bodyMeasurements.goals.weight}kg (${diff > 0 ? `faltam ${diff.toFixed(1)}kg para perder` : `já atingiu!`})`);
    }
  }

  // Challenges
  if (ctx.challenges.active.length > 0) {
    parts.push(`\n🏆 DESAFIOS ATIVOS:
${ctx.challenges.active.map(c => `- ${c.type}: ${c.progress}/${c.target} ${c.completed ? '✅' : `(${Math.round((c.progress/c.target)*100)}%)`}`).join("\n")}
- Desafios completos esta semana: ${ctx.challenges.completedThisWeek}
- Total de badges: ${ctx.challenges.totalBadges}`);

    if (ctx.challenges.recentBadges.length > 0) {
      parts.push(`- Badges recentes: ${ctx.challenges.recentBadges.join(", ")}`);
    }
  }

  // Progress Photos
  if (ctx.progressPhotos.totalPhotos > 0) {
    parts.push(`\n📸 FOTOS DE PROGRESSO:
- Total de fotos: ${ctx.progressPhotos.totalPhotos}
- Última foto: ${ctx.progressPhotos.latestPhotoDate} (há ${ctx.progressPhotos.daysSinceLastPhoto} dias)
- Poses registadas: ${ctx.progressPhotos.poses.join(", ")}`);
    
    if (ctx.progressPhotos.daysSinceLastPhoto && ctx.progressPhotos.daysSinceLastPhoto >= 7) {
      parts.push(`⚠️ Lembrete: Já passaram ${ctx.progressPhotos.daysSinceLastPhoto} dias desde a última foto de progresso!`);
    }
  }

  // Recovery State
  if (ctx.recovery.fatigueIndex !== null && ctx.recovery.fatigueIndex !== undefined) {
    const fi = ctx.recovery.fatigueIndex;
    let status = "totalmente recuperado";
    if (fi >= 81) status = "fadiga muito alta — recomendado descanso";
    else if (fi >= 61) status = "fadiga alta — evitar treino intenso";
    else if (fi >= 41) status = "fadiga moderada";
    else if (fi >= 21) status = "fadiga leve";

    parts.push(`\n⚡ ESTADO DE RECUPERAÇÃO:
- Índice de fadiga atual: ${fi} / 100
- Estado: ${status}`);
  }

  // Weekly Report
  if (ctx.weeklyReport.overallScore > 0) {
    parts.push(`\n📊 RELATÓRIO SEMANAL:
- Score geral: ${ctx.weeklyReport.overallScore}/100
- Nutrição: ${ctx.weeklyReport.nutritionScore}/100
- Treinos: ${ctx.weeklyReport.workoutScore}/100
- Consistência: ${ctx.weeklyReport.consistencyScore}/100`);

    if (ctx.weeklyReport.highlights.length > 0) {
      parts.push(`\n✨ DESTAQUES DA SEMANA:
${ctx.weeklyReport.highlights.map(h => `- ${h}`).join("\n")}`);
    }

    if (ctx.weeklyReport.improvements.length > 0) {
      parts.push(`\n🎯 ÁREAS A MELHORAR:
${ctx.weeklyReport.improvements.map(i => `- ${i}`).join("\n")}`);
    }
  }

  // Physique Evaluations
  if (ctx.physiqueEvaluations.evaluations.length > 0) {
    const evs = ctx.physiqueEvaluations.evaluations;
    const latest = evs[0];
    const lines = evs.map((ev, i) =>
      `- ${i === 0 ? "Mais recente" : `Anterior ${i}`} (${ev.date}, há ${ev.daysAgo} dias): Score ${ev.score.toFixed(1)}/10${ev.bodyFatEstimate ? `, gordura estimada ${ev.bodyFatEstimate}` : ""}`
    );
    const delta = evs.length >= 2 ? +(evs[0].score - evs[1].score).toFixed(1) : null;
    parts.push(`\n🏋️ AVALIAÇÕES FÍSICAS (últimas ${evs.length}):
${lines.join("\n")}${delta !== null ? `\n- Evolução: ${delta >= 0 ? "+" : ""}${delta} pontos desde a avaliação anterior` : ""}
- Última avaliação: há ${latest.daysAgo} dias com score ${latest.score.toFixed(1)}/10`);
  }

  parts.push(`\n⚙️ CAPACIDADE DE AÇÃO: Quando o utilizador pedir para criar ou alterar calendário, reagendar treinos ou criar metas, inclui na resposta: [ACTION:updateSchedule:{"Segunda-feira":["Peito","Bíceps"]}] — usa dias em português completo. Nunca mostres a linha [ACTION:...] ao utilizador.`);

  return parts.join("\n");
};
