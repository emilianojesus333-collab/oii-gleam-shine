import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, TrendingUp, Minus, TrendingDown, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SessionSummary {
  id: string;
  date: string;
  day_of_week: string | null;
  muscle_groups: string[] | null;
  exerciseCount: number;
  decisions: { progress: number; maintain: number; deload: number };
}

const decisionIcons = {
  progress: { icon: TrendingUp, color: "text-blue-400" },
  maintain: { icon: Minus, color: "text-yellow-400" },
  deload: { icon: TrendingDown, color: "text-red-400" },
};

export default function History() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      setLoading(true);

      const { data: rawSessions } = await supabase
        .from("workout_sessions")
        .select("id, date, day_of_week, muscle_groups")
        .eq("status", "completed")
        .order("date", { ascending: false })
        .limit(30);

      if (!rawSessions || rawSessions.length === 0) {
        setSessions([]);
        setLoading(false);
        return;
      }

      const sessionIds = rawSessions.map((s) => s.id);

      // Batch fetch sets and logs to avoid N+1
      const [setsRes, logsRes] = await Promise.all([
        supabase
          .from("workout_sets")
          .select("session_id, exercise_id")
          .in("session_id", sessionIds),
        supabase
          .from("progression_logs")
          .select("session_id, decision")
          .in("session_id", sessionIds),
      ]);

      const setsMap: Record<string, Set<string>> = {};
      for (const s of setsRes.data || []) {
        if (!setsMap[s.session_id]) setsMap[s.session_id] = new Set();
        setsMap[s.session_id].add(s.exercise_id);
      }

      const logsMap: Record<string, { progress: number; maintain: number; deload: number }> = {};
      for (const l of logsRes.data || []) {
        if (!logsMap[l.session_id]) logsMap[l.session_id] = { progress: 0, maintain: 0, deload: 0 };
        const d = l.decision as "progress" | "maintain" | "deload";
        if (logsMap[l.session_id][d] !== undefined) logsMap[l.session_id][d]++;
      }

      const summaries: SessionSummary[] = rawSessions.map((s) => ({
        id: s.id,
        date: s.date,
        day_of_week: s.day_of_week,
        muscle_groups: s.muscle_groups,
        exerciseCount: setsMap[s.id]?.size || 0,
        decisions: logsMap[s.id] || { progress: 0, maintain: 0, deload: 0 },
      }));

      setSessions(summaries);
      setLoading(false);
    };

    fetchHistory();
  }, [user]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("pt-PT", { day: "numeric", month: "short" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/workout")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">Histórico de Treinos</h1>
      </div>

      <div className="px-5 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="w-8 h-8 text-primary/60" />
            </div>
            <p className="font-semibold text-foreground mb-1">Ainda sem treinos</p>
            <p className="text-sm text-muted-foreground mb-6">Completa o teu primeiro treino para veres o histórico aqui.</p>
            <Button onClick={() => navigate("/workout")} size="sm" className="gap-2">
              <Dumbbell className="w-4 h-4" />
              Fazer primeiro treino
            </Button>
          </div>
        ) : (
          sessions.map((s, i) => {
            const totalDecisions = s.decisions.progress + s.decisions.maintain + s.decisions.deload;
            return (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => navigate(`/workout-summary/${s.id}`)}
                className="w-full text-left rounded-2xl bg-card border border-border p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">
                      {s.day_of_week || formatDate(s.date)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(s.date)} · {s.muscle_groups?.join(" + ") || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{s.exerciseCount} exercício{s.exerciseCount !== 1 ? "s" : ""}</span>
                  {totalDecisions > 0 && (
                    <>
                      <span>·</span>
                      {s.decisions.progress > 0 && (
                        <span className="text-blue-400 flex items-center gap-0.5">
                          <TrendingUp className="w-3 h-3" /> {s.decisions.progress}
                        </span>
                      )}
                      {s.decisions.maintain > 0 && (
                        <span className="text-yellow-400 flex items-center gap-0.5">
                          <Minus className="w-3 h-3" /> {s.decisions.maintain}
                        </span>
                      )}
                      {s.decisions.deload > 0 && (
                        <span className="text-red-400 flex items-center gap-0.5">
                          <TrendingDown className="w-3 h-3" /> {s.decisions.deload}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </motion.button>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
}
