import { motion } from 'framer-motion';
import { Flame, Beef, Wheat, Droplet, Leaf } from 'lucide-react';
import { MacroGoals } from '@/hooks/useNutrition';

interface MacroRingProps {
  goals: MacroGoals;
  consumed: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  progress: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

const macroConfig = [
{ key: 'protein', label: 'Proteína', icon: Beef, color: 'hsl(346, 77%, 49%)', unit: 'g' },
{ key: 'carbs', label: 'Carbs', icon: Wheat, color: 'hsl(45, 93%, 47%)', unit: 'g' },
{ key: 'fat', label: 'Gordura', icon: Droplet, color: 'hsl(217, 91%, 60%)', unit: 'g' },
{ key: 'fiber', label: 'Fibra', icon: Leaf, color: 'hsl(142, 76%, 36%)', unit: 'g' }] as
const;

export const MacroRings = ({ goals, consumed, progress }: MacroRingProps) => {
  const caloriesRemaining = Math.max(goals.calories - consumed.calories, 0);
  const caloriesProgress = Math.min(consumed.calories / goals.calories * 100, 100);
  const isOverCalories = consumed.calories > goals.calories;

  return (
    <div className="space-y-6">
      {/* Main calorie ring */}
      <div className="flex items-center justify-center gap-6">
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="72"
              cy="72"
              r="64"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-muted/20" />

            <motion.circle
              cx="72"
              cy="72"
              r="64"
              stroke={isOverCalories ? 'hsl(0, 84%, 60%)' : '#4ADE80'}
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              initial={{ strokeDasharray: '0 402' }}
              animate={{ strokeDasharray: `${caloriesProgress * 4.02} 402` }}
              transition={{ duration: 0.8, ease: 'easeOut' }} />

          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Flame className={`w-6 h-6 ${isOverCalories ? 'text-red-500' : 'text-green-500'}`} />
              <motion.span
              key={Math.round(consumed.calories)}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-2xl font-bold text-white">

              {Math.round(consumed.calories)}
            </motion.span>
            <span className="text-xs text-gray-400">/{Math.round(goals.calories)} kcal</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-center">
            <p className="text-sm text-gray-400">Restante</p>
            <p className={`text-3xl font-bold ${isOverCalories ? 'text-red-500' : 'text-white'}`}>
              {isOverCalories ? '+' : ''}{Math.round(Math.abs(goals.calories - consumed.calories))}
            </p>
            <p className="text-xs text-gray-400">kcal</p>
          </div>
        </div>
      </div>

      {/* Macro bars - horizontal container */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ background: "transparent", border: "none", padding: "16px 0", width: "100%" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
          {macroConfig.filter((m) => m.key !== 'fiber').map(({ key, label }, i) => {
            const value = consumed[key as keyof typeof consumed];
            const goal = goals[key as keyof typeof goals];
            const pct = progress[key as keyof typeof progress];
            const isOver = value > goal;

            return (
              <div
                key={key}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  padding: "0 12px",
                  borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.1)" : "none",
                }}
              >
                <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", margin: 0 }}>{label}</p>
                <div style={{ width: "100%", height: 3, borderRadius: 2, background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
                  <motion.div
                    style={{ height: "100%", borderRadius: 2, backgroundColor: isOver ? "hsl(0, 84%, 60%)" : "#4ADE80" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(pct, 100)}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "white", margin: 0 }}>
                  {Math.round(value)}/{Math.round(goal)} g
                </p>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>);

};