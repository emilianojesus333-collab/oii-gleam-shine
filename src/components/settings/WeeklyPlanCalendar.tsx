import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, RotateCcw, Users } from "lucide-react";
import { toast } from "sonner";

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
const DAYS_FULL = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];

// ─── MUSCLES ─────────────────────────────────────────────────────────────────
// ViewBox: 0 0 200 440
// Body is centered horizontally. All paths are tuned to sit INSIDE the silhouette.

const MUSCLES: Muscle[] = [
  // ── FRONT ──────────────────────────────────────────────────────────────────
  {
    id: "chest",
    label: "Peito",
    color: "#60A5FA",
    // Two pec slabs — broad, filling the chest area
    frontPath:
      "M 72 118 C 70 113 71 106 75 102 C 80 97 88 96 95 99 C 100 102 102 108 101 115 " +
      "L 101 130 C 94 134 82 133 74 127 Z " +
      "M 128 118 C 130 113 129 106 125 102 C 120 97 112 96 105 99 C 100 102 98 108 99 115 " +
      "L 99 130 C 106 134 118 133 126 127 Z",
  },
  {
    id: "shoulders",
    label: "Ombros",
    color: "#A78BFA",
    // Rounded deltoid caps sitting on top of arms
    frontPath:
      "M 54 113 C 51 104 54 93 61 88 C 69 83 79 86 82 95 L 75 117 C 67 118 59 117 54 113 Z " +
      "M 146 113 C 149 104 146 93 139 88 C 131 83 121 86 118 95 L 125 117 C 133 118 141 117 146 113 Z",
    backPath:
      "M 54 113 C 51 104 54 93 61 88 C 69 83 79 86 82 95 L 75 117 C 67 118 59 117 54 113 Z " +
      "M 146 113 C 149 104 146 93 139 88 C 131 83 121 86 118 95 L 125 117 C 133 118 141 117 146 113 Z",
  },
  {
    id: "biceps",
    label: "Bíceps",
    color: "#F472B6",
    // Elongated shape on front of upper arm
    frontPath:
      "M 51 122 C 47 133 46 148 49 161 C 55 163 63 162 67 158 C 69 145 70 132 68 122 Z " +
      "M 149 122 C 153 133 154 148 151 161 C 145 163 137 162 133 158 C 131 145 130 132 132 122 Z",
  },
  {
    id: "forearms",
    label: "Antebraços",
    color: "#22D3EE",
    frontPath:
      "M 48 164 C 45 176 45 193 48 206 L 61 206 C 63 193 64 176 63 164 Z " +
      "M 152 164 C 155 176 155 193 152 206 L 139 206 C 137 193 136 176 137 164 Z",
    backPath:
      "M 48 164 C 45 176 45 193 48 206 L 61 206 C 63 193 64 176 63 164 Z " +
      "M 152 164 C 155 176 155 193 152 206 L 139 206 C 137 193 136 176 137 164 Z",
  },
  {
    id: "abs",
    label: "Abdominais",
    color: "#34D399",
    // 6 clearly separated blocks, 2 cols × 3 rows
    frontPath:
      "M 89 135 C 89 133 91 131 93 131 L 98 131 C 100 131 102 133 102 135 L 102 143 C 102 145 100 147 98 147 L 93 147 C 91 147 89 145 89 143 Z " +
      "M 102 135 C 102 133 104 131 106 131 L 111 131 C 113 131 115 133 115 135 L 115 143 C 115 145 113 147 111 147 L 106 147 C 104 147 102 145 102 143 Z " +
      "M 89 149 L 102 149 L 102 160 L 89 160 Z " +
      "M 102 149 L 115 149 L 115 160 L 102 160 Z " +
      "M 90 162 L 101 162 L 101 173 L 90 173 Z " +
      "M 103 162 L 114 162 L 114 173 L 103 173 Z",
  },
  {
    id: "quads",
    label: "Quadríceps",
    color: "#FCD34D",
    // Wide tapered quads filling thigh area
    frontPath:
      "M 78 213 C 76 228 74 252 76 272 C 80 272 91 271 94 269 C 97 249 97 228 96 213 Z " +
      "M 122 213 C 124 228 126 252 124 272 C 120 272 109 271 106 269 C 103 249 103 228 104 213 Z",
  },
  {
    id: "calves",
    label: "Gémeos",
    color: "#2DD4BF",
    frontPath:
      "M 78 279 C 76 292 76 312 78 326 L 92 326 C 94 312 94 292 92 279 Z " +
      "M 122 279 C 124 292 124 312 122 326 L 108 326 C 106 312 106 292 108 279 Z",
    backPath:
      "M 78 282 C 76 295 76 315 78 330 L 92 330 C 94 315 94 295 92 282 Z " +
      "M 122 282 C 124 295 124 315 122 330 L 108 330 C 106 315 106 295 108 282 Z",
  },

  // ── BACK ───────────────────────────────────────────────────────────────────
  {
    id: "traps",
    label: "Trapézios",
    color: "#FBBF24",
    // Diamond shape from neck down to mid-back
    backPath:
      "M 86 93 C 91 87 100 84 100 84 L 100 116 C 93 119 87 115 82 109 Z " +
      "M 114 93 C 109 87 100 84 100 84 L 100 116 C 107 119 113 115 118 109 Z",
  },
  {
    id: "lats",
    label: "Dorsais",
    color: "#818CF8",
    // Wide V-taper from armpit down to waist
    backPath:
      "M 65 118 C 62 126 61 140 63 158 C 68 162 78 166 84 164 C 87 150 88 136 86 120 Z " +
      "M 135 118 C 138 126 139 140 137 158 C 132 162 122 166 116 164 C 113 150 112 136 114 120 Z",
  },
  {
    id: "rhomboids",
    label: "Rombóides",
    color: "#C084FC",
    backPath:
      "M 86 120 L 100 116 L 114 120 L 114 148 L 100 154 L 86 148 Z",
  },
  {
    id: "lower_back",
    label: "Lombar",
    color: "#86EFAC",
    backPath:
      "M 87 158 L 113 158 L 110 190 L 90 190 Z",
  },
  {
    id: "triceps",
    label: "Tríceps",
    color: "#FB923C",
    // Back of upper arm
    backPath:
      "M 51 122 C 47 133 46 148 49 161 C 55 163 63 162 67 158 C 69 145 70 132 68 122 Z " +
      "M 149 122 C 153 133 154 148 151 161 C 145 163 137 162 133 158 C 131 145 130 132 132 122 Z",
  },
  {
    id: "glutes",
    label: "Glúteos",
    color: "#F87171",
    // Two rounded glute shapes
    backPath:
      "M 74 194 C 71 207 71 224 76 236 C 83 249 96 254 100 254 L 100 194 Z " +
      "M 126 194 C 129 207 129 224 124 236 C 117 249 104 254 100 254 L 100 194 Z",
  },
  {
    id: "hamstrings",
    label: "Isquiotibiais",
    color: "#E879F9",
    backPath:
      "M 76 259 C 74 273 73 295 75 313 L 94 313 C 96 295 96 273 94 259 Z " +
      "M 124 259 C 126 273 127 295 125 313 L 106 313 C 104 295 104 273 106 259 Z",
  },
];

// ─── BODY SILHOUETTES ─────────────────────────────────────────────────────────
// These are anatomically-proportioned flat silhouettes.
// The key is: shoulders wider than waist, clear neck, arms with elbow articulation,
// legs with knee and calf definition, feet.

const MALE_FRONT = `
  M 100 20
  C 91 20 83 27 83 37 C 83 47 91 54 100 54 C 109 54 117 47 117 37 C 117 27 109 20 100 20 Z

  M 100 54
  C 88 54 76 57 68 62
  C 57 67 51 76 50 86
  L 50 100
  C 50 102 52 103 54 103
  C 52 106 51 110 51 114
  L 51 170
  C 51 173 53 175 55 175
  L 55 210
  C 55 213 57 215 60 215
  L 66 215
  L 66 275 C 66 278 68 280 71 280
  L 76 280
  L 76 330 C 76 334 78 337 81 337 C 82 337 84 336 85 335
  L 85 350 C 85 354 87 357 90 357 L 97 357 L 97 280 L 97 213
  L 100 211 L 103 213
  L 103 280 L 103 357 L 110 357 C 113 357 115 354 115 350
  L 115 335 C 116 336 118 337 119 337 C 122 337 124 334 124 330
  L 124 280 L 129 280 C 132 280 134 278 134 275
  L 134 215 L 140 215 C 143 215 145 213 145 210
  L 145 175 L 145 175 C 147 175 149 173 149 170
  L 149 114 C 149 110 148 106 146 103
  C 148 103 150 102 150 100
  L 150 86 C 149 76 143 67 132 62
  C 124 57 112 54 100 54 Z
`;

const MALE_BACK = `
  M 100 20
  C 91 20 83 27 83 37 C 83 47 91 54 100 54 C 109 54 117 47 117 37 C 117 27 109 20 100 20 Z

  M 100 54
  C 88 54 76 57 68 62
  C 57 67 51 76 50 86
  L 50 100
  C 50 102 52 103 54 103
  C 52 106 51 110 51 114
  L 51 170 C 51 173 53 175 55 175
  L 55 210 C 55 213 57 215 60 215
  L 66 215 L 66 272 C 66 275 68 278 71 278
  L 76 278 L 76 358 C 76 362 79 365 83 365 L 92 365 L 92 278
  L 100 276 L 108 278
  L 108 365 L 117 365 C 121 365 124 362 124 358
  L 124 278 L 129 278 C 132 278 134 275 134 272
  L 134 215 L 140 215 C 143 215 145 213 145 210
  L 145 175 L 145 175 C 147 175 149 173 149 170
  L 149 114 C 149 110 148 106 146 103
  C 148 103 150 102 150 100
  L 150 86 C 149 76 143 67 132 62
  C 124 57 112 54 100 54 Z
`;

const FEMALE_FRONT = `
  M 100 20
  C 92 20 85 27 85 36 C 85 45 92 52 100 52 C 108 52 115 45 115 36 C 115 27 108 20 100 20 Z

  M 100 52
  C 90 52 79 55 71 60
  C 61 65 56 73 55 83
  L 55 96 C 55 98 57 100 59 100
  C 57 103 56 107 56 111
  L 56 163 C 56 166 58 168 61 168
  L 61 188 C 61 191 63 193 66 193
  L 70 193
  L 70 230
  C 68 234 67 240 68 248
  C 72 264 86 272 100 272
  C 114 272 128 264 132 248
  C 133 240 132 234 130 230
  L 130 193 L 134 193 C 137 193 139 191 139 188
  L 139 168 C 142 168 144 166 144 163
  L 144 111 C 144 107 143 103 141 100
  C 143 100 145 98 145 96
  L 145 83 C 144 73 139 65 129 60
  C 121 55 110 52 100 52 Z

  M 84 168 C 80 174 80 186 84 192
  C 89 200 100 202 116 192
  C 120 186 120 174 116 168
  C 111 161 89 161 84 168 Z
`;

const FEMALE_BACK = `
  M 100 20
  C 92 20 85 27 85 36 C 85 45 92 52 100 52 C 108 52 115 45 115 36 C 115 27 108 20 100 20 Z

  M 100 52
  C 90 52 79 55 71 60
  C 61 65 56 73 55 83
  L 55 96 C 55 98 57 100 59 100
  C 57 103 56 107 56 111
  L 56 163 C 56 166 58 168 61 168
  L 61 188 C 61 191 63 193 66 193
  L 70 193
  L 70 268
  C 74 282 87 292 100 292
  C 113 292 126 282 130 268
  L 130 193 L 134 193 C 137 193 139 191 139 188
  L 139 168 C 142 168 144 166 144 163
  L 144 111 C 144 107 143 103 141 100
  C 143 100 145 98 145 96
  L 145 83 C 144 73 139 65 129 60
  C 121 55 110 52 100 52 Z

  M 70 293 L 76 355 C 76 359 79 362 83 362 L 92 362 L 92 293 Z
  M 130 293 L 124 355 C 124 359 121 362 117 362 L 108 362 L 108 293 Z
`;

// ─── Component ────────────────────────────────────────────────────────────────

export const WeeklyPlanCalendar = ({ schedule, onSaveDay }: WeeklyPlanCalendarProps) => {
  const [side, setSide]               = useState<Side>("front");
  const [gender, setGender]           = useState<Gender>("male");
  const [flipping, setFlipping]       = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState<Muscle | null>(null);
  const [localSchedule, setLocalSchedule]   = useState<Schedule>(schedule);
  const [hovered, setHovered]         = useState<string | null>(null);
  const [saving, setSaving]           = useState(false);
  const touchX = useRef(0);

  const visibleMuscles = MUSCLES.filter((m) =>
    side === "front" ? !!m.frontPath : !!m.backPath
  );

  const getBodyPath = () => {
    if (gender === "male") return side === "front" ? MALE_FRONT : MALE_BACK;
    return side === "front" ? FEMALE_FRONT : FEMALE_BACK;
  };

  const getMuscleScheduledDays = (muscle: Muscle): string[] =>
    DAYS_FULL.filter((d) => localSchedule[d]?.includes(muscle.label));

  const isScheduled = (muscle: Muscle) => getMuscleScheduledDays(muscle).length > 0;

  const flipSide = () => {
    if (flipping) return;
    setFlipping(true);
    setSelectedMuscle(null);
    setTimeout(() => {
      setSide((s) => (s === "front" ? "back" : "front"));
      setFlipping(false);
    }, 200);
  };

  const handleMuscleClick = (m: Muscle) => {
    setSelectedMuscle((prev) => (prev?.id === m.id ? null : m));
  };

  const toggleDay = (muscle: Muscle, dayFull: string) => {
    setLocalSchedule((prev) => {
      const current = prev[dayFull] || [];
      const updated = current.includes(muscle.label)
        ? current.filter((x) => x !== muscle.label)
        : [...current, muscle.label];
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

      {/* Controls */}
      <div className="flex items-center justify-between gap-2">
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={flipSide}
          className="flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-semibold"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.65)" }}
        >
          <RotateCcw size={13} />
          {side === "front" ? "Ver costas" : "Ver frente"}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => { setGender((g) => g === "male" ? "female" : "male"); setSelectedMuscle(null); }}
          className="flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-semibold"
          style={{
            background: gender === "female" ? "rgba(236,72,153,0.13)" : "rgba(99,102,241,0.13)",
            border: `1px solid ${gender === "female" ? "rgba(236,72,153,0.3)" : "rgba(99,102,241,0.3)"}`,
            color: gender === "female" ? "#EC4899" : "#818CF8",
          }}
        >
          <Users size={13} />
          {gender === "male" ? "Masculino" : "Feminino"}
        </motion.button>
      </div>

      {/* Body canvas */}
      <div
        className="relative rounded-3xl flex items-center justify-center overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #0A1628 0%, #060D18 100%)",
          minHeight: 380,
          border: "1px solid rgba(255,255,255,0.06)",
        }}
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => { if (Math.abs(touchX.current - e.changedTouches[0].clientX) > 45) flipSide(); }}
      >
        {/* Ambient radial glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 60% 70% at 50% 42%, rgba(59,130,246,0.05) 0%, transparent 70%)",
        }} />

        <motion.svg
          viewBox="0 0 200 390"
          animate={{ scaleX: flipping ? 0 : 1 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          style={{ width: "46%", maxWidth: 168, position: "relative", zIndex: 10 }}
        >
          <defs>
            {/* Subtle inner glow for active muscles */}
            <filter id="mGlow" x="-15%" y="-15%" width="130%" height="130%">
              <feGaussianBlur stdDeviation="2" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Body silhouette — dark blue-grey fill */}
          <path
            d={getBodyPath()}
            fill="#1B2D42"
            stroke="#253D58"
            strokeWidth="0.7"
          />

          {/* Muscle zones */}
          {visibleMuscles.map((muscle) => {
            const path = side === "front" ? muscle.frontPath : muscle.backPath;
            if (!path) return null;
            const isActive   = selectedMuscle?.id === muscle.id;
            const isHov      = hovered === muscle.id;
            const sched      = isScheduled(muscle);

            return (
              <path
                key={muscle.id}
                d={path}
                fill={muscle.color}
                fillOpacity={isActive ? 0.96 : isHov ? 0.75 : sched ? 0.58 : 0.24}
                stroke={muscle.color}
                strokeWidth={isActive ? 1.4 : sched ? 0.7 : 0.25}
                strokeOpacity={isActive ? 1 : sched ? 0.9 : 0.5}
                filter={isActive ? "url(#mGlow)" : undefined}
                style={{ cursor: "pointer", transition: "fill-opacity 0.15s, stroke-width 0.15s" }}
                onClick={() => handleMuscleClick(muscle)}
                onMouseEnter={() => setHovered(muscle.id)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}

          {/* Floating label */}
          {(hovered || selectedMuscle) && (() => {
            const m = MUSCLES.find((x) => x.id === (selectedMuscle?.id || hovered));
            if (!m) return null;
            const days = getMuscleScheduledDays(m);
            const txt  = days.length
              ? `${m.label}  ·  ${days.map((d) => DAYS_SHORT[DAYS_FULL.indexOf(d)]).join(" ")}`
              : m.label;
            return (
              <g>
                <rect x="18" y="6" width="164" height="22" rx="11" fill="rgba(4,12,24,0.92)" />
                <text
                  x="100" y="17"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={m.color}
                  fontSize="8.5"
                  fontWeight="700"
                  fontFamily="system-ui,-apple-system,sans-serif"
                >
                  {txt}
                </text>
              </g>
            );
          })()}
        </motion.svg>

        <p className="absolute bottom-3 left-0 right-0 text-center"
          style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.05em" }}>
          ← desliza para rodar →
        </p>
      </div>

      {/* Day picker */}
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
            <div className="rounded-2xl p-4" style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: selectedMuscle.color }} />
                  <span className="text-sm font-bold text-white">{selectedMuscle.label}</span>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>— dias</span>
                </div>
                <button
                  onClick={() => setSelectedMuscle(null)}
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                >
                  <X size={12} style={{ color: "rgba(255,255,255,0.5)" }} />
                </button>
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-1.5 mb-4">
                {DAYS_SHORT.map((day, i) => {
                  const active = getMuscleScheduledDays(selectedMuscle).includes(DAYS_FULL[i]);
                  return (
                    <motion.button
                      key={day}
                      whileTap={{ scale: 0.86 }}
                      onClick={() => toggleDay(selectedMuscle, DAYS_FULL[i])}
                      className="flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all"
                      style={{
                        background: active ? `${selectedMuscle.color}1E` : "rgba(255,255,255,0.04)",
                        border: `1px solid ${active ? selectedMuscle.color + "60" : "rgba(255,255,255,0.07)"}`,
                      }}
                    >
                      <span className="text-[10px] font-bold" style={{
                        color: active ? selectedMuscle.color : "rgba(255,255,255,0.36)",
                      }}>
                        {day}
                      </span>
                      <div className="w-2.5 h-2.5 rounded-full transition-all" style={{
                        background: active ? selectedMuscle.color : "rgba(255,255,255,0.1)",
                      }} />
                    </motion.button>
                  );
                })}
              </div>

              {/* Save */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => saveDay(selectedMuscle)}
                disabled={saving}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: selectedMuscle.color, color: "#fff" }}
              >
                {saving
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><Check size={15} />Guardar {selectedMuscle.label}</>
                }
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary chips */}
      {MUSCLES.some((m) => isScheduled(m)) && (
        <div className="rounded-2xl p-3" style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2"
            style={{ color: "rgba(255,255,255,0.28)" }}>
            Plano configurado
          </p>
          <div className="flex flex-wrap gap-1.5">
            {MUSCLES.filter(isScheduled).map((m) => (
              <button
                key={m.id}
                onClick={() => handleMuscleClick(m)}
                className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                style={{
                  background: `${m.color}18`,
                  color: m.color,
                  border: `1px solid ${m.color}35`,
                }}
              >
                {m.label} · {getMuscleScheduledDays(m).map((d) => DAYS_SHORT[DAYS_FULL.indexOf(d)]).join(" ")}
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
