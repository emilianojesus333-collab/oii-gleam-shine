import { motion } from "framer-motion";
import { Zap, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CARD_PATH = "M12,0 L348,0 Q360,0 360,12 L360,72 Q360,84 348,84 L12,84 Q0,84 0,70 L0,14 Q0,0 12,0 Z";

export const AIInsightsWidget = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
    >
      <h3 style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.01em", marginBottom: 10 }}>
        Insights IA
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Card A — Criar treino com IA */}
        <motion.div
          whileTap={{ scale: 0.985 }}
          onClick={() => navigate("/workout")}
          style={{ position: "relative", width: "100%", height: 84, cursor: "pointer" }}
        >
          <svg
            viewBox="0 0 360 84"
            preserveAspectRatio="none"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          >
            <path d={CARD_PATH} fill="#0E1825" stroke="rgba(96,165,250,0.16)" strokeWidth={1} />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              padding: "0 20px",
              gap: 12,
            }}
          >
            <Zap size={22} color="#60A5FA" style={{ opacity: 0.5, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.65)" }}>
                Criar treino com IA
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", marginTop: 2 }}>
                Gera um plano personalizado com base nos teus objetivos e recuperação.
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); navigate("/workout"); }}
              style={{
                background: "rgba(59,130,246,0.2)",
                color: "#60A5FA",
                border: "1px solid rgba(96,165,250,0.3)",
                borderRadius: 4,
                padding: "7px 16px",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              GERAR
            </button>
          </div>
        </motion.div>

        {/* Card B — Avaliação física */}
        <motion.div
          whileTap={{ scale: 0.985 }}
          onClick={() => navigate("/chat")}
          style={{ position: "relative", width: "100%", height: 84, cursor: "pointer" }}
        >
          <svg
            viewBox="0 0 360 84"
            preserveAspectRatio="none"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          >
            <path d={CARD_PATH} fill="#120E1F" stroke="rgba(167,139,250,0.16)" strokeWidth={1} />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              padding: "0 20px",
              gap: 12,
            }}
          >
            <Heart size={22} color="#A78BFA" style={{ opacity: 0.5, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.65)" }}>
                Avaliação física
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", marginTop: 2 }}>
                Identifica os teus pontos fortes e fracos para melhorar o plano.
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); navigate("/chat"); }}
              style={{
                background: "rgba(139,92,246,0.2)",
                color: "#A78BFA",
                border: "1px solid rgba(167,139,250,0.3)",
                borderRadius: 4,
                padding: "7px 16px",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              GERAR
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
