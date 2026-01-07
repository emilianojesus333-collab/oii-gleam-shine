import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Dumbbell, Brain, Target, Check } from "lucide-react";

const steps = [
  { icon: Dumbbell, text: "A analisar o teu perfil..." },
  { icon: Target, text: "A personalizar o teu plano..." },
  { icon: Brain, text: "A preparar a tua IA..." },
];

const Processing = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    // Progress through steps
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1200);

    // Complete after all steps
    const completeTimeout = setTimeout(() => {
      setCompleted(true);
    }, steps.length * 1200 + 500);

    // Navigate to paywall after completion animation
    const navigateTimeout = setTimeout(() => {
      navigate("/paywall", { replace: true });
    }, steps.length * 1200 + 1500);

    return () => {
      clearInterval(stepInterval);
      clearTimeout(completeTimeout);
      clearTimeout(navigateTimeout);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-black text-primary">LiftMate</h1>
      </motion.div>

      {/* Progress Steps */}
      <div className="w-full max-w-sm space-y-6">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index <= currentStep;
          const isDone = index < currentStep || completed;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: isActive ? 1 : 0.3, 
                x: 0 
              }}
              transition={{ delay: index * 0.2, duration: 0.4 }}
              className="flex items-center gap-4"
            >
              <motion.div
                className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-300 ${
                  isDone 
                    ? "bg-primary text-primary-foreground" 
                    : isActive 
                    ? "bg-primary/20 text-primary" 
                    : "bg-muted text-muted-foreground"
                }`}
                animate={isActive && !isDone ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                {isDone ? (
                  <Check className="h-6 w-6" />
                ) : (
                  <Icon className="h-6 w-6" />
                )}
              </motion.div>
              <span className={`text-lg font-medium transition-colors ${
                isActive ? "text-foreground" : "text-muted-foreground"
              }`}>
                {step.text}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Loading indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12"
      >
        {!completed && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        )}
        {completed && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-primary font-semibold"
          >
            Tudo pronto! ✨
          </motion.p>
        )}
      </motion.div>
    </div>
  );
};

export default Processing;
