import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Dumbbell } from "lucide-react";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useAuth } from "@/hooks/useAuth";
import { useMuscleFatigue } from "@/hooks/useMuscleFatigue";
import { supabase } from "@/integrations/supabase/client";

interface TodayWorkoutCardProps {
  workout: string | null;
  stimulus: string;
  isRestDay: boolean;
}

function getWorkoutName(workout: string | null, isRestDay: boolean): string {
  if (isRestDay) return "Descanso";
  if (!workout) return "Treino livre";
  const parts = workout.split(/[•+]/).map((s) => s.trim()).filter(Boolean);
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} & ${parts[1]}`;
  return parts.join(" · ");
}

const neutralChip = { bg: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.70)", border: "1px solid rgba(255,255,255,0.15)" };

const recoveryChip = {
  label: "Descanso ou recuperação ativa",
  bg: "rgba(255,255,255,0.07)",
  color: "rgba(255,255,255,0.50)",
  border: "1px solid rgba(255,255,255,0.07)",
};

function getMuscleChips(workout: string | null): { label: string; bg: string; color: string; border?: string }[] {
  if (!workout) return [];
  const parts = workout.split(/[·•+,]/).map((s) => s.trim()).filter(Boolean);
  return parts.map((p) => ({ label: p, ...neutralChip }));
}

export function TodayWorkoutCard({ workout, stimulus, isRestDay }: TodayWorkoutCardProps) {
  const navigate = useNavigate();
  const { settings } = useUserSettings();
  const { user } = useAuth();
  const { muscles } = useMuscleFatigue();
  const [restSignals, setRestSignals] = useState({ consecutiveDays: 0, lastSessionSets: 0 });

  const workoutName = getWorkoutName(workout, isRestDay);
  const muscleChips = getMuscleChips(workout);

  // Fetch consecutive days + last session sets
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - 5);
      const { data } = await supabase
        .from("workout_sessions")
        .select("date, exercise_logs")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("date", since.toISOString().split("T")[0])
        .order("date", { ascending: false });
      if (!data) return;
      let consecutive = 0;
      const today = new Date();
      for (let i = 0; i < 5; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        if (data.some((s) => s.date === d.toISOString().split("T")[0])) consecutive++;
        else break;
      }
      const logs: any[] = data.length > 0 && Array.isArray(data[0].exercise_logs) ? data[0].exercise_logs : [];
      const lastSessionSets = logs.reduce((acc, log) => acc + (Number(log.sets) || 0), 0);
      setRestSignals({ consecutiveDays: consecutive, lastSessionSets });
    })();
  }, [user?.id]);

  const showRecoveryChip = useMemo(() => {
    if (isRestDay) return true;
    const highFatigueCount = muscles.filter((m) => m.current_fatigue > 60).length;
    return (
      highFatigueCount >= 2 ||
      restSignals.consecutiveDays > 4 ||
      restSignals.lastSessionSets > 20
    );
  }, [isRestDay, muscles, restSignals]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      style={{ marginBottom: 16 }}
    >
      {/* Label HOJE */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.15em",
          color: "rgba(255,255,255,0.50)",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        HOJE
      </div>

      {/* Chips de músculos + recuperação — máximo 2 visíveis */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {muscleChips.slice(0, 2).map((chip, i) => (
          <span
            key={i}
            style={{
              padding: "3px 10px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              background: chip.bg,
              color: chip.color,
              border: chip.border,
            }}
          >
            {chip.label}
          </span>
        ))}
        {muscleChips.length > 2 && (
          <span style={{
            padding: "3px 10px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            background: "rgba(255,255,255,0.07)",
            color: "rgba(255,255,255,0.50)",
          }}>
            +{muscleChips.length - 2}
          </span>
        )}
        {showRecoveryChip && (
          <span style={{
            padding: "3px 10px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            background: recoveryChip.bg,
            color: recoveryChip.color,
            border: recoveryChip.border,
          }}>
            {recoveryChip.label}
          </span>
        )}
      </div>


      <motion.button
        whileTap={isRestDay ? {} : { scale: 0.97 }}
        onClick={isRestDay ? undefined : () => navigate("/workout")}
        style={{
          width: "100%",
          margin: "0 0",
          height: 40,
          borderRadius: 100,
          background: "linear-gradient(135deg, #1D4ED8, #2563EB)",
          border: "none",
          color: "white",
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: "0.02em",
          cursor: isRestDay ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          animation: isRestDay ? undefined : "glowBreath 3s ease-in-out infinite",
          opacity: isRestDay ? 0.4 : 1,
          pointerEvents: isRestDay ? "none" : undefined,
        }}
      >
        <Dumbbell style={{ width: 16, height: 16, color: "white" }} />
        Iniciar treino
      </motion.button>
    </motion.div>
  );
}
