import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useUserSettings } from "@/hooks/useUserSettings";
import { BottomNav } from "@/components/BottomNav";

const MUSCLES = ["Peito", "Costas", "Pernas", "Ombros", "Bíceps", "Tríceps", "Core"];

const DAYS = [
  { full: "Segunda-feira", short: "Seg" },
  { full: "Terça-feira",   short: "Ter" },
  { full: "Quarta-feira",  short: "Qua" },
  { full: "Quinta-feira",  short: "Qui" },
  { full: "Sexta-feira",   short: "Sex" },
  { full: "Sábado",        short: "Sáb" },
  { full: "Domingo",       short: "Dom" },
];

export default function PlanoSemanal() {
  const navigate = useNavigate();
  const { settings, updateSchedule } = useUserSettings();

  const existingSchedule = useMemo<Record<string, string[]>>(() => {
    const raw = (settings?.onboarding_data?.schedule || {}) as Record<string, string | string[]>;
    const out: Record<string, string[]> = {};
    for (const [day, val] of Object.entries(raw)) {
      out[day] = Array.isArray(val) ? val : [val];
    }
    return out;
  }, [settings]);

  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleMuscle = (m: string) => {
    setSelectedMuscles((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((x) => x !== day) : [...prev, day]
    );
  };

  const handleOpenModal = () => {
    if (selectedMuscles.length === 0) return;
    setSelectedDays([]);
    setShowModal(true);
  };

  const handleConfirm = async () => {
    if (selectedDays.length === 0) {
      toast.error("Seleciona pelo menos um dia");
      return;
    }
    setSaving(true);
    try {
      const updated: Record<string, string[]> = { ...existingSchedule };
      for (const day of selectedDays) {
        updated[day] = [...selectedMuscles];
      }
      await updateSchedule(updated);
      toast.success("Plano atualizado!");
      setShowModal(false);
      setSelectedMuscles([]);
    } catch {
      toast.error("Erro ao guardar plano");
    } finally {
      setSaving(false);
    }
  };

  // Build a summary: muscle → days assigned
  const muscleAssignments = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const [dayFull, muscles] of Object.entries(existingSchedule)) {
      const day = DAYS.find((d) => d.full === dayFull);
      if (!day) continue;
      for (const m of muscles) {
        if (m === "Descanso") continue;
        if (!map[m]) map[m] = [];
        map[m].push(day.short);
      }
    }
    return map;
  }, [existingSchedule]);

  return (
    <div className="min-h-screen bg-black pb-32">

      {/* Header */}
      <div style={{ background: "#000", borderBottom: "1px solid #1A1A1A", padding: "52px 20px 20px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600,
            marginBottom: 20,
          }}
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "white", marginBottom: 4 }}>
          Plano Semanal
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
          Seleciona os músculos e atribui os dias de treino
        </p>
      </div>

      {/* Muscle list */}
      <div style={{ padding: "24px 20px 0" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
          Grupos musculares
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {MUSCLES.map((m) => {
            const isSelected = selectedMuscles.includes(m);
            const assignedDays = muscleAssignments[m] || [];
            return (
              <motion.button
                key={m}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleMuscle(m)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 16px",
                  background: isSelected ? "rgba(37,99,235,0.12)" : "#141414",
                  border: isSelected ? "1px solid rgba(37,99,235,0.35)" : "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 14,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {/* Checkbox */}
                  <div style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    background: isSelected ? "#2563EB" : "rgba(255,255,255,0.06)",
                    border: isSelected ? "none" : "1px solid rgba(255,255,255,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {isSelected && <Check size={13} color="white" strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: isSelected ? "white" : "rgba(255,255,255,0.75)" }}>
                    {m}
                  </span>
                </div>
                {assignedDays.length > 0 && (
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>
                    {assignedDays.join(", ")}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Assign days button */}
      <div style={{ padding: "20px 20px 0" }}>
        <motion.button
          whileTap={selectedMuscles.length > 0 ? { scale: 0.97 } : {}}
          onClick={handleOpenModal}
          disabled={selectedMuscles.length === 0}
          style={{
            width: "100%", height: 50, borderRadius: 14,
            background: selectedMuscles.length > 0 ? "#2563EB" : "rgba(255,255,255,0.05)",
            border: selectedMuscles.length > 0 ? "none" : "1px solid rgba(255,255,255,0.08)",
            color: selectedMuscles.length > 0 ? "white" : "rgba(255,255,255,0.3)",
            fontSize: 15, fontWeight: 700, cursor: selectedMuscles.length > 0 ? "pointer" : "not-allowed",
          }}
        >
          {selectedMuscles.length > 0
            ? `Atribuir dias → (${selectedMuscles.join(", ")})`
            : "Seleciona músculos primeiro"}
        </motion.button>
      </div>

      {/* Current schedule summary */}
      {Object.keys(existingSchedule).length > 0 && (
        <div style={{ padding: "28px 20px 0" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
            Plano atual
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {DAYS.filter((d) => existingSchedule[d.full]?.length > 0).map((d) => {
              const muscles = existingSchedule[d.full] || [];
              if (muscles.length === 0) return null;
              return (
                <div key={d.full} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px",
                  background: "#111", borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", minWidth: 28 }}>
                    {d.short}
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {muscles.map((mg) => (
                      <span key={mg} style={{
                        padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: "rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.7)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}>
                        {mg}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <BottomNav />

      {/* Day assignment modal — centered */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 9999,
              background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
            }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#141414", borderRadius: 24, padding: 24,
                width: "100%", maxWidth: 380,
              }}
            >
              {/* Modal header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "white" }}>
                  Escolhe os dias
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
                >
                  <X size={18} color="rgba(255,255,255,0.4)" />
                </button>
              </div>

              {/* Selected muscles */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 20 }}>
                {selectedMuscles.map((m) => (
                  <span key={m} style={{
                    padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                    background: "rgba(37,99,235,0.15)",
                    color: "#60A5FA",
                    border: "1px solid rgba(37,99,235,0.25)",
                  }}>
                    {m}
                  </span>
                ))}
              </div>

              {/* Days grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20 }}>
                {DAYS.map((d) => {
                  const active = selectedDays.includes(d.full);
                  return (
                    <motion.button
                      key={d.full}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleDay(d.full)}
                      style={{
                        height: 52, borderRadius: 12,
                        background: active ? "#2563EB" : "rgba(255,255,255,0.06)",
                        border: active ? "none" : "1px solid rgba(255,255,255,0.09)",
                        color: active ? "white" : "rgba(255,255,255,0.5)",
                        fontSize: 13, fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {d.short}
                    </motion.button>
                  );
                })}
              </div>

              {/* Confirm */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleConfirm}
                disabled={saving || selectedDays.length === 0}
                style={{
                  width: "100%", height: 48, borderRadius: 12,
                  background: selectedDays.length > 0 ? "#2563EB" : "rgba(255,255,255,0.06)",
                  border: "none",
                  color: selectedDays.length > 0 ? "white" : "rgba(255,255,255,0.3)",
                  fontSize: 15, fontWeight: 800, cursor: selectedDays.length > 0 ? "pointer" : "not-allowed",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "A guardar..." : "Concluir"}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
