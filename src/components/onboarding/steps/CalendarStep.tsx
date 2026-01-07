import { useState } from "react";
import { OnboardingLayout } from "../OnboardingLayout";
import { OptionCard } from "../OptionCard";
import { MuscleGroupSheet } from "../MuscleGroupSheet";
import { motion } from "framer-motion";

interface CalendarStepProps {
  schedule: Record<string, string[]>;
  onSelectGroups: (day: string, groups: string[]) => void;
  onContinue: () => void;
  onBack?: () => void;
}

const weekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const CalendarStep = ({
  schedule,
  onSelectGroups,
  onContinue,
  onBack,
}: CalendarStepProps) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState("");

  const handleDayClick = (day: string) => {
    setSelectedDay(day);
    setSheetOpen(true);
  };

  const handleGroupsSelect = (groups: string[]) => {
    onSelectGroups(selectedDay, groups);
  };

  const formatGroups = (groups: string[] | undefined) => {
    if (!groups || groups.length === 0) return "Select";
    if (groups.length === 1) return groups[0];
    if (groups.length === 2) return groups.join(" + ");
    return `${groups.slice(0, 2).join(" + ")} +${groups.length - 2}`;
  };

  return (
    <OnboardingLayout onContinue={onContinue} onBack={onBack} showBackButton={!!onBack}>
      <div className="flex flex-1 flex-col pt-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-xl font-bold text-foreground">
            Set your schedule
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tell us what you'll train each day
          </p>
        </motion.div>

        <div className="mt-6 flex flex-col gap-2">
          {weekDays.map((day, index) => {
            const dayGroups = schedule[day];
            const hasSelection = dayGroups && dayGroups.length > 0;
            
            return (
              <motion.div
                key={day}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <OptionCard
                  label={day}
                  rightText={formatGroups(dayGroups)}
                  selected={hasSelection}
                  onClick={() => handleDayClick(day)}
                />
              </motion.div>
            );
          })}
        </div>
      </div>

      <MuscleGroupSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        selectedDay={selectedDay}
        onSelectGroups={handleGroupsSelect}
        currentSelection={schedule[selectedDay]}
      />
    </OnboardingLayout>
  );
};
