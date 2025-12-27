import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

interface OnboardingLayoutProps {
  children: ReactNode;
  onContinue: () => void;
  onBack?: () => void;
  showButton?: boolean;
  showBackButton?: boolean;
  buttonDisabled?: boolean;
}

export const OnboardingLayout = ({
  children,
  onContinue,
  onBack,
  showButton = true,
  showBackButton = false,
  buttonDisabled = false,
}: OnboardingLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {showBackButton && onBack && (
        <div className="px-4 pt-4">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-card transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
        </div>
      )}
      
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
