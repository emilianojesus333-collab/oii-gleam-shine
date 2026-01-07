import { OnboardingLayout } from "../OnboardingLayout";
import { OptionCard } from "../OptionCard";
import { motion } from "framer-motion";

interface FocusStepProps {
  selectedFocus: string | null;
  onSelect: (focus: string) => void;
  onContinue: () => void;
  onBack?: () => void;
}

const focusOptions = [
  "Strength",
  "Hypertrophy",
  "Endurance",
  "Mobility",
  "Overall Balance",
];

export const FocusStep = ({
  selectedFocus,
  onSelect,
  onContinue,
  onBack,
}: FocusStepProps) => {
  return (
    <OnboardingLayout onContinue={onContinue} onBack={onBack} showBackButton={!!onBack} buttonDisabled={!selectedFocus}>
      <div className="flex flex-1 flex-col pt-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-xl font-bold text-foreground">
            What's your main focus?
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This will help personalize your training
          </p>
        </motion.div>

        <div className="mt-8 flex flex-col gap-2.5">
          {focusOptions.map((focus, index) => (
            <motion.div
              key={focus}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
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
