import { ReactNode } from "react";
import { motion } from "framer-motion";

interface OnboardingLayoutProps {
  children: ReactNode;
  onContinue: () => void;
  showButton?: boolean;
  buttonDisabled?: boolean;
}

export const OnboardingLayout = ({
  children,
  onContinue,
  showButton = true,
  buttonDisabled = false,
}: OnboardingLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="flex flex-1 flex-col px-6 py-8"
      >
        {children}
      </motion.div>

      {showButton && (
        <div className="px-6 pb-8 safe-area-bottom">
          <button
            onClick={onContinue}
            disabled={buttonDisabled}
            className="w-full rounded-2xl bg-card py-4 text-lg font-medium text-foreground transition-all hover:bg-muted active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            continuar
          </button>
        </div>
      )}
    </div>
  );
};
