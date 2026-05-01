import { Dumbbell, Heart, RefreshCw, Target, Utensils, Moon } from "lucide-react";
import { motion } from "framer-motion";
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
    glow: "shadow-[0_0_12px_rgba(59,130,246,0.35)]",
    iconBg: "bg-blue-500/15",
  },
  {
    icon: Heart,
    label: "Recuperação",
    command: "Dá-me dicas de recuperação para depois do treino",
    color: "text-rose-400",
    glow: "shadow-[0_0_12px_rgba(244,63,94,0.35)]",
    iconBg: "bg-rose-500/15",
  },
  {
    icon: RefreshCw,
    label: "Substituir",
    command: "Preciso de uma alternativa para um exercício. Que opções tenho?",
    color: "text-blue-400",
    glow: "shadow-[0_0_12px_rgba(16,185,129,0.35)]",
    iconBg: "bg-blue-500/15",
  },
];

const secondaryCommands = [
  {
    icon: Utensils,
    label: "Nutrição",
    command: "Que dicas de nutrição tens para o meu objetivo?",
    color: "text-orange-400",
  },
  {
    icon: Moon,
    label: "Descanso",
    command: "Como posso melhorar a minha recuperação e sono?",
    color: "text-purple-400",
  },
  {
    icon: Target,
    label: "Progresso",
    command: "Mostra-me o meu progresso e estatísticas",
    color: "text-green-400",
  },
];

export const QuickCommandsSheet = ({ open, onOpenChange, onCommand }: QuickCommandsSheetProps) => {
  const handleSelect = (command: string) => {
    onCommand(command);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="
        bg-gradient-to-b from-[#0F172A] to-[#1A2238] 
        border border-white/[0.08] 
        rounded-[20px] 
        w-[80%] max-w-sm 
        p-0 gap-0 
        shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] 
        [&>button]:hidden
      ">
        <DialogHeader className="px-5 pt-6 pb-4">
          <DialogTitle className="text-[#E5E7EB] text-lg font-semibold text-center tracking-tight">
            Atalhos rápidos
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-3 space-y-4">
          {/* Primary row - 3 cards */}
          <div className="grid grid-cols-3 gap-2.5">
            {primaryCommands.map((cmd, index) => (
              <motion.button
                key={cmd.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, duration: 0.2 }}
                onClick={() => handleSelect(cmd.command)}
                className="
                  flex flex-col items-center gap-2.5 
                  rounded-[14px] 
                  bg-white/[0.05] 
                  border border-white/[0.08] 
                  p-3.5 
                  hover:bg-white/[0.08] 
                  hover:border-white/[0.12]
                  active:scale-[0.96] 
                  transition-all duration-200
                "
              >
                <div className={`
                  w-10 h-10 rounded-xl 
                  ${cmd.iconBg} 
                  flex items-center justify-center 
                  ${cmd.glow}
                  transition-transform duration-200
                `}>
                  <cmd.icon className={`h-5 w-5 ${cmd.color}`} />
                </div>
                <span className="text-[11px] text-white/70 text-center leading-tight font-medium">
                  {cmd.label}
                </span>
              </motion.button>
            ))}
          </div>

          {/* Secondary list */}
          <div className="space-y-1 pt-1">
            {secondaryCommands.map((cmd, index) => (
              <motion.button
                key={cmd.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + index * 0.05, duration: 0.2 }}
                onClick={() => handleSelect(cmd.command)}
                className="
                  flex w-full items-center gap-4 
                  rounded-xl 
                  px-3 py-3 
                  hover:bg-white/[0.04] 
                  active:bg-white/[0.06]
                  transition-colors duration-150
                "
              >
                <cmd.icon className={`h-5 w-5 ${cmd.color}`} />
                <span className="text-sm text-[#D1D5DB] font-medium">
                  {cmd.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Cancel button */}
        <div className="px-4 pb-5 pt-2">
          <button
            onClick={() => onOpenChange(false)}
            className="
              w-full py-3 
              rounded-xl 
              bg-white/[0.06] 
              text-[#9CA3AF] 
              text-sm 
              font-medium 
              hover:bg-white/[0.09] 
              hover:text-[#B4B9C2]
              active:scale-[0.98] 
              transition-all duration-150
            "
          >
            Cancelar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
