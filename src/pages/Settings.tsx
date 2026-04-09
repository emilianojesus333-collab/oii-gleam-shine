import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  LogOut,
  FileText,
  Shield,
  Headphones,
  Trash2,
  ChevronRight,
  Crown,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BottomNav } from "@/components/BottomNav";
import { useSubscriptionContext } from "@/contexts/SubscriptionContext";

import { ExportData } from "@/components/settings/ExportData";
import { AIFeaturesCarousel } from "@/components/settings/AIFeaturesCarousel";
import { UserProfileCard } from "@/components/settings/UserProfileCard";
import { LanguageSelector } from "@/components/settings/LanguageSelector";
import { useNutrition } from "@/hooks/useNutrition";

import { supabase } from "@/integrations/supabase/client";
import { useUserSettings } from "@/hooks/useUserSettings";
import { WeeklyPlanCalendar } from "@/components/settings/WeeklyPlanCalendar";
import { HexBadge } from "@/components/ui/HexBadge";
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
    className="flex w-full items-center gap-3 px-3 py-3 transition-colors active:bg-muted/20"
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
  const [isDeleting, setIsDeleting] = useState(false);

  const { settings, updateSettings, updateSchedule: saveScheduleToDb } = useUserSettings();
  const { allLogs, goals } = useNutrition();
  const { isSubscriptionValid, isTrialing, subscriptionEnd, openCustomerPortal } = useSubscriptionContext();

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
    <div className="min-h-screen bg-black pb-32">
      {/* Header */}
      <div style={{ background: "#1A1A1A", borderBottom: "1px solid #2A2A2A", padding: "48px 20px 16px" }}>
        <motion.div {...anim(0)} className="flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </motion.button>
          <h1 className="text-xl font-bold text-foreground">Definições</h1>
          <HexBadge label="CF" />
        </motion.div>
      </div>

      <div className="space-y-0">
        {/* ─── Profile ─── */}
        <motion.div {...anim(0.05)}>
          <UserProfileCard />
        </motion.div>

        {/* ─── Plano Semanal ─── */}
        <motion.div
          {...anim(0.12)}
          style={{ background: "#1A1A1A", borderRadius: 0, border: "none", borderBottom: "1px solid #2A2A2A", padding: "20px 16px", width: "100%", margin: 0 }}
        >
          <p className="pb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Plano Semanal</p>
          <WeeklyPlanCalendar schedule={schedule} onSaveDay={handleSaveDay} />
        </motion.div>

        {/* ─── Inteligência Artificial ─── */}
        <motion.div
          {...anim(0.15)}
          style={{ background: "#1A1A1A", borderRadius: 0, border: "none", borderBottom: "1px solid #2A2A2A", padding: "20px 16px", width: "100%", margin: 0 }}
        >
          <p className="pb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Inteligência Artificial</p>
          <AIFeaturesCarousel />
        </motion.div>

        {/* ─── Dados ─── */}
        <motion.div
          {...anim(0.2)}
          style={{ background: "#1A1A1A", borderRadius: 0, border: "none", borderBottom: "1px solid #2A2A2A", width: "100%", margin: 0 }}
        >
          <p className="px-4 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Dados</p>
          <ExportData nutritionLogs={allLogs} nutritionGoals={goals} />
        </motion.div>

        {/* ─── Subscrição ─── */}
        <motion.div
          {...anim(0.22)}
          style={{ background: "#1A1A1A", borderRadius: 0, border: "none", borderBottom: "1px solid #2A2A2A", width: "100%", margin: 0 }}
        >
          <p className="px-4 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Subscrição</p>
          {isSubscriptionValid() || isTrialing ? (
            <>
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/15">
                  <Crown className="h-[18px] w-[18px] text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-sm font-medium text-foreground">
                    {isTrialing ? "Trial ativo" : "LiftMate Pro"}
                  </span>
                  {subscriptionEnd && (
                    <p className="text-[11px] text-muted-foreground">
                      {isTrialing ? "Trial termina em" : "Renova em"}{" "}
                      {new Date(subscriptionEnd).toLocaleDateString("pt-PT", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                  Ativa
                </span>
              </div>
              <div className="border-t border-white/[0.06]" />
              <SettingsRow
                icon={RefreshCw}
                label="Gerir subscrição"
                sublabel="Cancelar, alterar plano ou ver faturas"
                onClick={async () => {
                  try {
                    await openCustomerPortal();
                  } catch {
                    toast.error("Não foi possível abrir o portal. Tenta novamente.");
                  }
                }}
              />
            </>
          ) : (
            <button
              onClick={() => navigate("/paywall")}
              className="flex w-full items-center gap-3 px-4 py-4 transition-colors active:bg-muted/20"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
                <Crown className="h-[18px] w-[18px] text-amber-500" />
              </div>
              <div className="flex-1 text-left">
                <span className="text-sm font-medium text-foreground">Ativar LiftMate Pro</span>
                <p className="text-[11px] text-muted-foreground">7 dias grátis, cancela quando quiseres</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            </button>
          )}
        </motion.div>

        {/* ─── Informações ─── */}
        <motion.div
          {...anim(0.25)}
          style={{ background: "#1A1A1A", borderRadius: 0, border: "none", borderBottom: "1px solid #2A2A2A", width: "100%", margin: 0 }}
        >
          <p className="px-4 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Informações</p>
          <LanguageSelector inline />
          <div className="border-t border-white/[0.06]" />
          <SettingsRow icon={FileText} label="Termos de Uso" onClick={() => navigate("/terms")} />
          <div className="border-t border-white/[0.06]" />
          <SettingsRow icon={Shield} label="Política de Privacidade" onClick={() => navigate("/privacy")} />
          <div className="border-t border-white/[0.06]" />
          <SettingsRow
            icon={Headphones}
            label="Suporte"
            iconClass="text-primary"
            onClick={() => navigate("/support")}
          />
        </motion.div>

        {/* ─── Conta ─── */}
        <motion.div
          {...anim(0.3)}
          style={{ background: "#1A1A1A", borderRadius: 0, border: "none", borderBottom: "1px solid #2A2A2A", width: "100%", margin: 0 }}
        >
          <p className="px-4 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Conta</p>
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
          <div className="border-t border-white/[0.06]" />
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
