import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Dumbbell } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { toast } from "sonner";
import { useUserSettings } from "@/hooks/useUserSettings";
import { ALL_EQUIPMENT_OPTIONS } from "@/utils/exerciseAlternatives";
import type { Equipment } from "@/data/exerciseCatalog";

export default function MeuEquipamento() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useUserSettings();
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([]);

  useEffect(() => {
    if (!settings) return;
    const cfg = (settings.alerts_config as Record<string, unknown> | null) || {};
    if (Array.isArray(cfg.available_equipment)) {
      setAvailableEquipment(cfg.available_equipment as Equipment[]);
    }
  }, [settings?.id]);

  const toggleEquipment = (eq: Equipment) => {
    setAvailableEquipment((prev) =>
      prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq]
    );
  };

  const handleSave = async () => {
    const current = (settings?.alerts_config as Record<string, unknown>) || {};
    await updateSettings({ alerts_config: { ...current, available_equipment: availableEquipment } });
    toast.success("Equipamento guardado");
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-black pb-32">
      {/* Header */}
      <div style={{ background: "#000", borderBottom: "1px solid #1A1A1A", padding: "52px 20px 24px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600,
            marginBottom: 24,
          }}
        >
          <ArrowLeft size={18} />
          Voltar
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, flexShrink: 0,
            background: "linear-gradient(135deg, #1D4ED8, #2563EB)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Dumbbell size={26} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: "white", lineHeight: 1.1 }}>
              O meu Equipamento
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
              Usado para sugerir alternativas de exercícios
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "24px 20px 0" }}>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>
          Seleciona o equipamento que tens disponível. O LiftMate vai sugerir alternativas compatíveis durante o treino.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 32 }}>
          {ALL_EQUIPMENT_OPTIONS.map((opt) => {
            const active = availableEquipment.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => toggleEquipment(opt.value)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: active ? "rgba(29,78,216,0.08)" : "#1A1A1A",
                  border: `1px solid ${active ? "rgba(29,78,216,0.5)" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: 14, padding: "12px 14px", cursor: "pointer", textAlign: "left",
                }}
              >
                <span style={{ fontSize: 20, lineHeight: 1 }}>{opt.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 13, fontWeight: 600,
                    color: active ? "#60A5FA" : "rgba(255,255,255,0.6)",
                    lineHeight: 1.3,
                  }}>
                    {opt.label}
                  </p>
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                  background: active ? "#1D4ED8" : "rgba(255,255,255,0.06)",
                  border: `1.5px solid ${active ? "#1D4ED8" : "rgba(255,255,255,0.12)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {active && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          style={{
            width: "100%", height: 50, borderRadius: 14,
            background: "#1D4ED8", border: "none",
            color: "white", fontSize: 15, fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Guardar equipamento
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
