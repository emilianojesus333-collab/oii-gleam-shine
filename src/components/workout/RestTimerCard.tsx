import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Check } from "lucide-react";
import { useTimerNotification } from "@/hooks/useTimerNotification";
import { toast } from "sonner";
import type { ExerciseLog } from "@/data/workoutHistory";

const CIRCUMFERENCE = 2 * Math.PI * 68; // ≈ 427.26

const PRESETS = [30, 60, 90, 120, 180, 300];
const PRESET_LABELS = ["30s", "1min", "1.5min", "2min", "3min", "5min"];

function computeRest(weight: number, reps: number) {
  const base = 60;
  const weightMod = weight > 50 ? 30 : weight >= 20 ? 15 : 0;
  const repsMod = reps <= 6 ? 30 : reps <= 12 ? 15 : 0;
  return { base, weightMod, repsMod, total: base + weightMod + repsMod };
}

function nearestPreset(seconds: number): number {
  return PRESETS.reduce((prev, curr) =>
    Math.abs(curr - seconds) < Math.abs(prev - seconds) ? curr : prev
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface RestTimerCardProps {
  savedExercises: ExerciseLog[];
  trainingType: string;
  userId?: string;
  autoStartTrigger?: number;
}

const CARD_STYLE: React.CSSProperties = {
  background: "#1A1A1A",
  borderRadius: 0,
  border: "none",
  borderBottom: "1px solid #2A2A2A",
  width: "100%",
};

export const RestTimerCard = ({ savedExercises, trainingType, userId, autoStartTrigger = 0 }: RestTimerCardProps) => {
  const lastEx = savedExercises.length > 0 ? savedExercises[savedExercises.length - 1] : null;
  const lastWeight = lastEx?.weight ?? 30;
  const lastReps = lastEx?.reps ?? 8;

  const { base, weightMod, repsMod, total } = computeRest(lastWeight, lastReps);
  const defaultPreset = nearestPreset(total);

  const [selectedPreset, setSelectedPreset] = useState(defaultPreset);
  const [timeRemaining, setTimeRemaining] = useState(defaultPreset);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const { notifyTimerEnd } = useTimerNotification();
  const hasNotifiedRef = useRef(false);
  const STORAGE_KEY = userId ? `liftmate_rest_timer_${userId}` : null;

  // Sync default preset when savedExercises changes (new exercise saved)
  useEffect(() => {
    if (!isRunning && !isFinished) {
      const newPreset = nearestPreset(total);
      setSelectedPreset(newPreset);
      setTimeRemaining(newPreset);
    }
  }, [lastWeight, lastReps]);

  // Restore timer from localStorage on mount
  useEffect(() => {
    if (!STORAGE_KEY) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const { startTime, duration, isActive } = JSON.parse(raw);
      if (!isActive || !startTime || !duration) return;
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = duration - elapsed;
      if (remaining > 0) {
        setSelectedPreset(duration);
        setTimeRemaining(remaining);
        setIsRunning(true);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch { /* ignore */ }
  }, []);

  // Persist timer state
  useEffect(() => {
    if (!STORAGE_KEY) return;
    if (isRunning) {
      const startTime = Date.now() - ((selectedPreset - timeRemaining) * 1000);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ startTime, duration: selectedPreset, isActive: true }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [isRunning, timeRemaining, selectedPreset]);

  // Countdown
  useEffect(() => {
    if (!isRunning) return;
    hasNotifiedRef.current = false;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          setIsFinished(true);
          if (!hasNotifiedRef.current) {
            hasNotifiedRef.current = true;
            notifyTimerEnd();
            toast.success("Tempo de descanso terminado!");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, notifyTimerEnd]);

  const handlePreset = (seconds: number) => {
    setSelectedPreset(seconds);
    setTimeRemaining(seconds);
    setIsRunning(false);
    setIsFinished(false);
  };

  const handleMainButton = () => {
    if (isFinished) {
      setIsFinished(false);
      setTimeRemaining(selectedPreset);
    } else if (isRunning) {
      setIsRunning(false);
    } else {
      setIsRunning(true);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsFinished(false);
    setTimeRemaining(selectedPreset);
    if (STORAGE_KEY) localStorage.removeItem(STORAGE_KEY);
  };

  const progress = selectedPreset > 0 ? timeRemaining / selectedPreset : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  // Main button appearance
  let mainBg = "#2563EB";
  let mainColor = "white";
  let mainBorder = "none";
  let mainHeight: number | string = 36;
  let mainIcon = <Play size={16} />;
  let mainLabel = "▷ Iniciar descanso";
  if (isRunning) {
    mainHeight = 50;
    mainBg = "rgba(239,68,68,0.15)";
    mainColor = "#F87171";
    mainBorder = "1px solid rgba(239,68,68,0.25)";
    mainIcon = <Pause size={16} />;
    mainLabel = "Pausar";
  } else if (isFinished) {
    mainHeight = 50;
    mainBg = "rgba(74,222,128,0.15)";
    mainColor = "#4ADE80";
    mainBorder = "1px solid rgba(74,222,128,0.25)";
    mainIcon = <Check size={16} />;
    mainLabel = "Concluído";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* ── SECTION 1: Cálculo do Descanso ── */}
      <div style={{ ...CARD_STYLE, padding: "16px 18px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "white" }}>Cálculo do Descanso</span>
          <span style={{
            background: "rgba(37,99,235,0.15)",
            color: "#60A5FA",
            fontSize: 11,
            fontWeight: 700,
            padding: "5px 10px",
            borderRadius: 20,
            border: "1px solid rgba(37,99,235,0.25)",
          }}>
            {trainingType}
          </span>
        </div>

        {/* Breakdown rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          {/* Base */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.30)", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.50)" }}>Tempo base</span>
            </div>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.50)", fontWeight: 700 }}>{base}s</span>
          </div>

          {/* Weight */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#60A5FA", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.70)" }}>Peso ({lastWeight}kg)</span>
            </div>
            <span style={{ fontSize: 13, color: "#60A5FA", fontWeight: 700 }}>+{weightMod}s</span>
          </div>

          {/* Reps */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#FBBF24", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.70)" }}>Repetições ({lastReps})</span>
            </div>
            <span style={{ fontSize: 13, color: "#FBBF24", fontWeight: 700 }}>+{repsMod}s</span>
          </div>
        </div>

        {/* Separator + total */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>Total recomendado</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: "#60A5FA", letterSpacing: "-0.02em" }}>{total}s</span>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: Timer Circular ── */}
      <div style={{ ...CARD_STYLE, padding: "24px 20px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Circular timer */}
        <div style={{ position: "relative", width: 160, height: 160, marginBottom: 20 }}>
          <svg width="160" height="160" viewBox="0 0 160 160">
            {/* Background ring */}
            <circle
              cx="80" cy="80" r="68"
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="10"
            />
            {/* Progress ring */}
            <circle
              cx="80" cy="80" r="68"
              fill="none"
              stroke={isFinished ? "#4ADE80" : "#2563EB"}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 80 80)"
              style={{ transition: isRunning ? "stroke-dashoffset 1s linear" : "stroke-dashoffset 0.2s ease" }}
            />
          </svg>
          {/* Center text */}
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <span style={{
              fontSize: 36,
              fontWeight: 900,
              color: "white",
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}>
              {formatTime(timeRemaining)}
            </span>
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              color: "rgba(255,255,255,0.30)",
              marginTop: 2,
            }}>
              restante
            </span>
          </div>
        </div>

        {/* Preset pills */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 6, marginBottom: 16 }}>
          {PRESETS.map((sec, i) => {
            const active = selectedPreset === sec;
            return (
              <button
                key={sec}
                type="button"
                onClick={() => handlePreset(sec)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  background: active ? "rgba(37,99,235,0.15)" : "rgba(255,255,255,0.04)",
                  border: active ? "1px solid rgba(37,99,235,0.3)" : "1px solid rgba(255,255,255,0.07)",
                  color: active ? "#60A5FA" : "rgba(255,255,255,0.30)",
                  transition: "all 0.15s",
                }}
              >
                {PRESET_LABELS[i]}
              </button>
            );
          })}
        </div>

        {/* Button row */}
        <div style={{ display: "flex", gap: 10, width: "100%" }}>
          <button
            type="button"
            onClick={handleMainButton}
            style={{
              flex: 1,
              height: mainHeight,
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              background: mainBg,
              color: mainColor,
              border: mainBorder,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.15s",
            }}
          >
            {mainIcon}
            {mainLabel}
          </button>
          <button
            type="button"
            onClick={handleReset}
            style={{
              width: 50,
              height: 50,
              borderRadius: 12,
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.07)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <RotateCcw size={18} color="rgba(255,255,255,0.50)" />
          </button>
        </div>
      </div>
    </div>
  );
};
