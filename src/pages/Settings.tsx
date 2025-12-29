import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Calendar, 
  Save, 
  RotateCcw,
  Check,
  Dumbbell
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BottomNav } from "@/components/BottomNav";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ExportData } from "@/components/settings/ExportData";
import { PhysiqueEvaluation } from "@/components/settings/PhysiqueEvaluation";
import { useNutrition } from "@/hooks/useNutrition";

const weekDays = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
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

const Settings = () => {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<Schedule>({});
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [tempSelection, setTempSelection] = useState<string[]>([]);
  
  // Get nutrition data for export
  const { allLogs, goals } = useNutrition();

  // Load schedule from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("liftmate_onboarding");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setSchedule(data.schedule || {});
      } catch (e) {
        console.error("Error loading schedule:", e);
      }
    }
  }, []);

  const openDayEditor = (day: string) => {
    const current = schedule[day];
    setTempSelection(Array.isArray(current) ? current : []);
    setSelectedDay(day);
  };

  const toggleMuscleGroup = (group: string) => {
    setTempSelection((prev) => {
      if (prev.includes(group)) {
        return prev.filter((g) => g !== group);
      }
      return [...prev, group];
    });
  };

  const saveDay = () => {
    if (!selectedDay) return;
    
    const newSchedule = {
      ...schedule,
      [selectedDay]: tempSelection.length > 0 ? tempSelection : null,
    };
    setSchedule(newSchedule);
    
    // Save to localStorage
    const saved = localStorage.getItem("liftmate_onboarding");
    const data = saved ? JSON.parse(saved) : {};
    data.schedule = newSchedule;
    localStorage.setItem("liftmate_onboarding", JSON.stringify(data));
    
    // Also update liftmate_user_data for workout page compatibility
    const userData = localStorage.getItem("liftmate_user_data");
    if (userData) {
      const userDataObj = JSON.parse(userData);
      userDataObj.calendar = {};
      for (const [dayName, groups] of Object.entries(newSchedule)) {
        userDataObj.calendar[dayName] = groups 
          ? (Array.isArray(groups) ? groups.join(" + ") : groups)
          : "Descanso";
      }
      localStorage.setItem("liftmate_user_data", JSON.stringify(userDataObj));
    }
    
    setSelectedDay(null);
    toast.success(`${selectedDay} atualizado!`);
  };

  const setRestDay = () => {
    if (!selectedDay) return;
    setTempSelection([]);
    
    const newSchedule = {
      ...schedule,
      [selectedDay]: null,
    };
    setSchedule(newSchedule);
    
    // Save to localStorage
    const saved = localStorage.getItem("liftmate_onboarding");
    const data = saved ? JSON.parse(saved) : {};
    data.schedule = newSchedule;
    localStorage.setItem("liftmate_onboarding", JSON.stringify(data));
    
    // Also update liftmate_user_data
    const userData = localStorage.getItem("liftmate_user_data");
    if (userData) {
      const userDataObj = JSON.parse(userData);
      userDataObj.calendar = userDataObj.calendar || {};
      userDataObj.calendar[selectedDay] = "Descanso";
      localStorage.setItem("liftmate_user_data", JSON.stringify(userDataObj));
    }
    
    setSelectedDay(null);
    toast.success(`${selectedDay} definido como descanso!`);
  };

  const handleResetOnboarding = () => {
    localStorage.removeItem("liftmate_onboarding");
    localStorage.removeItem("liftmate_onboarded");
    localStorage.removeItem("liftmate_user_data");
    localStorage.removeItem("liftmate_completed_exercises");
    toast.success("Dados resetados!");
    navigate("/");
  };

  const getWorkoutDisplay = (day: string) => {
    const groups = schedule[day];
    if (!groups || (Array.isArray(groups) && groups.length === 0)) {
      return "Descanso";
    }
    return Array.isArray(groups) ? groups.join(" + ") : groups;
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-card border border-border/50 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Definições</h1>
            <p className="text-sm text-muted-foreground">Personaliza o teu treino</p>
          </div>
        </motion.div>
      </div>

      <div className="px-5 space-y-5">
        {/* Calendar Editor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-[20px] p-5 border border-border/30"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Calendário de Treino</h2>
              <p className="text-xs text-muted-foreground">Toca num dia para editar</p>
            </div>
          </div>

          <div className="space-y-2">
            {weekDays.map((day, index) => {
              const workout = getWorkoutDisplay(day);
              const isRest = workout === "Descanso";
              
              return (
                <motion.button
                  key={day}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + index * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openDayEditor(day)}
                  className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${
                    isRest
                      ? "bg-muted/20 border border-border/30"
                      : "bg-primary/10 border border-primary/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isRest ? "bg-muted/30" : "bg-primary/20"
                    }`}>
                      <Dumbbell className={`w-4 h-4 ${isRest ? "text-muted-foreground" : "text-primary"}`} />
                    </div>
                    <span className="font-medium text-foreground">{day}</span>
                  </div>
                  <span className={`text-sm ${isRest ? "text-muted-foreground" : "text-primary font-medium"}`}>
                    {workout}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Physique Evaluation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <PhysiqueEvaluation />
        </motion.div>

        {/* Export Data */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ExportData nutritionLogs={allLogs} nutritionGoals={goals} />
        </motion.div>

        {/* Reset Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleResetOnboarding}
          className="w-full bg-destructive/10 border border-destructive/20 rounded-[20px] p-5 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
            <RotateCcw className="w-5 h-5 text-destructive" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-foreground">Refazer Onboarding</h3>
            <p className="text-xs text-muted-foreground">Recomeça do zero</p>
          </div>
        </motion.button>
      </div>

      {/* Day Editor Sheet */}
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
                    className={`py-3 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/30 text-foreground border border-border/50"
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4" />}
                    {group}
                  </motion.button>
                );
              })}
            </div>

            <div className="flex gap-3 pt-4">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={setRestDay}
                className="flex-1 py-4 rounded-xl bg-muted/30 border border-border/50 font-semibold text-foreground"
              >
                Dia de Descanso
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={saveDay}
                className="flex-1 py-4 rounded-xl bg-primary font-semibold text-primary-foreground flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Guardar
              </motion.button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <BottomNav />
    </div>
  );
};

export default Settings;
