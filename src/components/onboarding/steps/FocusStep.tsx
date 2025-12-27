import { OnboardingLayout } from "../OnboardingLayout";
import { OptionCard } from "../OptionCard";
import { motion } from "framer-motion";

interface FocusStepProps {
  selectedFocus: string | null;
  onSelect: (focus: string) => void;
  onContinue: () => void;
}

const focusOptions = [
  "Força",
  "Hipertrofia",
  "Resistencia",
  "Mobilidade",
  "Equilíbrio Geral",
];

export const FocusStep = ({
  selectedFocus,
  onSelect,
  onContinue,
}: FocusStepProps) => {
  return (
    <OnboardingLayout onContinue={onContinue} buttonDisabled={!selectedFocus}>
      <div className="flex flex-1 flex-col pt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-2xl font-bold text-foreground">
            Qual é o teu principal foco?
          </h1>
          <p className="mt-3 text-muted-foreground">
            isto vai ajudar a personalizar o seu treino
          </p>
        </motion.div>

        <div className="mt-10 flex flex-col gap-3">
          {focusOptions.map((focus, index) => (
            <motion.div
              key={focus}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <OptionCard
                label={focus}
                selected={selectedFocus === focus}
                onClick={() => onSelect(focus)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </OnboardingLayout>
  );
};
