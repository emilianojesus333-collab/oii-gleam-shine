import { useState, useEffect } from "react";
import { AlertTriangle, ShieldAlert, ChevronRight, X, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { HexBadge } from "@/components/ui/HexBadge";

interface FatigueAlertCardProps {
  fatigueIndex: number | null | undefined;
}

const getRecommendation = (index: number): string => {
  if (index >= 81) return "Recomenda-se descanso ou treino leve de mobilidade.";
  if (index >= 61) return "Reduz intensidade ou treina outro grupo muscular.";
  if (index >= 41) return "Reduz ligeiramente o volume (-10%) ou foca em técnica.";
  return "Recuperação boa. Podes treinar normalmente.";
};

export const FatigueAlertCard = ({ fatigueIndex }: FatigueAlertCardProps) => {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const alertKey = `liftmate_fatigue_alert_seen_${user?.id ?? "guest"}`;

  useEffect(() => {
    const today = new Date().toDateString();
    const lastSeen = localStorage.getItem(alertKey);
    if (lastSeen === today) {
      setDismissed(true);
    }
  }, []);

  if (dismissed || !fatigueIndex || fatigueIndex < 41) return null;

  const isVeryHigh = fatigueIndex >= 81;
  const isHigh = fatigueIndex >= 61;
  const icon = isVeryHigh ? ShieldAlert : AlertTriangle;
  const Icon = icon;

  const message = isVeryHigh
    ? "Fadiga muito alta. Um dia de descanso pode melhorar a tua recuperação."
    : isHigh
    ? "Nível de fadiga elevado. Considera reduzir intensidade ou focar em recuperação."
    : "Fadiga moderada. Atenção ao volume de treino.";

  const recommendation = getRecommendation(fatigueIndex);

  const accentColor = isVeryHigh
    ? "red"
    : isHigh
    ? "orange"
    : "yellow";

  const colorClasses = {
    red: { border: "border-red-500/30", bg: "bg-red-500/10", iconBg: "bg-red-500/20", text: "text-red-400" },
    orange: { border: "border-orange-500/30", bg: "bg-orange-500/10", iconBg: "bg-orange-500/20", text: "text-orange-400" },
    yellow: { border: "border-yellow-500/30", bg: "bg-yellow-500/10", iconBg: "bg-yellow-500/20", text: "text-yellow-400" },
  }[accentColor];

  const handleDismiss = () => {
    localStorage.setItem(alertKey, new Date().toDateString());
    setDismissed(true);
  };

  const handleChatWithContext = () => {
    navigate("/chat", { state: { prefill: `O meu índice de fadiga está em ${fatigueIndex}. Que treino recomendam para hoje?` } });
  };

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          transition={{ duration: 0.3 }}
          className={`relative rounded-none p-4 mb-2 ${colorClasses.bg}`}
          style={{ borderLeft: "2px solid #3B82F6" }}
        >
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 h-6 w-6 flex items-center justify-center rounded-full bg-white/5"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          <div className="flex items-start gap-3 pr-6">
            <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${colorClasses.iconBg}`}>
              <Icon className={`h-5 w-5 ${colorClasses.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <HexBadge label="RC" size={22} />
                <p className={`text-sm font-semibold ${colorClasses.text}`}>
                  {isVeryHigh ? "Fadiga Muito Alta" : isHigh ? "Fadiga Alta" : "Fadiga Moderada"}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {message}
              </p>

              {/* Recommendation */}
              <div className="mt-2 flex items-start gap-1.5">
                <Lightbulb className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${colorClasses.text}`} />
                <p className={`text-xs font-medium ${colorClasses.text} leading-relaxed`}>
                  {recommendation}
                </p>
              </div>

              <button
                onClick={handleChatWithContext}
                className={`mt-2.5 flex items-center gap-1 text-xs font-medium ${colorClasses.text}`}
              >
                Ver treino recomendado
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
