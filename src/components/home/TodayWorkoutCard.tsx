import { motion } from "framer-motion";
import { Dumbbell, Leaf } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TodayWorkoutCardProps {
  workout: string | null;
  stimulus: string;
  isRestDay: boolean;
}

export function TodayWorkoutCard({ workout, stimulus, isRestDay }: TodayWorkoutCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 100, damping: 15 }}
      className="rounded-2xl p-5 sm:p-6 overflow-hidden relative"
      style={{
        background: isRestDay
          ? "linear-gradient(135deg, #111827 0%, #1a2332 100%)"
          : "linear-gradient(135deg, #0f1a2e 0%, #1e3a5f 50%, #2563EB 100%)",
        boxShadow: isRestDay
          ? "0 4px 20px rgba(0,0,0,0.3)"
          : "0 8px 32px rgba(37,99,235,0.2)",
      }}
    >
      {/* Label */}
      <span className="text-[11px] font-semibold uppercase tracking-widest text-[#9CA3AF]">
        HOJE
      </span>

      {/* Workout name */}
      <h2 className="mt-2 text-2xl sm:text-[28px] font-black leading-tight text-[#F3F4F6]">
        {isRestDay ? "Recuperação" : workout || "Treino"}
      </h2>

      <p className="mt-1 text-sm text-[#9CA3AF]">
        {isRestDay ? "O teu corpo precisa de descanso" : stimulus}
      </p>

      {/* Button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => isRestDay ? navigate("/workout") : navigate("/workout")}
        className="mt-5 w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
        style={{
          backgroundColor: isRestDay ? "#1F2937" : "#3B82F6",
          color: isRestDay ? "#9CA3AF" : "#FFFFFF",
          boxShadow: isRestDay ? "none" : "0 4px 14px rgba(59,130,246,0.4)",
        }}
      >
        {isRestDay ? (
          <>
            <Leaf className="h-4 w-4" />
            Ver sugestão leve
          </>
        ) : (
          <>
            <Dumbbell className="h-4 w-4" />
            Iniciar Treino
          </>
        )}
      </motion.button>
    </motion.div>
  );
}
