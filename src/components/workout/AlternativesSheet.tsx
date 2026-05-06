import { motion, AnimatePresence } from "framer-motion";
import { X, Dumbbell, ArrowRight } from "lucide-react";
import { DIFFICULTY_CONFIG, MUSCLE_COLORS, type CatalogExercise } from "@/data/exerciseCatalog";

interface AlternativesSheetProps {
  open: boolean;
  exerciseName: string;
  alternatives: CatalogExercise[];
  onClose: () => void;
  onSelect: (alternative: CatalogExercise) => void;
}

export const AlternativesSheet = ({
  open,
  exerciseName,
  alternatives,
  onClose,
  onSelect,
}: AlternativesSheetProps) => (
  <AnimatePresence>
    {open && (
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
            padding: "20px 20px 40px",
          }}
        >
          {/* Handle */}
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", margin: "0 auto 20px" }} />

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <div>
              <p style={{ fontSize: 16, fontWeight: 900, color: "white" }}>
                Alternativas
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                Para: {exerciseName}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, padding: 6, cursor: "pointer" }}
            >
              <X size={16} color="rgba(255,255,255,0.6)" />
            </button>
          </div>

          {alternatives.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <p style={{ fontSize: 28, marginBottom: 10 }}>🔍</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                Sem alternativas para o teu equipamento
              </p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
                Adiciona mais equipamento nas Definições
              </p>
            </div>
          ) : (
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              {alternatives.map((alt) => {
                const cfg = DIFFICULTY_CONFIG[alt.difficulty];
                const primaryColor = MUSCLE_COLORS[alt.muscleGroups[0]] ?? "#60A5FA";

                return (
                  <motion.button
                    key={alt.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelect(alt)}
                    style={{
                      width: "100%", textAlign: "left",
                      background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 14, padding: "14px 14px",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {/* Icon */}
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                        background: `${primaryColor}18`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Dumbbell size={18} color={primaryColor} />
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 800, color: "white", marginBottom: 3, lineHeight: 1.2 }}>
                          {alt.name.pt}
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {alt.muscleGroups.map((m) => (
                            <span key={m} style={{
                              fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 20,
                              background: `${MUSCLE_COLORS[m] ?? "#60A5FA"}18`,
                              color: MUSCLE_COLORS[m] ?? "#60A5FA",
                            }}>
                              {m}
                            </span>
                          ))}
                          {alt.equipment.slice(0, 2).map((eq) => (
                            <span key={eq} style={{
                              fontSize: 10, padding: "2px 7px", borderRadius: 20,
                              background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)",
                            }}>
                              {eq}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Difficulty + arrow */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
                          background: cfg.bg, color: cfg.color,
                        }}>
                          {cfg.label}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <span style={{ fontSize: 10, color: "#60A5FA", fontWeight: 700 }}>Usar esta</span>
                          <ArrowRight size={11} color="#60A5FA" />
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
