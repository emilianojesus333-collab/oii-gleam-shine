import { motion } from 'framer-motion';
import { 
  Calendar, TrendingUp, Dumbbell, Utensils, 
  Flame, Target, ChevronRight, Award
} from 'lucide-react';
import { useWeeklyReport, WeeklyReport } from '@/hooks/useWeeklyReport';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';

export const WeeklyReportCard = () => {
  const { user } = useAuth();
  const report = useWeeklyReport(user?.id);

  if (!report) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bom';
    if (score >= 40) return 'Razoável';
    return 'Precisa melhorar';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ background: "#1A1A1A", borderRadius: 0, border: "none", borderBottom: "1px solid #2A2A2A", padding: "20px 16px", width: "100%", margin: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <span className="font-semibold text-sm block">Relatório Semanal</span>
            <span className="text-xs text-muted-foreground">
              {new Date(report.weekStart).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })} - {new Date(report.weekEnd).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${getScoreColor(report.overallScore)}`}>
            {report.overallScore}
          </p>
          <p className="text-xs text-muted-foreground">{getScoreLabel(report.overallScore)}</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-black/20">
          <div className="flex items-center gap-2 mb-1">
            <Dumbbell className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-muted-foreground">Treinos</span>
          </div>
          <p className="text-lg font-bold">{report.workout.totalSessions}</p>
        </div>
        <div className="p-3 rounded-xl bg-black/20">
          <div className="flex items-center gap-2 mb-1">
            <Utensils className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-muted-foreground">Média Calorias</span>
          </div>
          <p className="text-lg font-bold">{report.nutrition.avgCalories}</p>
        </div>
        <div className="p-3 rounded-xl bg-black/20">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-green-400" />
            <span className="text-xs text-muted-foreground">Meta Proteína</span>
          </div>
          <p className="text-lg font-bold">{report.nutrition.daysMetProteinGoal}/7 dias</p>
        </div>
        <div className="p-3 rounded-xl bg-black/20">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-red-400" />
            <span className="text-xs text-muted-foreground">Streak</span>
          </div>
          <p className="text-lg font-bold">{report.workout.currentStreak} dias</p>
        </div>
      </div>

      {/* Highlights */}
      {report.highlights.length > 0 && (
        <div className="space-y-1 mb-3">
          {report.highlights.slice(0, 2).map((highlight, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-green-400">
              <Award className="w-3 h-3" />
              <span>{highlight}</span>
            </div>
          ))}
        </div>
      )}

      {/* Areas to improve */}
      {report.areasToImprove.length > 0 && (
        <div className="text-xs text-muted-foreground">
          💡 {report.areasToImprove[0]}
        </div>
      )}
    </motion.div>
  );
};

// Full weekly report view
export const WeeklyReportView = () => {
  const { user } = useAuth();
  const report = useWeeklyReport(user?.id);

  if (!report) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
        <p>Ainda não há dados suficientes para gerar um relatório</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20">
        <p className="text-5xl font-black mb-1">{report.overallScore}</p>
        <p className="text-muted-foreground">Pontuação Semanal</p>
        <Progress value={report.overallScore} className="mt-4 h-3" />
      </div>

      {/* Nutrition Stats */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 0, borderBottom: "1px solid #2A2A2A", padding: "16px" }}>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Utensils className="w-5 h-5 text-orange-400" />
          Nutrição
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-bold">{report.nutrition.avgCalories}</p>
            <p className="text-xs text-muted-foreground">Média kcal/dia</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{report.nutrition.avgProtein}g</p>
            <p className="text-xs text-muted-foreground">Média proteína/dia</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{report.nutrition.daysLogged}/7</p>
            <p className="text-xs text-muted-foreground">Dias registados</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{report.nutrition.totalMeals}</p>
            <p className="text-xs text-muted-foreground">Total refeições</p>
          </div>
        </div>
      </div>

      {/* Workout Stats */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 0, borderBottom: "1px solid #2A2A2A", padding: "16px" }}>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-blue-400" />
          Treinos
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-bold">{report.workout.totalSessions}</p>
            <p className="text-xs text-muted-foreground">Sessões</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{report.workout.totalExercises}</p>
            <p className="text-xs text-muted-foreground">Exercícios feitos</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{report.workout.avgCompletionRate}%</p>
            <p className="text-xs text-muted-foreground">Taxa conclusão</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{report.workout.currentStreak}</p>
            <p className="text-xs text-muted-foreground">Streak atual</p>
          </div>
        </div>
        {report.workout.muscleGroupsHit.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-2">Grupos trabalhados:</p>
            <div className="flex flex-wrap gap-1">
              {report.workout.muscleGroupsHit.map((mg) => (
                <span key={mg} className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs">
                  {mg}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Highlights & Improvements */}
      <div className="grid grid-cols-1 gap-4">
        {report.highlights.length > 0 && (
          <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
            <h3 className="font-semibold mb-2 text-green-400">✨ Destaques</h3>
            <ul className="space-y-1">
              {report.highlights.map((h, i) => (
                <li key={i} className="text-sm">{h}</li>
              ))}
            </ul>
          </div>
        )}

        {report.areasToImprove.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <h3 className="font-semibold mb-2 text-amber-400">💡 Para melhorar</h3>
            <ul className="space-y-1">
              {report.areasToImprove.map((a, i) => (
                <li key={i} className="text-sm">{a}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
