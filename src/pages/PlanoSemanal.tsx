import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar } from "lucide-react";
import { WeeklyPlanCalendar } from "@/components/settings/WeeklyPlanCalendar";
import { BottomNav } from "@/components/BottomNav";

export default function PlanoSemanal() {
  const navigate = useNavigate();

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
            <Calendar size={26} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: "white", lineHeight: 1.1 }}>
              Plano Semanal
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
              Define os teus dias de treino
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <WeeklyPlanCalendar />

      {/* Save button */}
      <div style={{ padding: "20px 20px 0" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: "100%", height: 50, borderRadius: 14,
            background: "#1D4ED8", border: "none",
            color: "white", fontSize: 15, fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Guardar plano
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
