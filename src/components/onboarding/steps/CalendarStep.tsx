import { useState } from "react";
import { OnboardingLayout } from "../OnboardingLayout";
import { OptionCard } from "../OptionCard";
import { MuscleGroupSheet } from "../MuscleGroupSheet";
import { motion } from "framer-motion";

interface CalendarStepProps {
  schedule: Record<string, string>;
  onSelectGroup: (day: string, group: string) => void;
  onContinue: () => void;
  onBack?: () => void;
}

const weekDays = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];

export const CalendarStep = ({
  schedule,
  onSelectGroup,
  onContinue,
  onBack,
}: CalendarStepProps) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState("");

  const handleDayClick = (day: string) => {
    setSelectedDay(day);
    setSheetOpen(true);
  };

  const handleGroupSelect = (group: string) => {
    onSelectGroup(selectedDay, group);
  };

  return (
    <OnboardingLayout onContinue={onContinue} onBack={onBack} showBackButton={!!onBack}>
      <div className="flex flex-1 flex-col pt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-2xl font-bold text-foreground">
            Define o teu calendário
          </h1>
          <p className="mt-3 text-muted-foreground">
            Diz-nos o que vais treinar em cada dia
          </p>
        </motion.div>

        <div className="mt-6 flex flex-col gap-3">
          {weekDays.map((day, index) => (
            <motion.div
              key={day}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <OptionCard
                label={day}
                rightText={schedule[day] || "Selecionar"}
                selected={!!schedule[day]}
                onClick={() => handleDayClick(day)}
              />
            </motion.div>
          ))}
        </div>
      </div>

      <MuscleGroupSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        selectedDay={selectedDay}
        onSelectGroup={handleGroupSelect}
        currentSelection={schedule[selectedDay]}
      />
    </OnboardingLayout>
  );
};
