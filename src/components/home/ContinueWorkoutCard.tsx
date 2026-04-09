import { motion } from "framer-motion";
import { Play, Dumbbell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useActiveSession } from "@/hooks/useActiveSession";
import { HexBadge } from "@/components/ui/HexBadge";

export const ContinueWorkoutCard = () => {
  const navigate = useNavigate();
  const { activeSession, loading } = useActiveSession();

  if (loading || !activeSession) return null;

  const planned = activeSession.planned_exercises.filter((e) => e.source === "ai");
  const completed = planned.filter((e) => e.completed).length;
  const total = planned.length;
  const isActive = activeSession.status === "in_progress" || activeSession.status === "planned";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-none p-4 overflow-hidden mb-2"
      style={{ borderLeft: "2px solid #3B82F6" }}
    >
      <div className="flex items-center gap-3 mb-3">
        <HexBadge label="TR" />
        <div className="flex-1">
          <h3 className="text-sm font-bold text-foreground">
            {isActive ? "Treino em andamento" : "Treino planeado"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {activeSession.muscle_groups?.join(" + ")} · {completed}/{total} exercícios
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-muted rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
        />
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate("/workout")}
        className="w-full py-3 rounded-xl font-semibold bg-primary text-primary-foreground flex items-center justify-center gap-2 shadow-lg shadow-primary/30"
      >
        <Play className="w-4 h-4" />
        {isActive ? "Continuar Treino" : "Começar Treino"}
      </motion.button>
    </motion.div>
  );
};
