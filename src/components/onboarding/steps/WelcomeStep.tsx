import { OnboardingLayout } from "../OnboardingLayout";
import { motion } from "framer-motion";

interface WelcomeStepProps {
  onContinue: () => void;
  onBack?: () => void;
}

export const WelcomeStep = ({ onContinue, onBack }: WelcomeStepProps) => {
  return (
    <OnboardingLayout onContinue={onContinue} onBack={onBack} showBackButton={!!onBack}>
      <div className="flex flex-1 flex-col items-center justify-center text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold text-foreground">
            Bem-Vindo ao LiftMate
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Vamos personalizar a tua experiência
          </p>
        </motion.div>
      </div>
    </OnboardingLayout>
  );
};
