import { OnboardingLayout } from "../OnboardingLayout";
import { OptionCard } from "../OptionCard";
import { motion } from "framer-motion";

interface ExperienceStepProps {
  selectedExperience: string | null;
  onSelect: (experience: string) => void;
  onContinue: () => void;
  onBack?: () => void;
}

const experiences = [
  "Iniciante",
  "Intermédio",
  "Avançado",
];

export const ExperienceStep = ({
  selectedExperience,
  onSelect,
  onContinue,
  onBack,
}: ExperienceStepProps) => {
  return (
    <OnboardingLayout onContinue={onContinue} onBack={onBack} showBackButton={!!onBack} buttonDisabled={!selectedExperience}>
      <div className="flex flex-1 flex-col pt-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-xl font-bold text-foreground">Qual é o teu nível no treino?</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            isto vai ajudar a personalizar o seu treino
          </p>
        </motion.div>

        <div className="mt-8 flex flex-col gap-2.5">
          {experiences.map((experience, index) => (
            <motion.div
              key={experience}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <OptionCard
                label={experience}
                selected={selectedExperience === experience}
                onClick={() => onSelect(experience)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </OnboardingLayout>
  );
};
