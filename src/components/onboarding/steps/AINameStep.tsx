import { useState } from "react";
import { motion } from "framer-motion";
import { OnboardingLayout } from "../OnboardingLayout";
import { Input } from "@/components/ui/input";
import { Sparkles, Wand2, MessageCircle } from "lucide-react";

interface AINameStepProps {
  onContinue: () => void;
  onBack: () => void;
}

const suggestedNames = [
  "Atlas",
  "Titan",
  "Flex",
  "Coach",
  "Iron",
  "Spartan",
  "Zeus",
  "Rocky",
];

export const AINameStep = ({ onContinue, onBack }: AINameStepProps) => {
  const [aiName, setAiName] = useState("");
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);

  const handleContinue = () => {
    // Note: AI name is saved to database via user_settings, not localStorage
    // This localStorage is only for temporary storage during onboarding flow
    // The actual save happens in the Onboarding page when completing the flow
    onContinue();
  };

  const handleSelectSuggestion = (name: string) => {
    setSelectedSuggestion(name);
    setAiName(name);
  };

  const isValid = aiName.trim().length > 0 || selectedSuggestion;

  return (
    <OnboardingLayout
      onBack={onBack}
      onContinue={handleContinue}
      showBackButton={true}
      buttonDisabled={!isValid}
    >
      <div className="flex flex-col items-center gap-8 pt-16">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <h1 className="text-2xl font-bold text-white">Name your assistant</h1>
          <p className="text-white/60 text-sm">Personalize your training assistant</p>
        </motion.div>

        {/* AI Avatar */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="relative"
        >
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/30">
            <MessageCircle className="w-14 h-14 text-primary" />
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center"
          >
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </motion.div>
        </motion.div>

        {/* Name Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-sm space-y-2"
        >
          <div className="relative">
            <Input
              type="text"
              placeholder="Enter a name..."
              value={aiName}
              onChange={(e) => {
                setAiName(e.target.value);
                setSelectedSuggestion(null);
              }}
              className="h-14 text-center text-lg font-medium bg-white/5 border-white/20 placeholder:text-white/40"
              maxLength={20}
            />
            <Wand2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          </div>
        </motion.div>

        {/* Suggested Names */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full space-y-3"
        >
          <p className="text-sm text-white/50 text-center">Or choose a suggestion</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestedNames.map((name, index) => (
              <motion.button
                key={name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                onClick={() => handleSelectSuggestion(name)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedSuggestion === name || aiName === name
                    ? "bg-primary text-primary-foreground"
                    : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
                }`}
              >
                {name}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Preview */}
        {isValid && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm p-4 rounded-2xl bg-white/5 border border-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-white">
                  {aiName.trim() || selectedSuggestion}
                </p>
                <p className="text-xs text-white/50">Your personal assistant</p>
              </div>
              <div className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
          </motion.div>
        )}
      </div>
    </OnboardingLayout>
  );
};
