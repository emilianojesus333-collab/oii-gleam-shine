import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Brain } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { toast } from "sonner";
import { useUserSettings } from "@/hooks/useUserSettings";

const PERSONALITIES = [
  { id: "motivador",   emoji: "💪", name: "Motivador",      desc: "Energético, celebra cada conquista" },
  { id: "exigente",    emoji: "🎯", name: "Coach Exigente", desc: "Direto, focado em resultados" },
  { id: "tecnico",     emoji: "🧠", name: "Técnico",         desc: "Detalhado, explica o porquê" },
  { id: "amigo",       emoji: "😊", name: "Amigo",           desc: "Descontraído e casual" },
  { id: "intenso",     emoji: "⚡", name: "Intenso",         desc: "Alta energia, atleta de elite" },
  { id: "equilibrado", emoji: "🧘", name: "Equilibrado",    desc: "Calmo, foco no longo prazo" },
];

export default function ChatIA() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useUserSettings();

  const [aiNameInput, setAiNameInput] = useState("");
  const [personality, setPersonality] = useState(
    () => localStorage.getItem("liftmate_chat_personality") || "motivador"
  );
  const [tone, setTone] = useState(
    () => localStorage.getItem("liftmate_chat_tone") || "Casual"
  );
  const [focus, setFocus] = useState(
    () => localStorage.getItem("liftmate_chat_focus") || "Tudo"
  );

  useEffect(() => {
    if (!settings) return;
    if (settings.ai_name) setAiNameInput(settings.ai_name);
    const cfg = (settings.alerts_config as Record<string, string> | null) || {};
    if (cfg.chat_personality) { setPersonality(cfg.chat_personality); localStorage.setItem("liftmate_chat_personality", cfg.chat_personality); }
    if (cfg.chat_tone)        { setTone(cfg.chat_tone);               localStorage.setItem("liftmate_chat_tone", cfg.chat_tone); }
    if (cfg.chat_focus)       { setFocus(cfg.chat_focus);             localStorage.setItem("liftmate_chat_focus", cfg.chat_focus); }
  }, [settings?.id]);

  const saveToConfig = async (patch: Record<string, unknown>) => {
    const current = (settings?.alerts_config as Record<string, unknown>) || {};
    await updateSettings({ alerts_config: { ...current, ...patch } });
  };

  const handleSave = async () => {
    const updates: Record<string, unknown> = {
      chat_personality: personality,
      chat_tone: tone,
      chat_focus: focus,
    };
    if (aiNameInput.trim()) {
      await updateSettings({ ai_name: aiNameInput.trim(), alerts_config: { ...((settings?.alerts_config as Record<string, unknown>) || {}), ...updates } });
    } else {
      await saveToConfig(updates);
    }
    localStorage.setItem("liftmate_chat_personality", personality);
    localStorage.setItem("liftmate_chat_tone", tone);
    localStorage.setItem("liftmate_chat_focus", focus);
    toast.success("Preferências guardadas");
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
            <Brain size={26} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: "white", lineHeight: 1.1 }}>
              Chat &amp; IA
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
              Personaliza o teu assistente
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "24px 20px 0" }}>
        {/* Nome do assistente */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>
            NOME DO ASSISTENTE
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={aiNameInput}
              onChange={(e) => setAiNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="Ex: Victoria, Max, Coach..."
              style={{
                flex: 1, height: 44,
                background: "#1A1A1A",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12, padding: "0 16px",
                color: "#fff", fontSize: 14, outline: "none",
              }}
            />
          </div>
        </div>

        {/* Personalidade */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>
            PERSONALIDADE
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {PERSONALITIES.map((p) => {
              const active = personality === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPersonality(p.id)}
                  style={{
                    background: active ? "rgba(29,78,216,0.08)" : "#1A1A1A",
                    border: `1px solid ${active ? "rgba(29,78,216,0.5)" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: 14, padding: 12, textAlign: "left", cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{p.emoji}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{p.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tom */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>
            TOM
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            {["Formal", "Casual", "Intenso"].map((t) => {
              const active = tone === t;
              return (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  style={{
                    flex: 1, height: 44, borderRadius: 12, cursor: "pointer",
                    background: active ? "rgba(29,78,216,0.15)" : "#1A1A1A",
                    border: `1px solid ${active ? "rgba(29,78,216,0.4)" : "rgba(255,255,255,0.06)"}`,
                    color: active ? "#60A5FA" : "rgba(255,255,255,0.5)",
                    fontSize: 14, fontWeight: 600,
                  } as React.CSSProperties}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Foco */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>
            FOCO
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            {["Treino", "Nutrição", "Tudo"].map((f) => {
              const active = focus === f;
              return (
                <button
                  key={f}
                  onClick={() => setFocus(f)}
                  style={{
                    flex: 1, height: 44, borderRadius: 12, cursor: "pointer",
                    background: active ? "rgba(29,78,216,0.15)" : "#1A1A1A",
                    border: `1px solid ${active ? "rgba(29,78,216,0.4)" : "rgba(255,255,255,0.06)"}`,
                    color: active ? "#60A5FA" : "rgba(255,255,255,0.5)",
                    fontSize: 14, fontWeight: 600,
                  } as React.CSSProperties}
                >
                  {f}
                </button>
              );
            })}
          </div>
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
          Guardar
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
