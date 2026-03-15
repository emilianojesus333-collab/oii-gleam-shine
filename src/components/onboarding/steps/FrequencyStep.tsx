import { OnboardingLayout } from "../OnboardingLayout";
import { OptionCard } from "../OptionCard";
import { motion } from "framer-motion";

interface FrequencyStepProps {
  selectedFrequency: string | null;
  onSelect: (frequency: string) => void;
  onContinue: () => void;
  onBack?: () => void;
}

const frequencies = [
  "2–3 dias",
  "3–4 dias",
  "4–5 dias",
  "5+ dias",
];

export const FrequencyStep = ({
  selectedFrequency,
  onSelect,
  onContinue,
  onBack,
}: FrequencyStepProps) => {
  return (
    <OnboardingLayout onContinue={onContinue} onBack={onBack} showBackButton={!!onBack} buttonDisabled={!selectedFrequency}>
      <div className="flex flex-1 flex-col pt-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-xl font-bold text-foreground">
            Quantos dias por semana queres treinar?
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Isto vai ajudar a definir o teu plano semanal
          </p>
        </motion.div>

        <div className="mt-8 flex flex-col gap-2.5">
          {frequencies.map((frequency, index) => (
            <motion.div
              key={frequency}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <OptionCard
                label={frequency}
                selected={selectedFrequency === frequency}
                onClick={() => onSelect(frequency)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </OnboardingLayout>
  );
};
