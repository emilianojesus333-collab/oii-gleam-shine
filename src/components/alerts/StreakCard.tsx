import { motion } from 'framer-motion';
import { Flame, Trophy, Target, Calendar } from 'lucide-react';
import { StreakData } from '@/hooks/useAlerts';

interface StreakCardProps {
  streak: StreakData;
  onRecordWorkout: () => void;
}

export const StreakCard = ({ streak, onRecordWorkout }: StreakCardProps) => {
  const today = new Date().toISOString().split('T')[0];
  const workedOutToday = streak.lastWorkoutDate === today;
  
  // Generate last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const getFlameColor = () => {
    if (streak.currentStreak >= 30) return 'text-purple-400';
    if (streak.currentStreak >= 14) return 'text-orange-400';
    if (streak.currentStreak >= 7) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getMotivationalMessage = () => {
    if (workedOutToday) return 'Treino registado hoje! 💪';
    if (streak.currentStreak === 0) return 'Começa uma nova sequência!';
    if (streak.currentStreak >= 30) return 'Lendário! Continua assim!';
    if (streak.currentStreak >= 14) return 'Imparável! 2 semanas!';
    if (streak.currentStreak >= 7) return 'Uma semana! Excelente!';
    return 'Não quebres a sequência!';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl p-5 border border-orange-500/20"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div 
            className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center"
            animate={streak.currentStreak > 0 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Flame className={`w-6 h-6 ${getFlameColor()}`} />
          </motion.div>
          <div>
            <h3 className="font-semibold text-foreground">Consistência</h3>
            <p className="text-xs text-muted-foreground">{getMotivationalMessage()}</p>
          </div>
        </div>

        {!workedOutToday && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onRecordWorkout}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-medium shadow-lg shadow-orange-500/25"
          >
            Registar Treino
          </motion.button>
        )}
      </div>

      {/* Main streak display */}
      <div className="flex items-center justify-center gap-8 py-4 mb-4">
        <div className="text-center">
          <motion.div
            key={streak.currentStreak}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-5xl font-bold ${getFlameColor()}`}
          >
            {streak.currentStreak}
          </motion.div>
          <p className="text-xs text-muted-foreground mt-1">DIAS</p>
        </div>
        
        <div className="h-16 w-px bg-border/50" />
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-muted-foreground">Recorde:</span>
            <span className="font-semibold">{streak.longestStreak} dias</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Target className="w-4 h-4 text-green-500" />
            <span className="text-muted-foreground">Total:</span>
            <span className="font-semibold">{streak.totalWorkouts} treinos</span>
          </div>
        </div>
      </div>

      {/* Last 7 days visualization */}
      <div className="flex gap-1">
        {last7Days.map((date, index) => {
          const dayName = new Date(date).toLocaleDateString('pt-PT', { weekday: 'short' }).charAt(0).toUpperCase();
          const isToday = date === today;
          const wasWorkedOut = streak.lastWorkoutDate && date <= streak.lastWorkoutDate && 
            (streak.currentStreak >= (6 - index + 1) || date === streak.lastWorkoutDate);
          
          // Simplified logic: show as worked out if it's the last workout date or before it within streak
          const isActive = date === streak.lastWorkoutDate || 
            (streak.lastWorkoutDate && date < streak.lastWorkoutDate);
          
          return (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg ${
                isToday ? 'bg-primary/10 border border-primary/30' : ''
              }`}
            >
              <span className="text-[10px] text-muted-foreground">{dayName}</span>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  isActive
                    ? 'bg-gradient-to-br from-orange-500 to-red-500'
                    : isToday
                    ? 'bg-muted/50 border-2 border-dashed border-muted-foreground/30'
                    : 'bg-muted/30'
                }`}
              >
                {isActive && <Flame className="w-3 h-3 text-white" />}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
