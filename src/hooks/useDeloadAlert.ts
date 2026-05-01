import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type DeloadSeverity = "none" | "consider" | "recommended" | "urgent";

export interface DeloadAlert {
  severity: DeloadSeverity;
  weeklyVolumes: number[];          // last 6 weeks, oldest first
  volumeSpike: number;              // % increase vs baseline
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

      // Map session_id → volume
      const volBySession: Record<string, number> = {};
      for (const s of sets) {
        volBySession[s.session_id] = (volBySession[s.session_id] ?? 0) + Number(s.weight) * s.reps;
      }

      // Bucket into 6 weeks (index 0 = oldest). Also track sessions per week.
      const weeklyVolumes = [0, 0, 0, 0, 0, 0];
      const weeklySessions = [0, 0, 0, 0, 0, 0];
      const weekHasData = [false, false, false, false, false, false];
      for (const session of sessions) {
        const sessionDate = new Date(session.date + "T00:00:00");
        const daysFromMonday = Math.floor((thisMonday.getTime() - sessionDate.getTime()) / 86400000);
        const weekIndex = 5 - Math.floor(daysFromMonday / 7);
        if (weekIndex >= 0 && weekIndex <= 5) {
          weeklyVolumes[weekIndex] += volBySession[session.id] ?? 0;
          weeklySessions[weekIndex] += 1;
          weekHasData[weekIndex] = true;
        }
      }

      // === REGRAS CONSERVADORAS DE DELOAD ===
      // Histórico mínimo: pelo menos 3 semanas de dados (qualquer das últimas 6)
      const weeksWithData = weekHasData.filter(Boolean).length;

      // Última semana completa (índice 5 = semana atual em curso; usamos a mais recente fechada: índice 4)
      const lastFullWeekIndex = 4;
      const lastWeekSessions = weeklySessions[lastFullWeekIndex] ?? 0;

      // Spike vs média das 3 semanas anteriores à última fechada
      const baselineThree = weeklyVolumes.slice(1, 4); // semanas -4,-3,-2
      const avgBaseline = baselineThree.reduce((s, v) => s + v, 0) / 3;
      const avgRecent = weeklyVolumes[lastFullWeekIndex] ?? 0;
      const spike = avgBaseline > 0 ? Math.round(((avgRecent - avgBaseline) / avgBaseline) * 100) : 0;

      // Conta semanas consecutivas (mais recentes) com aumento >20% face à anterior
      let consecutive = 0;
      for (let i = lastFullWeekIndex; i >= 1; i--) {
        const prev = weeklyVolumes[i - 1];
        const curr = weeklyVolumes[i];
        if (prev > 0 && curr > prev * 1.2) {
          consecutive += 1;
        } else {
          break;
        }
      }

      // Severity: só dispara se TODAS as condições críticas forem cumpridas
      let severity: DeloadSeverity = "none";
      const hasMinHistory = weeksWithData >= 3;
      const trainedEnoughLastWeek = lastWeekSessions >= 4;
      const sustainedSpike = consecutive >= 3;

      if (hasMinHistory && trainedEnoughLastWeek && sustainedSpike) {
        if (fatigueIndex !== null && fatigueIndex >= 81) severity = "urgent";
        else if (spike >= 40 || consecutive >= 4) severity = "urgent";
        else if (spike >= 30) severity = "recommended";
        else severity = "consider";
      }

      const { message, recommendation } = buildMessage(severity, Math.max(0, spike), consecutive);

      setAlert({ severity, weeklyVolumes, volumeSpike: spike, fatigueIndex, consecutiveHighWeeks: consecutive, message, recommendation });
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [user]);

  return { ...alert, loading };
}
