import { motion } from "framer-motion";
import { Dumbbell, Leaf, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TodayWorkoutCardProps {
  workout: string | null;
  stimulus: string;
  isRestDay: boolean;
}

export function TodayWorkoutCard({ workout, stimulus, isRestDay }: TodayWorkoutCardProps) {
  const navigate = useNavigate();

  const workoutLabel = isRestDay
    ? "REST DAY"
    : (workout || "TREINO").toUpperCase().replace(/\s*•\s*/g, " + ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-1"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-foreground tracking-tight">
          {workoutLabel}
        </h2>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/workout")}
          className="text-xs text-muted-foreground flex items-center gap-0.5"
        >
          ver mais
          <ChevronRight className="w-3 h-3" />
        </motion.button>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {isRestDay
          ? "O teu corpo precisa de descanso para crescer."
          : stimulus}
      </p>
    </motion.div>
  );
}
