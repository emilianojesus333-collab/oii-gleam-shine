import { motion } from 'framer-motion';
import { Trophy, Target, Flame, CheckCircle2, Clock } from 'lucide-react';
import { useChallenges } from '@/hooks/useChallenges';
import { Progress } from '@/components/ui/progress';

export const ChallengesWidget = () => {
  const { activeChallenges, weeklyProgress, badges } = useChallenges();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ background: "#1A1A1A", borderRadius: 0, border: "none", borderBottom: "1px solid #2A2A2A", padding: "20px 16px", width: "100%", margin: 0 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <span className="font-semibold text-sm">Desafios da Semana</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-amber-400">
          <span>{weeklyProgress.completed}/{weeklyProgress.total}</span>
        </div>
      </div>

      {/* Weekly progress bar */}
      <div className="mb-4">
        <Progress value={weeklyProgress.percentage} className="h-2 bg-amber-900/30" />
        <p className="text-xs text-muted-foreground mt-1 text-right">{weeklyProgress.percentage}% completo</p>
      </div>

      {/* Active challenges */}
      <div className="space-y-2">
        {activeChallenges.slice(0, 3).map((challenge) => (
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-3 rounded-xl border ${
              challenge.completed 
                ? 'bg-green-500/10 border-green-500/30' 
                : 'bg-black/20 border-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{challenge.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{challenge.title}</p>
                  {challenge.completed && (
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Progress 
                    value={(challenge.current / challenge.target) * 100} 
                    className="h-1 flex-1 bg-white/10"
                  />
                  <span className="text-xs text-muted-foreground shrink-0">
                    {challenge.current}/{challenge.target}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {activeChallenges.length === 0 && (
        <div className="text-center py-4">
          <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Novos desafios em breve</p>
        </div>
      )}

      {/* Recent badges */}
      {badges.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/10">
          <p className="text-xs text-muted-foreground mb-2">Badges Desbloqueados</p>
          <div className="flex gap-2">
            {badges.slice(-4).map((badge) => (
              <motion.div
                key={badge.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  badge.rarity === 'legendary' ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                  badge.rarity === 'epic' ? 'bg-gradient-to-br from-purple-400 to-pink-500' :
                  badge.rarity === 'rare' ? 'bg-gradient-to-br from-blue-400 to-cyan-500' :
                  'bg-gradient-to-br from-gray-400 to-gray-600'
                }`}
                title={badge.name}
              >
                {badge.icon}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

// Full challenges view
export const ChallengesView = () => {
  const { activeChallenges, completedChallenges, badges, totalChallengesCompleted, weeklyProgress } = useChallenges();

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
          <p className="text-2xl font-bold text-amber-400">{totalChallengesCompleted}</p>
          <p className="text-xs text-muted-foreground">Total Completos</p>
        </div>
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
          <p className="text-2xl font-bold text-green-400">{badges.length}</p>
          <p className="text-xs text-muted-foreground">Badges</p>
        </div>
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
          <p className="text-2xl font-bold text-blue-400">{weeklyProgress.percentage}%</p>
          <p className="text-xs text-muted-foreground">Esta Semana</p>
        </div>
      </div>

      {/* Active challenges */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Target className="w-5 h-5 text-amber-400" />
          Desafios Ativos
        </h3>
        <div className="space-y-3">
          {activeChallenges.map((challenge) => (
            <motion.div
              key={challenge.id}
              className={`p-4 rounded-2xl border ${
                challenge.completed 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-card/50 border-border/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{challenge.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{challenge.title}</h4>
                    {challenge.completed && (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                        Completo!
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{challenge.description}</p>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{challenge.current} / {challenge.target} {challenge.unit}</span>
                      <span>{Math.round((challenge.current / challenge.target) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(challenge.current / challenge.target) * 100} 
                      className="h-2"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* All badges */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          Coleção de Badges
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {badges.map((badge) => (
            <motion.div
              key={badge.id}
              whileHover={{ scale: 1.05 }}
              className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 ${
                badge.rarity === 'legendary' ? 'bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border border-yellow-500/30' :
                badge.rarity === 'epic' ? 'bg-gradient-to-br from-purple-400/20 to-pink-500/20 border border-purple-500/30' :
                badge.rarity === 'rare' ? 'bg-gradient-to-br from-blue-400/20 to-cyan-500/20 border border-blue-500/30' :
                'bg-card/50 border border-border/50'
              }`}
            >
              <span className="text-2xl mb-1">{badge.icon}</span>
              <p className="text-xs text-center font-medium">{badge.name}</p>
            </motion.div>
          ))}
          {badges.length === 0 && (
            <div className="col-span-4 text-center py-8 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Completa desafios para desbloquear badges!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
