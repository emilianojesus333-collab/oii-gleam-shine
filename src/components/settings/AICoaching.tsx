import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, Loader2, Lightbulb, TrendingUp, Apple, Dumbbell, Moon, RefreshCw, ChevronRight, Target, Scale, Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getWorkoutStats } from "@/data/workoutHistory";
import { useNutrition } from "@/hooks/useNutrition";
import { useAlerts } from "@/hooks/useAlerts";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface CoachingTip {
  category: 'treino' | 'nutrição' | 'recuperação' | 'geral';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  actionable: string;
}

interface CoachingAnalysis {
  success: boolean;
  error?: string;
  tips?: CoachingTip[];
  summary?: string;
}

interface UserGoals {
  weightGoal?: number; // kg to gain/lose
  focusMuscles?: string[];
  trainingFocus?: string;
}

const STORAGE_KEY = 'liftmate_ai_coaching';
const GOALS_STORAGE_KEY = 'liftmate_coaching_goals';
const COOLDOWN_HOURS = 4;

const MUSCLE_OPTIONS = [
  'Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 
  'Core', 'Quadríceps', 'Posteriores', 'Glúteos', 'Gémeos'
];

const TRAINING_FOCUS_OPTIONS = [
  { value: 'hypertrophy', label: 'Hipertrofia', icon: Dumbbell },
  { value: 'strength', label: 'Força', icon: Zap },
  { value: 'endurance', label: 'Resistência', icon: Target },
];

export const AICoaching = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [tips, setTips] = useState<CoachingTip[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [canRefresh, setCanRefresh] = useState(true);
  const [showGoalsForm, setShowGoalsForm] = useState(false);
  const [userGoals, setUserGoals] = useState<UserGoals>({});
  const [tempWeightGoal, setTempWeightGoal] = useState<string>('');
  const [tempFocusMuscles, setTempFocusMuscles] = useState<string[]>([]);
  const [tempTrainingFocus, setTempTrainingFocus] = useState<string>('');

  const { progress, goals, weeklyStats } = useNutrition();
  const { state: alertsState, getSleepHours } = useAlerts();
  const { permission, showNotification } = usePushNotifications();

  useEffect(() => {
    loadStoredTips();
    loadUserGoals();
  }, []);

  const loadUserGoals = () => {
    const stored = localStorage.getItem(GOALS_STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setUserGoals(data);
        setTempWeightGoal(data.weightGoal?.toString() || '');
        setTempFocusMuscles(data.focusMuscles || []);
        setTempTrainingFocus(data.trainingFocus || '');
      } catch (e) {
        console.error('Error loading goals:', e);
      }
    }
  };

  const saveUserGoals = () => {
    const goals: UserGoals = {
      weightGoal: tempWeightGoal ? parseFloat(tempWeightGoal) : undefined,
      focusMuscles: tempFocusMuscles.length > 0 ? tempFocusMuscles : undefined,
      trainingFocus: tempTrainingFocus || undefined,
    };
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
    setUserGoals(goals);
    setShowGoalsForm(false);
    toast.success('Objetivos guardados!');
  };

  const toggleMuscle = (muscle: string) => {
    setTempFocusMuscles(prev => 
      prev.includes(muscle) 
        ? prev.filter(m => m !== muscle)
        : [...prev, muscle].slice(0, 3)
    );
  };

  const loadStoredTips = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
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
    const data = {
      tips: newTips,
      summary: newSummary,
      lastUpdate: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setLastUpdate(new Date());
    setCanRefresh(false);
  };

  const gatherContext = () => {
    const workoutStats = getWorkoutStats();
    const sleepHours = getSleepHours();
    
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
    
    const highPriorityTips = newTips.filter(t => t.priority === 'high');
    
    for (const tip of highPriorityTips) {
      await showNotification(`🔥 ${tip.title}`, {
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
      
      const { data, error } = await supabase.functions.invoke('ai-coaching', {
        body: { context }
      });

      if (error) throw error;

      if (data.success === false) {
        toast.error(data.error || 'Erro na análise');
        return;
      }

      setTips(data.tips || []);
      setSummary(data.summary || '');
      saveCoachingData(data.tips || [], data.summary || '');
      
      // Send push notifications for high priority tips
      await sendHighPriorityNotifications(data.tips || []);
      
      toast.success('Análise concluída!');
    } catch (error) {
      console.error('Error in AI coaching:', error);
      toast.error('Erro ao gerar dicas. Tenta novamente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'treino': return <Dumbbell className="w-4 h-4" />;
      case 'nutrição': return <Apple className="w-4 h-4" />;
      case 'recuperação': return <Moon className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'treino': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'nutrição': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'recuperação': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      default: return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400';
      case 'medium': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-muted/30 text-muted-foreground';
    }
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return null;
    const hours = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60));
    if (hours < 1) return 'Há menos de 1 hora';
    if (hours === 1) return 'Há 1 hora';
    return `Há ${hours} horas`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-500/10 via-card to-cyan-500/10 rounded-[20px] p-5 border border-blue-500/20 h-full"
    >
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
        {tips.length > 0 && canRefresh && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={analyzePatterns}
            disabled={isAnalyzing}
            className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
          </motion.button>
        )}
      </div>

      {isAnalyzing ? (
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          <p className="text-sm text-foreground/70">A analisar os teus padrões...</p>
        </div>
      ) : showGoalsForm ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Os Teus Objetivos</h3>
            <button 
              onClick={() => setShowGoalsForm(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
          </div>

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
              className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Training Focus */}
          <div className="space-y-2">
            <label className="text-xs text-foreground/80">Foco de treino:</label>
            <div className="grid grid-cols-3 gap-2">
              {TRAINING_FOCUS_OPTIONS.map(opt => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setTempTrainingFocus(opt.value)}
                    className={`p-2 rounded-lg border text-xs flex flex-col items-center gap-1 transition-all ${
                      tempTrainingFocus === opt.value
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                        : 'bg-background/30 border-border/50 text-foreground/70 hover:border-border'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Muscle Focus */}
          <div className="space-y-2">
            <label className="text-xs text-foreground/80">
              Músculos a melhorar: (max. 3)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MUSCLE_OPTIONS.map(muscle => (
                <button
                  key={muscle}
                  onClick={() => toggleMuscle(muscle)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                    tempFocusMuscles.includes(muscle)
                      ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400'
                      : 'bg-background/30 border border-border/50 text-foreground/70 hover:border-border'
                  }`}
                >
                  {muscle}
                </button>
              ))}
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={saveUserGoals}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-sm"
          >
            Guardar Objetivos
          </motion.button>
        </div>
      ) : tips.length === 0 ? (
        <div className="space-y-4">
          {/* Goals Summary */}
          {(userGoals.weightGoal || userGoals.focusMuscles?.length || userGoals.trainingFocus) && (
            <div className="p-3 rounded-xl bg-background/30 border border-border/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground/80">Os teus objetivos:</span>
                <button 
                  onClick={() => setShowGoalsForm(true)}
                  className="text-xs text-blue-400 hover:underline"
                >
                  Editar
                </button>
              </div>
              {userGoals.weightGoal && (
                <p className="text-xs text-foreground/60">
                  {userGoals.weightGoal > 0 ? `Ganhar ${userGoals.weightGoal}kg` : `Perder ${Math.abs(userGoals.weightGoal)}kg`}
                </p>
              )}
              {userGoals.trainingFocus && (
                <p className="text-xs text-foreground/60">
                  Foco: {TRAINING_FOCUS_OPTIONS.find(o => o.value === userGoals.trainingFocus)?.label}
                </p>
              )}
              {userGoals.focusMuscles?.length && (
                <p className="text-xs text-foreground/60">
                  Músculos: {userGoals.focusMuscles.join(', ')}
                </p>
              )}
            </div>
          )}

          <p className="text-sm text-foreground/80">
            {userGoals.weightGoal || userGoals.focusMuscles?.length 
              ? 'Pronto para analisar com base nos teus objetivos!'
              : 'Define os teus objetivos para dicas mais personalizadas.'}
          </p>
          
          {!userGoals.weightGoal && !userGoals.focusMuscles?.length && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowGoalsForm(true)}
              className="w-full py-3 rounded-xl bg-background/30 border border-border/50 text-foreground font-medium text-sm flex items-center justify-center gap-2 hover:bg-background/50 transition-colors"
            >
              <Target className="w-4 h-4" />
              Definir Objetivos
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          )}
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={analyzePatterns}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Gerar Dicas Personalizadas
          </motion.button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Goals Edit Button */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowGoalsForm(true)}
              className="text-xs text-blue-400 hover:underline flex items-center gap-1"
            >
              <Target className="w-3 h-3" />
              {userGoals.weightGoal || userGoals.focusMuscles?.length ? 'Editar objetivos' : 'Definir objetivos'}
            </button>
          </div>

          {/* Summary */}
          {summary && (
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
              <p className="text-sm text-foreground/90">{summary}</p>
            </div>
          )}

          {/* Tips */}
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            <AnimatePresence>
              {tips.map((tip, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-3 rounded-xl border ${getCategoryColor(tip.category)}`}
                >
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
                  <div className="flex items-center gap-1.5 text-xs text-foreground/60">
                    <TrendingUp className="w-3 h-3" />
                    <span>{tip.actionable}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Last update */}
          {lastUpdate && (
            <p className="text-xs text-center text-muted-foreground">
              Atualizado {formatLastUpdate()}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
};
