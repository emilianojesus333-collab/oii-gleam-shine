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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { settings, updateSettings, updateSchedule: saveScheduleToDb } = useUserSettings();
  const { allLogs, goals } = useNutrition();

  useEffect(() => {
    if (settings) {
      setSchedule(settings.onboarding_data?.schedule || {});
    }
  }, [settings]);




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




        {/* ─── Plano Semanal (separado) ─── */}
        <SectionLabel>Plano Semanal</SectionLabel>
        <motion.div
          {...anim(0.12)}
          className="rounded-[20px] border border-border/20 bg-card/60 p-4 backdrop-blur-sm"
        >
          <WeeklyPlanCalendar schedule={schedule} onSaveDay={handleSaveDay} />
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
          <LanguageSelector inline />
          <div className="mx-3 border-t border-border/10" />
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
