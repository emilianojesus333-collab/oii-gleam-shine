import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, ChevronLeft, ChevronRight, Dumbbell, Info,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import {
  exerciseCatalog,
  searchCatalog,
  getAlternatives,
  MUSCLE_GROUPS,
  EQUIPMENT_OPTIONS,
  DIFFICULTY_OPTIONS,
  MUSCLE_COLORS,
  DIFFICULTY_CONFIG,
  type CatalogExercise,
  type Equipment,
  type Difficulty,
} from "@/data/exerciseCatalog";

// ─── Exercise detail sheet ────────────────────────────────────────────────────

const ExerciseSheet = ({
  exercise,
  onClose,
}: {
  exercise: CatalogExercise;
  onClose: () => void;
}) => {
  const cfg = DIFFICULTY_CONFIG[exercise.difficulty];
  const alternatives = getAlternatives(exercise.id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "#111", borderRadius: "20px 20px 0 0",
          padding: "24px 20px 40px",
          maxHeight: "85vh", overflowY: "auto",
        }}
      >
        {/* Drag handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", margin: "0 auto 20px" }} />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ flex: 1, paddingRight: 12 }}>
            <p style={{ fontSize: 18, fontWeight: 900, color: "white", marginBottom: 3, lineHeight: 1.2 }}>
              {exercise.name.pt}
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{exercise.name.en}</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, padding: 6, cursor: "pointer" }}
          >
            <X size={16} color="rgba(255,255,255,0.6)" />
          </button>
        </div>

        {/* Badges row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
            background: cfg.bg, color: cfg.color,
          }}>
            {cfg.label}
          </span>
          {exercise.muscleGroups.map((m) => (
            <span key={m} style={{
              fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20,
              background: `${MUSCLE_COLORS[m] ?? "#60A5FA"}18`,
              color: MUSCLE_COLORS[m] ?? "#60A5FA",
            }}>
              {m}
            </span>
          ))}
          {exercise.equipment.map((eq) => (
            <span key={eq} style={{
              fontSize: 11, padding: "4px 10px", borderRadius: 20,
              background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)",
            }}>
              {eq}
            </span>
          ))}
        </div>

        {/* Instructions */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginBottom: 8 }}>
            EXECUÇÃO
          </p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
            {exercise.instructions}
          </p>
        </div>

        {/* Tips */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginBottom: 8 }}>
            DICAS TÉCNICAS
          </p>
          {exercise.tips.map((tip, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <span style={{ color: "#60A5FA", fontSize: 12, marginTop: 1 }}>•</span>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{tip}</p>
            </div>
          ))}
        </div>

        {/* Secondary muscles */}
        {exercise.secondaryMuscles.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginBottom: 8 }}>
              MÚSCULOS SECUNDÁRIOS
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {exercise.secondaryMuscles.map((m) => (
                <span key={m} style={{
                  fontSize: 11, padding: "3px 10px", borderRadius: 20,
                  background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)",
                }}>
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Alternatives */}
        {alternatives.length > 0 && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginBottom: 10 }}>
              ALTERNATIVAS
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {alternatives.map((alt) => (
                <div key={alt.id} style={{
                  background: "#1a1a1a", borderRadius: 10, padding: "10px 12px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "white" }}>{alt.name.pt}</p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                      {alt.equipment.join(", ")}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
                    background: DIFFICULTY_CONFIG[alt.difficulty].bg,
                    color: DIFFICULTY_CONFIG[alt.difficulty].color,
                  }}>
                    {DIFFICULTY_CONFIG[alt.difficulty].label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// ─── Exercise card ────────────────────────────────────────────────────────────

const ExerciseCard = ({
  exercise,
  onPress,
}: {
  exercise: CatalogExercise;
  onPress: () => void;
}) => {
  const cfg = DIFFICULTY_CONFIG[exercise.difficulty];
  const primaryColor = MUSCLE_COLORS[exercise.muscleGroups[0]] ?? "#60A5FA";

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onPress}
      style={{
        width: "100%", textAlign: "left", background: "#141414",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12, padding: "13px 14px",
        cursor: "pointer", marginBottom: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1, paddingRight: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: "white", marginBottom: 2, lineHeight: 1.3 }}>
            {exercise.name.pt}
          </p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>
            {exercise.name.en}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {exercise.muscleGroups.map((m) => (
              <span key={m} style={{
                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                background: `${MUSCLE_COLORS[m] ?? "#60A5FA"}18`,
                color: MUSCLE_COLORS[m] ?? "#60A5FA",
              }}>
                {m}
              </span>
            ))}
            {exercise.equipment.slice(0, 2).map((eq) => (
              <span key={eq} style={{
                fontSize: 10, padding: "2px 8px", borderRadius: 20,
                background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)",
              }}>
                {eq}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
            background: cfg.bg, color: cfg.color,
          }}>
            {cfg.label}
          </span>
          <Info size={14} color="rgba(255,255,255,0.2)" />
        </div>
      </div>
    </motion.button>
  );
};

// ─── Filter chip ──────────────────────────────────────────────────────────────

const FilterChip = ({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color?: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    style={{
      flexShrink: 0, padding: "6px 14px", borderRadius: 20, cursor: "pointer",
      fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
      background: active ? (color ? `${color}22` : "rgba(96,165,250,0.18)") : "rgba(255,255,255,0.06)",
      border: `1px solid ${active ? (color ?? "#60A5FA") + "55" : "rgba(255,255,255,0.08)"}`,
      color: active ? (color ?? "#60A5FA") : "rgba(255,255,255,0.45)",
      transition: "all 0.15s",
    }}
  >
    {label}
  </button>
);

// ─── Main page ────────────────────────────────────────────────────────────────

const ExerciseLibrary = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("Todos");
  const [equipFilter, setEquipFilter] = useState<Equipment | "todos">("todos");
  const [diffFilter, setDiffFilter] = useState<Difficulty | "todos">("todos");
  const [selectedExercise, setSelectedExercise] = useState<CatalogExercise | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () =>
      searchCatalog(query, {
        muscleGroup: muscleFilter === "Todos" ? undefined : muscleFilter,
        equipment: equipFilter,
        difficulty: diffFilter,
      }),
    [query, muscleFilter, equipFilter, diffFilter]
  );

  const totalCount = exerciseCatalog.length;

  return (
    <div style={{ minHeight: "100vh", background: "#000", paddingBottom: 90 }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(180deg, #0d1117 0%, #000 100%)",
        padding: "52px 16px 16px",
        position: "sticky", top: 0, zIndex: 10,
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 10, padding: "6px 8px", cursor: "pointer" }}
          >
            <ChevronLeft size={18} color="rgba(255,255,255,0.7)" />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: "white", lineHeight: 1 }}>
              Biblioteca de Exercícios
            </h1>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
              {totalCount} exercícios catalogados
            </p>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(96,165,250,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Dumbbell size={18} color="#60A5FA" />
          </div>
        </div>

        {/* Search bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12, padding: "10px 14px", marginBottom: 14,
        }}>
          <Search size={15} color="rgba(255,255,255,0.3)" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisa por nome PT ou EN..."
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              color: "white", fontSize: 13,
            }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <X size={14} color="rgba(255,255,255,0.3)" />
            </button>
          )}
        </div>

        {/* Muscle group filter */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6, scrollbarWidth: "none" }}>
          {MUSCLE_GROUPS.map((m) => (
            <FilterChip
              key={m}
              label={m}
              active={muscleFilter === m}
              color={m !== "Todos" ? MUSCLE_COLORS[m] : undefined}
              onClick={() => setMuscleFilter(m)}
            />
          ))}
        </div>
      </div>

      {/* Secondary filters */}
      <div style={{ padding: "12px 16px", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none", flex: 1 }}>
          {EQUIPMENT_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.value}
              label={opt.label}
              active={equipFilter === opt.value}
              onClick={() => setEquipFilter(opt.value)}
            />
          ))}
        </div>
      </div>

      <div style={{ padding: "0 16px 8px", display: "flex", gap: 6 }}>
        {DIFFICULTY_OPTIONS.map((opt) => (
          <FilterChip
            key={opt.value}
            label={opt.label}
            active={diffFilter === opt.value}
            color={
              opt.value !== "todos"
                ? DIFFICULTY_CONFIG[opt.value as Difficulty].color
                : undefined
            }
            onClick={() => setDiffFilter(opt.value)}
          />
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", alignSelf: "center" }}>
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Results */}
      <div style={{ padding: "0 16px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>🔍</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>
              Nenhum exercício encontrado
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
              Tenta outros filtros ou outra pesquisa
            </p>
          </div>
        ) : (
          filtered.map((ex) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              onPress={() => setSelectedExercise(ex)}
            />
          ))
        )}
      </div>

      <BottomNav />

      {/* Detail sheet */}
      <AnimatePresence>
        {selectedExercise && (
          <ExerciseSheet
            exercise={selectedExercise}
            onClose={() => setSelectedExercise(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExerciseLibrary;
