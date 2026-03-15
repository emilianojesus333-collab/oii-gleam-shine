import { OnboardingLayout } from "../OnboardingLayout";
import { motion } from "framer-motion";

interface MusclePriorityStepProps {
  selectedMuscles: string[];
  onToggle: (muscle: string) => void;
  onContinue: () => void;
  onBack?: () => void;
}

const muscleGroups = [
  "Peito",
  "Costas",
  "Pernas",
  "Ombros",
  "Braços",
  "Core",
];

export const MusclePriorityStep = ({
  selectedMuscles,
  onToggle,
  onContinue,
  onBack,
}: MusclePriorityStepProps) => {
  return (
    <OnboardingLayout onContinue={onContinue} onBack={onBack} showBackButton={!!onBack} buttonDisabled={selectedMuscles.length === 0}>
      <div className="flex flex-1 flex-col pt-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-xl font-bold text-foreground">
            Que músculos queres desenvolver mais?
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Podes selecionar vários
          </p>
        </motion.div>

        <div className="mt-8 flex flex-col gap-2.5">
          {muscleGroups.map((muscle, index) => {
            const isSelected = selectedMuscles.includes(muscle);
            return (
              <motion.div
                key={muscle}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onToggle(muscle)}
                  className={`w-full rounded-xl px-4 py-3.5 text-left text-[15px] font-medium transition-all ${
                    isSelected
                      ? "bg-foreground text-background"
                      : "bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  {muscle}
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </OnboardingLayout>
  );
};
