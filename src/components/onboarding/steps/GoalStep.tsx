import { OnboardingLayout } from "../OnboardingLayout";
import { OptionCard } from "../OptionCard";
import { motion } from "framer-motion";

interface GoalStepProps {
  selectedGoal: string | null;
  onSelect: (goal: string) => void;
  onContinue: () => void;
}

const goals = [
  "ganhar massa muscular",
  "perder gordura",
  "melhorar o condicionamento",
  "manter forma física",
];

export const GoalStep = ({ selectedGoal, onSelect, onContinue }: GoalStepProps) => {
  return (
    <OnboardingLayout onContinue={onContinue} buttonDisabled={!selectedGoal}>
      <div className="flex flex-1 flex-col pt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-2xl font-bold text-foreground">
            Qual é o teu objetivo?
          </h1>
          <p className="mt-3 text-muted-foreground">
            isto vai ajudar a personalizar o seu treino
          </p>
        </motion.div>

        <div className="mt-10 flex flex-col gap-3">
          {goals.map((goal, index) => (
            <motion.div
              key={goal}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <OptionCard
                label={goal}
                selected={selectedGoal === goal}
                onClick={() => onSelect(goal)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </OnboardingLayout>
  );
};
