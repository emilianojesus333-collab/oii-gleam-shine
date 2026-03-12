import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface PerformanceMetrics {
  avgPerformance30d: number | null;
  weeklyVolume: number;
  weeklyFrequency: number;
  fatigueIndex: number | null;
  performanceTrend: { date: string; score: number; label: string }[];
}

export const usePerformanceMetrics = () => {
  const { user } = useAuth();

  return useQuery<PerformanceMetrics>({
    queryKey: ["performance-metrics", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("No user");

      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Parallel queries
      const [sessionsRes, setsRes, settingsRes] = await Promise.all([
        // Last 30 days sessions (for avg performance + trend)
        supabase
          .from("workout_sessions")
          .select("id, date, performance_score")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
          .order("date", { ascending: true }),

        // Last 7 days sets (for volume)
        supabase
          .from("workout_sets")
          .select("weight, reps")
          .eq("user_id", user.id)
          .eq("set_type", "working")
          .gte("created_at", sevenDaysAgo.toISOString()),

        // Fatigue index
        supabase
          .from("user_settings")
          .select("fatigue_index")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      const sessions = sessionsRes.data || [];
      const sets = setsRes.data || [];

      // 1. Avg performance (30d)
      const scoresWithValue = sessions.filter((s) => s.performance_score != null);
      const avgPerformance30d =
        scoresWithValue.length > 0
          ? Math.round(scoresWithValue.reduce((sum, s) => sum + (s.performance_score ?? 0), 0) / scoresWithValue.length)
          : null;

      // 2. Weekly volume
      const weeklyVolume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0);

      // 3. Weekly frequency
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];
      const weeklyFrequency = sessions.filter((s) => s.date >= sevenDaysAgoStr).length;

      // 4. Fatigue
      const fatigueIndex = settingsRes.data?.fatigue_index ?? null;

      // 5. Performance trend (last 10 sessions)
      const last10 = sessions
        .filter((s) => s.performance_score != null)
        .slice(-10);

      const performanceTrend = last10.map((s) => ({
        date: new Date(s.date).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" }),
        score: s.performance_score ?? 0,
        label: new Date(s.date).toLocaleDateString("pt-PT", { day: "numeric", month: "long" }),
      }));

      return {
        avgPerformance30d,
        weeklyVolume,
        weeklyFrequency,
        fatigueIndex,
        performanceTrend,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
};
