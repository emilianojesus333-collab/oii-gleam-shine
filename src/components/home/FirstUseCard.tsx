import { motion } from "framer-motion";
import { Dumbbell, Apple, MessageCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const steps = [
  {
    icon: Dumbbell,
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.12)",
    title: "Primeiro treino",
    desc: "Gera um plano com IA",
    path: "/workout",
  },
  {
    icon: Apple,
    color: "#22C55E",
    bg: "rgba(34,197,94,0.12)",
    title: "Regista refeições",
    desc: "Scanner de alimentos IA",
    path: "/nutrition",
  },
  {
    icon: MessageCircle,
    color: "#A855F7",
    bg: "rgba(168,85,247,0.12)",
    title: "Fala com o coach",
    desc: "Tira dúvidas ou pede planos",
    path: "/chat",
  },
];

export const FirstUseCard = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-2xl overflow-hidden mb-4"
      style={{ background: "#0f1117", border: "1px solid #1F2937" }}
    >
      <div className="px-5 pt-5 pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
          Começa por aqui
        </p>
        <h3 className="text-lg font-bold text-white">
          3 passos para o primeiro resultado
        </h3>
      </div>

      <div className="px-3 pb-4 space-y-1">
        {steps.map((step, i) => (
          <motion.button
            key={step.path}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.08 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(step.path)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 transition-colors active:bg-white/5"
          >
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
              style={{ background: step.bg }}
            >
              <step.icon size={18} style={{ color: step.color }} strokeWidth={1.8} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-white">{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.desc}</p>
            </div>
            <ArrowRight size={14} className="text-muted-foreground/40" />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};
