import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, Loader2, Lightbulb, TrendingUp, Dumbbell, Moon, RefreshCw, ChevronRight, Target, Scale, Zap, Check } from "lucide-react";
import { toast } from "sonner";
import { invokeWithAuth } from "@/lib/supabaseHelpers";
import { getWorkoutStats } from "@/data/workoutHistory";
import { useNutrition } from "@/hooks/useNutrition";
import { useAlerts } from "@/hooks/useAlerts";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/hooks/useAuth";

interface CoachingTip {
  category: 'treino' | 'recuperação' | 'geral';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  actionable: string;
}

interface UserGoals {
  weightGoal?: number;
  focusMuscles?: string[];
  trainingFocus?: string;
  confirmed?: boolean;
}

const STORAGE_KEY_PREFIX = 'liftmate_ai_coaching_';
const GOALS_STORAGE_KEY_PREFIX = 'liftmate_coaching_goals_';
const COOLDOWN_HOURS = 4;

const MUSCLE_OPTIONS = [
'Full Body', 'Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps',
'Core', 'Quadríceps', 'Posteriores', 'Glúteos', 'Gémeos'];


const TRAINING_FOCUS_OPTIONS = [
{ value: 'hypertrophy', label: 'Hipertrofia', icon: Dumbbell },
{ value: 'strength', label: 'Força', icon: Zap },
{ value: 'endurance', label: 'Resistência', icon: Target }];


export const AICoaching = () => {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [tips, setTips] = useState<CoachingTip[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [canRefresh, setCanRefresh] = useState(true);
  const [step, setStep] = useState<'goals' | 'confirm' | 'results'>('goals');
  const [userGoals, setUserGoals] = useState<UserGoals>({});
  const [tempWeightGoal, setTempWeightGoal] = useState<string>('');
  const [tempFocusMuscles, setTempFocusMuscles] = useState<string[]>([]);
  const [tempTrainingFocus, setTempTrainingFocus] = useState<string>('');

  const { progress, goals, weeklyStats } = useNutrition();
  const { state: alertsState } = useAlerts();
  const { permission, showNotification } = usePushNotifications();

  // Helper to get user-scoped storage keys
  const getStorageKey = () => user?.id ? `${STORAGE_KEY_PREFIX}${user.id}` : null;
  const getGoalsStorageKey = () => user?.id ? `${GOALS_STORAGE_KEY_PREFIX}${user.id}` : null;

  useEffect(() => {
    if (user) {
      loadStoredTips();
      loadUserGoals();
    }
  }, [user]);

  const loadUserGoals = () => {
    const key = getGoalsStorageKey();
    if (!key) return;

    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setUserGoals(data);
        setTempWeightGoal(data.weightGoal?.toString() || '');
        setTempFocusMuscles(data.focusMuscles || []);
        setTempTrainingFocus(data.trainingFocus || '');
        if (data.confirmed) {
          setStep('results');
        }
      } catch (e) {
        console.error('Error loading goals:', e);
      }
    }
  };

  const saveUserGoals = (confirmed: boolean = false) => {
    const key = getGoalsStorageKey();
    if (!key) return;

    const newGoals: UserGoals = {
      weightGoal: tempWeightGoal ? parseFloat(tempWeightGoal) : undefined,
      focusMuscles: tempFocusMuscles.length > 0 ? tempFocusMuscles : undefined,
      trainingFocus: tempTrainingFocus || undefined,
      confirmed
    };
    localStorage.setItem(key, JSON.stringify(newGoals));
    setUserGoals(newGoals);
  };

  const handleGoToConfirm = () => {
    if (!tempWeightGoal && !tempFocusMuscles.length && !tempTrainingFocus) {
      toast.error('Define pelo menos um objetivo');
      return;
    }
    saveUserGoals(false);
    setStep('confirm');
  };

  const handleConfirmGoals = async () => {
    saveUserGoals(true);
    setStep('results');
    await analyzePatterns();
  };

  const toggleMuscle = (muscle: string) => {
    if (muscle === 'Full Body') {
      // Full Body is mutually exclusive - select only it or deselect it
      setTempFocusMuscles((prev) =>
      prev.includes('Full Body') ? [] : ['Full Body']
      );
    } else {
      // Other muscles - can't select if Full Body is selected
      if (tempFocusMuscles.includes('Full Body')) return;

      setTempFocusMuscles((prev) =>
      prev.includes(muscle) ?
      prev.filter((m) => m !== muscle) :
      [...prev, muscle].slice(0, 3)
      );
    }
  };

  const loadStoredTips = () => {
    const key = getStorageKey();
    if (!key) return;

    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.tips) setTips(data.tips);
        if (data.summary) setSummary(data.summary);
        if (data.lastUpdate) {
          const lastDate = new Date(data.lastUpdate);
          setLastUpdate(lastDate);

          const hoursSince = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60);
          setCanRefresh(hoursSince >= COOLDOWN_HOURS);
        }
      } catch (e) {
        console.error('Error loading coaching data:', e);
      }
    }
  };

  const saveCoachingData = (newTips: CoachingTip[], newSummary: string) => {
    const key = getStorageKey();
    if (!key) return;

    const data = {
      tips: newTips,
      summary: newSummary,
      lastUpdate: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(data));
    setLastUpdate(new Date());
    setCanRefresh(false);
  };

  const gatherContext = () => {
    const workoutStats = getWorkoutStats(user?.id);
    const sleepHours = 8;

    return {
      workout: {
        totalSessions: workoutStats.totalSessions,
        thisWeek: workoutStats.thisWeekSessions,
        streak: workoutStats.currentStreak,
        mostTrained: workoutStats.mostTrainedMuscles.slice(0, 3),
        completionRate: workoutStats.averageCompletionRate
      },
      nutrition: {
        todayCalories: progress.calories,
        goalCalories: goals.calories,
        todayProtein: progress.protein,
        goalProtein: goals.protein,
        weeklyAverage: weeklyStats.avgCalories,
        daysTracked: weeklyStats.daysLogged
      },
      recovery: {
        sleepHours,
        hydration: alertsState.hydration.currentIntake,
        hydrationGoal: alertsState.hydration.dailyGoalLiters * 1000
      },
      userGoals: userGoals
    };
  };

  const sendHighPriorityNotifications = async (newTips: CoachingTip[]) => {
    if (permission !== 'granted') return;

    const highPriorityTips = newTips.filter((t) => t.priority === 'high');

    for (const tip of highPriorityTips) {
      await showNotification(tip.title, {
        body: tip.actionable,
        tag: 'coaching-high-priority',
        data: { category: tip.category }
      });
    }
  };

  const analyzePatterns = async () => {
    if (!canRefresh && tips.length > 0) {
      toast.info('Aguarda algumas horas para nova análise');
      return;
    }

    setIsAnalyzing(true);

    try {
      const context = gatherContext();

      const { data, error } = await invokeWithAuth<{success: boolean;error?: string;tips?: CoachingTip[];summary?: string;}>('ai-coaching', {
        body: { context }
      });

      if (error) throw error;

      if (data.success === false) {
        toast.error(data.error || 'Erro na análise');
        return;
      }

      // Validate response structure
      const validatedTips = Array.isArray(data.tips) 
        ? data.tips.filter((t: any) => t && typeof t.title === 'string' && typeof t.message === 'string')
        : [];
      const validatedSummary = typeof data.summary === 'string' ? data.summary : '';

      if (validatedTips.length === 0) {
        toast.error('A IA não retornou dicas válidas. Tenta novamente.');
        return;
      }

      setTips(validatedTips);
      setSummary(validatedSummary);
      saveCoachingData(validatedTips, validatedSummary);

      await sendHighPriorityNotifications(data.tips || []);

      toast.success('Análise concluída');
    } catch (error) {
      console.error('Error in AI coaching:', error);
      toast.error('Erro ao gerar dicas. Tenta novamente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetGoals = () => {
    const goalsKey = getGoalsStorageKey();
    const storageKey = getStorageKey();
    if (goalsKey) localStorage.removeItem(goalsKey);
    if (storageKey) localStorage.removeItem(storageKey);
    setUserGoals({});
    setTempWeightGoal('');
    setTempFocusMuscles([]);
    setTempTrainingFocus('');
    setTips([]);
    setSummary('');
    setStep('goals');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'treino':return <Dumbbell className="w-4 h-4" />;
      case 'recuperação':return <Moon className="w-4 h-4" />;
      default:return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'treino':return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'recuperação':return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      default:return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':return 'bg-red-500/20 text-red-400';
      case 'medium':return 'bg-orange-500/20 text-orange-400';
      default:return 'bg-muted/30 text-muted-foreground';
    }
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return null;
    const hours = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60));
    if (hours < 1) return 'Há menos de 1 hora';
    if (hours === 1) return 'Há 1 hora';
    return `Há ${hours} horas`;
  };

  const getGoalSummaryText = () => {
    const parts = [];
    if (tempWeightGoal) {
      const val = parseFloat(tempWeightGoal);
      parts.push(val > 0 ? `Ganhar ${val}kg` : `Perder ${Math.abs(val)}kg`);
    }
    if (tempTrainingFocus) {
      const label = TRAINING_FOCUS_OPTIONS.find((o) => o.value === tempTrainingFocus)?.label;
      if (label) parts.push(`Foco: ${label}`);
    }
    if (tempFocusMuscles.length) {
      parts.push(`Músculos: ${tempFocusMuscles.join(', ')}`);
    }
    return parts;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-500/10 via-card to-cyan-500/10 rounded-[20px] p-5 border h-full border-black bg-[#111311]">

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Coaching IA</h2>
            <p className="text-xs text-muted-foreground">Dicas personalizadas</p>
          </div>
        </div>
        {step === 'results' && tips.length > 0 && canRefresh &&
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={analyzePatterns}
          disabled={isAnalyzing}
          className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors">

            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
          </motion.button>
        }
      </div>

      {isAnalyzing ?
      <div className="flex flex-col items-center justify-center py-8 gap-4">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          <p className="text-sm text-foreground/70">A gerar dicas para os teus objetivos...</p>
        </div> :
      step === 'goals' ?
      <div className="space-y-4">
          <p className="text-sm text-foreground/80">Define os teus objetivos:</p>

          {/* Weight Goal */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs text-foreground/80">
              <Scale className="w-4 h-4" />
              Quanto peso queres ganhar/perder? (kg)
            </label>
            <input
            type="number"
            value={tempWeightGoal}
            onChange={(e) => setTempWeightGoal(e.target.value)}
            placeholder="Ex: 5 para ganhar, -3 para perder"
            className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50" />

          </div>

          {/* Training Focus */}
          <div className="space-y-2">
            <label className="text-xs text-foreground/80">Foco de treino:</label>
            <div className="grid grid-cols-3 gap-2">
              {TRAINING_FOCUS_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setTempTrainingFocus(opt.value)}
                  className={`p-2 rounded-lg border text-xs flex flex-col items-center gap-1 transition-all ${
                  tempTrainingFocus === opt.value ?
                  'bg-blue-500/20 border-blue-500/50 text-blue-400' :
                  'bg-background/30 border-border/50 text-foreground/70 hover:border-border'}`
                  }>

                    <Icon className="w-4 h-4" />
                    {opt.label}
                  </button>);

            })}
            </div>
          </div>

          {/* Muscle Focus */}
          <div className="space-y-2">
            <label className="text-xs text-foreground/80">
              Músculos a melhorar: (max. 3)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MUSCLE_OPTIONS.map((muscle) => {
              const isFullBody = muscle === 'Full Body';
              const isSelected = tempFocusMuscles.includes(muscle);
              const isDisabled = !isFullBody && tempFocusMuscles.includes('Full Body');

              return (
                <button
                  key={muscle}
                  onClick={() => toggleMuscle(muscle)}
                  disabled={isDisabled}
                  className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                  isSelected ?
                  isFullBody ?
                  'bg-purple-500/20 border border-purple-500/50 text-purple-400' :
                  'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400' :
                  isDisabled ?
                  'bg-background/10 border border-border/30 text-foreground/30 cursor-not-allowed' :
                  'bg-background/30 border border-border/50 text-foreground/70 hover:border-border'}`
                  }>

                    {muscle}
                  </button>);

            })}
            </div>
          </div>

          <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleGoToConfirm}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-sm flex items-center justify-center gap-2">

            Continuar
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div> :
      step === 'confirm' ?
      <div className="space-y-4">
          <p className="text-sm font-medium text-foreground">Confirma os teus objetivos:</p>
          
          <div className="p-4 rounded-xl bg-background/30 border border-border/50 space-y-2">
            {getGoalSummaryText().map((text, i) =>
          <div key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                <Check className="w-4 h-4 text-green-400" />
                {text}
              </div>
          )}
          </div>

          <div className="flex gap-2">
            <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setStep('goals')}
            className="flex-1 py-3 rounded-xl bg-background/30 border border-border/50 text-foreground font-medium text-sm">

              Voltar
            </motion.button>
            <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleConfirmGoals}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-sm flex items-center justify-center gap-2">

              <Check className="w-4 h-4" />
              Confirmar
            </motion.button>
          </div>
        </div> :

      <div className="space-y-4">
          {/* Goals Edit Button */}
          <div className="flex items-center justify-between">
            <button
            onClick={resetGoals}
            className="text-xs text-blue-400 hover:underline flex items-center gap-1">

              <Target className="w-3 h-3" />
              Alterar objetivos
            </button>
            {lastUpdate &&
          <span className="text-xs text-muted-foreground">{formatLastUpdate()}</span>
          }
          </div>

          {/* Summary */}
          {summary &&
        <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
              <p className="text-sm text-foreground/90">{summary}</p>
            </div>
        }

          {/* Tips */}
          {tips.length > 0 ?
        <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
              <AnimatePresence>
                {tips.map((tip, index) =>
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 rounded-xl border ${getCategoryColor(tip.category)}`}>

                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(tip.category)}
                        <span className="font-medium text-sm">{tip.title}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityBadge(tip.priority)}`}>
                        {tip.priority === 'high' ? 'Urgente' : tip.priority === 'medium' ? 'Importante' : 'Dica'}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/70 mb-2">{tip.message}</p>
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      <TrendingUp className="w-3 h-3" />
                      {tip.actionable}
                    </div>
                  </motion.div>
            )}
              </AnimatePresence>
            </div> :

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={analyzePatterns}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold flex items-center justify-center gap-2">

              <Sparkles className="w-5 h-5" />
              Gerar Dicas
            </motion.button>
        }
        </div>
      }
    </motion.div>);

};

export default AICoaching;