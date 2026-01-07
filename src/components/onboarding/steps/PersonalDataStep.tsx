import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { OnboardingLayout } from "../OnboardingLayout";
import { WheelPicker } from "../WheelPicker";
import { User, Ruler, Weight, Heart } from "lucide-react";

interface PersonalDataStepProps {
  personalData: {
    name: string;
    height: string;
    weight: string;
    gender: string;
    birthYear: string;
  };
  onUpdate: (data: Partial<PersonalDataStepProps["personalData"]>) => void;
  onContinue: () => void;
  onBack: () => void;
}

// Generate height options (140cm - 220cm)
const heightOptions = Array.from({ length: 81 }, (_, i) => {
  const cm = 140 + i;
  return { value: String(cm), label: `${cm} cm` };
});

// Generate weight options (40kg - 150kg)
const weightOptions = [
  { value: "", label: "Prefiro não dizer" },
  ...Array.from({ length: 111 }, (_, i) => {
    const kg = 40 + i;
    return { value: String(kg), label: `${kg} kg` };
  }),
];

// Gender options
const genderOptions = [
  { value: "male", label: "Masculino" },
  { value: "female", label: "Feminino" },
  { value: "other", label: "Outro" },
  { value: "prefer_not", label: "Prefiro não dizer" },
];

// Birth year options (1940 - 2010)
const currentYear = new Date().getFullYear();
const birthYearOptions = Array.from({ length: 71 }, (_, i) => {
  const year = currentYear - 14 - i;
  return { value: String(year), label: String(year) };
});

type PickerField = "height" | "weight" | "gender" | "birthYear" | null;

export const PersonalDataStep = ({
  personalData,
  onUpdate,
  onContinue,
  onBack,
}: PersonalDataStepProps) => {
  const [activePicker, setActivePicker] = useState<PickerField>(null);
  const [name, setName] = useState(personalData.name);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    onUpdate({ name: value });
  };

  const isValid = name.trim().length >= 2 && personalData.height && personalData.gender && personalData.birthYear;

  const getDisplayValue = (field: PickerField) => {
    switch (field) {
      case "height":
        return personalData.height ? `${personalData.height} cm` : "Selecionar";
      case "weight":
        return personalData.weight ? `${personalData.weight} kg` : "Opcional";
      case "gender":
        return genderOptions.find(g => g.value === personalData.gender)?.label || "Selecionar";
      case "birthYear":
        return personalData.birthYear || "Selecionar";
      default:
        return "";
    }
  };

  const fields = [
    { key: "height" as PickerField, icon: Ruler, label: "Altura", required: true },
    { key: "weight" as PickerField, icon: Weight, label: "Peso", required: false },
    { key: "gender" as PickerField, icon: Heart, label: "Género", required: true },
    { key: "birthYear" as PickerField, icon: User, label: "Ano de nascimento", required: true },
  ];

  return (
    <OnboardingLayout
      onContinue={onContinue}
      onBack={onBack}
      showBackButton
      buttonDisabled={!isValid}
    >
      <div className="flex flex-1 flex-col pt-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-xl font-bold text-foreground mb-1">
            Conta-nos sobre ti
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Estas informações ajudam a personalizar a tua experiência
          </p>
        </motion.div>

        <div className="space-y-3">
          {/* Name input */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-card rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <User className="h-5 w-5 text-foreground" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">
                  Nome *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  placeholder="Como te chamas?"
                  className="w-full bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                  maxLength={30}
                />
              </div>
            </div>
          </motion.div>

          {/* Picker fields */}
          {fields.map((field, index) => (
            <motion.div
              key={field.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
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
                      {field.label} {field.required && "*"}
                    </label>
                    <span className={`text-[15px] ${
                      getDisplayValue(field.key) === "Selecionar" || getDisplayValue(field.key) === "Opcional"
                        ? "text-muted-foreground/50" 
                        : "text-foreground"
                    }`}>
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
                        items={
                          field.key === "height" ? heightOptions :
                          field.key === "weight" ? weightOptions :
                          field.key === "gender" ? genderOptions :
                          birthYearOptions
                        }
                        value={personalData[field.key] || ""}
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
