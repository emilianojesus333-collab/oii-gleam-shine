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

const monthAbbr = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const CHIP_COLORS: Record<string, { bg: string; color: string }> = {
  Peito: { bg: "rgba(96,165,250,0.15)", color: "#60A5FA" },
  Costas: { bg: "rgba(167,139,250,0.15)", color: "#A78BFA" },
  Pernas: { bg: "rgba(52,211,153,0.15)", color: "#34D399" },
  Ombros: { bg: "rgba(251,191,36,0.15)", color: "#FBBF24" },
  Bíceps: { bg: "rgba(248,113,113,0.15)", color: "#F87171" },
  Tríceps: { bg: "rgba(251,146,60,0.15)", color: "#FB923C" },
  Abdominais: { bg: "rgba(34,211,238,0.15)", color: "#22D3EE" },
  Glúteos: { bg: "rgba(232,121,249,0.15)", color: "#E879F9" },
  Cardio: { bg: "rgba(251,191,36,0.15)", color: "#FBBF24" },
};

const REST_CHIP = { bg: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" };
const DEFAULT_CHIP = { bg: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" };

function getChipStyle(name: string) {
  return CHIP_COLORS[name] || DEFAULT_CHIP;
}

interface DayEntry {
  fullDay: string;
  dateNum: number;
  monthAbbr: string;
  muscles: string[];
  isRest: boolean;
}

export const UpcomingWorkouts = () => {
  const { settings } = useUserSettings();

  const nextDays = useMemo<DayEntry[]>(() => {
    const schedule = settings?.onboarding_data?.schedule || {};
    const today = new Date();
    const result: DayEntry[] = [];

    for (let i = 1; i <= 3; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayName = weekDaysMap[d.getDay()];
      const groups = schedule[dayName] || null;
      const muscles: string[] = groups
        ? Array.isArray(groups) ? groups : [groups]
        : [];
      const isRest = muscles.length === 0 || (muscles.length === 1 && muscles[0] === "Descanso");

      result.push({
        fullDay: dayName,
        dateNum: d.getDate(),
        monthAbbr: monthAbbr[d.getMonth()],
        muscles: isRest ? [] : muscles,
        isRest,
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
      style={{ background: "#1A1A1A", borderRadius: 0, border: "none", borderBottom: "1px solid #2A2A2A", padding: "20px 16px", width: "100%", margin: 0 }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 900, color: "#fff", marginBottom: 16 }}>
        Próximos treinos
      </h2>

      <div style={{ position: "relative", paddingLeft: 52 }}>
        {/* Vertical line */}
        <div
          style={{
            position: "absolute",
            left: 17,
            top: 12,
            bottom: 12,
            width: 1.5,
            background: "rgba(255,255,255,0.08)",
          }}
        />

        {nextDays.map((day, index) => (
          <motion.div
            key={day.fullDay}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.55 + index * 0.08 }}
            style={{
              position: "relative",
              paddingBottom: index < 2 ? 24 : 0,
            }}
          >
            {/* Dot */}
            <div
              style={{
                position: "absolute",
                left: -35,
                top: 4,
                width: 10,
                height: 10,
                borderRadius: "50%",
                border: index === 0 ? "2px solid #60A5FA" : "2px solid rgba(255,255,255,0.2)",
                background: index === 0 ? "#60A5FA" : "#000000",
                boxShadow: index === 0 ? "0 0 8px rgba(96,165,250,0.5)" : "none",
              }}
            />

            {/* Content */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>
                  {day.fullDay}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)" }}>
                  {day.dateNum} {day.monthAbbr}
                </span>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {day.isRest ? (
                  <span
                    style={{
                      padding: "3px 9px",
                      borderRadius: 20,
                      fontSize: 10,
                      fontWeight: 700,
                      background: REST_CHIP.bg,
                      color: REST_CHIP.color,
                    }}
                  >
                    Descanso
                  </span>
                ) : (
                  day.muscles.map((m) => {
                    const s = getChipStyle(m);
                    return (
                      <span
                        key={m}
                        style={{
                          padding: "3px 9px",
                          borderRadius: 20,
                          fontSize: 10,
                          fontWeight: 700,
                          background: s.bg,
                          color: s.color,
                        }}
                      >
                        {m}
                      </span>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
