import { motion } from "framer-motion";
import { Play, Loader2, CheckCircle2 } from "lucide-react";

interface WorkoutCTAProps {
  onStart: () => void;
  onComplete: () => void;
  hasStarted: boolean;
  isCompleting: boolean;
  savedCount: number;
}

export const WorkoutCTA = ({
  onStart,
  onComplete,
  hasStarted,
  isCompleting,
  savedCount,
}: WorkoutCTAProps) => {
  const showComplete = hasStarted && savedCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="px-6 pb-8"
    >
      {showComplete ? (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onComplete}
          disabled={isCompleting}
          className="relative w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 bg-[#2563EB] text-white shadow-[0_0_30px_rgba(37,99,235,0.3)] disabled:opacity-50 transition-all"
        >
          {isCompleting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              A concluir...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Concluir Treino ({savedCount})
            </>
          )}
        </motion.button>
      ) : (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          className="relative w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 bg-primary text-primary-foreground shadow-[0_0_30px_hsl(var(--primary)/0.3)] transition-all"
        >
          <Play className="w-5 h-5" />
          Iniciar Treino
        </motion.button>
      )}
    </motion.div>
  );
};
