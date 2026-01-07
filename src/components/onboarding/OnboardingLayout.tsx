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

const pageVariants = {
  initial: {
    opacity: 0,
    x: 60,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    x: -60,
    scale: 0.98,
  },
};

const pageTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

export const OnboardingLayout = ({
  children,
  onContinue,
  onBack,
  showButton = true,
  showBackButton = false,
  buttonDisabled = false,
}: OnboardingLayoutProps) => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className="flex min-h-[100dvh] max-w-[390px] mx-auto flex-col bg-background"
    >
      {showBackButton && onBack && (
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.2 }}
          className="px-5 pt-14"
        >
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-card transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
        </motion.div>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`flex flex-1 flex-col px-6 ${showBackButton ? 'pt-4 pb-6' : 'py-6'}`}
      >
        {children}
      </motion.div>

      {showButton && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3, ease: "easeOut" }}
          className="px-6 pb-10 safe-area-bottom"
        >
          <motion.button
            onClick={onContinue}
            disabled={buttonDisabled}
            whileTap={{ scale: 0.97 }}
            className="w-full rounded-2xl bg-card py-4 text-base font-semibold text-foreground transition-all hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            continue
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
};
