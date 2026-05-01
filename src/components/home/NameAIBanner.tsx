import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useAuth } from "@/hooks/useAuth";
import { HexBadge } from "@/components/ui/HexBadge";

// Get user-specific storage key
const getStorageKey = (userId?: string) => userId ? `liftmate_name_banner_dismissed_${userId}` : null;

export const NameAIBanner = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { settings, isLoading } = useUserSettings();

  useEffect(() => {
    if (isLoading || !user?.id) return;
    
    // Check if AI name is already set in database
    const hasAiName = settings?.ai_name && settings.ai_name !== "LiftMate" && settings.ai_name !== "Liftmate";
    const key = getStorageKey(user.id);
    const bannerDismissed = key ? localStorage.getItem(key) : null;
    
    // Show banner if no AI name and not dismissed
    if (!hasAiName && !bannerDismissed) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [settings, isLoading, user?.id]);

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
    const key = getStorageKey(user?.id);
    if (key) {
      localStorage.setItem(key, "true");
    }
  };

  const handleNameAI = () => {
    navigate("/settings");
  };

  return (
    <AnimatePresence>
      {visible && !dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="mx-4 mb-3 relative overflow-hidden"
          style={{ background: "#0F1923", borderRadius: 20, border: "1px solid rgba(255,255,255,0.07)", padding: "18px" }}
        >
          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1 rounded-full bg-background/50 hover:bg-background/80 transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>

          <div className="flex items-start gap-4">
            <HexBadge label="IA" size={42} />
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground mb-1">
                Dá um nome ao teu Chat!
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Personaliza a tua experiência dando um nome ao assistente.
              </p>
              
              <Button
                onClick={handleNameAI}
                size="sm"
                className="gap-2"
              >
                Escolher nome
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
