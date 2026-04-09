import { useState } from "react";
import { Save, Activity } from "lucide-react";

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
}

const FIELD_LABEL_STYLE: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.28)",
  marginBottom: 6,
  display: "block",
};

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 10,
  padding: "13px 14px",
  color: "white",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

interface StepperProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
}

const Stepper = ({ value, onChange, min = 0, step = 1 }: StepperProps) => (
  <div
    style={{
      display: "flex",
      flexDirection: "row",
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 10,
      height: 52,
      overflow: "hidden",
    }}
  >
    <button
      type="button"
      onClick={() => onChange(Math.max(min, value - step))}
      style={{
        width: 44,
        flexShrink: 0,
        background: "transparent",
        border: "none",
        color: "rgba(255,255,255,0.38)",
        fontSize: 22,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      −
    </button>
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 20,
        fontWeight: 900,
        color: "white",
      }}
    >
      {value}
    </div>
    <button
      type="button"
      onClick={() => onChange(value + step)}
      style={{
        width: 44,
        flexShrink: 0,
        background: "transparent",
        border: "none",
        color: "rgba(255,255,255,0.38)",
        fontSize: 22,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      +
    </button>
  </div>
);

export const ExerciseToolsCard = ({
  selectedExercise,
  setSelectedExercise,
  weight,
  setWeight,
  reps,
  setReps,
  sets,
  setSets,
  restTime,
  setRestTime,
  todayExercises,
  saveExercise,
  justSaved,
  saveButtonLabel,
}: ExerciseToolsCardProps) => {
  const [activeTab, setActiveTab] = useState<0 | 1>(0);

  // 1RM calculator internal state
  const [calcExercise, setCalcExercise] = useState("");
  const [calcWeight, setCalcWeight] = useState(80);
  const [calcReps, setCalcReps] = useState(8);
  const [oneRM, setOneRM] = useState<number | null>(null);

  const handleCalculate = () => {
    const result = Math.round(calcWeight * (1 + calcReps / 30));
    setOneRM(result);
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "14px 0",
    textAlign: "center",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    background: "transparent",
    border: "none",
    borderBottom: active ? "2px solid #2563EB" : "2px solid transparent",
    color: active ? "white" : "rgba(255,255,255,0.3)",
    position: "relative",
    top: active ? 1 : 0,
    transition: "color 0.15s, border-color 0.15s",
  });

  return (
    <div
      style={{
        background: "#1A1A1A",
        borderRadius: 0,
        border: "none",
        borderBottom: "1px solid #2A2A2A",
        width: "100%",
        overflow: "hidden",
      }}
    >
      {/* Tabs row */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <button style={tabStyle(activeTab === 0)} onClick={() => setActiveTab(0)}>
          Registar Exercício
        </button>
        <button style={tabStyle(activeTab === 1)} onClick={() => setActiveTab(1)}>
          Calculadora 1RM
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: 20 }}>
        {/* ── TAB 1: Registar Exercício ── */}
        {activeTab === 0 && (
          <div>
            {/* Exercise name */}
            <div style={{ marginBottom: 14 }}>
              <span style={FIELD_LABEL_STYLE}>Nome do Exercício</span>
              <input
                type="text"
                list="exercise-options-tools"
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                placeholder="Escreve ou seleciona um exercício..."
                style={INPUT_STYLE}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(96,165,250,0.35)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
              />
              <datalist id="exercise-options-tools">
                {todayExercises.map((ex) => (
                  <option key={ex.name} value={ex.name} />
                ))}
              </datalist>
            </div>

            {/* Row 1: Peso + Reps */}
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <span style={FIELD_LABEL_STYLE}>Peso (kg)</span>
                <Stepper
                  value={parseInt(weight) || 0}
                  onChange={(v) => setWeight(String(v))}
                  min={0}
                  step={2.5}
                />
              </div>
              <div style={{ flex: 1 }}>
                <span style={FIELD_LABEL_STYLE}>Repetições</span>
                <Stepper
                  value={parseInt(reps) || 0}
                  onChange={(v) => setReps(String(v))}
                  min={1}
                />
              </div>
            </div>

            {/* Row 2: Séries + Descanso */}
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <div style={{ flex: 1 }}>
                <span style={FIELD_LABEL_STYLE}>Séries</span>
                <Stepper
                  value={parseInt(sets) || 0}
                  onChange={(v) => setSets(String(v))}
                  min={1}
                />
              </div>
              <div style={{ flex: 1 }}>
                <span style={FIELD_LABEL_STYLE}>Descanso (s)</span>
                <Stepper
                  value={parseInt(restTime) || 0}
                  onChange={(v) => setRestTime(String(v))}
                  min={0}
                  step={15}
                />
              </div>
            </div>

            {/* Save button */}
            <button
              type="button"
              onClick={saveExercise}
              disabled={!selectedExercise.trim()}
              style={{
                width: "100%",
                marginTop: 14,
                padding: 15,
                background: justSaved ? "#16a34a" : "#0D0D0D",
                color: "white",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 800,
                border: justSaved ? "none" : "1px solid rgba(255,255,255,0.12)",
                cursor: selectedExercise.trim() ? "pointer" : "not-allowed",
                opacity: selectedExercise.trim() ? 1 : 0.45,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "background 0.2s",
                boxSizing: "border-box",
              }}
            >
              <Save size={16} />
              {justSaved ? "Guardado!" : (saveButtonLabel ?? "Guardar Exercício")}
            </button>
          </div>
        )}

        {/* ── TAB 2: Calculadora 1RM ── */}
        {activeTab === 1 && (
          <div>
            {/* Exercise name */}
            <div style={{ marginBottom: 14 }}>
              <span style={FIELD_LABEL_STYLE}>Exercício</span>
              <input
                type="text"
                list="calc-exercise-options-tools"
                value={calcExercise}
                onChange={(e) => setCalcExercise(e.target.value)}
                placeholder="Ex: Supino Reto, Agachamento"
                style={INPUT_STYLE}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(96,165,250,0.35)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
              />
              <datalist id="calc-exercise-options-tools">
                {todayExercises.map((ex) => (
                  <option key={ex.name} value={ex.name} />
                ))}
              </datalist>
            </div>

            {/* Row: Peso + Reps */}
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <span style={FIELD_LABEL_STYLE}>Peso (kg)</span>
                <Stepper
                  value={calcWeight}
                  onChange={setCalcWeight}
                  min={0}
                  step={2.5}
                />
              </div>
              <div style={{ flex: 1 }}>
                <span style={FIELD_LABEL_STYLE}>Repetições</span>
                <Stepper
                  value={calcReps}
                  onChange={setCalcReps}
                  min={1}
                />
              </div>
            </div>

            {/* Result area — shown after calculation */}
            {oneRM !== null && (
              <div
                style={{
                  marginTop: 12,
                  background: "rgba(52,211,153,0.1)",
                  border: "1px solid rgba(52,211,153,0.2)",
                  borderRadius: 12,
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "rgba(52,211,153,0.6)",
                      marginBottom: 4,
                    }}
                  >
                    1RM Estimado
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: "#34D399", lineHeight: 1 }}>
                    {oneRM}
                    <span style={{ fontSize: 14, fontWeight: 600, marginLeft: 4, opacity: 0.7 }}>kg</span>
                  </div>
                </div>
                <Activity size={28} color="#34D399" />
              </div>
            )}

            {/* Calculate button */}
            <button
              type="button"
              onClick={handleCalculate}
              style={{
                width: "100%",
                marginTop: 14,
                padding: 15,
                background: "rgba(52,211,153,0.14)",
                color: "#34D399",
                border: "1px solid rgba(52,211,153,0.25)",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
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
