import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { OnboardingLayout } from "../OnboardingLayout";
import { WheelPicker } from "../WheelPicker";
import { Ruler, Weight } from "lucide-react";

interface PhysicalDataStepProps {
  data: {
    height: string;
    weight: string;
  };
  onUpdate: (updates: Partial<PhysicalDataStepProps["data"]>) => void;
  onContinue: () => void;
  onBack?: () => void;
}

const heightOptions = Array.from({ length: 81 }, (_, i) => {
  const cm = 140 + i;
  return { value: String(cm), label: `${cm} cm` };
});

const weightOptions = [
  { value: "", label: "Prefiro não dizer" },
  ...Array.from({ length: 111 }, (_, i) => {
    const kg = 40 + i;
    return { value: String(kg), label: `${kg} kg` };
  }),
];

type PickerField = "height" | "weight" | null;

export const PhysicalDataStep = ({
  data,
  onUpdate,
  onContinue,
  onBack,
}: PhysicalDataStepProps) => {
  const [activePicker, setActivePicker] = useState<PickerField>(null);

  const isValid = !!data.height;

  const getDisplayValue = (field: PickerField) => {
    switch (field) {
      case "height":
        return data.height ? `${data.height} cm` : "Selecionar";
      case "weight":
        return data.weight ? `${data.weight} kg` : "Opcional";
      default:
        return "";
    }
  };

  const fields = [
    { key: "height" as PickerField, icon: Ruler, label: "Altura", required: true },
    { key: "weight" as PickerField, icon: Weight, label: "Peso", required: false },
  ];

  return (
    <OnboardingLayout
      onContinue={onContinue}
      onBack={onBack}
      showBackButton={!!onBack}
      buttonDisabled={!isValid}
    >
      <div className="flex flex-1 flex-col pt-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-xl font-bold text-foreground mb-1">
            Dados físicos
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Ajuda-nos a calcular o teu plano ideal
          </p>
        </motion.div>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <motion.div
              key={field.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
            >
              <button
                onClick={() => setActivePicker(activePicker === field.key ? null : field.key)}
                className={`w-full bg-card rounded-xl p-4 transition-all ${
                  activePicker === field.key ? "ring-1 ring-primary/50" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <field.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="flex-1 text-left">
                    <label className="text-xs text-muted-foreground mb-0.5 block">
                      {field.label} {field.required ? "*" : "(opcional)"}
                    </label>
                    <span
                      className={`text-[15px] ${
                        getDisplayValue(field.key) === "Selecionar" || getDisplayValue(field.key) === "Opcional"
                          ? "text-muted-foreground/50"
                          : "text-foreground"
                      }`}
                    >
                      {getDisplayValue(field.key)}
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: activePicker === field.key ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.div>
                </div>
              </button>

              <AnimatePresence>
                {activePicker === field.key && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2 pb-1">
                      <WheelPicker
                        items={field.key === "height" ? heightOptions : weightOptions}
                        value={data[field.key] || ""}
                        onChange={(value) => onUpdate({ [field.key]: value })}
                        visibleItems={5}
                        itemHeight={40}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-muted-foreground/60 text-center mt-auto pt-4"
        >
          * Campos obrigatórios
        </motion.p>
      </div>
    </OnboardingLayout>
  );
};
