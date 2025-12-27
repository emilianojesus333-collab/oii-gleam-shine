import { OnboardingLayout } from "../OnboardingLayout";
import { motion } from "framer-motion";

interface WelcomeStepProps {
  onContinue: () => void;
  onBack?: () => void;
}

export const WelcomeStep = ({ onContinue, onBack }: WelcomeStepProps) => {
  return (
    <OnboardingLayout onContinue={onContinue} onBack={onBack} showBackButton={!!onBack}>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-foreground">
            Bem-Vindo ao LiftMate
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Vamos personalizar a tua{" "}
            <span className="underline underline-offset-4">experiência</span>
          </p>
        </motion.div>
      </div>
    </OnboardingLayout>
  );
};
