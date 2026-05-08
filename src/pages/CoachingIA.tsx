import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, ArrowLeft, Dumbbell, Zap, Target, Scale,
  Check, ChevronRight, RefreshCw, Loader2, TrendingUp,
  Lightbulb, Moon, Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { invokeWithAuth } from "@/lib/supabaseHelpers";
import { getWorkoutStats } from "@/data/workoutHistory";
import { useNutrition } from "@/hooks/useNutrition";
import { useAlerts } from "@/hooks/useAlerts";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/hooks/useAuth";
import { useWeeklyStats } from "@/hooks/useWeeklyStats";
import { BottomNav } from "@/components/BottomNav";

// ── Types ──────────────────────────────────────────────────────────────
interface CoachingTip {
  category: "treino" | "recuperação" | "nutrição" | "geral";
  title: string;
  message: string;
  priority: "low" | "medium" | "high";
  actionable: string;
}

interface UserGoals {
  weightGoal?: number;
  focusMuscles?: string[];
  trainingFocus?: string;
  confirmed?: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────
const STORAGE_KEY_PREFIX = "liftmate_ai_coaching_";
const GOALS_STORAGE_KEY_PREFIX = "liftmate_coaching_goals_";
const COOLDOWN_HOURS = 4;

const MUSCLE_OPTIONS = [
  "Full Body", "Peito", "Costas", "Ombros", "Bíceps",
  "Tríceps", "Core", "Quadríceps", "Posteriores", "Glúteos", "Gémeos",
];

const TRAINING_FOCUS_OPTIONS = [
  { value: "hypertrophy", label: "Hipertrofia", icon: Dumbbell },
  { value: "strength",    label: "Força",       icon: Zap },
  { value: "endurance",   label: "Resistência", icon: Target },
];

const CATEGORY_BORDER: Record<string, string> = {
  treino:      "#4ADE80",
  recuperação: "#FBBF24",
  nutrição:    "#60A5FA",
  geral:       "rgba(255,255,255,0.30)",
};

// ── Shimmer keyframe (injected once) ──────────────────────────────────
const shimmerStyle = `
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}`;

// ── Page ───────────────────────────────────────────────────────────────
const CoachingIA = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: weeklyData } = useWeeklyStats();
  const { progress, goals: nutritionGoals, weeklyStats } = useNutrition();
  const { state: alertsState } = useAlerts();
  const { permission, showNotification } = usePushNotifications();

  const [isAnalyzing, setIsAnalyzing]   = useState(false);
  const [tips, setTips]                 = useState<CoachingTip[]>([]);
  const [summary, setSummary]           = useState("");
  const [lastUpdate, setLastUpdate]     = useState<Date | null>(null);
  const [canRefresh, setCanRefresh]     = useState(true);
  const [step, setStep]                 = useState<"goals" | "confirm" | "results">("goals");
  const [userGoals, setUserGoals]       = useState<UserGoals>({});
  const [tempWeightGoal, setTempWeightGoal]     = useState("");
  const [tempFocusMuscles, setTempFocusMuscles] = useState<string[]>([]);
  const [tempTrainingFocus, setTempTrainingFocus] = useState("");

  const storageKey      = user?.id ? `${STORAGE_KEY_PREFIX}${user.id}` : null;
  const goalsStorageKey = user?.id ? `${GOALS_STORAGE_KEY_PREFIX}${user.id}` : null;

  useEffect(() => {
    if (!user) return;
    // Load stored tips
    const raw = storageKey && localStorage.getItem(storageKey);
    if (raw) {
      try {
        const d = JSON.parse(raw);
        if (d.tips)       setTips(d.tips);
        if (d.summary)    setSummary(d.summary);
        if (d.lastUpdate) {
          const dt = new Date(d.lastUpdate);
          setLastUpdate(dt);
          setCanRefresh((Date.now() - dt.getTime()) / 3_600_000 >= COOLDOWN_HOURS);
        }
      } catch { /* ignore */ }
    }
    // Load stored goals
    const rawGoals = goalsStorageKey && localStorage.getItem(goalsStorageKey);
    if (rawGoals) {
      try {
        const g = JSON.parse(rawGoals);
        setUserGoals(g);
        setTempWeightGoal(g.weightGoal?.toString() || "");
        setTempFocusMuscles(g.focusMuscles || []);
        setTempTrainingFocus(g.trainingFocus || "");
        if (g.confirmed) setStep("results");
      } catch { /* ignore */ }
    }
  }, [user]);

  const saveGoals = (confirmed: boolean) => {
    const g: UserGoals = {
      weightGoal:    tempWeightGoal ? parseFloat(tempWeightGoal) : undefined,
      focusMuscles:  tempFocusMuscles.length ? tempFocusMuscles : undefined,
      trainingFocus: tempTrainingFocus || undefined,
      confirmed,
    };
    if (goalsStorageKey) localStorage.setItem(goalsStorageKey, JSON.stringify(g));
    setUserGoals(g);
    return g;
  };

  const handleGoToConfirm = () => {
    if (!tempWeightGoal && !tempFocusMuscles.length && !tempTrainingFocus) {
      toast.error("Define pelo menos um objetivo"); return;
    }
    saveGoals(false);
    setStep("confirm");
  };

  const handleConfirmGoals = async () => {
    saveGoals(true);
    setStep("results");
    await analyzePatterns();
  };

  const resetGoals = () => {
    if (storageKey)      localStorage.removeItem(storageKey);
    if (goalsStorageKey) localStorage.removeItem(goalsStorageKey);
    setUserGoals({}); setTips([]); setSummary("");
    setTempWeightGoal(""); setTempFocusMuscles([]); setTempTrainingFocus("");
    setStep("goals");
  };

  const toggleMuscle = (m: string) => {
    if (m === "Full Body") {
      setTempFocusMuscles((p) => (p.includes("Full Body") ? [] : ["Full Body"]));
    } else {
      if (tempFocusMuscles.includes("Full Body")) return;
      setTempFocusMuscles((p) =>
        p.includes(m) ? p.filter((x) => x !== m) : [...p, m].slice(0, 3)
      );
    }
  };

  const gatherContext = () => ({
    workout: (() => {
      const s = getWorkoutStats(user?.id);
      return { totalSessions: s.totalSessions, thisWeek: s.thisWeekSessions, streak: s.currentStreak, mostTrained: s.mostTrainedMuscles.slice(0, 3), completionRate: s.averageCompletionRate };
    })(),
    nutrition: { todayCalories: progress.calories, goalCalories: nutritionGoals.calories, todayProtein: progress.protein, goalProtein: nutritionGoals.protein, weeklyAverage: weeklyStats.avgCalories, daysTracked: weeklyStats.daysLogged },
    recovery:  { sleepHours: 8, hydration: alertsState.hydration.currentIntake, hydrationGoal: alertsState.hydration.dailyGoalLiters * 1000 },
    userGoals,
  });

  const analyzePatterns = async () => {
    if (!canRefresh && tips.length > 0) { toast.info("Aguarda algumas horas para nova análise"); return; }
    setIsAnalyzing(true);
    try {
      const { data, error } = await invokeWithAuth<{ success: boolean; error?: string; tips?: CoachingTip[]; summary?: string }>("ai-coaching", { body: { context: gatherContext() } });
      if (error) throw error;
      if (data.success === false) { toast.error(data.error || "Erro na análise"); return; }
      const validTips = (data.tips || []).filter((t): t is CoachingTip => !!t && typeof t.title === "string");
      if (!validTips.length) { toast.error("A IA não retornou dicas válidas."); return; }
      const validSummary = typeof data.summary === "string" ? data.summary : "";
      setTips(validTips); setSummary(validSummary);
      const saved = { tips: validTips, summary: validSummary, lastUpdate: new Date().toISOString() };
      if (storageKey) localStorage.setItem(storageKey, JSON.stringify(saved));
      setLastUpdate(new Date()); setCanRefresh(false);
      if (permission === "granted") {
        for (const t of validTips.filter((x) => x.priority === "high")) {
          await showNotification(t.title, { body: t.actionable, tag: "coaching-high-priority" });
        }
      }
      toast.success("Análise concluída");
    } catch (e) {
      console.error("[CoachingIA]", e);
      toast.error("Erro ao gerar dicas. Tenta novamente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const hoursUntilRefresh = lastUpdate
    ? Math.max(0, COOLDOWN_HOURS - Math.floor((Date.now() - lastUpdate.getTime()) / 3_600_000))
    : 0;

  const formatLastUpdate = () => {
    if (!lastUpdate) return null;
    const h = Math.floor((Date.now() - lastUpdate.getTime()) / 3_600_000);
    if (h < 1) return "Há menos de 1 hora";
    return h === 1 ? "Há 1 hora" : `Há ${h} horas`;
  };

  const consistency = weeklyData
    ? weeklyData.plannedSessions > 0
      ? Math.round((weeklyData.completedSessions / weeklyData.plannedSessions) * 100)
      : 0
    : 0;

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#000", paddingBottom: 100 }}>
      <style>{shimmerStyle}</style>

      {/* ── HEADER ── */}
      <div style={{ background: "#000", padding: "48px 24px 0" }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.50)", fontSize: 14, padding: 0 }}
        >
          <ArrowLeft size={18} />
        </button>

        <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, #1D4ED8, #2563EB)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 24, marginBottom: 16 }}>
          <Brain size={28} color="#fff" />
        </div>

        <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", marginBottom: 8 }}>
          Coaching IA
        </div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.50)", lineHeight: 1.5, marginBottom: 28 }}>
          Dicas personalizadas com base nos teus dados de treino
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>

        {/* ── SECÇÃO 1 — ESTA SEMANA ── */}
        <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.30)", textTransform: "uppercase", marginBottom: 12 }}>
            ESTA SEMANA
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { value: weeklyData?.completedSessions ?? 0, label: "Treinos" },
              { value: weeklyData?.totalSets ?? 0,         label: "Séries" },
              { value: `${consistency}%`,                  label: "Consistência" },
            ].map(({ value, label }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.30)", marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SECÇÃO 2 — DEFINIR OBJETIVOS ── */}
        <AnimatePresence mode="wait">
          {isAnalyzing ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 32, marginBottom: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <Loader2 size={32} color="#60A5FA" style={{ animation: "spin 1s linear infinite" }} />
              <p style={{ color: "rgba(255,255,255,0.50)", fontSize: 14, textAlign: "center" }}>A gerar dicas para os teus objetivos...</p>
            </motion.div>

          ) : step === "goals" ? (
            <motion.div key="goals" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 16, marginBottom: 12 }}>

              <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Define os teus objetivos</p>

              {/* Peso */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.50)", marginBottom: 8 }}>
                  <Scale size={14} /> Objetivo de peso (kg)
                </label>
                <input
                  type="number" value={tempWeightGoal} onChange={(e) => setTempWeightGoal(e.target.value)}
                  placeholder="Ex: 5 para ganhar, -3 para perder"
                  style={{ width: "100%", height: 44, background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "0 16px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              {/* Foco de treino */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: "rgba(255,255,255,0.50)", display: "block", marginBottom: 8 }}>Foco de treino</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {TRAINING_FOCUS_OPTIONS.map(({ value, label, icon: Icon }) => {
                    const active = tempTrainingFocus === value;
                    return (
                      <button key={value} onClick={() => setTempTrainingFocus(value)}
                        style={{ padding: "10px 8px", borderRadius: 12, border: `1px solid ${active ? "rgba(29,78,216,0.5)" : "rgba(255,255,255,0.07)"}`, background: active ? "rgba(29,78,216,0.15)" : "#1A1A1A", color: active ? "#60A5FA" : "rgba(255,255,255,0.50)", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                        <Icon size={16} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Músculos */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: "rgba(255,255,255,0.50)", display: "block", marginBottom: 8 }}>Músculos a melhorar (máx. 3)</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {MUSCLE_OPTIONS.map((m) => {
                    const isFullBody = m === "Full Body";
                    const selected = tempFocusMuscles.includes(m);
                    const disabled = !isFullBody && tempFocusMuscles.includes("Full Body");
                    return (
                      <button key={m} onClick={() => toggleMuscle(m)} disabled={disabled}
                        style={{ padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, border: `1px solid ${selected ? (isFullBody ? "rgba(167,139,250,0.5)" : "rgba(96,165,250,0.5)") : "rgba(255,255,255,0.15)"}`, background: selected ? (isFullBody ? "rgba(167,139,250,0.15)" : "rgba(96,165,250,0.15)") : "rgba(255,255,255,0.04)", color: selected ? (isFullBody ? "#A78BFA" : "#60A5FA") : disabled ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.50)", cursor: disabled ? "not-allowed" : "pointer" }}>
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Botão gerar */}
              <button onClick={handleGoToConfirm}
                style={{ width: "100%", height: 50, borderRadius: 14, border: "none", cursor: "pointer", background: "linear-gradient(90deg, #1D4ED8, #60A5FA, #1D4ED8)", backgroundSize: "200% 100%", animation: "shimmer 3s linear infinite", color: "#fff", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Sparkles size={18} />
                ✦ Gerar Coaching IA
                <ChevronRight size={16} />
              </button>
            </motion.div>

          ) : step === "confirm" ? (
            <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 16, marginBottom: 12 }}>

              <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Confirma os teus objetivos</p>
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                {[
                  tempWeightGoal && (parseFloat(tempWeightGoal) > 0 ? `Ganhar ${tempWeightGoal}kg` : `Perder ${Math.abs(parseFloat(tempWeightGoal))}kg`),
                  tempTrainingFocus && `Foco: ${TRAINING_FOCUS_OPTIONS.find((o) => o.value === tempTrainingFocus)?.label}`,
                  tempFocusMuscles.length && `Músculos: ${tempFocusMuscles.join(", ")}`,
                ].filter(Boolean).map((text, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.70)", marginBottom: 8 }}>
                    <Check size={14} color="#4ADE80" /> {text}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setStep("goals")}
                  style={{ flex: 1, height: 44, borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "rgba(255,255,255,0.70)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  Voltar
                </button>
                <button onClick={handleConfirmGoals}
                  style={{ flex: 1, height: 44, borderRadius: 12, border: "none", background: "#1D4ED8", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Check size={16} /> Confirmar
                </button>
              </div>
            </motion.div>

          ) : null}
        </AnimatePresence>

        {/* ── SECÇÃO 3 — RESULTADOS ── */}
        {step === "results" && !isAnalyzing && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>

            {/* Barra superior: alterar objetivos + cooldown */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <button onClick={resetGoals}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: "#60A5FA", fontSize: 12 }}>
                <Target size={12} /> Alterar objetivos
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {lastUpdate && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.30)" }}>{formatLastUpdate()}</span>}
                {canRefresh ? (
                  <button onClick={analyzePatterns}
                    style={{ background: "rgba(29,78,216,0.2)", border: "none", borderRadius: 8, padding: "4px 10px", color: "#60A5FA", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    <RefreshCw size={11} /> Atualizar
                  </button>
                ) : hoursUntilRefresh > 0 ? (
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.30)" }}>Próxima em {hoursUntilRefresh}h</span>
                ) : null}
              </div>
            </div>

            {/* Resumo geral */}
            {summary && (
              <div style={{ background: "rgba(29,78,216,0.08)", border: "1px solid rgba(29,78,216,0.2)", borderRadius: 16, padding: 16, marginBottom: 12 }}>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.90)", lineHeight: 1.6 }}>{summary}</p>
              </div>
            )}

            {/* Dicas */}
            {tips.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <AnimatePresence>
                  {tips.map((tip, i) => {
                    const borderColor = CATEGORY_BORDER[tip.category] || CATEGORY_BORDER.geral;
                    return (
                      <motion.div key={i}
                        initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                        style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.07)", borderLeft: `3px solid ${borderColor}`, borderRadius: 16, padding: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {tip.category === "treino" && <Dumbbell size={14} color="#4ADE80" />}
                            {tip.category === "recuperação" && <Moon size={14} color="#FBBF24" />}
                            {tip.category === "nutrição" && <Sparkles size={14} color="#60A5FA" />}
                            {tip.category === "geral" && <Lightbulb size={14} color="rgba(255,255,255,0.50)" />}
                            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: borderColor }}>
                              {tip.category}
                            </span>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: tip.priority === "high" ? "rgba(248,113,113,0.15)" : tip.priority === "medium" ? "rgba(251,146,60,0.15)" : "rgba(255,255,255,0.07)", color: tip.priority === "high" ? "#F87171" : tip.priority === "medium" ? "#FB923C" : "rgba(255,255,255,0.30)" }}>
                            {tip.priority === "high" ? "Urgente" : tip.priority === "medium" ? "Importante" : "Dica"}
                          </span>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{tip.title}</p>
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.50)", lineHeight: 1.5, marginBottom: 8 }}>{tip.message}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: borderColor }}>
                          <TrendingUp size={12} /> {tip.actionable}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              <button onClick={analyzePatterns}
                style={{ width: "100%", height: 50, borderRadius: 14, border: "none", cursor: "pointer", background: "linear-gradient(90deg, #1D4ED8, #60A5FA, #1D4ED8)", backgroundSize: "200% 100%", animation: "shimmer 3s linear infinite", color: "#fff", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Sparkles size={18} /> Gerar Dicas
              </button>
            )}
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default CoachingIA;
