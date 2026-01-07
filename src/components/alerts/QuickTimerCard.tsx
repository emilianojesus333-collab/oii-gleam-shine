import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Play, Square, RotateCcw } from 'lucide-react';
import { QuickTimer } from '@/hooks/useAlerts';

interface QuickTimerCardProps {
  timers: QuickTimer[];
  activeTimer: number | null;
  remaining: number;
  onStart: (seconds: number) => void;
  onStop: () => void;
}

export const QuickTimerCard = ({ timers, activeTimer, remaining, onStart, onStop }: QuickTimerCardProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = activeTimer ? (remaining / activeTimer) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl p-5 border border-emerald-500/20"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
          <Timer className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Timer Rápido</h3>
          <p className="text-xs text-gray-400">Descanso entre séries</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTimer !== null ? (
          <motion.div
            key="active"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative"
          >
            {/* Progress ring */}
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-emerald-500/20"
                />
                <motion.circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  className="text-emerald-400"
                  initial={{ strokeDasharray: '364 364' }}
                  animate={{ strokeDasharray: `${progress * 3.64} 364` }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  key={remaining}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-4xl font-bold text-white tabular-nums"
                >
                  {formatTime(remaining)}
                </motion.span>
                <span className="text-xs text-gray-400">restantes</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onStop}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/20 text-red-400 font-medium"
              >
                <Square className="w-4 h-4" />
                Parar
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onStart(activeTimer)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500/20 text-emerald-400 font-medium"
              >
                <RotateCcw className="w-4 h-4" />
                Reiniciar
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="buttons"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="grid grid-cols-4 gap-2"
          >
            {timers.map((timer) => (
              <motion.button
                key={timer.seconds}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => onStart(timer.seconds)}
                className="flex flex-col items-center justify-center gap-1 p-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
              >
                <Play className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-semibold text-white">{timer.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
