import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const NameAIBanner = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if AI name is already set
    const aiName = localStorage.getItem("liftmate_ai_name");
    const bannerDismissed = localStorage.getItem("liftmate_name_banner_dismissed");
    
    // Show banner if no AI name and not dismissed
    if (!aiName && !bannerDismissed) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
    localStorage.setItem("liftmate_name_banner_dismissed", "true");
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
          className="rounded-2xl bg-primary/10 border border-primary/20 p-4 relative overflow-hidden"
        >
          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1 rounded-full bg-background/50 hover:bg-background/80 transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 shrink-0">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            
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
