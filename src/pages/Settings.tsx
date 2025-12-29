import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Calendar, 
  Save, 
  Check,
  Dumbbell,
  Sun,
  Moon,
  Sparkles,
  Edit3,
  CreditCard,
  ExternalLink,
  LogOut,
  FileText,
  Shield,
  Headphones
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BottomNav } from "@/components/BottomNav";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ExportData } from "@/components/settings/ExportData";
import { AIFeaturesCarousel } from "@/components/settings/AIFeaturesCarousel";
import { UserProfileCard } from "@/components/settings/UserProfileCard";
import { LanguageSelector } from "@/components/settings/LanguageSelector";
import { useNutrition } from "@/hooks/useNutrition";
import { useSubscription } from "@/hooks/useSubscription";
import { Input } from "@/components/ui/input";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";
import { supabase } from "@/integrations/supabase/client";
import { useUserSettings } from "@/hooks/useUserSettings";

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
  const [aiName, setAiName] = useState("Liftmate");
  const [isEditingAiName, setIsEditingAiName] = useState(false);
  const [tempAiName, setTempAiName] = useState("");
  
  // Get user settings from database (per-user data)
  const { settings, updateSettings, updateSchedule: saveScheduleToDb, isLoading: settingsLoading } = useUserSettings();
  
  // Get nutrition data for export
  const { allLogs, goals } = useNutrition();
  
  // Get subscription management
  const { openCustomerPortal } = useSubscription();
  const [portalLoading, setPortalLoading] = useState(false);

  // Load schedule and AI name from database settings
  useEffect(() => {
    if (settings) {
      setSchedule(settings.onboarding_data?.schedule || {});
      setAiName(settings.ai_name || "Liftmate");
    }
  }, [settings]);

  const openAiNameEditor = () => {
    setTempAiName(aiName);
    setIsEditingAiName(true);
  };

  const saveAiName = async () => {
    if (tempAiName.trim()) {
      const newName = tempAiName.trim();
      setAiName(newName);
      setIsEditingAiName(false);
      
      // Save to database (per-user)
      try {
        await updateSettings({ ai_name: newName });
        toast.success("Nome da IA atualizado!");
      } catch (error) {
        console.error("Error saving AI name:", error);
      }
    }
  };

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

  const saveDay = async () => {
    if (!selectedDay) return;
    
    const newSchedule = {
      ...schedule,
      [selectedDay]: tempSelection.length > 0 ? tempSelection : null,
    };
    setSchedule(newSchedule);
    
    // Save to database (per-user)
    try {
      await saveScheduleToDb(newSchedule);
      toast.success(`${selectedDay} atualizado!`);
    } catch (error) {
      console.error("Error saving schedule:", error);
    }
    
    setSelectedDay(null);
  };

  const setRestDay = async () => {
    if (!selectedDay) return;
    setTempSelection([]);
    
    const newSchedule = {
      ...schedule,
      [selectedDay]: null,
    };
    setSchedule(newSchedule);
    
    // Save to database (per-user)
    try {
      await saveScheduleToDb(newSchedule);
      toast.success(`${selectedDay} definido como descanso!`);
    } catch (error) {
      console.error("Error saving rest day:", error);
    }
    
    setSelectedDay(null);
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
        {/* User Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <UserProfileCard />
        </motion.div>

        {/* AI Name Editor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-card rounded-[20px] p-4 border border-border/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Nome do assistente</h3>
                <p className="text-xs text-muted-foreground">{aiName}</p>
              </div>
            </div>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={openAiNameEditor}
              className="p-2.5 rounded-xl bg-muted/30 border border-border/50"
            >
              <Edit3 className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          </div>
        </motion.div>

        {/* Compact Calendar Editor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-[20px] p-4 border border-border/30"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Calendário</h2>
            </div>
            <p className="text-xs text-muted-foreground">Toca para editar</p>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((shortDay, index) => {
              const fullDay = weekDays[index];
              const workout = getWorkoutDisplay(fullDay);
              const isRest = workout === "Descanso";
              
              return (
                <motion.button
                  key={fullDay}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openDayEditor(fullDay)}
                  className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                    isRest
                      ? "bg-muted/20"
                      : "bg-primary/20 border border-primary/30"
                  }`}
                >
                  <span className="text-[10px] text-muted-foreground mb-1">{shortDay}</span>
                  <Dumbbell className={`w-3.5 h-3.5 ${isRest ? "text-muted-foreground/50" : "text-primary"}`} />
                </motion.button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-3 pt-2 border-t border-border/20">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary/50"></div>
              <span>Treino</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-muted/50"></div>
              <span>Descanso</span>
            </div>
          </div>
        </motion.div>

        {/* AI Features Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <AIFeaturesCarousel />
        </motion.div>

        {/* Manage Subscription */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-[20px] p-4 border border-border/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div className="flex items-center gap-2">
                <div>
                  <h3 className="font-semibold text-foreground">Subscrição</h3>
                  <p className="text-xs text-muted-foreground">Gerir plano e pagamento</p>
                </div>
                <SubscriptionBadge />
              </div>
            </div>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={async () => {
                setPortalLoading(true);
                try {
                  await openCustomerPortal();
                } catch (error) {
                  toast.error("Erro ao abrir portal de gestão");
                } finally {
                  setPortalLoading(false);
                }
              }}
              disabled={portalLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50"
            >
              {portalLoading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Gerir
                  <ExternalLink className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Export Data */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <ExportData nutritionLogs={allLogs} nutritionGoals={goals} />
        </motion.div>

        {/* Language Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
        >
          <LanguageSelector />
        </motion.div>

        {/* Theme Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-[20px] p-4 border border-border/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                {document.documentElement.classList.contains('dark') ? (
                  <Moon className="w-5 h-5 text-primary" />
                ) : (
                  <Sun className="w-5 h-5 text-primary" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Tema</h3>
                <p className="text-xs text-muted-foreground">Altera a aparência</p>
              </div>
            </div>
            
            <div className="flex bg-muted/30 rounded-xl p-1">
              <button
                onClick={() => {
                  document.documentElement.classList.remove('dark');
                  localStorage.setItem('liftmate_theme', 'light');
                  toast.success('Tema claro ativado');
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  !document.documentElement.classList.contains('dark')
                    ? 'bg-white text-black shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  document.documentElement.classList.add('dark');
                  localStorage.setItem('liftmate_theme', 'dark');
                  toast.success('Tema escuro ativado');
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  document.documentElement.classList.contains('dark')
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Moon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Legal Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card rounded-[20px] p-4 border border-border/30"
        >
          <div className="space-y-3">
            <button
              onClick={() => navigate("/terms")}
              className="w-full flex items-center justify-between py-2"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="font-medium text-foreground">Termos de Uso</span>
              </div>
              <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
            </button>
            
            <div className="border-t border-border/20" />
            
            <button
              onClick={() => navigate("/privacy")}
              className="w-full flex items-center justify-between py-2"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="font-medium text-foreground">Política de Privacidade</span>
              </div>
              <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
            </button>
            
            <div className="border-t border-border/20" />
            
            <button
              onClick={() => navigate("/support")}
              className="w-full flex items-center justify-between py-2"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Headphones className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium text-foreground">Suporte</span>
              </div>
              <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
            </button>
          </div>
        </motion.div>

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-[20px] p-4 border border-destructive/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Terminar sessão</h3>
                <p className="text-xs text-muted-foreground">Sair da conta</p>
              </div>
            </div>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={async () => {
                try {
                  await supabase.auth.signOut();
                  localStorage.removeItem("liftmate_dev_skip_subscription");
                  toast.success("Sessão terminada");
                  navigate("/auth");
                } catch (error) {
                  toast.error("Erro ao terminar sessão");
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-medium text-sm"
            >
              Sair
            </motion.button>
          </div>
        </motion.div>
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

      {/* AI Name Editor Sheet */}
      <Sheet open={isEditingAiName} onOpenChange={setIsEditingAiName}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-xl font-bold">Nome do assistente</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Como queres chamar o teu assistente?</p>
            
            <Input
              value={tempAiName}
              onChange={(e) => setTempAiName(e.target.value)}
              placeholder="Ex: Coach, Buddy, Trainer..."
              className="bg-muted/30 border-border/50"
              maxLength={20}
            />

            <div className="flex flex-wrap gap-2">
              {["Coach", "Buddy", "Trainer", "Atlas", "Titan", "Max"].map((suggestion) => (
                <motion.button
                  key={suggestion}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTempAiName(suggestion)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    tempAiName === suggestion
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/30 text-muted-foreground border border-border/50"
                  }`}
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={saveAiName}
              disabled={!tempAiName.trim()}
              className="w-full py-4 rounded-xl bg-primary font-semibold text-primary-foreground flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              Guardar
            </motion.button>
          </div>
        </SheetContent>
      </Sheet>

      <BottomNav />
    </div>
  );
};

export default Settings;
