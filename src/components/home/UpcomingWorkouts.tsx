import { useMemo } from "react";
import { motion } from "framer-motion";
import { useUserSettings } from "@/hooks/useUserSettings";

const weekDaysMap: Record<number, string> = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado"
};

const shortDaysMap: Record<number, string> = {
  0: "DOM",
  1: "SEG",
  2: "TER",
  3: "QUA",
  4: "QUI",
  5: "SEX",
  6: "SÁB"
};

export const UpcomingWorkouts = () => {
  const { settings } = useUserSettings();

  const nextDays = useMemo(() => {
    const schedule = settings?.onboarding_data?.schedule || {};
    const todayIndex = new Date().getDay();
    const result: {shortDay: string;fullDay: string;workout: string | null;}[] = [];

    for (let i = 1; i <= 3; i++) {
      const dayIndex = (todayIndex + i) % 7;
      const dayName = weekDaysMap[dayIndex];
      const groups = schedule[dayName] || null;
      const workout = groups ?
      Array.isArray(groups) ?
      groups.join(" • ") :
      groups :
      null;

      result.push({
        shortDay: shortDaysMap[dayIndex],
        fullDay: dayName,
        workout
      });
    }

    return result;
  }, [settings]);

  if (!settings?.onboarding_data?.schedule) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="space-y-3">
      
      <h2 className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">
        Próximos treinos
      </h2>

      <div className="space-y-2">
        {nextDays.map((day, index) => {
          const isRest = !day.workout || day.workout === "Descanso";
          return (
            <motion.div
              key={day.fullDay}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 + index * 0.08 }}
              className={`rounded-xl p-3.5 sm:p-4 bg-[#111311] ${
              index === 0 ? "border border-blue-500/30" : ""}`
              }>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-blue-400 w-8">
                    {day.shortDay}
                  </span>
                  <div>
                    <p
                      className={`text-sm font-semibold ${
                      isRest ? "text-muted-foreground" : "text-foreground"}`
                      }>
                      
                      {isRest ? "Descanso" : day.workout}
                    </p>
                    

                    
                  </div>
                </div>
              </div>
            </motion.div>);

        })}
      </div>
    </motion.div>);

};