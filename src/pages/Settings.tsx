import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Save,
  Check,
  Dumbbell,
  Sparkles,
  Edit3,
  LogOut,
  FileText,
  Shield,
  Headphones,
  Trash2,
  Droplets,
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
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useUserSettings } from "@/hooks/useUserSettings";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatBottleSize } from "@/lib/hydration";

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

const bottleSizeOptions = [500, 750, 1000, 1500];

type Schedule = Record<string, string[] | null>;

const Settings = () => {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<Schedule>({});
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [tempSelection, setTempSelection] = useState<string[]>([]);
  const [aiName, setAiName] = useState("Liftmate");
  const [isEditingAiName, setIsEditingAiName] = useState(false);
  const [tempAiName, setTempAiName] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { settings, updateSettings, updateSchedule: saveScheduleToDb } = useUserSettings();
  const { allLogs, goals } = useNutrition();

  useEffect(() => {
    if (settings) {
      setSchedule(settings.onboarding_data?.schedule || {});
      setAiName(settings.ai_name || "Liftmate");
    }
  }, [settings]);

  const currentAlertsConfig = (settings?.alerts_config as Record<string, any> | null) ?? null;
  const currentBottleSize = Number(currentAlertsConfig?.hydration?.bottleSizeMl) || 1000;

  const openAiNameEditor = () => {
    setTempAiName(aiName);
    setIsEditingAiName(true);
  };

  const saveAiName = async () => {
    if (tempAiName.trim()) {
      const newName = tempAiName.trim();
      setAiName(newName);
      setIsEditingAiName(false);

      try {
        await updateSettings({ ai_name: newName });
        toast.success("Nome da IA atualizado!");
      } catch (error) {
        console.error("Error saving AI name:", error);
      }
    }
  };

  const handleBottleSizeChange = async (bottleSizeMl: number) => {
    try {
      await updateSettings({
        alerts_config: {
          ...(currentAlertsConfig ?? {}),
          hydration: {
            ...(currentAlertsConfig?.hydration ?? {}),
            bottleSizeMl,
          },
        },
      });
      toast.success(`Garrafa definida para ${formatBottleSize(bottleSizeMl)}`);
    } catch (error) {
      console.error("Error saving bottle size:", error);
      toast.error("Erro ao atualizar o tamanho da garrafa");
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
        return prev.filter((selectedGroup) => selectedGroup !== group);
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
    <div className="min-h-screen bg-black pb-32">
      <div className="bg-black px-5 pb-6 pt-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 bg-card"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </motion.button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Definições</h1>
            <p className="text-sm text-muted-foreground">Personaliza o teu treino</p>
          </div>
        </motion.div>
      </div>

      <div className="space-y-5 bg-black px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <UserProfileCard />
        </motion.div>


        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="rounded-[20px] border border-border/30 bg-[#111311] p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Nome do assistente</h3>
                <p className="text-xs text-muted-foreground">{aiName}</p>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={openAiNameEditor}
              className="rounded-xl border border-border/50 bg-muted/30 p-2.5"
            >
              <Edit3 className="h-4 w-4 text-muted-foreground" />
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-[20px] border border-border/30 bg-[#111311] p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
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
                  className={`flex flex-col items-center rounded-lg p-2 transition-all ${
                    isRest ? "bg-muted/20" : "border border-primary/30 bg-primary/20"
                  }`}
                >
                  <span className="mb-1 text-[10px] text-muted-foreground">{shortDay}</span>
                  <Dumbbell className={`h-3.5 w-3.5 ${isRest ? "text-muted-foreground/50" : "text-primary"}`} />
                </motion.button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-center gap-4 border-t border-border/20 pt-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-primary/50"></div>
              <span>Treino</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-muted/50"></div>
              <span>Descanso</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <AIFeaturesCarousel />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <ExportData nutritionLogs={allLogs} nutritionGoals={goals} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
        >
          <LanguageSelector />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-[20px] border border-border/30 bg-[#111311] p-4"
        >
          <div className="space-y-3">
            <button
              onClick={() => navigate("/terms")}
              className="flex w-full items-center justify-between py-2"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/30">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <span className="font-medium text-foreground">Termos de Uso</span>
              </div>
              <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
            </button>

            <div className="border-t border-border/20" />

            <button
              onClick={() => navigate("/privacy")}
              className="flex w-full items-center justify-between py-2"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/30">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                </div>
                <span className="font-medium text-foreground">Política de Privacidade</span>
              </div>
              <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
            </button>

            <div className="border-t border-border/20" />

            <button
              onClick={() => navigate("/support")}
              className="flex w-full items-center justify-between py-2"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                  <Headphones className="h-5 w-5 text-primary" />
                </div>
                <span className="font-medium text-foreground">Suporte</span>
              </div>
              <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4 rounded-[20px] border border-border/30 bg-[#111311] p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/30">
                <LogOut className="h-5 w-5 text-muted-foreground" />
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
              className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/50 px-4 py-2.5 text-sm font-medium text-foreground"
            >
              Sair
            </motion.button>
          </div>

          <div className="border-t border-border/20" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Apagar conta</h3>
                <p className="text-xs text-muted-foreground">Elimina todos os dados</p>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground"
            >
              Apagar
            </motion.button>
          </div>
        </motion.div>
      </div>

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
                        ? "bg-primary text-primary-foreground"
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
              className="border-border/50 bg-muted/30"
              maxLength={20}
            />

            <div className="flex flex-wrap gap-2">
              {["Coach", "Buddy", "Trainer", "Atlas", "Titan", "Max"].map((suggestion) => (
                <motion.button
                  key={suggestion}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTempAiName(suggestion)}
                  className={`rounded-lg px-3 py-1.5 text-sm transition-all ${
                    tempAiName === suggestion
                      ? "bg-primary text-primary-foreground"
                      : "border border-border/50 bg-muted/30 text-muted-foreground"
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-semibold text-primary-foreground disabled:opacity-50"
            >
              <Save className="h-5 w-5" />
              Guardar
            </motion.button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar conta permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Todos os teus dados serão eliminados permanentemente, incluindo:
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Histórico de treinos</li>
                <li>Registos nutricionais</li>
                <li>Medidas corporais</li>
                <li>Conversas com a IA</li>
                <li>Definições e preferências</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={async (event) => {
                event.preventDefault();
                setIsDeleting(true);
                try {
                  const { data: { session } } = await supabase.auth.getSession();
                  if (!session) throw new Error("Sem sessão ativa");

                  const response = await supabase.functions.invoke("delete-account", {});
                  if (response.error) throw response.error;
                  const result = response.data;
                  if (!result?.success) throw new Error("Falha ao eliminar conta");

                  localStorage.clear();

                  toast.success("Conta eliminada com sucesso");
                  navigate("/auth");
                } catch (error) {
                  console.error("Error deleting account:", error);
                  toast.error("Erro ao eliminar conta. Tenta novamente.");
                } finally {
                  setIsDeleting(false);
                  setShowDeleteDialog(false);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "A eliminar..." : "Apagar conta"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
};

export default Settings;
