import { motion } from 'framer-motion';
import { Heart, Apple, ChefHat, ChevronRight } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useNavigate } from 'react-router-dom';
import { getLocalizedText } from '@/data/fitnessRecipes';
import { useLanguage } from '@/hooks/useLanguage';

export const FavoritesWidget = () => {
  const { favorites, totalFavorites } = useFavorites();
  const navigate = useNavigate();
  const { language } = useLanguage();

  // Get emoji based on category
  const getCategoryEmoji = (category: string) => {
    const emojiMap: Record<string, string> = {
      protein: '🥩',
      carbs: '🍚',
      fat: '🥑',
      vegetable: '🥦',
      fruit: '🍎',
      dairy: '🥛',
      supplement: '💊',
      complete: '🍽️',
    };
    return emojiMap[category] || '🍽️';
  };

  // Get first 3 items to display
  const previewItems = [
    ...favorites.foods.slice(0, 2).map(f => ({ type: 'food' as const, name: f.name, emoji: getCategoryEmoji(f.category) })),
    ...favorites.recipes.slice(0, 2).map(r => ({ type: 'recipe' as const, name: getLocalizedText(r.name), emoji: r.imageEmoji })),
  ].slice(0, 3);

  if (totalFavorites === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white/70 flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-400" />
          {language === 'pt' ? 'Favoritos Rápidos' : 'Quick Favorites'}
        </h3>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/nutrition')}
          className="text-xs text-primary/70 flex items-center gap-1"
        >
          {language === 'pt' ? 'Ver todos' : 'See all'}
          <ChevronRight className="w-3 h-3" />
        </motion.button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {previewItems.map((item, index) => (
          <motion.button
            key={`${item.type}-${item.name}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45 + index * 0.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/nutrition')}
            className="rounded-2xl bg-[#1E1E1E]/50 p-3 text-center"
          >
            <span className="text-2xl block mb-1">{item.emoji}</span>
            <p className="text-xs text-white/70 truncate font-medium">{item.name}</p>
            <p className="text-[10px] text-gray-400/50 mt-0.5 flex items-center justify-center gap-1">
              {item.type === 'food' ? (
                <>
                  <Apple className="w-2.5 h-2.5" />
                  {language === 'pt' ? 'Alimento' : 'Food'}
                </>
              ) : (
                <>
                  <ChefHat className="w-2.5 h-2.5" />
                  {language === 'pt' ? 'Receita' : 'Recipe'}
                </>
              )}
            </p>
          </motion.button>
        ))}
        
        {/* Show more button if there are more favorites */}
        {totalFavorites > 3 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/nutrition')}
            className="rounded-2xl bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-500/20 p-3 text-center"
          >
            <span className="text-2xl block mb-1">+{totalFavorites - 3}</span>
            <p className="text-xs text-rose-300/70 font-medium">{language === 'pt' ? 'mais' : 'more'}</p>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};
