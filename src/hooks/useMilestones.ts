import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserSettings } from "@/hooks/useUserSettings";
import {
  checkMilestones,
  getPendingMilestone,
  clearPendingMilestone,
  type Milestone,
} from "@/utils/milestones";

export function useMilestones() {
  const { user } = useAuth();
  const { settings } = useUserSettings();
  const [pendingMilestone, setPendingMilestone] = useState<Milestone | null>(null);

  const runCheck = useCallback(async () => {
    if (!user?.id || !settings) return;

    // Fetch total sessions and sessions per day in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: sessions } = await supabase
      .from("workout_sessions")
      .select("id, date")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("date", { ascending: true });

    if (!sessions) return;

    const totalSessions = sessions.length;

    // Days with at least one workout in the last 7 days
    const recentDates = new Set(
      sessions
        .filter((s) => new Date(s.date + "T00:00:00") >= sevenDaysAgo)
        .map((s) => s.date)
    );
    const daysWithWorkoutsLast7 = recentDates.size;

    // Check for a new PR in the last 24h
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const { data: recentPRs } = await supabase
      .from("one_rm_records")
      .select("id")
      .eq("user_id", user.id)
      .gte("created_at", oneDayAgo.toISOString())
      .limit(1);

    const hasNewPR = (recentPRs?.length ?? 0) > 0;

    const accountCreatedAt = settings.created_at || new Date().toISOString();

    const triggered = checkMilestones(user.id, {
      totalSessions,
      accountCreatedAt,
      daysWithWorkoutsLast7,
      hasNewPR,
    });

    if (triggered) {
      const milestone = getPendingMilestone(user.id);
      setPendingMilestone(milestone);
    }
  }, [user?.id, settings]);

  // Check on mount
  useEffect(() => {
    if (!user?.id) return;
    // Show any pending milestone that was set but not yet displayed
    const pending = getPendingMilestone(user.id);
    if (pending) {
      setPendingMilestone(pending);
      return;
    }
    runCheck();
  }, [user?.id, runCheck]);

  const dismissMilestone = useCallback(() => {
    if (user?.id) clearPendingMilestone(user.id);
    setPendingMilestone(null);
  }, [user?.id]);

  return { pendingMilestone, dismissMilestone, runCheck };
}
