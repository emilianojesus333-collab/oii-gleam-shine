import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Clock } from 'lucide-react';
import { HexBadge } from "@/components/ui/HexBadge";
import { useWorkoutNutritionSync } from '@/hooks/useWorkoutNutritionSync';

interface PostWorkoutMeal {
  id: string;
  title: string;
  prepTime: string;
  calories: number;
  protein: number;
}

const postWorkoutMeals: PostWorkoutMeal[] = [
  { id: 'pw1', title: 'Frango grelhado com arroz', prepTime: '20 min', calories: 520, protein: 42 },
  { id: 'pw2', title: 'Shake proteico com banana', prepTime: '2 min', calories: 320, protein: 30 },
  { id: 'pw3', title: 'Omelete de claras com batata doce', prepTime: '10 min', calories: 410, protein: 35 },
  { id: 'pw4', title: 'Iogurte grego com whey e aveia', prepTime: '3 min', calories: 280, protein: 32 },
  { id: 'pw5', title: 'Atum com arroz integral', prepTime: '15 min', calories: 460, protein: 38 },
];

export const PostWorkoutSuggestions = () => {
  const { trainedToday, phase } = useWorkoutNutritionSync();

  const suggestions = useMemo(() => {
    if (!trainedToday && phase !== 'post_workout' && phase !== 'recovery') return [];
    const shuffled = [...postWorkoutMeals].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, [trainedToday, phase]);

  if (suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2 mb-1">
        <HexBadge label="TR" />
        <h3 className="font-semibold text-white text-sm">Recuperação Pós-Treino</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-2">Sugestões rápidas para recuperação muscular</p>

      <div className="grid gap-2">
        {suggestions.map((meal, i) => (
          <motion.div
            key={meal.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3 p-3 rounded-none mb-2"
            style={{ background: "#1A1A1A", borderRadius: 0, border: "none", borderBottom: "1px solid #2A2A2A", padding: "20px 16px", width: "100%", margin: 0 }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{meal.title}</p>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Flame className="w-3 h-3 text-blue-400" />
                  {meal.calories} kcal
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-rose-400 font-medium">{meal.protein}g</span> prot
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {meal.prepTime}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
