import { OnboardingLayout } from "../OnboardingLayout";
import { motion } from "framer-motion";

interface ScheduleStepProps {
  frequency: string | null;
  schedule: Record<string, string[] | null>;
  onUpdate: (schedule: Record<string, string[] | null>) => void;
  onContinue: () => void;
  onBack?: () => void;
}

const DAYS = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];

const SHORT_DAYS: Record<string, string> = {
  "Segunda-feira": "Seg",
  "Terça-feira": "Ter",
  "Quarta-feira": "Qua",
  "Quinta-feira": "Qui",
  "Sexta-feira": "Sex",
  "Sábado": "Sáb",
  "Domingo": "Dom",
};

const MUSCLE_GROUPS = [
  "Peito", "Costas", "Ombros", "Bíceps", "Tríceps",
  "Pernas", "Glúteos", "Abdominais", "Descanso",
];

const GROUP_COLORS: Record<string, string> = {
  Peito: "#3B82F6", Costas: "#8B5CF6", Ombros: "#F59E0B",
  Bíceps: "#10B981", Tríceps: "#06B6D4", Pernas: "#EF4444",
  Glúteos: "#EC4899", Abdominais: "#F97316", Descanso: "#6B7280",
};

export const ScheduleStep = ({
  frequency,
  schedule,
  onUpdate,
  onContinue,
  onBack,
}: ScheduleStepProps) => {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const toggleMuscle = (day: string, muscle: string) => {
    const current = schedule[day] || [];
    if (muscle === "Descanso") {
      onUpdate({ ...schedule, [day]: ["Descanso"] });
      return;
    }
    const withoutRest = current.filter((m) => m !== "Descanso");
    const updated = withoutRest.includes(muscle)
      ? withoutRest.filter((m) => m !== muscle)
      : [...withoutRest, muscle];
    onUpdate({ ...schedule, [day]: updated.length ? updated : null });
  };

  const activeDays = Object.values(schedule).filter(
    (v) => v && v.length > 0 && !v.includes("Descanso")
  ).length;

  const isValid = activeDays >= 1;

  return (
    <OnboardingLayout
      onContinue={onContinue}
      onBack={onBack}
      showBackButton={!!onBack}
      buttonDisabled={!isValid}
    >
      <div className="flex flex-1 flex-col pt-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="text-2xl font-black text-foreground mb-2">
            O teu plano semanal
          </h2>
          <p className="text-muted-foreground text-sm">
            Escolhe o que treinas em cada dia. Podes alterar depois nas Definições.
          </p>
        </motion.div>

        {/* Day selector */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {DAYS.map((day) => {
            const muscles = schedule[day];
            const hasWorkout = muscles && muscles.length > 0;
            const isRest = muscles?.includes("Descanso");
            const isSelected = selectedDay === day;

            return (
              <motion.button
                key={day}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className="flex flex-col items-center flex-shrink-0 rounded-xl px-3 py-2.5 transition-all"
                style={{
                  background: isSelected
                    ? "rgba(34,197,94,0.15)"
                    : hasWorkout
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(255,255,255,0.03)",
                  border: `1px solid ${
                    isSelected
                      ? "rgba(34,197,94,0.5)"
                      : hasWorkout
                      ? "rgba(255,255,255,0.12)"
                      : "rgba(255,255,255,0.06)"
                  }`,
                  minWidth: 52,
                }}
              >
                <span className="text-[11px] font-medium text-muted-foreground mb-1">
                  {SHORT_DAYS[day]}
                </span>
                {isRest ? (
                  <span className="text-[10px] text-muted-foreground/60">—</span>
                ) : hasWorkout ? (
                  <div className="flex flex-wrap gap-0.5 justify-center max-w-[44px]">
                    {muscles!.map((m) => (
                      <div
                        key={m}
                        className="w-2 h-2 rounded-full"
                        style={{ background: GROUP_COLORS[m] || "#6B7280" }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="w-2 h-2 rounded-full bg-white/10" />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Muscle group picker for selected day */}
        {selectedDay && (
          <motion.div
            key={selectedDay}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <p className="text-sm font-semibold text-foreground mb-3">
              {selectedDay}
            </p>
            <div className="flex flex-wrap gap-2">
              {MUSCLE_GROUPS.map((muscle) => {
                const current = schedule[selectedDay] || [];
                const active = current.includes(muscle);
                const color = GROUP_COLORS[muscle];

                return (
                  <motion.button
                    key={muscle}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleMuscle(selectedDay, muscle)}
                    className="rounded-xl px-3.5 py-2 text-sm font-medium transition-all"
                    style={{
                      background: active ? `${color}22` : "rgba(255,255,255,0.05)",
                      border: `1px solid ${active ? color : "rgba(255,255,255,0.1)"}`,
                      color: active ? color : "#9CA3AF",
                    }}
                  >
                    {muscle}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {!selectedDay && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground/50 text-center">
              Toca num dia para definir o treino
            </p>
          </div>
        )}

        {isValid && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-auto pt-4"
          >
            <p className="text-xs text-center text-muted-foreground/60">
              {activeDays} dia{activeDays !== 1 ? "s" : ""} de treino configurado{activeDays !== 1 ? "s" : ""}
            </p>
          </motion.div>
        )}
      </div>
    </OnboardingLayout>
  );
};

// Need useState - add the import
import { useState } from "react";
