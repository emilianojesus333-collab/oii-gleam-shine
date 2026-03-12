import { Dumbbell, Heart, RefreshCw, Target, Utensils, Moon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface QuickCommandsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommand: (command: string) => void;
}

const primaryCommands = [
  {
    icon: Dumbbell,
    label: "Sugere treino",
    command: "Sugere-me um treino para hoje com base no meu histórico e objetivos",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Heart,
    label: "Recuperação",
    command: "Dá-me dicas de recuperação para depois do treino",
    color: "text-red-400",
    bg: "bg-red-500/10",
  },
  {
    icon: RefreshCw,
    label: "Substituir exercício",
    command: "Preciso de uma alternativa para um exercício. Que opções tenho?",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
];

const secondaryCommands = [
  {
    icon: Utensils,
    label: "Nutrição",
    command: "Que dicas de nutrição tens para o meu objetivo?",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
  {
    icon: Moon,
    label: "Descanso",
    command: "Como posso melhorar a minha recuperação e sono?",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: Target,
    label: "Progresso",
    command: "Mostra-me o meu progresso e estatísticas",
    color: "text-green-400",
    bg: "bg-green-500/10",
  },
];

export const QuickCommandsSheet = ({ open, onOpenChange, onCommand }: QuickCommandsSheetProps) => {
  const handleSelect = (command: string) => {
    onCommand(command);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1f2e] border border-white/10 rounded-2xl w-[80%] max-w-sm p-0 gap-0 shadow-2xl shadow-black/60 [&>button]:hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-white text-base font-semibold text-center">
            Atalhos rápidos
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-2 space-y-3">
          {/* Primary row - 3 cards */}
          <div className="grid grid-cols-3 gap-2">
            {primaryCommands.map((cmd, index) => (
              <motion.button
                key={cmd.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSelect(cmd.command)}
                className={`flex flex-col items-center gap-2 rounded-xl ${cmd.bg} border border-white/[0.06] p-3 hover:bg-white/10 active:scale-95 transition-all`}
              >
                <cmd.icon className={`h-5 w-5 ${cmd.color}`} />
                <span className="text-[11px] text-white/70 text-center leading-tight">{cmd.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Secondary list */}
          <div className="space-y-0.5">
            {secondaryCommands.map((cmd, index) => (
              <motion.button
                key={cmd.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + index * 0.05 }}
                onClick={() => handleSelect(cmd.command)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/5 active:bg-white/10 transition-colors"
              >
                <div className={`w-8 h-8 rounded-lg ${cmd.bg} flex items-center justify-center`}>
                  <cmd.icon className={`h-4 w-4 ${cmd.color}`} />
                </div>
                <span className="text-sm text-white/80">{cmd.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Cancel button */}
        <div className="px-4 pb-4 pt-1">
          <button
            onClick={() => onOpenChange(false)}
            className="w-full py-2.5 rounded-xl bg-white/5 border border-white/[0.06] text-white/50 text-sm font-medium hover:bg-white/10 active:scale-[0.98] transition-all"
          >
            Cancelar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
