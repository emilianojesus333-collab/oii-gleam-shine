import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useMuscleFatigue, getMuscleLabel } from "@/hooks/useMuscleFatigue";

function getRecoveryPct(fatigue: number) {
  return Math.max(0, Math.min(100, 100 - fatigue));
}

export function RecoveryRingsCard() {
  const { muscles, loading } = useMuscleFatigue();
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(t);
  }, [loading]);

  if (loading) return null;

  const display = muscles.slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.5 }}
      className="mx-2 mb-3 grid grid-cols-2 gap-3"
    >
      {display.map((m, i) => {
        const pct = getRecoveryPct(m.current_fatigue);
        const isRecovered = pct >= 80;
        const label = getMuscleLabel(m.muscle_group);
        const barColor = isRecovered ? "#4ADE80" : "#FBBF24";
        const delay = i * 0.15;

        return (
          <motion.div
            key={m.muscle_group}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + i * 0.07 }}
            className="rounded-2xl p-4"
            style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="text-sm font-bold text-white mb-3">{label}</p>
            <div className="w-full h-1.5 rounded-full mb-2" style={{ background: "rgba(255,255,255,0.15)" }}>
              <div
                style={{
                  height: "100%",
                  borderRadius: "9999px",
                  background: barColor,
                  width: animated ? `${pct}%` : "0%",
                  transition: `width 1.2s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s`,
                }}
              />
            </div>
            <p className="text-xs font-semibold" style={{ color: barColor }}>
              {isRecovered ? "Recuperado" : `${pct}% recuperado`}
            </p>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
