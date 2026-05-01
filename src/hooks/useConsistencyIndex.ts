import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserSettings } from "@/hooks/useUserSettings";

export interface ConsistencyIndex {
  currentMonth: {
    label: string;        // "Abril 2026"
    completed: number;
    planned: number;
    percentage: number;   // 0–100
  };
  previousMonth: {
    label: string;
    completed: number;
    planned: number;
    percentage: number;
  };
  delta: number;          // current % - previous %
  loading: boolean;
}

function plannedSessionsForMonth(
  schedule: Record<string, unknown>,
  year: number,
  month: number   // 0-indexed
): number {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dayNames = ["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];

  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month, d).getDay();
    const value = schedule[dayNames[dow]];
    if (value && value !== "Descanso") count++;
  }
  return count;
}

export function useConsistencyIndex(): ConsistencyIndex {
  const { user } = useAuth();
  const { settings } = useUserSettings();
  const [data, setData] = useState<Omit<ConsistencyIndex, "loading">>({
    currentMonth:  { label: "", completed: 0, planned: 0, percentage: 0 },
    previousMonth: { label: "", completed: 0, planned: 0, percentage: 0 },
    delta: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    (async () => {
      setLoading(true);

      const now = new Date();
      const curYear  = now.getFullYear();
      const curMonth = now.getMonth();
      const prevYear  = curMonth === 0 ? curYear - 1 : curYear;
      const prevMonth = curMonth === 0 ? 11 : curMonth - 1;

      const curStart  = `${curYear}-${String(curMonth + 1).padStart(2, "0")}-01`;
      const prevStart = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-01`;
      const prevEnd   = `${curYear}-${String(curMonth + 1).padStart(2, "0")}-01`;

      const schedule = (settings?.onboarding_data?.schedule as Record<string, unknown>) || {};

      const [curRes, prevRes] = await Promise.all([
        supabase
          .from("workout_sessions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "completed")
          .gte("date", curStart),
        supabase
          .from("workout_sessions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "completed")
          .gte("date", prevStart)
          .lt("date", prevEnd),
      ]);

      if (cancelled) return;

      const curCompleted  = curRes.count ?? 0;
      const prevCompleted = prevRes.count ?? 0;
      const curPlanned    = plannedSessionsForMonth(schedule, curYear, curMonth);
      const prevPlanned   = plannedSessionsForMonth(schedule, prevYear, prevMonth);

      const curPct  = curPlanned  > 0 ? Math.min(100, Math.round((curCompleted  / curPlanned)  * 100)) : 0;
      const prevPct = prevPlanned > 0 ? Math.min(100, Math.round((prevCompleted / prevPlanned) * 100)) : 0;

      const monthNames = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

      setData({
        currentMonth:  { label: `${monthNames[curMonth]} ${curYear}`,   completed: curCompleted,  planned: curPlanned,  percentage: curPct  },
        previousMonth: { label: `${monthNames[prevMonth]} ${prevYear}`, completed: prevCompleted, planned: prevPlanned, percentage: prevPct },
        delta: curPct - prevPct,
      });
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [user, settings]);

  return { ...data, loading };
}
