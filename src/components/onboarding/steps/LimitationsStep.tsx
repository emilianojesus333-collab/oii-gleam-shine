import { OnboardingLayout } from "../OnboardingLayout";
import { motion } from "framer-motion";

interface LimitationsStepProps {
  selectedLimitations: string[];
  onToggle: (limitation: string) => void;
  onContinue: () => void;
  onBack?: () => void;
}

const limitations = [
  "Nenhuma",
  "Ombro",
  "Joelho",
  "Lombar",
  "Outra",
];

export const LimitationsStep = ({
  selectedLimitations,
  onToggle,
  onContinue,
  onBack,
}: LimitationsStepProps) => {
  const handleToggle = (limitation: string) => {
    if (limitation === "Nenhuma") {
      // If selecting "Nenhuma", clear all others
      onToggle("__clear_all__");
      onToggle("Nenhuma");
      return;
    }
    // If selecting something else while "Nenhuma" is selected, remove "Nenhuma"
    if (selectedLimitations.includes("Nenhuma")) {
      onToggle("Nenhuma");
    }
    onToggle(limitation);
  };

  return (
    <OnboardingLayout onContinue={onContinue} onBack={onBack} showBackButton={!!onBack} buttonDisabled={selectedLimitations.length === 0}>
      <div className="flex flex-1 flex-col pt-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-xl font-bold text-foreground">
            Tens alguma limitação física?
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Adaptamos os exercícios para ti
          </p>
        </motion.div>

        <div className="mt-8 flex flex-col gap-2.5">
          {limitations.map((limitation, index) => {
            const isSelected = selectedLimitations.includes(limitation);
            return (
              <motion.div
                key={limitation}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleToggle(limitation)}
                  className={`w-full rounded-xl px-4 py-3.5 text-left text-[15px] font-medium transition-all ${
                    isSelected
                      ? "bg-foreground text-background"
                      : "bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  {limitation}
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </OnboardingLayout>
  );
};
