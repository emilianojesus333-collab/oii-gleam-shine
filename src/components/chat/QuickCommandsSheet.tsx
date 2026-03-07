import { Dumbbell, Heart, RefreshCw, Target, Utensils, Moon } from "lucide-react";
import { motion } from "framer-motion";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

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
  },
  {
    icon: Heart,
    label: "Recuperação",
    command: "Dá-me dicas de recuperação para depois do treino",
    color: "text-red-400",
  },
  {
    icon: RefreshCw,
    label: "Substituir exercício",
    command: "Preciso de uma alternativa para um exercício. Que opções tenho?",
    color: "text-cyan-400",
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
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-[#111827] border-t border-white/10 max-h-[50vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-white/80 text-sm font-medium">Atalhos rápidos</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-4">
          {/* Primary row - 3 cards */}
          <div className="grid grid-cols-3 gap-2">
            {primaryCommands.map((cmd, index) => (
              <motion.button
                key={cmd.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSelect(cmd.command)}
                className="flex flex-col items-center gap-2 rounded-xl bg-white/5 border border-white/10 p-3 hover:bg-white/10 transition-colors"
              >
                <cmd.icon className={`h-5 w-5 ${cmd.color}`} />
                <span className="text-xs text-white/70 text-center leading-tight">{cmd.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Secondary list */}
          <div className="space-y-1">
            {secondaryCommands.map((cmd, index) => (
              <motion.button
                key={cmd.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + index * 0.05 }}
                onClick={() => handleSelect(cmd.command)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 hover:bg-white/5 transition-colors"
              >
                <cmd.icon className={`h-4 w-4 ${cmd.color}`} />
                <span className="text-sm text-white/80">{cmd.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
