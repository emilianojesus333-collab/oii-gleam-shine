import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, ChevronRight, Lock, Calendar, BicepsFlexed } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CoachingTip {
  category: string;
  title: string;
  message: string;
  priority: string;
}

const COACHING_STORAGE_KEY = 'liftmate_ai_coaching';
const PHYSIQUE_STORAGE_KEY = 'liftmate_physique_evaluation';
const EVALUATION_COOLDOWN_DAYS = 15;

export const AIInsightsWidget = () => {
  const navigate = useNavigate();
  const [topTip, setTopTip] = useState<CoachingTip | null>(null);
  const [daysUntilEval, setDaysUntilEval] = useState<number | null>(null);
  const [canEvaluate, setCanEvaluate] = useState(true);
  const [lastScore, setLastScore] = useState<number | null>(null);

  useEffect(() => {
    // Load coaching tips
    const coachingData = localStorage.getItem(COACHING_STORAGE_KEY);
    if (coachingData) {
      try {
        const data = JSON.parse(coachingData);
        if (data.tips && data.tips.length > 0) {
          // Get highest priority tip
          const highPriority = data.tips.find((t: CoachingTip) => t.priority === 'high');
          setTopTip(highPriority || data.tips[0]);
        }
      } catch (e) {
        console.error('Error loading coaching data:', e);
      }
    }

    // Load physique evaluation status
    const physiqueData = localStorage.getItem(PHYSIQUE_STORAGE_KEY);
    if (physiqueData) {
      try {
        const data = JSON.parse(physiqueData);
        if (data.lastEvaluationDate) {
          const lastDate = new Date(data.lastEvaluationDate);
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const evalDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
          const daysSinceEval = Math.floor((today.getTime() - evalDay.getTime()) / (1000 * 60 * 60 * 24));

          if (daysSinceEval > 0 && daysSinceEval < EVALUATION_COOLDOWN_DAYS) {
            setCanEvaluate(false);
            setDaysUntilEval(EVALUATION_COOLDOWN_DAYS - daysSinceEval);
          } else {
            setCanEvaluate(true);
            setDaysUntilEval(null);
          }
        }

        if (data.lastResults?.analysis?.overallScore) {
          setLastScore(data.lastResults.analysis.overallScore);
        }
      } catch (e) {
        console.error('Error loading physique data:', e);
      }
    }
  }, []);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'treino':return 'from-blue-500/20 to-blue-500/5 border-blue-500/30';
      case 'nutrição':return 'from-green-500/20 to-green-500/5 border-green-500/30';
      case 'recuperação':return 'from-purple-500/20 to-purple-500/5 border-purple-500/30';
      default:return 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="space-y-3">

      <h3 className="text-lg font-bold flex items-center gap-2 text-destructive-foreground">
        <Sparkles className="w-4 h-4 text-primary" />
        Insights IA
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {/* Coaching Tip Card */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/settings')} className="px-[16px] py-[16px] border rounded-2xl text-center text-primary-foreground border-black bg-cyan-950 hover:bg-cyan-800">




          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-[80px] h-[30px] text-sky-400 my-0 mx-0" />
            <span className="text-xs text-left text-cyan-950">​</span>
          </div>
          {topTip ?
          <>
              <p className="text-sm font-semibold text-white/80 line-clamp-2 mb-1">
                {topTip.title}
              </p>
              <p className="text-xs text-white/50 line-clamp-2">
                {topTip.message}
              </p>
            </> :

          <>
              <p className="text-sm font-semibold mb-1 text-white text-left">
                ​Criar um treino com IA    
              </p>
              <p className="text-xs text-primary">
                Toca para gerar
              </p>
            </>
          }
          <ChevronRight className="w-4 h-4 text-white/30 absolute right-3 top-1/2 -translate-y-1/2" />
        </motion.button>

        {/* Physique Evaluation Card */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/settings')}
          className="rounded-2xl p-4 text-left bg-gradient-to-br from-purple-500/20 to-pink-500/10 border relative overflow-hidden text-[#1b1b1d] bg-white border-secondary-foreground">

          <div className="flex items-center gap-2 mb-2">
            <BicepsFlexed className="h-[30px] text-black w-[86px]" />
            <span className="text-xs text-white/50">​</span>
          </div>
          
          {canEvaluate ?
          <>
              <p className="text-sm font-semibold mb-1 text-left text-black">
                {lastScore ? 'Nova Avaliação' : 'Avaliação Física'}
              </p>
              <p className="text-xs text-left text-black">
                {lastScore ? `Última: ${lastScore.toFixed(1)}/10` : 'Disponível agora'}
              </p>
              <div className="absolute top-2 right-2">
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              </div>
            </> :

          <>
              <div className="flex items-center gap-1.5 mb-1">
                <Lock className="w-3 h-3 text-orange-400" />
                <p className="text-sm font-semibold text-white/80">
                  Bloqueada
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-white/50">
                <Calendar className="w-3 h-3" />
                <span>Em {daysUntilEval} dias</span>
              </div>
              {lastScore &&
            <p className="text-xs text-purple-400/70 mt-1">
                  Score: {lastScore.toFixed(1)}/10
                </p>
            }
            </>
          }
        </motion.button>
      </div>
    </motion.div>);

};