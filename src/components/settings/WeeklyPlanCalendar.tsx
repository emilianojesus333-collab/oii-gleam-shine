import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Save, Calendar } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const weekDayLabels = ["D", "S", "T", "Q", "Q", "S", "S"];
const weekDaysFull = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

const muscleGroups = [
  "Peito",
  "Costas",
  "Ombros",
  "Bíceps",
  "Tríceps",
  "Pernas",
  "Core",
  "Glúteos",
  "Cardio",
];

type Schedule = Record<string, string[] | null>;

interface WeeklyPlanCalendarProps {
  schedule: Schedule;
  onSaveDay: (day: string, muscles: string[] | null) => Promise<void>;
}

function getWeekDates(): { label: string; dayNum: number; fullDay: string }[] {
  const today = new Date();
  const currentDow = today.getDay(); // 0=Sun
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDow);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return {
      label: weekDayLabels[i],
      dayNum: d.getDate(),
      fullDay: weekDaysFull[i],
    };
  });
}

export const WeeklyPlanCalendar = ({ schedule, onSaveDay }: WeeklyPlanCalendarProps) => {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [tempSelection, setTempSelection] = useState<string[]>([]);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const weekDates = getWeekDates();
  const today = new Date();
  const todayDow = today.getDay();

  const getWorkoutGroups = (day: string): string[] => {
    const groups = schedule[day];
    if (!groups || (Array.isArray(groups) && groups.length === 0)) return [];
    return Array.isArray(groups) ? groups : [];
  };

  const openDayEditor = (day: string) => {
    const current = getWorkoutGroups(day);
    setTempSelection([...current]);
    setSelectedDay(day);
    setExpandedDay(null);
  };

  const toggleMuscleGroup = (group: string) => {
    setTempSelection((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  };

  const saveDay = async () => {
    if (!selectedDay) return;
    await onSaveDay(selectedDay, tempSelection.length > 0 ? tempSelection : null);
    setSelectedDay(null);
  };

  const setRestDay = async () => {
    if (!selectedDay) return;
    await onSaveDay(selectedDay, null);
    setSelectedDay(null);
  };

  const toggleExpand = (fullDay: string) => {
    setExpandedDay((prev) => (prev === fullDay ? null : fullDay));
  };

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Plano semanal</span>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDates.map(({ label, dayNum, fullDay }, index) => {
            const muscles = getWorkoutGroups(fullDay);
            const isRest = muscles.length === 0;
            const isToday = index === todayDow;
            const isExpanded = expandedDay === fullDay;

            return (
              <div key={fullDay} className="relative">
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => toggleExpand(fullDay)}
                  onDoubleClick={() => openDayEditor(fullDay)}
                  className={`flex w-full flex-col items-center gap-0.5 rounded-2xl py-2.5 transition-all ${
                    isToday
                      ? "bg-primary text-primary-foreground ring-2 ring-primary/50"
                      : isRest
                        ? "bg-muted/20"
                        : "bg-destructive/10 ring-1 ring-inset ring-destructive/20"
                  }`}
                >
                  <span
                    className={`text-[10px] font-medium ${
                      isToday ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                  <span
                    className={`text-base font-bold ${
                      isToday ? "text-primary-foreground" : "text-foreground"
                    }`}
                  >
                    {dayNum}
                  </span>
                  {!isRest && (
                    <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-destructive" />
                  )}
                </motion.button>

                {/* Tooltip com músculos */}
                <AnimatePresence>
                  {isExpanded && !isRest && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.95 }}
                      className="absolute left-1/2 top-full z-30 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-xl border border-border/30 bg-card px-3 py-2 shadow-lg"
                    >
                      <div className="flex flex-col gap-0.5">
                        {muscles.map((m) => (
                          <span key={m} className="text-[10px] font-medium text-destructive">
                            {m}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => openDayEditor(fullDay)}
                        className="mt-1.5 w-full rounded-lg bg-muted/30 px-2 py-1 text-[9px] font-medium text-muted-foreground"
                      >
                        Editar
                      </button>
                    </motion.div>
                  )}
                  {isExpanded && isRest && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.95 }}
                      className="absolute left-1/2 top-full z-30 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-xl border border-border/30 bg-card px-3 py-2 shadow-lg"
                    >
                      <span className="text-[10px] text-muted-foreground">Descanso</span>
                      <button
                        onClick={() => openDayEditor(fullDay)}
                        className="mt-1.5 block w-full rounded-lg bg-muted/30 px-2 py-1 text-[9px] font-medium text-muted-foreground"
                      >
                        Editar
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sheet de edição */}
      <Sheet open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-xl font-bold">{selectedDay}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Seleciona os grupos musculares:</p>
            <div className="grid grid-cols-3 gap-2">
              {muscleGroups.map((group) => {
                const isSelected = tempSelection.includes(group);
                return (
                  <motion.button
                    key={group}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleMuscleGroup(group)}
                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-destructive text-destructive-foreground"
                        : "border border-border/50 bg-muted/30 text-foreground"
                    }`}
                  >
                    {isSelected && <Check className="h-4 w-4" />}
                    {group}
                  </motion.button>
                );
              })}
            </div>
            <div className="flex gap-3 pt-4">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={setRestDay}
                className="flex-1 rounded-xl border border-border/50 bg-muted/30 py-4 font-semibold text-foreground"
              >
                Dia de Descanso
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={saveDay}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-4 font-semibold text-primary-foreground"
              >
                <Save className="h-5 w-5" />
                Guardar
              </motion.button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
