import { useMemo } from "react";
import { Check, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getWorkoutHistory, type WorkoutSession, type ExerciseLog } from "@/data/workoutHistory";
import { useMuscleFatigue } from "@/hooks/useMuscleFatigue";

const PT_DAYS: Record<string, string> = {
  Sunday: "Domingo",
  Monday: "Segunda-feira",
  Tuesday: "Terça-feira",
  Wednesday: "Quarta-feira",
  Thursday: "Quinta-feira",
  Friday: "Sexta-feira",
  Saturday: "Sábado",
};

const DAY_NAMES = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

function daysAgo(dateStr: string): number {
  const sessionDate = new Date(dateStr);
  sessionDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((today.getTime() - sessionDate.getTime()) / 86400000);
}

function estimateDuration(logs: ExerciseLog[]): number {
  const totalSets = logs.reduce((s, l) => s + (l.sets || 0), 0);
  const totalRestSec = logs.reduce((s, l) => s + (l.restTime || 0) * (l.sets || 1), 0);
  return Math.max(1, Math.round((totalSets * 45 + totalRestSec) / 60));
}

function totalVolume(logs: ExerciseLog[]): number {
  return logs.reduce((s, l) => s + (l.weight || 0) * (l.reps || 0) * (l.sets || 0), 0);
}

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${kg}kg`;
}

function sharesMusclGroup(session: WorkoutSession, groups: string[]): boolean {
  const lower = groups.map((g) => g.toLowerCase());
  return session.muscleGroups.some((m) => lower.includes(m.toLowerCase()));
}

interface LastSessionCardProps {
  todayMuscleGroups: string[];
  userId?: string;
}

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.30)",
  marginBottom: 14,
  display: "block",
};

const STAT_LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "rgba(255,255,255,0.30)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginTop: 3,
  display: "block",
};

const CARD: React.CSSProperties = {
  background: "#1A1A1A",
  borderRadius: 0,
  border: "none",
  borderBottom: "1px solid #2A2A2A",
  padding: "18px 16px",
  width: "100%",
};

export const LastSessionCard = ({ todayMuscleGroups, userId }: LastSessionCardProps) => {
  const navigate = useNavigate();
  const { muscles } = useMuscleFatigue();

  const { lastSession, prevSession, prSet } = useMemo(() => {
    const history = getWorkoutHistory(userId);
    const today = new Date().toISOString().split("T")[0];

    // All sessions for today's muscle groups, excluding today
    const relevant = history.sessions.filter(
      (s) => s.date !== today && sharesMusclGroup(s, todayMuscleGroups)
    );

    if (relevant.length === 0) return { lastSession: null, prevSession: null, prSet: new Set<string>() };

    const last = relevant[0]; // already sorted descending
    const prev = relevant[1] ?? null;

    // PR detection: for each exercise in last session, check if weight > max in all earlier sessions
    const allEarlier = history.sessions.filter((s) => s.date < last.date);
    const historicMax: Record<string, number> = {};
    for (const s of allEarlier) {
      for (const log of s.exerciseLogs ?? []) {
        const key = log.name.toLowerCase();
        historicMax[key] = Math.max(historicMax[key] ?? 0, log.weight);
      }
    }

    const prSet = new Set<string>();
    for (const log of last.exerciseLogs ?? []) {
      const key = log.name.toLowerCase();
      if (log.weight > 0 && (historicMax[key] === undefined || log.weight > historicMax[key])) {
        prSet.add(key);
      }
    }

    return { lastSession: last, prevSession: prev, prSet };
  }, [userId, todayMuscleGroups]);

  // Recovery badge: use fatigue for first muscle group
  const recoveryBadge = useMemo(() => {
    if (!lastSession || muscles.length === 0) return null;
    const firstGroup = lastSession.muscleGroups[0]?.toLowerCase() ?? "";
    const entry = muscles.find((m) => m.muscle_group === firstGroup || firstGroup.startsWith(m.muscle_group));
    if (!entry) return null;
    const fatigue = entry.fatigue_pct;
    if (fatigue <= 20) return { label: "Recuperado", bg: "rgba(74,222,128,0.12)", color: "#4ADE80", border: "1px solid rgba(74,222,128,0.2)", showCheck: true };
    if (fatigue <= 75) return { label: "Recuperando", bg: "rgba(251,191,36,0.12)", color: "#FBBF24", border: "1px solid rgba(251,191,36,0.2)", showCheck: false };
    return { label: "Fatigado", bg: "rgba(248,113,113,0.12)", color: "#F87171", border: "1px solid rgba(248,113,113,0.2)", showCheck: false };
  }, [lastSession, muscles]);

  // Empty state
  if (!lastSession) {
    return (
      <div style={CARD}>
        <span style={SECTION_LABEL}>ÚLTIMA SESSÃO · {todayMuscleGroups[0]?.toUpperCase() ?? "—"}</span>
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <p style={{ fontSize: 15, fontWeight: 900, color: "white", marginBottom: 6 }}>
            Sem sessões anteriores
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.30)", marginBottom: 18 }}>
            Ainda não tens registos para este grupo muscular
          </p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            style={{
              padding: "12px 20px",
              background: "rgba(37,99,235,0.15)",
              border: "1px solid rgba(37,99,235,0.3)",
              borderRadius: 12,
              color: "#60A5FA",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Registar primeiro treino
          </button>
        </div>
      </div>
    );
  }

  const logs: ExerciseLog[] = lastSession.exerciseLogs ?? [];
  const totalSets = logs.reduce((s, l) => s + (l.sets || 0), 0);
  const vol = totalVolume(logs);
  const duration = estimateDuration(logs);
  const days = daysAgo(lastSession.date);
  const dayName = lastSession.dayOfWeek ? (PT_DAYS[lastSession.dayOfWeek] ?? lastSession.dayOfWeek) : DAY_NAMES[new Date(lastSession.date).getDay()];

  const prevVol = prevSession ? totalVolume(prevSession.exerciseLogs ?? []) : null;
  const volDiff = prevVol && prevVol > 0 ? Math.round(((vol - prevVol) / prevVol) * 100) : null;
  const volBarWidth = volDiff !== null ? Math.min(100, Math.abs(volDiff)) : 0;

  return (
    <div style={CARD}>
      {/* Section label */}
      <span style={SECTION_LABEL}>
        ÚLTIMA SESSÃO · {lastSession.muscleGroups[0]?.toUpperCase() ?? "—"}
      </span>

      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: "white", letterSpacing: "-0.01em" }}>
            {lastSession.muscleGroups.join(" · ")}
          </span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.30)", fontWeight: 500 }}>
            há {days} {days === 1 ? "dia" : "dias"} · {dayName}
          </span>
        </div>

        {recoveryBadge && (
          <span style={{
            background: recoveryBadge.bg,
            color: recoveryBadge.color,
            border: recoveryBadge.border,
            fontSize: 11,
            fontWeight: 700,
            padding: "5px 11px",
            borderRadius: 20,
            display: "flex",
            alignItems: "center",
            gap: 5,
            flexShrink: 0,
          }}>
            {recoveryBadge.showCheck && <Check size={10} />}
            {recoveryBadge.label}
          </span>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[
          { value: logs.length, label: "Exercícios" },
          { value: totalSets, label: "Séries" },
          { value: formatVolume(vol), label: "Volume" },
          { value: `${duration}min`, label: "Duração" },
        ].map((stat) => (
          <div key={stat.label} style={{
            flex: 1,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12,
            padding: 10,
          }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: "white", letterSpacing: "-0.02em", lineHeight: 1, display: "block" }}>
              {stat.value}
            </span>
            <span style={STAT_LABEL}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Progression row — only if we have a previous session to compare */}
      {volDiff !== null && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 12px",
          background: "rgba(255,255,255,0.04)",
          borderRadius: 10,
          marginBottom: 14,
        }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.30)", fontWeight: 500, flex: 1, whiteSpace: "nowrap" }}>
            Volume vs sessão anterior
          </span>
          <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${volBarWidth}%`,
              background: volDiff >= 0 ? "#4ADE80" : "#F87171",
              borderRadius: 2,
              transition: "width 0.4s ease",
            }} />
          </div>
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            color: volDiff >= 0 ? "#4ADE80" : "#F87171",
            whiteSpace: "nowrap",
          }}>
            {volDiff >= 0 ? "+" : ""}{volDiff}%
          </span>
        </div>
      )}

      {/* Exercises label */}
      <span style={{ ...SECTION_LABEL, marginBottom: 8 }}>EXERCÍCIOS</span>

      {/* Exercises list */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {logs.map((log, i) => {
          const isPR = prSet.has(log.name.toLowerCase());
          const isLast = i === logs.length - 1;
          return (
            <div key={log.timestamp ?? i} style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "9px 0",
              borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.04)",
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.70)" }}>
                {log.name}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.30)" }}>
                  {log.sets} × {log.weight}kg
                </span>
                {isPR && (
                  <span style={{
                    background: "rgba(251,191,36,0.12)",
                    color: "#FBBF24",
                    border: "1px solid rgba(251,191,36,0.2)",
                    fontSize: 11,
                    fontWeight: 800,
                    padding: "2px 7px",
                    borderRadius: 20,
                  }}>
                    PR
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail button */}
      <button
        type="button"
        onClick={() => navigate("/history")}
        style={{
          width: "100%",
          marginTop: 14,
          padding: 12,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12,
          color: "rgba(255,255,255,0.50)",
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          boxSizing: "border-box",
        }}
      >
        Ver sessão completa
        <ChevronRight size={14} />
      </button>
    </div>
  );
};
