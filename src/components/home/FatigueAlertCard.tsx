import { useState, useEffect } from "react";
import { AlertTriangle, ShieldAlert, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface FatigueAlertCardProps {
  fatigueIndex: number | null | undefined;
}

export const FatigueAlertCard = ({ fatigueIndex }: FatigueAlertCardProps) => {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const today = new Date().toDateString();
    const lastSeen = localStorage.getItem("liftmate_fatigue_alert_seen");
    if (lastSeen === today) {
      setDismissed(true);
    }
  }, []);

  if (dismissed || !fatigueIndex || fatigueIndex < 61) return null;

  const isVeryHigh = fatigueIndex >= 81;
  const icon = isVeryHigh ? ShieldAlert : AlertTriangle;
  const Icon = icon;
  const message = isVeryHigh
    ? "Fadiga muito alta. Um dia de descanso pode melhorar a tua recuperação."
    : "Nível de fadiga elevado. Considera reduzir intensidade ou focar em recuperação.";

  const handleDismiss = () => {
    localStorage.setItem("liftmate_fatigue_alert_seen", new Date().toDateString());
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          transition={{ duration: 0.3 }}
          className={`relative rounded-2xl border p-4 ${
            isVeryHigh
              ? "border-red-500/30 bg-red-500/10"
              : "border-orange-500/30 bg-orange-500/10"
          }`}
        >
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 h-6 w-6 flex items-center justify-center rounded-full bg-white/5"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          <div className="flex items-start gap-3 pr-6">
            <div
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                isVeryHigh ? "bg-red-500/20" : "bg-orange-500/20"
              }`}
            >
              <Icon
                className={`h-5 w-5 ${isVeryHigh ? "text-red-400" : "text-orange-400"}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-semibold ${
                  isVeryHigh ? "text-red-400" : "text-orange-400"
                }`}
              >
                {isVeryHigh ? "Fadiga Muito Alta" : "Fadiga Alta"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {message}
              </p>
              <button
                onClick={() => navigate("/chat")}
                className={`mt-2 flex items-center gap-1 text-xs font-medium ${
                  isVeryHigh ? "text-red-400" : "text-orange-400"
                }`}
              >
                Ver recomendações
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
