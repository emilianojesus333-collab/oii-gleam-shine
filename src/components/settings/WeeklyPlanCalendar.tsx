import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, RotateCcw, Users } from "lucide-react";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────────────

type Side = "front" | "back";
type Gender = "male" | "female";
type Schedule = Record<string, string[] | null>;

interface WeeklyPlanCalendarProps {
  schedule: Schedule;
  onSaveDay: (day: string, muscles: string[] | null) => Promise<void>;
}

interface Muscle {
  id: string;
  label: string;
  color: string;
  frontPath?: string;
  backPath?: string;
}

const DAYS_SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const DAYS_FULL  = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];

// ─── Muscles with precise anatomical SVG paths ───────────────────────────────
// ViewBox: 0 0 200 420 — body centered, proportional

const MUSCLES: Muscle[] = [
  // ── FRONT ──────────────────────────────────────────────────────────────────
  {
    id: "chest",
    label: "Peito",
    color: "#3B82F6",
    frontPath:
      // left pec
      "M 72 110 C 68 107 66 102 68 97 C 70 92 76 89 83 90 C 90 91 96 95 98 101 L 98 118 C 90 122 80 121 72 117 Z" +
      // right pec
      " M 128 110 C 132 107 134 102 132 97 C 130 92 124 89 117 90 C 110 91 104 95 102 101 L 102 118 C 110 122 120 121 128 117 Z",
  },
  {
    id: "shoulders",
    label: "Ombros",
    color: "#8B5CF6",
    frontPath:
      "M 55 103 C 52 97 54 88 60 84 C 67 80 76 82 80 89 L 73 108 C 66 108 60 107 55 103 Z" +
      " M 145 103 C 148 97 146 88 140 84 C 133 80 124 82 120 89 L 127 108 C 134 108 140 107 145 103 Z",
    backPath:
      "M 55 103 C 52 97 54 88 60 84 C 67 80 76 82 80 89 L 73 108 C 66 108 60 107 55 103 Z" +
      " M 145 103 C 148 97 146 88 140 84 C 133 80 124 82 120 89 L 127 108 C 134 108 140 107 145 103 Z",
  },
  {
    id: "biceps",
    label: "Bíceps",
    color: "#EC4899",
    frontPath:
      "M 53 112 C 49 120 48 132 50 143 C 54 143 60 142 63 140 C 64 130 65 120 66 112 Z" +
      " M 147 112 C 151 120 152 132 150 143 C 146 143 140 142 137 140 C 136 130 135 120 134 112 Z",
  },
  {
    id: "forearms",
    label: "Antebraços",
    color: "#06B6D4",
    frontPath:
      "M 50 146 C 47 156 47 170 50 181 L 60 181 C 61 170 62 156 63 146 Z" +
      " M 150 146 C 153 156 153 170 150 181 L 140 181 C 139 170 138 156 137 146 Z",
    backPath:
      "M 50 146 C 47 156 47 170 50 181 L 60 181 C 61 170 62 156 63 146 Z" +
      " M 150 146 C 153 156 153 170 150 181 L 140 181 C 139 170 138 156 137 146 Z",
  },
  {
    id: "abs",
    label: "Abdominais",
    color: "#10B981",
    frontPath:
      // 6 ab blocks in 2 columns
      "M 89 122 L 99 122 L 99 132 L 89 132 Z" +
      " M 101 122 L 111 122 L 111 132 L 101 132 Z" +
      " M 89 134 L 99 134 L 99 144 L 89 144 Z" +
      " M 101 134 L 111 134 L 111 144 L 101 144 Z" +
      " M 89 146 L 99 146 L 99 156 L 89 156 Z" +
      " M 101 146 L 111 146 L 111 156 L 101 156 Z",
  },
  {
    id: "quads",
    label: "Quadríceps",
    color: "#EAB308",
    frontPath:
      "M 78 195 C 76 208 75 228 76 248 L 90 248 C 92 228 93 208 92 195 Z" +
      " M 122 195 C 124 208 125 228 124 248 L 110 248 C 108 228 107 208 108 195 Z",
  },
  {
    id: "calves_front",
    label: "Gémeos",
    color: "#14B8A6",
    frontPath:
      "M 78 255 C 76 265 76 280 78 295 L 89 295 C 90 280 90 265 89 255 Z" +
      " M 122 255 C 124 265 124 280 122 295 L 111 295 C 110 280 110 265 111 255 Z",
  },
  // ── BACK ───────────────────────────────────────────────────────────────────
  {
    id: "traps",
    label: "Trapézios",
    color: "#F59E0B",
    backPath:
      "M 85 88 C 90 83 100 80 100 80 L 100 108 C 93 110 87 108 82 104 Z" +
      " M 115 88 C 110 83 100 80 100 80 L 100 108 C 107 110 113 108 118 104 Z",
  },
  {
    id: "back_upper",
    label: "Dorsais",
    color: "#6366F1",
    backPath:
      "M 68 110 C 66 115 65 125 66 140 L 82 148 C 86 138 88 127 87 115 Z" +
      " M 132 110 C 134 115 135 125 134 140 L 118 148 C 114 138 112 127 113 115 Z",
  },
  {
    id: "rhomboids",
    label: "Rombóides",
    color: "#A855F7",
    backPath:
      "M 85 110 L 100 108 L 115 110 L 115 135 L 100 140 L 85 135 Z",
  },
  {
    id: "lower_back",
    label: "Lombar",
    color: "#84CC16",
    backPath:
      "M 85 145 L 115 145 L 112 175 L 88 175 Z",
  },
  {
    id: "triceps",
    label: "Tríceps",
    color: "#F97316",
    backPath:
      "M 53 112 C 49 120 48 132 50 143 C 54 143 60 142 63 140 C 64 130 65 120 66 112 Z" +
      " M 147 112 C 151 120 152 132 150 143 C 146 143 140 142 137 140 C 136 130 135 120 134 112 Z",
  },
  {
    id: "glutes",
    label: "Glúteos",
    color: "#EF4444",
    backPath:
      "M 72 178 C 70 188 70 202 74 213 C 80 222 91 226 100 226 C 100 226 100 178 100 178 Z" +
      " M 128 178 C 130 188 130 202 126 213 C 120 222 109 226 100 226 C 100 226 100 178 100 178 Z",
  },
  {
    id: "hamstrings",
    label: "Isquiotibiais",
    color: "#D946EF",
    backPath:
      "M 76 230 C 74 243 73 262 75 280 L 90 280 C 91 262 92 243 91 230 Z" +
      " M 124 230 C 126 243 127 262 125 280 L 110 280 C 109 262 108 243 109 230 Z",
  },
  {
    id: "calves_back",
    label: "Gémeos",
    color: "#14B8A6",
    backPath:
      "M 77 285 C 75 296 75 312 77 325 L 89 325 C 90 312 90 296 89 285 Z" +
      " M 123 285 C 125 296 125 312 123 325 L 111 325 C 110 312 110 296 111 285 Z",
  },
];

// ─── SVG Body Silhouettes ────────────────────────────────────────────────────

// Male body — anatomically accurate flat-design silhouette
const MALE_FRONT = `
  M100,28 C91,28 84,35 84,44 C84,53 91,60 100,60 C109,60 116,53 116,44 C116,35 109,28 100,28 Z
  M66,68 C60,70 56,76 54,82 L54,160 C54,163 57,165 60,165 L64,165 L64,188 C64,191 66,193 68,193 L72,193 L72,305 C72,308 74,310 77,310 L88,310 L88,193 L91,193 L91,165 L96,165 L96,193 L96,310 L96,340 C96,343 98,345 100,345 C102,345 104,343 104,340 L104,310 L104,193 L109,193 L109,165 L112,165 L112,193 L113,310 L123,310 C126,310 128,308 128,305 L128,193 L132,193 C134,193 136,191 136,188 L136,165 L140,165 C143,165 146,163 146,160 L146,82 C144,76 140,70 134,68 C126,64 113,61 100,61 C87,61 74,64 66,68 Z
`;

const MALE_BACK = `
  M100,28 C91,28 84,35 84,44 C84,53 91,60 100,60 C109,60 116,53 116,44 C116,35 109,28 100,28 Z
  M66,68 C60,70 56,76 54,82 L54,160 C54,163 57,165 60,165 L64,165 L64,188 C64,191 66,193 68,193 L72,193 L72,300 C72,303 74,305 77,305 L88,305 L88,340 C88,343 90,345 93,345 L96,345 L96,305 L96,225 L100,225 L104,225 L104,305 L104,345 L107,345 C110,345 112,343 112,340 L112,305 L123,305 C126,305 128,303 128,300 L128,193 L132,193 C134,193 136,191 136,188 L136,165 L140,165 C143,165 146,163 146,160 L146,82 C144,76 140,70 134,68 C126,64 113,61 100,61 C87,61 74,64 66,68 Z
`;

const FEMALE_FRONT = `
  M100,28 C92,28 86,34 86,42 C86,50 92,56 100,56 C108,56 114,50 114,42 C114,34 108,28 100,28 Z
  M70,64 C64,66 59,72 57,78 L57,155 C57,158 60,160 63,160 L66,160 L66,180 C66,183 68,185 70,185 L74,185 L74,300 C74,303 76,305 79,305 L88,305 L88,185 L90,185 L90,172 C94,176 97,178 100,178 C103,178 106,176 110,172 L110,185 L112,185 L112,305 L121,305 C124,305 126,303 126,300 L126,185 L130,185 C132,185 134,183 134,180 L134,160 L137,160 C140,160 143,158 143,155 L143,78 C141,72 136,66 130,64 C122,60 112,57 100,57 C88,57 78,60 70,64 Z
  M84,158 C80,164 80,174 84,180 C88,186 100,188 116,180 C120,174 120,164 116,158 C112,152 88,152 84,158 Z
`;

const FEMALE_BACK = `
  M100,28 C92,28 86,34 86,42 C86,50 92,56 100,56 C108,56 114,50 114,42 C114,34 108,28 100,28 Z
  M70,64 C64,66 59,72 57,78 L57,155 C57,158 60,160 63,160 L66,160 L66,180 C66,183 68,185 70,185 L74,185 L74,295 C74,298 76,300 79,300 L88,300 L88,340 C88,343 90,345 93,345 L96,345 L96,300 L96,230 L100,232 L104,230 L104,300 L104,345 L107,345 C110,345 112,343 112,340 L112,300 L121,300 C124,300 126,298 126,295 L126,185 L130,185 C132,185 134,183 134,180 L134,160 L137,160 C140,160 143,158 143,155 L143,78 C141,72 136,66 130,64 C122,60 112,57 100,57 C88,57 78,60 70,64 Z
  M78,208 C75,218 75,232 79,241 C85,252 100,256 100,256 C100,256 115,252 121,241 C125,232 125,218 122,208 C116,198 84,198 78,208 Z
`;

// ─── Component ───────────────────────────────────────────────────────────────

export const WeeklyPlanCalendar = ({ schedule, onSaveDay }: WeeklyPlanCalendarProps) => {
  const [side, setSide] = useState<Side>("front");
  const [gender, setGender] = useState<Gender>("male");
  const [flipping, setFlipping] = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState<Muscle | null>(null);
  const [localSchedule, setLocalSchedule] = useState<Schedule>(schedule);
  const [hovered, setHovered] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const touchX = useRef(0);

  const visibleMuscles = MUSCLES.filter((m) =>
    side === "front" ? !!m.frontPath : !!m.backPath
  );

  const getBodyPath = () => {
    if (gender === "male") return side === "front" ? MALE_FRONT : MALE_BACK;
    return side === "front" ? FEMALE_FRONT : FEMALE_BACK;
  };

  const getMuscleId = (muscle: Muscle) => muscle.label;

  const getMuscleScheduledDays = (muscle: Muscle): string[] => {
    const label = getMuscleId(muscle);
    return DAYS_FULL.filter((d) => localSchedule[d]?.includes(label));
  };

  const isScheduled = (muscle: Muscle) => getMuscleScheduledDays(muscle).length > 0;

  const flipSide = () => {
    if (flipping) return;
    setFlipping(true);
    setSelectedMuscle(null);
    setTimeout(() => {
      setSide((s) => (s === "front" ? "back" : "front"));
      setFlipping(false);
    }, 180);
  };

  const handleMuscleClick = (m: Muscle) => {
    setSelectedMuscle((prev) => (prev?.id === m.id ? null : m));
  };

  const toggleDay = (muscle: Muscle, dayFull: string) => {
    const label = getMuscleId(muscle);
    setLocalSchedule((prev) => {
      const current = prev[dayFull] || [];
      const updated = current.includes(label)
        ? current.filter((x) => x !== label)
        : [...current, label];
      return { ...prev, [dayFull]: updated.length ? updated : null };
    });
  };

  const saveDay = async (muscle: Muscle) => {
    setSaving(true);
    try {
      for (const dayFull of DAYS_FULL) {
        await onSaveDay(dayFull, localSchedule[dayFull] || null);
      }
      toast.success(`${muscle.label} guardado!`);
      setSelectedMuscle(null);
    } catch {
      toast.error("Erro ao guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Controls row */}
      <div className="flex items-center justify-between gap-2">
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={flipSide}
          className="flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-semibold text-white/60"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}
        >
          <RotateCcw size={13} />
          {side === "front" ? "Ver costas" : "Ver frente"}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => { setGender((g) => g === "male" ? "female" : "male"); setSelectedMuscle(null); }}
          className="flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-semibold"
          style={{
            background: gender === "female" ? "rgba(236,72,153,0.12)" : "rgba(99,102,241,0.12)",
            border: `1px solid ${gender === "female" ? "rgba(236,72,153,0.28)" : "rgba(99,102,241,0.28)"}`,
            color: gender === "female" ? "#EC4899" : "#818CF8",
          }}
        >
          <Users size={13} />
          {gender === "male" ? "Masculino" : "Feminino"}
        </motion.button>
      </div>

      {/* Body canvas */}
      <div
        className="relative rounded-3xl overflow-hidden flex items-center justify-center"
        style={{ background: "linear-gradient(160deg, #0D1520 0%, #0A1018 100%)", minHeight: 340 }}
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => { if (Math.abs(touchX.current - e.changedTouches[0].clientX) > 45) flipSide(); }}
      >
        {/* Subtle radial glow behind body */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 55% 60% at 50% 50%, rgba(59,130,246,0.07) 0%, transparent 70%)" }}
        />

        <motion.svg
          viewBox="0 0 200 370"
          className="w-48 relative z-10"
          animate={{ scaleX: flipping ? 0 : 1 }}
          transition={{ duration: 0.18 }}
        >
          {/* Body silhouette */}
          <path
            d={getBodyPath()}
            fill="#152030"
            stroke="#1E3448"
            strokeWidth="1"
          />

          {/* Muscle zones */}
          {visibleMuscles.map((muscle) => {
            const path = side === "front" ? muscle.frontPath : muscle.backPath;
            if (!path) return null;
            const isActive = selectedMuscle?.id === muscle.id;
            const isHov = hovered === muscle.id;
            const sched = isScheduled(muscle);

            return (
              <g key={muscle.id}>
                <path
                  d={path}
                  fill={muscle.color}
                  fillOpacity={isActive ? 0.92 : isHov ? 0.7 : sched ? 0.52 : 0.28}
                  stroke={muscle.color}
                  strokeWidth={isActive ? 1.2 : 0.4}
                  strokeOpacity={isActive ? 0.9 : 0.5}
                  rx="2"
                  style={{ cursor: "pointer", transition: "fill-opacity 0.15s, stroke-width 0.15s" }}
                  onClick={() => handleMuscleClick(muscle)}
                  onMouseEnter={() => setHovered(muscle.id)}
                  onMouseLeave={() => setHovered(null)}
                />
                {/* Scheduled badge */}
                {sched && !isActive && (() => {
                  // Small dot overlay — position varies by muscle
                  return null; // handled by opacity
                })()}
              </g>
            );
          })}

          {/* Floating label for hovered/selected */}
          {(hovered || selectedMuscle) && (() => {
            const m = MUSCLES.find((x) => x.id === (selectedMuscle?.id || hovered));
            if (!m) return null;
            const days = getMuscleScheduledDays(m);
            return (
              <g>
                <rect x="30" y="4" width="140" height="28" rx="10" fill="rgba(5,10,18,0.88)" />
                <text x="100" y="14" textAnchor="middle" fill={m.color} fontSize="9.5" fontWeight="700" fontFamily="system-ui" dy="0.35em">
                  {m.label}
                  {days.length > 0 ? `  ·  ${days.map(d => DAYS_SHORT[DAYS_FULL.indexOf(d)]).join(" ")}` : ""}
                </text>
              </g>
            );
          })()}
        </motion.svg>

        {/* Swipe hint */}
        <p className="absolute bottom-2 left-0 right-0 text-center text-[9px] text-white/20">
          ← desliza para rodar →
        </p>
      </div>

      {/* Day picker — expands below when muscle is selected */}
      <AnimatePresence>
        {selectedMuscle && (
          <motion.div
            key={selectedMuscle.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div
              className="rounded-2xl p-4"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: selectedMuscle.color }} />
                  <span className="text-sm font-bold text-white">{selectedMuscle.label}</span>
                  <span className="text-xs text-white/40">— escolhe os dias</span>
                </div>
                <button
                  onClick={() => setSelectedMuscle(null)}
                  className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center"
                >
                  <X size={12} className="text-white/50" />
                </button>
              </div>

              {/* Day pills */}
              <div className="grid grid-cols-7 gap-1.5 mb-4">
                {DAYS_SHORT.map((day, i) => {
                  const active = getMuscleScheduledDays(selectedMuscle).includes(DAYS_FULL[i]);
                  return (
                    <motion.button
                      key={day}
                      whileTap={{ scale: 0.88 }}
                      onClick={() => toggleDay(selectedMuscle, DAYS_FULL[i])}
                      className="flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all"
                      style={{
                        background: active ? `${selectedMuscle.color}20` : "rgba(255,255,255,0.04)",
                        border: `1px solid ${active ? selectedMuscle.color + "50" : "rgba(255,255,255,0.07)"}`,
                      }}
                    >
                      <span
                        className="text-[10px] font-bold"
                        style={{ color: active ? selectedMuscle.color : "rgba(255,255,255,0.38)" }}
                      >
                        {day}
                      </span>
                      <div
                        className="w-2.5 h-2.5 rounded-full transition-all"
                        style={{ background: active ? selectedMuscle.color : "rgba(255,255,255,0.1)" }}
                      />
                    </motion.button>
                  );
                })}
              </div>

              {/* Save button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => saveDay(selectedMuscle)}
                disabled={saving}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                style={{ background: selectedMuscle.color, color: "#fff" }}
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check size={15} />
                    Guardar {selectedMuscle.label}
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scheduled summary chips */}
      {MUSCLES.some((m) => isScheduled(m)) && (
        <div
          className="rounded-2xl p-3"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2">
            Plano configurado
          </p>
          <div className="flex flex-wrap gap-1.5">
            {MUSCLES.filter(isScheduled).map((m) => (
              <button
                key={m.id}
                onClick={() => handleMuscleClick(m)}
                className="text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all"
                style={{
                  background: `${m.color}18`,
                  color: m.color,
                  border: `1px solid ${m.color}35`,
                }}
              >
                {m.label} · {getMuscleScheduledDays(m).map(d => DAYS_SHORT[DAYS_FULL.indexOf(d)]).join(" ")}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
