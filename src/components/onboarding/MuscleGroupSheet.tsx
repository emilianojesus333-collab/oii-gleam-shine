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

  const MAX_SELECTIONS = 3;

  const toggleGroup = (group: string) => {
    // If selecting "Descanso", clear all others and auto-confirm
    if (group === "Descanso") {
      const newSelection = selected.includes("Descanso") ? [] : ["Descanso"];
      setSelected(newSelection);
      if (newSelection.length === 1) {
        // Auto-confirm when selecting Descanso
        setTimeout(() => {
          onSelectGroups(newSelection);
          onClose();
        }, 300);
      }
      return;
    }
    
    // If selecting any other group, remove "Descanso" if present
    setSelected((prev) => {
      const withoutDescanso = prev.filter(g => g !== "Descanso");
      
      // If already selected, remove it
      if (withoutDescanso.includes(group)) {
        return withoutDescanso.filter((g) => g !== group);
      }
      
      // If at max limit, don't add more
      if (withoutDescanso.length >= MAX_SELECTIONS) {
        return withoutDescanso;
      }
      
      const newSelection = [...withoutDescanso, group];
      
      // Auto-confirm when reaching 3 selections
      if (newSelection.length === MAX_SELECTIONS) {
        setTimeout(() => {
          onSelectGroups(newSelection);
          onClose();
        }, 300);
      }
      
      return newSelection;
    });
  };

  const isAtLimit = selected.filter(g => g !== "Descanso").length >= MAX_SELECTIONS;

  const handleConfirm = () => {
    onSelectGroups(selected);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-2xl bg-background px-5 pb-8 [&>button]:hidden max-w-[390px] mx-auto">
        <SheetHeader className="mb-5">
          <SheetTitle className="text-center text-base font-bold text-foreground">
            {selectedDay}
          </SheetTitle>
          <SheetDescription className="text-center text-xs text-muted-foreground">
            Seleciona até 3 grupos musculares
          </SheetDescription>
        </SheetHeader>

        <div className="grid grid-cols-3 gap-2.5">
          {muscleGroups.map((group, index) => {
            const isSelected = selected.includes(group.label);
            const isDisabled = !isSelected && isAtLimit && group.label !== "Descanso";
            
            return (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <button
                  type="button"
                  disabled={isDisabled}
                  onClick={() => toggleGroup(group.label)}
                  className={cn(
                    "relative w-full rounded-xl bg-card px-2.5 py-3 text-center text-[13px] font-medium text-foreground transition-all active:scale-95",
                    isSelected && "bg-primary text-primary-foreground ring-2 ring-primary",
                    isDisabled && "opacity-40 cursor-not-allowed"
                  )}
                >
                  {isSelected && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                      <Check className="h-2.5 w-2.5 text-primary-foreground" />
                    </span>
                  )}
                  {group.label}
                </button>
              </motion.div>
            );
          })}
        </div>

        {selected.length > 0 && selected.length < 3 && !selected.includes("Descanso") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Button
              type="button"
              onClick={handleConfirm}
              className="mt-5 w-full rounded-full py-5 text-sm font-semibold"
            >
              Confirmar ({selected.length})
            </Button>
          </motion.div>
        )}
      </SheetContent>
    </Sheet>
  );
};
