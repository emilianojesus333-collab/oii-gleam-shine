import { useState, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw, Users, Check, X, ChevronRight } from "lucide-react";
import { useUserSettings } from "@/hooks/useUserSettings";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

type Side = "front" | "back";
type Gender = "male" | "female";

interface MuscleGroup {
  id: string;
  label: string;
  color: string;
  front?: string;   // SVG path(s) for front view
  back?: string;    // SVG path(s) for back view
}

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const DAYS_FULL = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

// ─── Muscle definitions with SVG paths ───────────────────────────────────────

const MUSCLES: MuscleGroup[] = [
  {
    id: "chest",
    label: "Peito",
    color: "#60A5FA",
    front: "M 95 130 C 95 120 110 112 130 115 L 150 120 L 150 155 C 140 162 120 162 105 155 Z M 205 130 C 205 120 190 112 170 115 L 150 120 L 150 155 C 160 162 180 162 195 155 Z",
  },
  {
    id: "shoulders",
    label: "Ombros",
    color: "#8B5CF6",
    front: "M 80 115 C 72 108 72 95 82 90 C 90 86 100 90 103 100 L 97 118 Z M 220 115 C 228 108 228 95 218 90 C 210 86 200 90 197 100 L 203 118 Z",
    back: "M 80 115 C 72 108 72 95 82 90 C 90 86 100 90 103 100 L 97 118 Z M 220 115 C 228 108 228 95 218 90 C 210 86 200 90 197 100 L 203 118 Z",
  },
  {
    id: "biceps",
    label: "Bíceps",
    color: "#EC4899",
    front: "M 82 125 C 76 135 74 150 78 165 L 90 165 C 90 150 92 137 95 127 Z M 218 125 C 224 135 226 150 222 165 L 210 165 C 210 150 208 137 205 127 Z",
  },
  {
    id: "triceps",
    label: "Tríceps",
    color: "#F59E0B",
    back: "M 82 125 C 76 135 74 150 78 165 L 90 165 C 90 150 92 137 95 127 Z M 218 125 C 224 135 226 150 222 165 L 210 165 C 210 150 208 137 205 127 Z",
  },
  {
    id: "forearms",
    label: "Antebraços",
    color: "#06B6D4",
    front: "M 78 168 C 74 178 73 195 76 208 L 86 208 C 86 195 87 178 88 168 Z M 222 168 C 226 178 227 195 224 208 L 214 208 C 214 195 213 178 212 168 Z",
    back: "M 78 168 C 74 178 73 195 76 208 L 86 208 C 86 195 87 178 88 168 Z M 222 168 C 226 178 227 195 224 208 L 214 208 C 214 195 213 178 212 168 Z",
  },
  {
    id: "abs",
    label: "Abdominais",
    color: "#22C55E",
    front: "M 135 162 L 165 162 L 165 230 L 135 230 Z",
  },
  {
    id: "back_upper",
    label: "Costas Sup.",
    color: "#6366F1",
    back: "M 105 120 C 110 112 130 108 150 108 C 170 108 190 112 195 120 L 190 158 C 175 165 160 167 150 167 C 140 167 125 165 110 158 Z",
  },
  {
    id: "back_lower",
    label: "Lombar",
    color: "#84CC16",
    back: "M 120 168 L 180 168 L 175 215 L 125 215 Z",
  },
  {
    id: "glutes",
    label: "Glúteos",
    color: "#F97316",
    back: "M 115 218 C 112 230 115 248 125 258 C 135 266 150 268 150 268 C 150 268 165 266 175 258 C 185 248 188 230 185 218 Z",
  },
  {
    id: "quads",
    label: "Quadríceps",
    color: "#EAB308",
    front: "M 120 235 C 118 248 116 268 118 288 L 148 288 L 148 235 Z M 180 235 C 182 248 184 268 182 288 L 152 288 L 152 235 Z",
  },
  {
    id: "hamstrings",
    label: "Isquiotibiais",
    color: "#D946EF",
    back: "M 120 270 C 118 282 116 302 118 322 L 148 322 L 148 270 Z M 180 270 C 182 282 184 302 182 322 L 152 322 L 152 270 Z",
  },
  {
    id: "calves",
    label: "Gémeos",
    color: "#14B8A6",
    front: "M 120 295 C 118 308 119 328 122 345 L 146 345 L 146 295 Z M 180 295 C 182 308 181 328 178 345 L 154 345 L 154 295 Z",
    back: "M 120 328 C 118 342 119 362 122 378 L 146 378 L 146 328 Z M 180 328 C 182 342 181 362 178 378 L 154 378 L 154 328 Z",
  },
];

// ─── Body SVG paths (neutral silhouette) ─────────────────────────────────────

const BODY_MALE_FRONT = `
  M 150 40 C 138 40 128 50 128 62 C 128 74 138 84 150 84 C 162 84 172 74 172 62 C 172 50 162 40 150 40 Z
  M 100 90 C 88 94 82 102 80 112 L 80 200 C 80 205 84 208 88 208 L 92 208 L 92 280 C 92 284 95 287 98 287 L 104 287 L 104 390 C 104 394 107 397 110 397 L 126 397 L 126 287 L 132 287 L 132 230 L 150 230 L 168 230 L 168 287 L 174 287 L 174 397 L 190 397 C 193 397 196 394 196 390 L 196 287 L 202 287 C 205 287 208 284 208 280 L 208 208 L 212 208 C 216 208 220 205 220 200 L 220 112 C 218 102 212 94 200 90 C 190 86 170 84 150 84 C 130 84 110 86 100 90 Z
`;

const BODY_MALE_BACK = `
  M 150 40 C 138 40 128 50 128 62 C 128 74 138 84 150 84 C 162 84 172 74 172 62 C 172 50 162 40 150 40 Z
  M 100 90 C 88 94 82 102 80 112 L 80 200 C 80 205 84 208 88 208 L 92 208 L 92 280 C 92 284 95 287 98 287 L 104 287 L 104 390 C 104 394 107 397 110 397 L 126 397 L 126 287 L 132 287 L 132 268 L 150 268 L 168 268 L 168 287 L 174 287 L 174 397 L 190 397 C 193 397 196 394 196 390 L 196 287 L 202 287 C 205 287 208 284 208 280 L 208 208 L 212 208 C 216 208 220 205 220 200 L 220 112 C 218 102 212 94 200 90 C 190 86 170 84 150 84 C 130 84 110 86 100 90 Z
`;

const BODY_FEMALE_FRONT = `
  M 150 40 C 139 40 130 49 130 60 C 130 71 139 80 150 80 C 161 80 170 71 170 60 C 170 49 161 40 150 40 Z
  M 106 88 C 94 92 86 100 84 110 L 84 195 C 84 199 87 202 91 202 L 95 202 L 95 270 C 95 274 97 277 100 277 L 106 277 L 106 390 C 106 394 109 397 112 397 L 126 397 L 126 277 L 128 240 C 134 245 142 248 150 248 C 158 248 166 245 172 240 L 174 277 L 188 277 L 188 397 L 202 397 C 205 397 208 394 208 390 L 208 277 L 214 277 C 217 277 219 274 219 270 L 219 202 L 223 202 C 227 202 230 199 230 195 L 230 110 C 228 100 220 92 208 88 C 196 83 172 80 150 80 C 128 80 110 83 106 88 Z
  M 132 165 C 126 170 124 180 132 188 C 138 194 162 194 168 188 C 176 180 174 170 168 165 C 162 160 138 160 132 165 Z
`;

const BODY_FEMALE_BACK = `
  M 150 40 C 139 40 130 49 130 60 C 130 71 139 80 150 80 C 161 80 170 71 170 60 C 170 49 161 40 150 40 Z
  M 106 88 C 94 92 86 100 84 110 L 84 195 C 84 199 87 202 91 202 L 95 202 L 95 270 C 95 274 97 277 100 277 L 106 277 L 106 390 L 126 390 L 126 277 L 128 268 L 150 270 L 172 268 L 174 277 L 188 277 L 188 390 L 208 390 C 208 390 208 277 208 277 L 214 277 C 217 277 219 274 219 270 L 219 202 L 223 202 C 227 202 230 199 230 195 L 230 110 C 228 100 220 92 208 88 C 196 83 172 80 150 80 C 128 80 110 83 106 88 Z
  M 128 238 C 124 250 124 265 128 275 C 136 288 164 288 172 275 C 176 265 176 250 172 238 C 164 226 136 226 128 238 Z
`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function BodyCalendar() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useUserSettings();

  const [side, setSide] = useState<Side>("front");
  const [gender, setGender] = useState<Gender>("male");
  const [isFlipping, setIsFlipping] = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [schedule, setSchedule] = useState<Record<string, string[]>>(() => {
    return settings?.onboarding_data?.schedule || {};
  });
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);

  // Swipe detection
  const touchStartX = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) flipSide();
  };

  const flipSide = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    setTimeout(() => {
      setSide((s) => (s === "front" ? "back" : "front"));
      setIsFlipping(false);
    }, 200);
  };

  const getMusclesForSide = () =>
    MUSCLES.filter((m) => (side === "front" ? m.front : m.back));

  const getBodyPath = () => {
    if (gender === "male") return side === "front" ? BODY_MALE_FRONT : BODY_MALE_BACK;
    return side === "front" ? BODY_FEMALE_FRONT : BODY_FEMALE_BACK;
  };

  const getMuscleSchedule = (muscleId: string): string[] => {
    const days: string[] = [];
    Object.entries(schedule).forEach(([day, muscles]) => {
      if (muscles?.includes(muscleId)) days.push(day);
    });
    return days;
  };

  const handleMuscleClick = (muscle: MuscleGroup) => {
    setSelectedMuscle(muscle);
    setShowDayPicker(true);
  };

  const toggleDay = (muscleId: string, day: string) => {
    setSchedule((prev) => {
      const current = prev[day] || [];
      const updated = current.includes(muscleId)
        ? current.filter((m) => m !== muscleId)
        : [...current, muscleId];
      return { ...prev, [day]: updated };
    });
  };

  const saveSchedule = async () => {
    try {
      const current = settings?.onboarding_data || {};
      await updateSettings({
        onboarding_data: { ...current, schedule } as any,
      });
      toast.success("Calendário guardado!");
      setShowDayPicker(false);
      setSelectedMuscle(null);
    } catch {
      toast.error("Erro ao guardar. Tenta novamente.");
    }
  };

  const isMuscleScheduled = (muscleId: string) =>
    getMuscleSchedule(muscleId).length > 0;

  return (
    <div className="min-h-screen bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4 z-10">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-white/70" />
        </button>
        <div className="text-center">
          <h1 className="text-base font-bold text-white">Calendário Muscular</h1>
          <p className="text-[11px] text-white/40">
            {side === "front" ? "Vista frontal" : "Vista posterior"} · {gender === "male" ? "Masculino" : "Feminino"}
          </p>
        </div>
        <div className="w-10" />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 px-5 pb-3">
        {/* Flip button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={flipSide}
          className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-semibold text-white/70"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)" }}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {side === "front" ? "Ver costas" : "Ver frente"}
        </motion.button>

        {/* Gender toggle */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setGender((g) => (g === "male" ? "female" : "male"))}
          className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-semibold"
          style={{
            background: gender === "female" ? "rgba(236,72,153,0.15)" : "rgba(59,130,246,0.15)",
            border: `1px solid ${gender === "female" ? "rgba(236,72,153,0.3)" : "rgba(59,130,246,0.3)"}`,
            color: gender === "female" ? "#EC4899" : "#60A5FA",
          }}
        >
          <Users className="w-3.5 h-3.5" />
          {gender === "male" ? "Masculino" : "Feminino"}
        </motion.button>
      </div>

      {/* SVG Body Canvas */}
      <div
        className="flex-1 flex items-center justify-center px-4"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <motion.div
          animate={{ scaleX: isFlipping ? 0 : 1 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="w-full max-w-xs"
        >
          <svg
            viewBox="0 0 300 430"
            className="w-full"
            style={{ filter: "drop-shadow(0 0 40px rgba(59,130,246,0.15))" }}
          >
            {/* Body silhouette */}
            <path
              d={getBodyPath()}
              fill="#1E2A3A"
              stroke="#2D3F55"
              strokeWidth="1.5"
            />

            {/* Muscle zones */}
            {getMusclesForSide().map((muscle) => {
              const path = side === "front" ? muscle.front : muscle.back;
              if (!path) return null;
              const isSelected = selectedMuscle?.id === muscle.id;
              const isHovered = hoveredMuscle === muscle.id;
              const isScheduled = isMuscleScheduled(muscle.id);

              return (
                <g key={muscle.id}>
                  <path
                    d={path}
                    fill={muscle.color}
                    fillOpacity={isSelected ? 0.9 : isHovered ? 0.65 : isScheduled ? 0.55 : 0.25}
                    stroke={muscle.color}
                    strokeWidth={isSelected || isHovered ? 1.5 : 0.5}
                    strokeOpacity={isSelected ? 1 : 0.6}
                    style={{ cursor: "pointer", transition: "all 0.18s ease" }}
                    onClick={() => handleMuscleClick(muscle)}
                    onMouseEnter={() => setHoveredMuscle(muscle.id)}
                    onMouseLeave={() => setHoveredMuscle(null)}
                  />
                  {/* Scheduled indicator dot */}
                  {isScheduled && !isSelected && (
                    <circle
                      cx="150"
                      cy="50"
                      r="3"
                      fill={muscle.color}
                      opacity={0.9}
                    />
                  )}
                </g>
              );
            })}

            {/* Hovered muscle label */}
            {hoveredMuscle && !showDayPicker && (() => {
              const m = MUSCLES.find((x) => x.id === hoveredMuscle);
              return m ? (
                <g>
                  <rect x="90" y="8" width="120" height="24" rx="12" fill="rgba(0,0,0,0.75)" />
                  <text
                    x="150"
                    y="24"
                    textAnchor="middle"
                    fill={m.color}
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="system-ui"
                  >
                    {m.label}
                  </text>
                </g>
              ) : null;
            })()}
          </svg>
        </motion.div>
      </div>

      {/* Swipe hint */}
      <p className="text-center text-[10px] text-white/25 pb-2">
        ← desliza para rodar o corpo →
      </p>

      {/* Scheduled muscles summary */}
      {Object.values(schedule).some((v) => v && v.length > 0) && (
        <div className="px-5 pb-3">
          <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">Plano configurado</p>
            <div className="flex flex-wrap gap-1.5">
              {MUSCLES.filter((m) => isMuscleScheduled(m.id)).map((m) => (
                <span
                  key={m.id}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: `${m.color}22`, color: m.color, border: `1px solid ${m.color}44` }}
                >
                  {m.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="h-20" />

      {/* Day Picker Sheet */}
      <AnimatePresence>
        {showDayPicker && selectedMuscle && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => { setShowDayPicker(false); setSelectedMuscle(null); }}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl px-5 pt-5 pb-10"
              style={{ background: "#1A1A1A", border: "1px solid #2A2A2A" }}
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

              {/* Muscle title */}
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{ background: `${selectedMuscle.color}22` }}
                >
                  <div className="w-4 h-4 rounded-full" style={{ background: selectedMuscle.color }} />
                </div>
                <div>
                  <p className="text-base font-bold text-white">{selectedMuscle.label}</p>
                  <p className="text-xs text-white/40">Seleciona os dias de treino</p>
                </div>
                <button
                  onClick={() => { setShowDayPicker(false); setSelectedMuscle(null); }}
                  className="ml-auto w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white/50" />
                </button>
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-2 mb-6">
                {DAYS.map((day, i) => {
                  const isActive = schedule[DAYS_FULL[i]]?.includes(selectedMuscle.id);
                  return (
                    <motion.button
                      key={day}
                      whileTap={{ scale: 0.88 }}
                      onClick={() => toggleDay(selectedMuscle.id, DAYS_FULL[i])}
                      className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all"
                      style={{
                        background: isActive ? `${selectedMuscle.color}22` : "rgba(255,255,255,0.04)",
                        border: `1px solid ${isActive ? selectedMuscle.color + "55" : "rgba(255,255,255,0.07)"}`,
                      }}
                    >
                      <span
                        className="text-[10px] font-bold"
                        style={{ color: isActive ? selectedMuscle.color : "rgba(255,255,255,0.50)" }}
                      >
                        {day}
                      </span>
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-3 h-3 rounded-full"
                          style={{ background: selectedMuscle.color }}
                        />
                      )}
                      {!isActive && <div className="w-3 h-3 rounded-full bg-white/10" />}
                    </motion.button>
                  );
                })}
              </div>

              {/* Selected days summary */}
              {getMuscleSchedule(selectedMuscle.id).length > 0 && (
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-4"
                  style={{ background: `${selectedMuscle.color}11`, border: `1px solid ${selectedMuscle.color}22` }}
                >
                  <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: selectedMuscle.color }} />
                  <p className="text-xs" style={{ color: selectedMuscle.color }}>
                    {getMuscleSchedule(selectedMuscle.id).join(", ")}
                  </p>
                </div>
              )}

              {/* Save button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={saveSchedule}
                disabled={getMuscleSchedule(selectedMuscle.id).length === 0}
                className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
                style={{ background: selectedMuscle.color, color: "#fff" }}
              >
                <Check className="w-4 h-4" />
                Guardar
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
