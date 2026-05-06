import { useMemo } from "react";
import { motion } from "framer-motion";
import { useUserSettings } from "@/hooks/useUserSettings";

const weekDaysMap: Record<number, string> = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
};

const dayAbbr: Record<string, string> = {
  "Domingo": "DOM",
  "Segunda-feira": "SEG",
  "Terça-feira": "TER",
  "Quarta-feira": "QUA",
  "Quinta-feira": "QUI",
  "Sexta-feira": "SEX",
  "Sábado": "SÁB",
};

const muscleColor: Record<string, string> = {
  "Peito":    "#60A5FA",
  "Costas":   "#A78BFA",
  "Pernas":   "#4ADE80",
  "Ombros":   "#FBBF24",
  "Bíceps":   "#F87171",
  "Tríceps":  "#FB923C",
  "Core":     "#EC4899",
};

function getMuscleColor(muscle: string): string {
  const key = Object.keys(muscleColor).find(k =>
    muscle.toLowerCase().includes(k.toLowerCase())
  );
  return muscleColor[key ?? ""] ?? "#60A5FA";
}

function getIntensity(muscles: string[]): number {
  if (muscles.length === 0 || (muscles.length === 1 && muscles[0] === "Descanso")) return 0;
  const joined = muscles.join(" ").toLowerCase();
  if (joined.includes("perna") || joined.includes("full")) return 90;
  if (joined.includes("cardio")) return 70;
  if (joined.includes("peito") || joined.includes("costas")) return 75;
  if (joined.includes("ombro") || joined.includes("bícep") || joined.includes("trícep")) return 60;
  return 65;
}

function getBarColor(muscles: string[]): string {
  if (muscles.length === 0 || (muscles.length === 1 && muscles[0] === "Descanso"))
    return "rgba(255,255,255,0.15)";
  return getMuscleColor(muscles[0]);
}

interface DayCard {
  abbr: string;
  dayNum: number;
  muscles: string[];
  isRest: boolean;
  isToday: boolean;
  intensity: number;
  barColor: string;
}

export const UpcomingWorkouts = () => {
  const { settings } = useUserSettings();

  const weeklyWorkoutCount = useMemo(() => {
    const schedule = settings?.onboarding_data?.schedule || {};
    return Object.values(schedule).filter((v) => {
      const muscles = Array.isArray(v) ? v : [v];
      return muscles.length > 0 && !(muscles.length === 1 && muscles[0] === "Descanso");
    }).length;
  }, [settings]);

  const days = useMemo<DayCard[]>(() => {
    const schedule = settings?.onboarding_data?.schedule || {};
    const today = new Date();
    const result: DayCard[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayName = weekDaysMap[d.getDay()];
      const groups = schedule[dayName] || null;
      const muscles: string[] = groups
        ? Array.isArray(groups) ? groups : [groups]
        : [];
      const isRest =
        muscles.length === 0 ||
        (muscles.length === 1 && muscles[0] === "Descanso");

      result.push({
        abbr: dayAbbr[dayName] ?? dayName.slice(0, 3).toUpperCase(),
        dayNum: d.getDate(),
        muscles,
        isRest,
        isToday: i === 0,
        intensity: getIntensity(muscles),
        barColor: getBarColor(muscles),
      });
    }
    return result;
  }, [settings]);

  if (!settings?.onboarding_data?.schedule) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      style={{ marginBottom: 24 }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.12em",
          color: "rgba(255,255,255,0.25)",
          textTransform: "uppercase",
          marginBottom: 6,
          paddingLeft: 16,
        }}
      >
        PRÓXIMOS TREINOS
      </div>

      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontWeight: 500, marginBottom: 10, paddingLeft: 16 }}>
        {weeklyWorkoutCount} treinos planeados esta semana — mantém o ritmo.
      </p>

      <div
        style={{
          display: "flex",
          gap: 10,
          overflowX: "auto",
          padding: "0 16px 12px",
          scrollbarWidth: "none",
          // @ts-ignore
          WebkitScrollbar: "none",
        }}
        className="hide-scrollbar"
      >
        <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>

        {days.map((day, i) => (
          <motion.div
            key={day.abbr + day.dayNum}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.55 + i * 0.06 }}
            style={{
              minWidth: 140,
              flexShrink: 0,
              background: day.isToday
                ? "linear-gradient(135deg, #1E3A8A, #1D4ED8)"
                : "#141414",
              border: `1px solid ${day.isToday ? "rgba(96,165,250,0.3)" : "rgba(255,255,255,0.06)"}`,
              borderRadius: 20,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {/* Abreviação do dia */}
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: day.isToday ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)",
            }}>
              {day.abbr}
            </span>

            {/* Número do dia */}
            <span style={{
              fontSize: 28,
              fontWeight: 900,
              color: "white",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}>
              {day.dayNum}
            </span>

            {/* Músculos */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {day.isRest ? (
                <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.3)" }}>
                  Descanso
                </span>
              ) : (
                day.muscles.map((m, mi) => (
                  <div key={mi} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.3)",
                      flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "white" }}>{m}</span>
                  </div>
                ))
              )}
            </div>

            {/* Barra de intensidade */}
            <div style={{ marginTop: "auto" }}>
              <div style={{
                fontSize: 9,
                fontWeight: 600,
                color: "rgba(255,255,255,0.3)",
                marginBottom: 4,
                letterSpacing: "0.08em",
              }}>
                INTENSIDADE
              </div>
              <div style={{
                height: 3,
                background: "rgba(255,255,255,0.08)",
                borderRadius: 2,
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%",
                  width: `${day.intensity}%`,
                  background: day.isToday ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.25)",
                  borderRadius: 2,
                  transition: "width 0.6s ease",
                }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
