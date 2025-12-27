import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MuscleGroupSheetProps {
  open: boolean;
  onClose: () => void;
  selectedDay: string;
  onSelectGroup: (group: string) => void;
  currentSelection?: string;
}

const muscleGroups = [
  { id: "peito", label: "Peito" },
  { id: "costas", label: "Costas" },
  { id: "pernas", label: "Pernas" },
  { id: "ombros", label: "Ombros" },
  { id: "bracos", label: "Braços" },
  { id: "abdomen", label: "Abdômen" },
  { id: "gluteos", label: "Glúteos" },
  { id: "descanso", label: "Descanso" },
];

export const MuscleGroupSheet = ({
  open,
  onClose,
  selectedDay,
  onSelectGroup,
  currentSelection,
}: MuscleGroupSheetProps) => {
  const handleSelect = (group: string) => {
    onSelectGroup(group);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-3xl bg-background px-6 pb-8">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-center text-lg font-bold text-foreground">
            {selectedDay}
          </SheetTitle>
          <p className="text-center text-sm text-muted-foreground">
            Seleciona o grupo muscular
          </p>
        </SheetHeader>

        <div className="grid grid-cols-2 gap-3">
          {muscleGroups.map((group, index) => (
            <motion.button
              key={group.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleSelect(group.label)}
              className={cn(
                "rounded-2xl bg-card px-4 py-4 text-center font-medium text-foreground transition-all",
                currentSelection === group.label && "ring-2 ring-primary"
              )}
            >
              {group.label}
            </motion.button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
