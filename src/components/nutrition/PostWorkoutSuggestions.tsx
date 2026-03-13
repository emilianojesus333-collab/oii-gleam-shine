import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { useWorkoutNutritionSync } from '@/hooks/useWorkoutNutritionSync';

interface PostWorkoutMeal {
  title: string;
  prepTime: string;
  calories: number;
  protein: number;
}

const postWorkoutMeals: PostWorkoutMeal[] = [
  { title: 'Frango grelhado com arroz', prepTime: '20 min', calories: 520, protein: 42 },
  { title: 'Shake proteico com banana', prepTime: '2 min', calories: 320, protein: 30 },
  { title: 'Omelete de claras com batata doce', prepTime: '10 min', calories: 410, protein: 35 },
  { title: 'Iogurte grego com aveia e mel', prepTime: '3 min', calories: 360, protein: 28 },
  { title: 'Atum com arroz integral', prepTime: '15 min', calories: 480, protein: 38 },
];

export const PostWorkoutSuggestions = () => {
  const { trainedToday, phase } = useWorkoutNutritionSync();

  const suggestions = useMemo(() => {
    if (!trainedToday && phase !== 'post_workout' && phase !== 'recovery') return [];
    return [...postWorkoutMeals].sort(() => Math.random() - 0.5).slice(0, 3);
  }, [trainedToday, phase]);

  if (suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div>
        <h3 className="font-semibold text-white text-sm">Recuperação Pós-Treino</h3>
        <p className="text-xs text-muted-foreground">Sugestões rápidas para recuperação muscular</p>
      </div>

      <div className="grid gap-2">
        {suggestions.map((meal, i) => (
          <motion.div
            key={meal.title}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5"
          >
            <p className="text-[14px] font-semibold text-white">{meal.title}</p>
            <p className="text-[12px] text-muted-foreground/80 mt-0.5 flex items-center gap-2">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {meal.prepTime}
              </span>
              <span>•</span>
              <span>{meal.calories} kcal</span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">{meal.protein}g prot</span>
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
