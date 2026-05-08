import { useState, useRef, useEffect } from "react";
import { Activity } from "lucide-react";
import { motion } from "framer-motion";

interface ExerciseToolsCardProps {
  selectedExercise: string;
  setSelectedExercise: (v: string) => void;
  weight: string;
  setWeight: (v: string) => void;
  reps: string;
  setReps: (v: string) => void;
  sets: string;
  setSets: (v: string) => void;
  restTime: string;
  setRestTime: (v: string) => void;
  todayExercises: { name: string; focus?: string }[];
  saveExercise: () => void;
  justSaved: boolean;
  saveButtonLabel?: string;
  estimatedOneRM?: number;
  userId?: string;
  focusTrigger?: number;
  completedSetsCount?: number;
  targetSets?: number;
}

const FIELD_LABEL_STYLE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.30)",
  marginBottom: 6,
  display: "block",
};

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 10,
  padding: "13px 14px",
  color: "white",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

// ── Stepper with embedded editable numeric input ──────────────────────────────
interface QuickStepperProps {
  value: string;
  onChange: (v: string) => void;
  min?: number;
  step?: number;
  inputRef?: React.RefObject<HTMLInputElement>;
  onEnterKey?: () => void;
  enterKeyHint?: "next" | "done" | "go" | "send" | "search";
}

const QuickStepper = ({
  value,
  onChange,
  min = 0,
  step = 1,
  inputRef,
  onEnterKey,
  enterKeyHint = "done",
}: QuickStepperProps) => {
  const numVal = parseFloat(value) || 0;

  const decrement = () => onChange(String(Math.max(min, numVal - step)));
  const increment = () => onChange(String(numVal + step));

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12,
      height: 60,
      overflow: "hidden",
    }}>
      <button
        type="button"
        onClick={decrement}
        style={{
          width: 48, height: "100%", flexShrink: 0,
          background: "transparent", border: "none",
          color: "rgba(255,255,255,0.50)", fontSize: 24,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >−</button>

      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        enterKeyHint={enterKeyHint}
        value={value}
        onChange={(e) => {
          const v = e.target.value.replace(/[^0-9.]/g, "");
          onChange(v);
        }}
        onFocus={(e) => e.currentTarget.select()}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onEnterKey?.();
          }
        }}
        style={{
          flex: 1, height: "100%", background: "transparent",
          border: "none", outline: "none",
          color: "white", fontSize: 26, fontWeight: 900,
          textAlign: "center", minWidth: 0,
        }}
      />

      <button
        type="button"
        onClick={increment}
        style={{
          width: 48, height: "100%", flexShrink: 0,
          background: "transparent", border: "none",
          color: "rgba(255,255,255,0.50)", fontSize: 24,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >+</button>
    </div>
  );
};

// ── Mini stepper for sets / rest (secondary controls) ────────────────────────
interface MiniStepperProps { value: number; onChange: (v: number) => void; min?: number; step?: number; }
const MiniStepper = ({ value, onChange, min = 0, step = 1 }: MiniStepperProps) => (
  <div style={{
    display: "flex", alignItems: "center",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 10, height: 48, overflow: "hidden",
  }}>
    <button type="button" onClick={() => onChange(Math.max(min, value - step))}
      style={{ width: 40, height: "100%", background: "transparent", border: "none",
        color: "rgba(255,255,255,0.30)", fontSize: 20, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
    <div style={{ flex: 1, textAlign: "center", fontSize: 18, fontWeight: 800, color: "white" }}>{value}</div>
    <button type="button" onClick={() => onChange(value + step)}
      style={{ width: 40, height: "100%", background: "transparent", border: "none",
        color: "rgba(255,255,255,0.30)", fontSize: 20, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
export const ExerciseToolsCard = ({
  selectedExercise, setSelectedExercise,
  weight, setWeight,
  reps, setReps,
  sets, setSets,
  restTime, setRestTime,
  todayExercises,
  saveExercise,
  justSaved,
  saveButtonLabel,
  estimatedOneRM,
  userId,
  focusTrigger = 0,
  completedSetsCount = 0,
  targetSets,
}: ExerciseToolsCardProps) => {
  const [activeTab, setActiveTab] = useState<0 | 1>(0);
  const [justConfirmed, setJustConfirmed] = useState(false);

  // Barbell mode
  const barbellKey = userId ? `liftmate_barbell_mode_${userId}` : "liftmate_barbell_mode";
  const [barbellMode, setBarbellMode] = useState(() => localStorage.getItem(barbellKey) === "true");
  const [sideWeight, setSideWeight] = useState(() => {
    const total = parseFloat(weight) || 0;
    return total > 20 ? String(((total - 20) / 2).toFixed(1)) : "20";
  });

  // Refs for focus management
  const weightRef = useRef<HTMLInputElement>(null);
  const repsRef   = useRef<HTMLInputElement>(null);

  // 1RM calculator state
  const [calcWeight, setCalcWeight] = useState(80);
  const [calcReps,   setCalcReps]   = useState(8);
  const [oneRM,      setOneRM]      = useState<number | null>(null);

  // Auto-focus weight after save
  useEffect(() => {
    if (focusTrigger === 0) return;
    setTimeout(() => weightRef.current?.focus(), 100);
  }, [focusTrigger]);

  // Barbell mode → sync total weight to parent
  useEffect(() => {
    if (!barbellMode) return;
    const side = parseFloat(sideWeight) || 0;
    setWeight(String(side * 2 + 20));
  }, [sideWeight, barbellMode]);

  const toggleBarbellMode = (on: boolean) => {
    setBarbellMode(on);
    localStorage.setItem(barbellKey, String(on));
    if (on) {
      const total = parseFloat(weight) || 40;
      setSideWeight(String(Math.max(0, ((total - 20) / 2)).toFixed(1)));
    }
  };

  const handleConfirm = () => {
    setJustConfirmed(true);
    setTimeout(() => {
      setJustConfirmed(false);
      saveExercise();
    }, 300);
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: "13px 0", textAlign: "center",
    fontSize: 12, fontWeight: 700, cursor: "pointer",
    background: "transparent", border: "none",
    borderBottom: active ? "2px solid #2563EB" : "2px solid transparent",
    color: active ? "white" : "rgba(255,255,255,0.30)",
    position: "relative", top: active ? 1 : 0,
    transition: "color 0.15s, border-color 0.15s",
  });

  const displaySets    = parseInt(sets) || 0;
  const displayRest    = parseInt(restTime) || 0;
  const effectiveSets  = targetSets ?? displaySets;
  const sideWeightNum  = parseFloat(sideWeight) || 0;
  const totalBarbellKg = sideWeightNum * 2 + 20;

  return (
    <div style={{
      background: justConfirmed ? "rgba(74,222,128,0.05)" : "#1A1A1A",
      borderRadius: 0,
      border: "none",
      borderBottom: "1px solid #2A2A2A",
      boxShadow: justConfirmed ? "inset 0 0 0 1.5px rgba(74,222,128,0.5)" : "none",
      width: "100%",
      overflow: "hidden",
      transition: "background 0.2s ease, box-shadow 0.2s ease",
    }}>
      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <button style={tabStyle(activeTab === 0)} onClick={() => setActiveTab(0)}>Registar Set</button>
        <button style={tabStyle(activeTab === 1)} onClick={() => setActiveTab(1)}>Calculadora 1RM</button>
      </div>

      <div style={{ padding: 20 }}>

        {/* ── TAB 1: Registar Set ── */}
        {activeTab === 0 && (
          <div>
            {/* Set counter */}
            {selectedExercise && effectiveSets > 0 && (
              <div style={{ marginBottom: 12 }}>
                <motion.span
                  key={completedSetsCount}
                  initial={{ scale: 1.15 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  style={{
                    display: "inline-block",
                    fontSize: 12, fontWeight: 700, color: "#4ADE80",
                  }}
                >
                  Série {completedSetsCount + 1} de {effectiveSets}
                </motion.span>
              </div>
            )}

            {/* Exercise name */}
            <div style={{ marginBottom: 16 }}>
              <span style={FIELD_LABEL_STYLE}>Nome do Exercício</span>
              <input
                type="text"
                list="exercise-options-tools"
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                placeholder="Escreve ou seleciona um exercício..."
                style={INPUT_STYLE}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(96,165,250,0.35)")}
                onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
              />
              <datalist id="exercise-options-tools">
                {todayExercises.map((ex) => <option key={ex.name} value={ex.name} />)}
              </datalist>
              {estimatedOneRM !== undefined && estimatedOneRM > 0 && (
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.30)", marginTop: 6 }}>
                  1RM estimado:{" "}
                  <span style={{ fontWeight: 700, color: "rgba(96,165,250,0.7)" }}>{estimatedOneRM}kg</span>
                </p>
              )}
            </div>

            {/* Weight + Reps quick inputs */}
            <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <span style={FIELD_LABEL_STYLE}>
                  {barbellMode ? "Peso por lado (kg)" : "Peso (kg)"}
                </span>
                {barbellMode ? (
                  <QuickStepper
                    value={sideWeight}
                    onChange={setSideWeight}
                    min={0}
                    step={2.5}
                    inputRef={weightRef}
                    enterKeyHint="next"
                    onEnterKey={() => repsRef.current?.focus()}
                  />
                ) : (
                  <QuickStepper
                    value={weight}
                    onChange={setWeight}
                    min={0}
                    step={2.5}
                    inputRef={weightRef}
                    enterKeyHint="next"
                    onEnterKey={() => repsRef.current?.focus()}
                  />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <span style={FIELD_LABEL_STYLE}>Repetições</span>
                <QuickStepper
                  value={reps}
                  onChange={setReps}
                  min={1}
                  step={1}
                  inputRef={repsRef}
                  enterKeyHint="done"
                  onEnterKey={handleConfirm}
                />
              </div>
            </div>

            {/* Barbell toggle + breakdown */}
            <div style={{ marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => toggleBarbellMode(!barbellMode)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "none", border: "none", cursor: "pointer", padding: 0,
                }}
              >
                <div style={{
                  width: 28, height: 16, borderRadius: 8,
                  background: barbellMode ? "#2563EB" : "rgba(255,255,255,0.15)",
                  position: "relative", transition: "background 0.2s", flexShrink: 0,
                }}>
                  <div style={{
                    position: "absolute", top: 2,
                    left: barbellMode ? 14 : 2,
                    width: 12, height: 12, borderRadius: "50%",
                    background: "white", transition: "left 0.2s",
                  }} />
                </div>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.50)", fontWeight: 600 }}>
                  Calcular por lado
                </span>
              </button>

              {barbellMode && (
                <p style={{ fontSize: 11, color: "#60A5FA", marginTop: 6, fontWeight: 600 }}>
                  2 × {sideWeightNum}kg + 20kg barra = <strong>{totalBarbellKg}kg</strong> total
                </p>
              )}
            </div>

            {/* Sets + Rest (secondary) */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <span style={FIELD_LABEL_STYLE}>Séries planeadas</span>
                <MiniStepper value={displaySets} onChange={(v) => setSets(String(v))} min={1} />
              </div>
              <div style={{ flex: 1 }}>
                <span style={FIELD_LABEL_STYLE}>Descanso (s)</span>
                <MiniStepper value={displayRest} onChange={(v) => setRestTime(String(v))} min={0} step={15} />
              </div>
            </div>

            {/* Confirm Set button */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.97, boxShadow: "none" }}
              onClick={handleConfirm}
              disabled={!selectedExercise.trim()}
              style={{
                width: "100%",
                height: 52,
                borderRadius: 14,
                background: justConfirmed
                  ? "rgba(74,222,128,0.18)"
                  : justSaved
                  ? "#16a34a"
                  : "#2563EB",
                color: "white",
                border: justConfirmed ? "1.5px solid rgba(74,222,128,0.6)" : "none",
                fontSize: 15,
                fontWeight: 700,
                cursor: selectedExercise.trim() ? "pointer" : "not-allowed",
                opacity: selectedExercise.trim() ? 1 : 0.4,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: justConfirmed || justSaved ? "none" : "0 8px 24px rgba(37,99,235,0.3)",
                transition: "background 0.2s ease, border 0.15s ease, box-shadow 0.15s ease",
                boxSizing: "border-box",
              }}
            >
              {justSaved ? "✓ Guardado!" : (saveButtonLabel ?? "✓ Confirmar Set")}
            </motion.button>
          </div>
        )}

        {/* ── TAB 2: Calculadora 1RM ── */}
        {activeTab === 1 && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <span style={FIELD_LABEL_STYLE}>Exercício</span>
              <input
                type="text"
                list="calc-exercise-options-tools"
                placeholder="Ex: Supino Reto, Agachamento"
                style={INPUT_STYLE}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(96,165,250,0.35)")}
                onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
              />
              <datalist id="calc-exercise-options-tools">
                {todayExercises.map((ex) => <option key={ex.name} value={ex.name} />)}
              </datalist>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <span style={FIELD_LABEL_STYLE}>Peso (kg)</span>
                <MiniStepper value={calcWeight} onChange={setCalcWeight} min={0} step={2.5} />
              </div>
              <div style={{ flex: 1 }}>
                <span style={FIELD_LABEL_STYLE}>Repetições</span>
                <MiniStepper value={calcReps} onChange={setCalcReps} min={1} />
              </div>
            </div>

            {oneRM !== null && (
              <div style={{
                marginTop: 12,
                background: "rgba(74,222,128,0.1)",
                border: "1px solid rgba(74,222,128,0.2)",
                borderRadius: 12, padding: "14px 16px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
                    textTransform: "uppercase", color: "rgba(74,222,128,0.6)", marginBottom: 4 }}>
                    1RM Estimado
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: "#4ADE80", lineHeight: 1 }}>
                    {oneRM}
                    <span style={{ fontSize: 14, fontWeight: 600, marginLeft: 4, opacity: 0.7 }}>kg</span>
                  </div>
                </div>
                <Activity size={28} color="#4ADE80" />
              </div>
            )}

            <button
              type="button"
              onClick={() => setOneRM(Math.round(calcWeight * (1 + calcReps / 30)))}
              style={{
                width: "100%", marginTop: 14, padding: 15,
                background: "rgba(74,222,128,0.14)", color: "#4ADE80",
                border: "1px solid rgba(74,222,128,0.25)", borderRadius: 12,
                fontSize: 13, fontWeight: 800, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxSizing: "border-box",
              }}
            >
              <Activity size={16} />
              Calcular 1RM
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
