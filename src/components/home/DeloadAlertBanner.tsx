import { useState } from "react";
import { AlertTriangle, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useDeloadAlert } from "@/hooks/useDeloadAlert";
import { useAuth } from "@/hooks/useAuth";

export const DeloadAlertBanner = () => {
  const alert = useDeloadAlert();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(() => {
    if (!user?.id) return false;
    const key = `liftmate_deload_banner_${user.id}`;
    return localStorage.getItem(key) === new Date().toDateString();
  });

  // Only show for consider / recommended / urgent
  if (alert.loading || alert.severity === "none" || dismissed) return null;

  const handleDismiss = () => {
    if (user?.id) {
      localStorage.setItem(`liftmate_deload_banner_${user.id}`, new Date().toDateString());
    }
    setDismissed(true);
  };

  const handleLearnMore = () => {
    navigate("/chat", {
      state: {
        prefill: `O meu volume aumentou ${Math.max(0, alert.volumeSpike)}% nas últimas 3 semanas${alert.consecutiveHighWeeks >= 2 ? ` (${alert.consecutiveHighWeeks} semanas consecutivas de volume elevado)` : ""}. Devo fazer uma semana de deload? Como deve ser estruturada?`,
      },
    });
  };

  const isUrgent = alert.severity === "urgent" || alert.severity === "recommended";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25 }}
        style={{
          margin: "0 16px 12px",
          background: isUrgent ? "rgba(251,146,60,0.08)" : "rgba(251,191,36,0.08)",
          border: `1px solid ${isUrgent ? "rgba(251,146,60,0.25)" : "rgba(251,191,36,0.2)"}`,
          borderRadius: 14,
          padding: "12px 14px",
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        {/* Icon */}
        <div style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          background: isUrgent ? "rgba(251,146,60,0.12)" : "rgba(251,191,36,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginTop: 1,
        }}>
          <AlertTriangle size={15} color={isUrgent ? "#FB923C" : "#FBBF24"} />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 12, fontWeight: 700,
            color: isUrgent ? "#FB923C" : "#FBBF24",
            marginBottom: 3,
          }}>
            {isUrgent ? "Deload recomendado" : "Considera uma semana de deload"}
          </p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
            {alert.volumeSpike > 0
              ? `Volume aumentou ${alert.volumeSpike}% nas últimas 3 semanas`
              : "Volume elevado por várias semanas consecutivas"}
            {alert.consecutiveHighWeeks >= 2
              ? ` · ${alert.consecutiveHighWeeks} semanas seguidas`
              : ""}
          </p>
          <button
            type="button"
            onClick={handleLearnMore}
            style={{
              marginTop: 8, background: "none", border: "none", cursor: "pointer",
              padding: 0, display: "flex", alignItems: "center", gap: 4,
              color: isUrgent ? "#FB923C" : "#FBBF24", fontSize: 11, fontWeight: 700,
            }}
          >
            Saber mais
            <ChevronRight size={12} />
          </button>
        </div>

        {/* Dismiss */}
        <button
          type="button"
          onClick={handleDismiss}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 2, flexShrink: 0 }}
        >
          <X size={14} color="rgba(255,255,255,0.25)" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
