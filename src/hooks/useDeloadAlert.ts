import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type DeloadSeverity = "none" | "consider" | "recommended" | "urgent";

export interface DeloadAlert {
  severity: DeloadSeverity;
  weeklyVolumes: number[];          // last 4 weeks, oldest first
  volumeSpike: number;              // % increase vs 4-week avg
  fatigueIndex: number | null;
  consecutiveHighWeeks: number;
  message: string;
  recommendation: string;
  loading: boolean;
}

function buildMessage(severity: DeloadSeverity, spike: number, consecutive: number): { message: string; recommendation: string } {
  switch (severity) {
    case "urgent":
      return {
        message: `Volume ${spike}% acima da média — ${consecutive} semanas seguidas de alta intensidade`,
        recommendation: "Reduz volume em 40-50% esta semana. Foca em mobilidade e técnica.",
      };
    case "recommended":
      return {
        message: `Volume ${spike}% acima da média — risco de overreaching`,
        recommendation: "Reduz sets em 30% e mantém intensidade para recuperar.",
      };
    case "consider":
      return {
        message: "Volume ligeiramente elevado nas últimas 2 semanas",
        recommendation: "Considera reduzir 1-2 sets por exercício esta semana.",
      };
    default:
      return { message: "", recommendation: "" };
  }
}

export function useDeloadAlert(): DeloadAlert {
  const { user } = useAuth();
  const [alert, setAlert] = useState<Omit<DeloadAlert, "loading">>({
    severity: "none",
    weeklyVolumes: [],
    volumeSpike: 0,
    fatigueIndex: null,
    consecutiveHighWeeks: 0,
    message: "",
    recommendation: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      setLoading(true);

      // Last 6 full weeks (3 baseline + 3 recent)
      const now = new Date();
      const day = now.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const thisMonday = new Date(now);
      thisMonday.setDate(now.getDate() + mondayOffset);
      thisMonday.setHours(0, 0, 0, 0);

      const fourWeeksAgo = new Date(thisMonday);
      fourWeeksAgo.setDate(thisMonday.getDate() - 42); // 6 weeks

      const [sessionsRes, setsRes, settingsRes] = await Promise.all([
        supabase
          .from("workout_sessions")
          .select("id, date")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .gte("date", fourWeeksAgo.toISOString().split("T")[0])
          .order("date", { ascending: true }),
        supabase
          .from("workout_sets")
          .select("session_id, weight, reps")
          .eq("user_id", user.id)
          .eq("set_type", "working")
          .gte("created_at", fourWeeksAgo.toISOString()),
        supabase
          .from("user_settings")
          .select("fatigue_index")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      if (cancelled) return;

      const sessions = sessionsRes.data || [];
      const sets = setsRes.data || [];
      const fatigueIndex = settingsRes.data?.fatigue_index ?? null;

      const noAlert = () => {
        setAlert({ severity: "none", weeklyVolumes: [], volumeSpike: 0, fatigueIndex, consecutiveHighWeeks: 0, message: "", recommendation: "" });
        setLoading(false);
      };

      // ── CONDIÇÃO 1: pelo menos 3 semanas de histórico ──────────────────
      // Count distinct weeks with at least one session
      const weekSet = new Set<number>();
      for (const session of sessions) {
        const d = new Date(session.date + "T00:00:00");
        const daysBack = Math.floor((thisMonday.getTime() - d.getTime()) / 86400000);
        weekSet.add(Math.floor(daysBack / 7));
      }
      if (weekSet.size < 3) { noAlert(); return; }

      // ── CONDIÇÃO 2: pelo menos 4 dias de treino na última semana ───────
      const lastWeekSessions = sessions.filter(s => {
        const d = new Date(s.date + "T00:00:00");
        return d >= thisMonday;
      });
      // count unique days (a user could have 2 sessions in 1 day)
      const uniqueTrainingDays = new Set(lastWeekSessions.map(s => s.date)).size;
      if (uniqueTrainingDays < 4) { noAlert(); return; }

      // ── Map session_id → volume ─────────────────────────────────────────
      const volBySession: Record<string, number> = {};
      for (const s of sets) {
        volBySession[s.session_id] = (volBySession[s.session_id] ?? 0) + Number(s.weight) * s.reps;
      }

      // Bucket into 6 weeks (index 0 = oldest)
      const weeklyVolumes = [0, 0, 0, 0, 0, 0];
      for (const session of sessions) {
        const sessionDate = new Date(session.date + "T00:00:00");
        const daysFromMonday = Math.floor((thisMonday.getTime() - sessionDate.getTime()) / 86400000);
        const weekIndex = 5 - Math.floor(daysFromMonday / 7);
        if (weekIndex >= 0 && weekIndex <= 5) {
          weeklyVolumes[weekIndex] += volBySession[session.id] ?? 0;
        }
      }

      // 3 baseline weeks vs 3 recent weeks
      const baselineThree = weeklyVolumes.slice(0, 3);
      const recentThree   = weeklyVolumes.slice(3);
      const avgBaseline = baselineThree.reduce((s, v) => s + v, 0) / 3;
      const avgRecent   = recentThree.reduce((s, v) => s + v, 0) / 3;

      // ── CONDIÇÃO 3: 3 semanas consecutivas com volume >20% acima baseline ──
      if (avgBaseline <= 0) { noAlert(); return; }
      const SPIKE_THRESHOLD = 20; // %
      const minHighVolume = avgBaseline * (1 + SPIKE_THRESHOLD / 100);

      // All 3 recent weeks must individually exceed baseline + 20%
      const allThreeConsecutiveHigh = recentThree.every(v => v > minHighVolume);
      if (!allThreeConsecutiveHigh) { noAlert(); return; }

      // All conditions met — calculate severity and spike
      const spike = Math.round(((avgRecent - avgBaseline) / avgBaseline) * 100);
      const consecutive = 3; // we know all 3 weeks qualify

      let severity: DeloadSeverity = "consider";
      if (fatigueIndex !== null && fatigueIndex >= 81) {
        severity = "urgent";
      } else if (spike >= 40 || (fatigueIndex !== null && fatigueIndex >= 61)) {
        severity = "urgent";
      } else if (spike >= 30) {
        severity = "recommended";
      }

      const { message, recommendation } = buildMessage(severity, Math.max(0, spike), consecutive);

      setAlert({ severity, weeklyVolumes, volumeSpike: spike, fatigueIndex, consecutiveHighWeeks: consecutive, message, recommendation });
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [user]);

  return { ...alert, loading };
}
