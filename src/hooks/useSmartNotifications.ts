import { useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import {
  buildTodayNotifications,
  alreadyScheduledToday,
  markScheduledToday,
} from "@/utils/smartNotifications";
import { getDayFlowProgress } from "@/utils/onboardingFlow";

interface SmartNotifContext {
  hasTodayWorkout: boolean;
  plannedExerciseCount: number;
  hydrationLiters: number;
  hydrationGoalLiters: number;
  currentStreak: number;
  lastSessionDate: string | null;
}

/**
 * Schedules smart notifications once per day, only after Day 3 of the onboarding flow.
 * Reuses usePushNotifications for actual scheduling.
 */
export function useSmartNotifications(ctx: SmartNotifContext) {
  const { user } = useAuth();
  const { permission, requestPermission, scheduleNotification } = usePushNotifications();

  /** Ask for permission non-intrusively — only after Day 3 */
  const maybeRequestPermission = useCallback(async () => {
    if (!user?.id) return false;
    if (permission === "granted") return true;
    if (permission === "denied") return false;

    // Only ask after Day 3 of the onboarding flow
    const progress = getDayFlowProgress(user.id);
    if (!progress) return false;

    const start = new Date(progress.startDate + "T00:00:00");
    const dayNumber =
      Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (dayNumber < 3) return false;

    return await requestPermission();
  }, [user?.id, permission, requestPermission]);

  const scheduleForToday = useCallback(async () => {
    if (!user?.id) return;
    if (alreadyScheduledToday(user.id)) return;

    const granted = await maybeRequestPermission();
    if (!granted) return;

    const notifications = await buildTodayNotifications(user.id, ctx);

    for (const n of notifications) {
      scheduleNotification(n.id, n.title, n.body, n.scheduledTime, n.tag, n.soundType);
    }

    if (notifications.length > 0) {
      markScheduledToday(user.id);
    }
  }, [user?.id, ctx, maybeRequestPermission, scheduleNotification]);

  // Run once on mount / when context changes
  useEffect(() => {
    scheduleForToday();
  }, [scheduleForToday]);
}
