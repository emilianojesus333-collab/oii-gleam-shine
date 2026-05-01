import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { DayTask } from "@/utils/onboardingFlow";

interface Props {
  task: DayTask;
  dayNumber: number;
  completedCount: number;
  onMarkComplete?: () => void;
}

export const DayFlowCard = ({ task, dayNumber, completedCount, onMarkComplete }: Props) => {
  const navigate = useNavigate();
  const totalDays = 7;
  const progressPct = (completedCount / totalDays) * 100;

  const handleAction = () => {
    onMarkComplete?.();
    if (task.routeState) {
      navigate(task.route, { state: task.routeState });
    } else {
      navigate(task.route);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        margin: "0 16px 12px",
        background: "linear-gradient(135deg, #0D1829, #1D4ED8)",
        border: "1px solid rgba(96,165,250,0.2)",
        borderRadius: 16,
        padding: "16px",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Subtle shimmer */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(120deg, transparent 30%, rgba(96,165,250,0.06) 50%, transparent 70%)",
      }} />

      {/* Day label */}
      <p style={{
        fontSize: 10, fontWeight: 800, letterSpacing: "0.14em",
        color: "rgba(147,197,253,0.7)", marginBottom: 6, textTransform: "uppercase",
      }}>
        DIA {dayNumber} DE 7
      </p>

      {/* Task title */}
      <p style={{ fontSize: 15, fontWeight: 800, color: "white", marginBottom: 4, lineHeight: 1.3 }}>
        {task.title}
      </p>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 14, lineHeight: 1.4 }}>
        {task.description}
      </p>

      {/* Progress bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
            Progresso da 1ª semana
          </p>
          <p style={{ fontSize: 10, color: "#93C5FD", fontWeight: 700 }}>
            {completedCount}/{totalDays} tarefas
          </p>
        </div>
        <div style={{
          height: 4, borderRadius: 4, background: "rgba(255,255,255,0.1)",
          overflow: "hidden",
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ height: "100%", background: "#60A5FA", borderRadius: 4 }}
          />
        </div>
      </div>

      {/* Action button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleAction}
        style={{
          width: "100%", padding: "11px 0", borderRadius: 10, cursor: "pointer",
          background: "rgba(96,165,250,0.2)", border: "1px solid rgba(96,165,250,0.3)",
          color: "#93C5FD", fontSize: 13, fontWeight: 800,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}
      >
        Fazer agora
        <ArrowRight size={13} />
      </motion.button>
    </motion.div>
  );
};

interface CompletedProps {
  completedCount: number;
}

export const DayFlowCompleted = ({ completedCount }: CompletedProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    style={{
      margin: "0 16px 12px",
      background: "linear-gradient(135deg, #052e16, #14532d)",
      border: "1px solid rgba(74,222,128,0.2)",
      borderRadius: 16, padding: "16px",
      display: "flex", alignItems: "center", gap: 12,
    }}
  >
    <CheckCircle2 size={28} color="#4ADE80" />
    <div>
      <p style={{ fontSize: 14, fontWeight: 800, color: "white" }}>
        Primeira semana concluída! 🎉
      </p>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
        {completedCount}/7 tarefas completadas · Continua assim!
      </p>
    </div>
  </motion.div>
);
