import { OnboardingLayout } from "../OnboardingLayout";
import { OptionCard } from "../OptionCard";
import { motion } from "framer-motion";

interface CalendarStepProps {
  schedule: Record<string, string>;
  onSelectDay: (day: string) => void;
  onContinue: () => void;
  onBack?: () => void;
}

const weekDays = [
  "Segunda-feira",
  "Terça-feira",
  "quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];

export const CalendarStep = ({
  schedule,
  onSelectDay,
  onContinue,
  onBack,
}: CalendarStepProps) => {
  return (
    <OnboardingLayout onContinue={onContinue} onBack={onBack} showBackButton={!!onBack}>
      <div className="flex flex-1 flex-col pt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-2xl font-bold text-foreground">
            Difine o teu calendario
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
                onClick={() => onSelectDay(day)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </OnboardingLayout>
  );
};
