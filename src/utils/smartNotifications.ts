/**
 * Smart Notifications
 * Analyses workout history to determine the user's real training hour,
 * then schedules contextual notifications via the Web Notifications API.
 *
 * Builds on top of the existing usePushNotifications hook — this module
 * is pure logic (no React state) so it can be called from a hook or effect.
 */

import { supabase } from "@/integrations/supabase/client";

export interface SmartNotificationSchedule {
  workoutHour: number | null;      // null = not enough data
  workoutMinute: number;
  hasEnoughData: boolean;
}

const SCHEDULE_KEY = (userId: string) => `liftmate_smart_notif_schedule_${userId}`;
const LAST_SCHEDULED_KEY = (userId: string) => `liftmate_smart_notif_last_${userId}`;

/** Fetch sessions and compute avg training hour from updated_at timestamps */
export async function detectWorkoutHour(userId: string): Promise<SmartNotificationSchedule> {
  const cached = localStorage.getItem(SCHEDULE_KEY(userId));
  if (cached) {
    try {
      return JSON.parse(cached) as SmartNotificationSchedule;
    } catch {
      // fall through
    }
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("updated_at")
    .eq("user_id", userId)
    .eq("status", "completed")
    .gte("updated_at", thirtyDaysAgo.toISOString())
    .order("updated_at", { ascending: false })
    .limit(20);

  if (!sessions || sessions.length < 3) {
    return { workoutHour: null, workoutMinute: 0, hasEnoughData: false };
  }

  const hours = sessions.map((s) => new Date(s.updated_at).getHours());
  const avgHour = Math.round(hours.reduce((a, b) => a + b, 0) / hours.length);

  const schedule: SmartNotificationSchedule = {
    workoutHour: avgHour,
    workoutMinute: 0,
    hasEnoughData: true,
  };

  // Cache for 24h
  localStorage.setItem(SCHEDULE_KEY(userId), JSON.stringify(schedule));
  setTimeout(() => localStorage.removeItem(SCHEDULE_KEY(userId)), 24 * 60 * 60 * 1000);

  return schedule;
}

/** Build today's notification schedule Date for a given hour */
function todayAt(hour: number, minute = 0): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** Returns true if we already scheduled notifications today */
export function alreadyScheduledToday(userId: string): boolean {
  const raw = localStorage.getItem(LAST_SCHEDULED_KEY(userId));
  if (!raw) return false;
  return raw === new Date().toDateString();
}

export function markScheduledToday(userId: string): void {
  localStorage.setItem(LAST_SCHEDULED_KEY(userId), new Date().toDateString());
}

export interface NotificationPayload {
  id: string;
  title: string;
  body: string;
  scheduledTime: Date;
  tag: string;
  soundType: "workout" | "water" | "streak";
}

/**
 * Build the list of smart notifications for today.
 * Caller is responsible for actually scheduling them via usePushNotifications.
 */
export async function buildTodayNotifications(
  userId: string,
  context: {
    hasTodayWorkout: boolean;       // is today a scheduled training day?
    plannedExerciseCount: number;   // how many exercises planned
    hydrationLiters: number;        // water drunk today
    hydrationGoalLiters: number;    // daily goal
    currentStreak: number;          // current training streak
    lastSessionDate: string | null; // YYYY-MM-DD
  }
): Promise<NotificationPayload[]> {
  const schedule = await detectWorkoutHour(userId);
  const now = new Date();
  const notifications: NotificationPayload[] = [];

  // 1. Workout reminder — 15 min before usual time
  if (schedule.hasEnoughData && schedule.workoutHour !== null && context.hasTodayWorkout) {
    const workoutTime = todayAt(schedule.workoutHour, schedule.workoutMinute);
    const reminderTime = new Date(workoutTime.getTime() - 15 * 60 * 1000);

    if (reminderTime > now) {
      const exerciseText =
        context.plannedExerciseCount > 0
          ? `Tens ${context.plannedExerciseCount} exercícios planeados para hoje.`
          : "O teu treino de hoje está à tua espera.";
      notifications.push({
        id: `workout-reminder-${userId}-${now.toDateString()}`,
        title: "Está na hora do treino! 💪",
        body: exerciseText,
        scheduledTime: reminderTime,
        tag: "workout-reminder",
        soundType: "workout",
      });
    }
  }

  // 2. Hydration reminder — at 15h if below 50% goal
  const hydrationPct =
    context.hydrationGoalLiters > 0
      ? context.hydrationLiters / context.hydrationGoalLiters
      : 1;
  const hydrationReminderTime = todayAt(15, 0);
  if (hydrationPct < 0.5 && hydrationReminderTime > now) {
    notifications.push({
      id: `hydration-reminder-${userId}-${now.toDateString()}`,
      title: "Não te esqueças da água 💧",
      body: `Bebeste apenas ${context.hydrationLiters.toFixed(1)}L de ${context.hydrationGoalLiters}L hoje. Bebe mais!`,
      scheduledTime: hydrationReminderTime,
      tag: "hydration-reminder",
      soundType: "water",
    });
  }

  // 3. Streak at risk — at 20h if streak >= 3 and no session today
  if (context.currentStreak >= 3 && context.lastSessionDate) {
    const today = now.toISOString().split("T")[0];
    const lastWasYesterday = context.lastSessionDate < today;
    const streakReminderTime = todayAt(20, 0);

    if (lastWasYesterday && streakReminderTime > now) {
      notifications.push({
        id: `streak-reminder-${userId}-${now.toDateString()}`,
        title: "Streak em risco! 🔥",
        body: `Treina hoje para manter os ${context.currentStreak} dias seguidos.`,
        scheduledTime: streakReminderTime,
        tag: "streak-reminder",
        soundType: "streak",
      });
    }
  }

  return notifications;
}
