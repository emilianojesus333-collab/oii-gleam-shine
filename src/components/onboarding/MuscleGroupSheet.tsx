import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface MuscleGroupSheetProps {
  open: boolean;
  onClose: () => void;
  selectedDay: string;
  onSelectGroups: (groups: string[]) => void;
  currentSelection?: string[];
}

const muscleGroups = [
  { id: "peito", label: "Peito" },
  { id: "costas", label: "Costas" },
  { id: "ombros", label: "Ombros" },
  { id: "biceps", label: "Bíceps" },
  { id: "triceps", label: "Tríceps" },
  { id: "pernas", label: "Pernas" },
  { id: "abdomen", label: "Abdómen" },
  { id: "gluteos", label: "Glúteos" },
  { id: "descanso", label: "Descanso" },
];

export const MuscleGroupSheet = ({
  open,
  onClose,
  selectedDay,
  onSelectGroups,
  currentSelection = [],
}: MuscleGroupSheetProps) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Only sync when sheet opens
  useEffect(() => {
    if (open && !initialized) {
      setSelected(currentSelection);
      setInitialized(true);
    }
    if (!open) {
      setInitialized(false);
    }
  }, [open]);

  const toggleGroup = (group: string) => {
    // If selecting "Descanso", clear all others
    if (group === "Descanso") {
      setSelected(selected.includes("Descanso") ? [] : ["Descanso"]);
      return;
    }
    
    // If selecting any other group, remove "Descanso" if present
    setSelected((prev) => {
      const withoutDescanso = prev.filter(g => g !== "Descanso");
      if (withoutDescanso.includes(group)) {
        return withoutDescanso.filter((g) => g !== group);
      }
      return [...withoutDescanso, group];
    });
  };

  const handleConfirm = () => {
    onSelectGroups(selected);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-3xl bg-background px-6 pb-8 [&>button]:hidden">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-center text-lg font-bold text-foreground">
            {selectedDay}
          </SheetTitle>
          <SheetDescription className="text-center text-sm text-muted-foreground">
            Seleciona os grupos musculares
          </SheetDescription>
        </SheetHeader>

        <div className="grid grid-cols-3 gap-3">
          {muscleGroups.map((group, index) => {
            const isSelected = selected.includes(group.label);
            return (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  className={cn(
                    "relative w-full rounded-2xl bg-card px-3 py-4 text-center text-sm font-medium text-foreground transition-all active:scale-95",
                    isSelected && "bg-primary text-primary-foreground ring-2 ring-primary"
                  )}
                >
                  {isSelected && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </span>
                  )}
                  {group.label}
                </button>
              </motion.div>
            );
          })}
        </div>

        <Button
          type="button"
          onClick={handleConfirm}
          className="mt-6 w-full rounded-full py-6 text-base font-semibold"
        >
          Confirmar {selected.length > 0 && `(${selected.length})`}
        </Button>
      </SheetContent>
    </Sheet>
  );
};
