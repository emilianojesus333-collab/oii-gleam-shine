import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import type { Milestone } from "@/utils/milestones";

interface Props {
  milestone: Milestone | null;
  onDismiss: () => void;
}

export const MilestoneModal = ({ milestone, onDismiss }: Props) => {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!milestone || firedRef.current) return;
    firedRef.current = true;

    // Burst from center
    const fire = (ratio: number, opts: confetti.Options) =>
      confetti({ origin: { y: 0.5 }, ...opts, particleCount: Math.floor(200 * ratio) });

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2,  { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1,  { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1,  { spread: 120, startVelocity: 45 });

    return () => { firedRef.current = false; };
  }, [milestone]);

  return (
    <AnimatePresence>
      {milestone && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onDismiss}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24,
          }}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 18, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 340,
              background: "linear-gradient(145deg, #111827, #1f2937)",
              border: `1px solid ${milestone.color}33`,
              borderRadius: 24, padding: "36px 28px 28px",
              textAlign: "center",
              boxShadow: `0 0 60px ${milestone.color}22, 0 20px 60px rgba(0,0,0,0.5)`,
            }}
          >
            {/* Glow ring */}
            <div style={{
              width: 88, height: 88, borderRadius: "50%", margin: "0 auto 20px",
              background: `${milestone.color}15`,
              border: `2px solid ${milestone.color}40`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 40,
              boxShadow: `0 0 40px ${milestone.color}30`,
            }}>
              {milestone.emoji}
            </div>

            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
              color: milestone.color, marginBottom: 8, textTransform: "uppercase",
            }}>
              Conquista Desbloqueada
            </p>

            <h2 style={{ fontSize: 22, fontWeight: 900, color: "white", marginBottom: 10 }}>
              {milestone.title}
            </h2>

            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.50)", lineHeight: 1.6, marginBottom: 28 }}>
              {milestone.description}
            </p>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onDismiss}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 14, cursor: "pointer",
                background: milestone.color, border: "none",
                color: "#000", fontSize: 14, fontWeight: 800,
              }}
            >
              Continuar 🚀
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
