import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Clock } from 'lucide-react';
import { getPostWorkoutSuggestions, FitnessRecipe } from '@/data/fitnessRecipes';
import { useWorkoutNutritionSync } from '@/hooks/useWorkoutNutritionSync';

export const PostWorkoutSuggestions = () => {
  const { trainedToday, phase } = useWorkoutNutritionSync();

  const suggestions = useMemo(() => {
    if (!trainedToday && phase !== 'post_workout' && phase !== 'recovery') return [];
    return getPostWorkoutSuggestions(3);
  }, [trainedToday, phase]);

  if (suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">🍽</span>
        <div>
          <h3 className="font-semibold text-white text-sm">Sugestão Pós-Treino</h3>
          <p className="text-xs text-gray-400">Recupera melhor com estas refeições</p>
        </div>
      </div>

      <div className="grid gap-2">
        {suggestions.map((recipe, i) => (
          <RecipeSuggestionCard key={recipe.id} recipe={recipe} index={i} />
        ))}
      </div>
    </motion.div>
  );
};

const RecipeSuggestionCard = ({ recipe, index }: { recipe: FitnessRecipe; index: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
    className="flex items-center gap-3 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5"
  >
    <span className="text-2xl">{recipe.imageEmoji}</span>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-white truncate">{recipe.name}</p>
      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <Flame className="w-3 h-3 text-emerald-400" />
          {recipe.calories} kcal
        </span>
        <span className="flex items-center gap-1">
          <span className="text-rose-400 font-medium">{recipe.protein}g</span> prot
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {recipe.prepTime}
        </span>
      </div>
    </div>
  </motion.div>
);
