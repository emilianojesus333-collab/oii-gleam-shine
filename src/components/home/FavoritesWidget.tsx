import { motion } from 'framer-motion';
import { Heart, Apple, ChevronRight } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useNavigate } from 'react-router-dom';
import { HexBadge } from '@/components/ui/HexBadge';

export const FavoritesWidget = () => {
  const { favorites, totalFavorites } = useFavorites();
  const navigate = useNavigate();

  const getCategoryEmoji = (category: string) => {
    const emojiMap: Record<string, string> = {
      protein: '🥩', carbs: '🍚', fat: '🥑', vegetable: '🥦',
      fruit: '🍎', dairy: '🥛', supplement: '💊', complete: '🍽️',
    };
    return emojiMap[category] || '🍽️';
  };

  const previewItems = favorites.foods.slice(0, 3).map(f => ({
    name: f.name,
    emoji: getCategoryEmoji(f.category),
  }));

  if (totalFavorites === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      style={{ background: "#1A1A1A", borderRadius: 0, border: "none", borderBottom: "1px solid #2A2A2A", padding: "20px 16px", width: "100%", margin: 0 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white/70 flex items-center gap-2">
          <HexBadge label="NU" size={28} />
          Favoritos Rápidos
        </h3>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/nutrition')}
          className="text-xs text-primary/70 flex items-center gap-1"
        >
          Ver todos
          <ChevronRight className="w-3 h-3" />
        </motion.button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {previewItems.map((item, index) => (
          <motion.button
            key={item.name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45 + index * 0.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/nutrition')}
            className="rounded-none p-3 text-center"
            style={{ background: "#1A1A1A", borderRadius: 0, border: "none", borderBottom: "1px solid #2A2A2A", padding: "20px 16px", width: "100%", margin: 0 }}
          >
            <span className="text-2xl block mb-1">{item.emoji}</span>
            <p className="text-xs text-white/70 truncate font-medium">{item.name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
              <Apple className="w-2.5 h-2.5" />
              Alimento
            </p>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};
