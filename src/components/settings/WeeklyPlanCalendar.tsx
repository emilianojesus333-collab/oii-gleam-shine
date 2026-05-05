import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useUserSettings } from "@/hooks/useUserSettings";

// ── Types ────────────────────────────────────────────────────────────────────

type Level = 1 | 2;

interface MuscleEntry {
  name: string;
  level: Level;
}

// ── Constants ────────────────────────────────────────────────────────────────

const LEVEL_COLOR: Record<Level, string> = {
  1: "#F87171",
  2: "#FBBF24",
};

const LEVEL_BG: Record<Level, string> = {
  1: "rgba(248,113,113,0.15)",
  2: "rgba(251,191,36,0.15)",
};

const LEVEL_BORDER: Record<Level, string> = {
  1: "rgba(248,113,113,0.3)",
  2: "rgba(251,191,36,0.3)",
};

const LEVEL_LABEL: Record<Level, string> = {
  1: "Músculo principal",
  2: "Músculo secundário",
};

const DAYS_FULL = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];

const DAYS_SHORT: Record<string, string> = {
  "Segunda-feira": "Segunda",
  "Terça-feira": "Terça",
  "Quarta-feira": "Quarta",
  "Quinta-feira": "Quinta",
  "Sexta-feira": "Sexta",
  "Sábado": "Sábado",
  "Domingo": "Domingo",
};

const COLUMNS: { header: string; muscles: MuscleEntry[] }[] = [
  {
    header: "Superior",
    muscles: [
      { name: "Peito", level: 1 },
      { name: "Ombros", level: 2 },
    ],
  },
  {
    header: "Posterior",
    muscles: [
      { name: "Costas", level: 1 },
      { name: "Trapézio", level: 2 },
      { name: "Lombar", level: 2 },
    ],
  },
  {
    header: "Core",
    muscles: [
      { name: "Abdominais", level: 2 },
    ],
  },
  {
    header: "Inferior",
    muscles: [
      { name: "Quadríceps", level: 1 },
      { name: "Posteriores", level: 1 },
      { name: "Glúteos", level: 1 },
      { name: "Panturrilhas", level: 2 },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export const WeeklyPlanCalendar = () => {
  const { settings, updateSchedule } = useUserSettings();

  // muscle name → full day name (e.g. "Peito" → "Segunda-feira")
  const [muscleDay, setMuscleDay] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<MuscleEntry | null>(null);
  const [saving, setSaving] = useState(false);

  // Load existing schedule on mount — invert day→muscles[] to muscle→day
  useEffect(() => {
    if (!settings?.onboarding_data?.schedule) return;
    const raw = settings.onboarding_data.schedule as Record<string, string | string[]>;
    const map: Record<string, string> = {};

    for (const [key, value] of Object.entries(raw)) {
      // Support both muscle→day format AND legacy day→muscles[] format
      if (DAYS_FULL.includes(key)) {
        // Legacy: day → muscles[]
        const muscles = Array.isArray(value) ? value : [value];
        for (const m of muscles) {
          if (typeof m === "string") map[m] = key;
        }
      } else {
        // New: muscle → day
        if (typeof value === "string") map[key] = value;
      }
    }
    setMuscleDay(map);
  }, [settings]);

  // Convert muscle→day map to day→muscles[] and save
  const saveAll = async (nextMap: Record<string, string>) => {
    setSaving(true);
    try {
      const dayMuscles: Record<string, string[]> = {};
      for (const [muscle, day] of Object.entries(nextMap)) {
        if (!dayMuscles[day]) dayMuscles[day] = [];
        dayMuscles[day].push(muscle);
      }
      await updateSchedule(dayMuscles);
    } catch {
      toast.error("Erro ao guardar.");
    } finally {
      setSaving(false);
    }
  };

  const handleSelectDay = async (day: string) => {
    if (!selected) return;
    const muscleName = selected.name;

    const nextMap = { ...muscleDay };
    if (nextMap[muscleName] === day) {
      // Tapping same day → remove
      delete nextMap[muscleName];
    } else {
      nextMap[muscleName] = day;
    }

    setMuscleDay(nextMap);
    setSelected(null);
    await saveAll(nextMap);
    toast.success(`${muscleName} guardado!`);
  };

  const handleRemove = async () => {
    if (!selected) return;
    const muscleName = selected.name;
    const nextMap = { ...muscleDay };
    delete nextMap[muscleName];
    setMuscleDay(nextMap);
    setSelected(null);
    await saveAll(nextMap);
    toast.success(`${muscleName} removido.`);
  };

  return (
    <>
      {/* Section wrapper */}
      <div
        style={{
          background: "#1A1A1A",
          borderRadius: 0,
          border: "none",
          borderBottom: "1px solid #2A2A2A",
          width: "100%",
          margin: 0,
          paddingBottom: 0,
        }}
      >
        {/* Title area */}
        <div style={{ padding: "20px 16px 0" }}>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: "#fff", marginBottom: 4 }}>
            Plano Semanal
          </h3>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 0 }}>
            Toca num músculo para atribuir o dia de treino
          </p>

          {/* Legend */}
          <div style={{ display: "flex", gap: 16, padding: "12px 0" }}>
            {([
              { color: "#F87171", label: "Principal" },
              { color: "#FBBF24", label: "Secundário" },
            ] as const).map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: item.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Table */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
          }}
        >
          {/* Column headers */}
          {COLUMNS.map((col, ci) => (
            <div
              key={col.header}
              style={{
                padding: "8px 4px",
                textAlign: "center",
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.45)",
                borderBottom: "1px solid #2A2A2A",
                borderRight: ci < COLUMNS.length - 1 ? "1px solid #2A2A2A" : "none",
              }}
            >
              {col.header}
            </div>
          ))}

          {/* Muscle cells — render row by row up to max 5 rows */}
          {Array.from({ length: 5 }).map((_, rowIdx) =>
            COLUMNS.map((col, ci) => {
              const entry = col.muscles[rowIdx];
              if (!entry) {
                // Empty filler cell
                return (
                  <div
                    key={`empty-${ci}-${rowIdx}`}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      borderRight: ci < COLUMNS.length - 1 ? "1px solid #2A2A2A" : "none",
                    }}
                  />
                );
              }

              const assignedDay = muscleDay[entry.name];
              const levelColor = LEVEL_COLOR[entry.level];
              const isSelected = selected?.name === entry.name;

              return (
                <motion.button
                  key={entry.name}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelected(isSelected ? null : entry)}
                  style={{
                    padding: "13px 6px",
                    minHeight: 58,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 5,
                    textAlign: "center",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    borderRight: ci < COLUMNS.length - 1 ? "1px solid #2A2A2A" : "none",
                    cursor: "pointer",
                    background: isSelected ? "rgba(255,255,255,0.04)" : "transparent",
                    transition: "background 0.15s ease",
                  }}
                >
                  {/* Muscle name */}
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: assignedDay ? levelColor : "#fff",
                      transition: "color 0.2s ease",
                      lineHeight: 1.2,
                    }}
                  >
                    {entry.name}
                  </span>

                  {/* Day tag */}
                  <AnimatePresence>
                    {assignedDay && (
                      <motion.span
                        key={assignedDay}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          padding: "2px 7px",
                          borderRadius: 20,
                          color: levelColor,
                          background: LEVEL_BG[entry.level],
                          border: `1px solid ${LEVEL_BORDER[entry.level]}`,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {DAYS_SHORT[assignedDay]}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom sheet overlay */}
      <AnimatePresence>
        {selected && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelected(null)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.75)",
                zIndex: 40,
              }}
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                background: "#1A1A1A",
                borderRadius: "20px 20px 0 0",
                paddingBottom: 32,
                zIndex: 50,
              }}
            >
              {/* Handle */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  paddingTop: 12,
                  paddingBottom: 8,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 4,
                    borderRadius: 2,
                    background: "rgba(255,255,255,0.15)",
                  }}
                />
              </div>

              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  padding: "4px 20px 16px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 900,
                      color: LEVEL_COLOR[selected.level],
                      lineHeight: 1.2,
                    }}
                  >
                    {selected.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: LEVEL_COLOR[selected.level],
                      opacity: 0.7,
                      marginTop: 2,
                    }}
                  >
                    {LEVEL_LABEL[selected.level]}
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.07)",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <X size={14} color="rgba(255,255,255,0.5)" />
                </button>
              </div>

              {/* Day options */}
              <div>
                {DAYS_FULL.map((day, i) => {
                  const isChosen = muscleDay[selected.name] === day;
                  const levelColor = LEVEL_COLOR[selected.level];
                  return (
                    <motion.button
                      key={day}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => !saving && handleSelectDay(day)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "14px 20px",
                        borderBottom:
                          i < DAYS_FULL.length - 1
                            ? "1px solid rgba(255,255,255,0.05)"
                            : "none",
                        background: "transparent",
                        cursor: "pointer",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: isChosen ? levelColor : "#fff",
                        }}
                      >
                        {day}
                      </span>
                      {isChosen && (
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: levelColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path
                              d="M1 3.5L3.8 6.5L9 1"
                              stroke="#000"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Remove button */}
              {muscleDay[selected.name] && (
                <div style={{ padding: "12px 20px 0" }}>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => !saving && handleRemove()}
                    style={{
                      width: "100%",
                      padding: "13px 0",
                      background: "rgba(248,113,113,0.1)",
                      color: "#F87171",
                      border: "1px solid rgba(248,113,113,0.2)",
                      borderRadius: 12,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Remover dia atribuído
                  </motion.button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
