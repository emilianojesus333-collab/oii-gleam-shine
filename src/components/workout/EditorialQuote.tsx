import { motion } from "framer-motion";

interface EditorialQuoteProps {
  muscleGroups: string[];
  aiName?: string;
}

const tips: Record<string, string> = {
  peito: "Começa pelo composto mais pesado enquanto estás fresco.",
  costas: "Foca a retração escapular para ativar as costas correctamente.",
  pernas: "Aquece bem os joelhos — agachamento com barra vazia antes de carregar.",
  ombros: "Prioriza a técnica no overhead press para evitar lesões.",
  braços: "Supersets de bíceps e tríceps maximizam o pump e poupam tempo.",
  bíceps: "Controla a fase excêntrica — é onde o músculo mais cresce.",
  tríceps: "Extensões overhead primeiro, depois isolamento por cabeça.",
};

function getTip(groups: string[]): string {
  for (const g of groups) {
    const key = g.toLowerCase();
    for (const [muscle, tip] of Object.entries(tips)) {
      if (key.includes(muscle)) return tip;
    }
  }
  return "Mantém o foco e controla cada repetição.";
}

export const EditorialQuote = ({ muscleGroups, aiName = "Victoria AI" }: EditorialQuoteProps) => {
  const tip = getTip(muscleGroups);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.35 }}
      className="px-8 py-6"
    >
      <p className="text-lg font-serif text-foreground/80 leading-relaxed italic">
        "{tip}"
      </p>
      <p className="text-xs text-primary/50 mt-3 font-medium">
        — {aiName}
      </p>
    </motion.div>
  );
};
