import { Dumbbell, Heart, RefreshCw, Target, Utensils, Moon } from "lucide-react";
import { motion } from "framer-motion";

interface QuickCommandsProps {
  onCommand: (command: string) => void;
}

const commands = [
  { 
    icon: Dumbbell, 
    label: "Sugere treino", 
    command: "Sugere-me um treino para hoje com base no meu histórico e objetivos",
    color: "text-primary"
  },
  { 
    icon: Heart, 
    label: "Recuperação", 
    command: "Dá-me dicas de recuperação para depois do treino",
    color: "text-red-400"
  },
  { 
    icon: RefreshCw, 
    label: "Substituir", 
    command: "Preciso de uma alternativa para um exercício. Que opções tenho?",
    color: "text-blue-400"
  },
  { 
    icon: Target, 
    label: "Progresso", 
    command: "Mostra-me o meu progresso e estatísticas",
    color: "text-green-400"
  },
  { 
    icon: Utensils, 
    label: "Nutrição", 
    command: "Que dicas de nutrição tens para o meu objetivo?",
    color: "text-orange-400"
  },
  { 
    icon: Moon, 
    label: "Descanso", 
    command: "Como posso melhorar a minha recuperação e sono?",
    color: "text-purple-400"
  },
];

export const QuickCommands = ({ onCommand }: QuickCommandsProps) => {
  return (
    <div className="px-4 py-3 border-b border-white/10">
      <p className="text-xs text-white/50 mb-2">Comandos rápidos</p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {commands.map((cmd, index) => (
          <motion.button
            key={cmd.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onCommand(cmd.command)}
            className="flex items-center gap-2 whitespace-nowrap rounded-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:border-white/20 transition-all"
          >
            <cmd.icon className={`h-4 w-4 ${cmd.color}`} />
            {cmd.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
