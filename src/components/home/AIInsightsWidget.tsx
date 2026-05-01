import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Zap, Heart } from "lucide-react";

export function AIInsightsWidget() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.5 }}
      style={{ margin: "0 16px 16px 16px" }}
    >
      {/* Título */}
      <div
        style={{
          fontSize: 20,
          fontWeight: 900,
          color: "#fff",
          marginBottom: 12,
        }}
      >
        Insights IA
      </div>

      {/* LINHA 1 — Ações IA */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        {/* Card Criar treino */}
        <button
          onClick={() => navigate("/coaching-ia")}
          style={{
            background: "linear-gradient(135deg, #0d2a4a 0%, #0a1e38 100%)",
            border: "1px solid rgba(96,165,250,0.2)",
            borderRadius: 16,
            padding: 16,
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <Zap size={22} color="#60A5FA" style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
            Criar um treino com IA
          </div>
          <div style={{ fontSize: 11, color: "#60A5FA", fontWeight: 600 }}>
            Toca para gerar
          </div>
        </button>

        {/* Card Avaliação Física */}
        <button
          onClick={() => navigate("/avaliacao-fisica")}
          style={{
            background: "linear-gradient(135deg, #1a0d3a 0%, #12082a 100%)",
            border: "1px solid rgba(167,139,250,0.2)",
            borderRadius: 16,
            padding: 16,
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <Heart size={22} color="#A78BFA" style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
            Avaliação Física
          </div>
          <div style={{ fontSize: 11, color: "#A78BFA" }}>
            Descobre o teu nível atual
          </div>
        </button>
      </div>

    </motion.div>
  );
}
