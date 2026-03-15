import { OnboardingLayout } from "../OnboardingLayout";
import { OptionCard } from "../OptionCard";
import { motion } from "framer-motion";

interface LocationStepProps {
  selectedLocation: string | null;
  onSelect: (location: string) => void;
  onContinue: () => void;
  onBack?: () => void;
}

const locations = [
  "Ginásio completo",
  "Casa com equipamento",
  "Casa sem equipamento",
];

export const LocationStep = ({
  selectedLocation,
  onSelect,
  onContinue,
  onBack,
}: LocationStepProps) => {
  return (
    <OnboardingLayout onContinue={onContinue} onBack={onBack} showBackButton={!!onBack} buttonDisabled={!selectedLocation}>
      <div className="flex flex-1 flex-col pt-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-xl font-bold text-foreground">
            Onde vais treinar?
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Adaptamos os exercícios ao teu espaço
          </p>
        </motion.div>

        <div className="mt-8 flex flex-col gap-2.5">
          {locations.map((location, index) => (
            <motion.div
              key={location}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <OptionCard
                label={location}
                selected={selectedLocation === location}
                onClick={() => onSelect(location)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </OnboardingLayout>
  );
};
