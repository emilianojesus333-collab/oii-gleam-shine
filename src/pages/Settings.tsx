import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Sparkles,
  LogOut,
  FileText,
  Shield,
  Headphones,
  Trash2,
  ChevronRight,
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
import { WeeklyPlanCalendar } from "@/components/settings/WeeklyPlanCalendar";
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

type Schedule = Record<string, string[] | null>;

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="px-1 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
    {children}
  </p>
);

const SettingsRow = ({
  icon: Icon,
  label,
  sublabel,
  onClick,
  iconClass,
  trailing,
}: {
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  onClick?: () => void;
  iconClass?: string;
  trailing?: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 transition-colors active:bg-muted/20"
  >
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-muted/30">
      <Icon className={`h-[18px] w-[18px] ${iconClass ?? "text-muted-foreground"}`} />
    </div>
    <div className="flex-1 text-left">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {sublabel && <p className="text-[11px] text-muted-foreground">{sublabel}</p>}
    </div>
    {trailing ?? <ChevronRight className="h-4 w-4 text-muted-foreground/50" />}
  </button>
);

const Settings = () => {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<Schedule>({});
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

  const handleSaveDay = async (day: string, muscles: string[] | null) => {
    const newSchedule = { ...schedule, [day]: muscles };
    setSchedule(newSchedule);
    try {
      await saveScheduleToDb(newSchedule);
      toast.success(`${day} atualizado!`);
    } catch (error) {
      console.error("Error saving schedule:", error);
    }
  };

  const anim = (delay: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.35 },
  });

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="px-5 pb-4 pt-12">
        <motion.div {...anim(0)} className="flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/40 bg-card"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </motion.button>
          <h1 className="text-xl font-bold text-foreground">Definições</h1>
        </motion.div>
      </div>

      <div className="space-y-2 px-5">
        {/* ─── Profile ─── */}
        <motion.div {...anim(0.05)}>
          <UserProfileCard />
        </motion.div>

        {/* ─── Preferências ─── */}
        <SectionLabel>Preferências</SectionLabel>
        <motion.div
          {...anim(0.1)}
          className="rounded-[20px] border border-border/20 bg-card/60 backdrop-blur-sm"
        >
          {/* AI Name */}
          <SettingsRow
            icon={Sparkles}
            label="Nome do assistente"
            sublabel={aiName}
            iconClass="text-primary"
            onClick={openAiNameEditor}
          />

          <div className="mx-3 border-t border-border/10" />

          {/* Language (inline) */}
          <LanguageSelector inline />

          <div className="mx-3 border-t border-border/10" />

          {/* Calendar mini */}
          <div className="px-3 py-3">
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Plano semanal</span>
              </div>
              <span className="text-[11px] text-muted-foreground">Toca para editar</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {["S", "T", "Q", "Q", "S", "S", "D"].map((shortDay, index) => {
                const fullDay = weekDays[index];
                const workout = getWorkoutDisplay(fullDay);
                const isRest = workout === "Descanso";
                return (
                  <motion.button
                    key={fullDay}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => openDayEditor(fullDay)}
                    className={`flex flex-col items-center gap-1 rounded-xl py-2 transition-all ${
                      isRest
                        ? "bg-muted/15"
                        : "bg-primary/15 ring-1 ring-inset ring-primary/25"
                    }`}
                  >
                    <span className="text-[10px] font-medium text-muted-foreground">{shortDay}</span>
                    <Dumbbell
                      className={`h-3.5 w-3.5 ${isRest ? "text-muted-foreground/30" : "text-primary"}`}
                    />
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* ─── Inteligência Artificial ─── */}
        <SectionLabel>Inteligência Artificial</SectionLabel>
        <motion.div {...anim(0.15)}>
          <AIFeaturesCarousel />
        </motion.div>

        {/* ─── Dados ─── */}
        <SectionLabel>Dados</SectionLabel>
        <motion.div {...anim(0.2)}>
          <ExportData nutritionLogs={allLogs} nutritionGoals={goals} />
        </motion.div>

        {/* ─── Informações ─── */}
        <SectionLabel>Informações</SectionLabel>
        <motion.div
          {...anim(0.25)}
          className="rounded-[20px] border border-border/20 bg-card/60 backdrop-blur-sm"
        >
          <SettingsRow icon={FileText} label="Termos de Uso" onClick={() => navigate("/terms")} />
          <div className="mx-3 border-t border-border/10" />
          <SettingsRow icon={Shield} label="Política de Privacidade" onClick={() => navigate("/privacy")} />
          <div className="mx-3 border-t border-border/10" />
          <SettingsRow
            icon={Headphones}
            label="Suporte"
            iconClass="text-primary"
            onClick={() => navigate("/support")}
          />
        </motion.div>

        {/* ─── Conta ─── */}
        <SectionLabel>Conta</SectionLabel>
        <motion.div
          {...anim(0.3)}
          className="rounded-[20px] border border-border/20 bg-card/60 backdrop-blur-sm"
        >
          <SettingsRow
            icon={LogOut}
            label="Terminar sessão"
            sublabel="Sair da conta"
            onClick={async () => {
              try {
                await supabase.auth.signOut();
                localStorage.removeItem("liftmate_dev_skip_subscription");
                toast.success("Sessão terminada");
                navigate("/auth");
              } catch {
                toast.error("Erro ao terminar sessão");
              }
            }}
            trailing={<span className="text-xs font-medium text-muted-foreground">Sair</span>}
          />
          <div className="mx-3 border-t border-border/10" />
          <SettingsRow
            icon={Trash2}
            label="Apagar conta"
            sublabel="Elimina todos os dados"
            iconClass="text-destructive"
            onClick={() => setShowDeleteDialog(true)}
            trailing={
              <span className="text-xs font-medium text-destructive">Apagar</span>
            }
          />
        </motion.div>

        {/* Bottom spacer */}
        <div className="h-4" />
      </div>

      {/* ─── Sheets ─── */}
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
