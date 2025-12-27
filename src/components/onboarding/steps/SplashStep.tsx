import { OnboardingLayout } from "../OnboardingLayout";
import { motion } from "framer-motion";

interface SplashStepProps {
  onContinue: () => void;
}

export const SplashStep = ({ onContinue }: SplashStepProps) => {
  return (
    <OnboardingLayout onContinue={onContinue}>
      <div className="flex flex-1 items-center justify-center">
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-4xl font-black tracking-tight text-foreground"
        >
          LIFTMATE
        </motion.h1>
      </div>
    </OnboardingLayout>
  );
};
