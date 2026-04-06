import { motion } from 'framer-motion';
import { Clock, Trash2 } from 'lucide-react';
import { Meal, mealTypeLabels, mealTypeIcons } from '@/hooks/useNutrition';
import { Button } from '@/components/ui/button';

interface MealCardProps {
  meal: Meal;
  onRemove: (id: string) => void;
}

export const MealCard = ({ meal, onRemove }: MealCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="p-4 rounded-none bg-[#0F0F0F] border-0" style={{ borderLeft: "2px solid rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{mealTypeIcons[meal.type]}</span>
          <div>
            <h4 className="font-medium text-sm text-white">{mealTypeLabels[meal.type]}</h4>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              {meal.time}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">{Math.round(meal.total.calories)} kcal</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive/70 hover:text-destructive"
            onClick={() => onRemove(meal.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Foods list */}
      <div className="space-y-1 mb-3">
        {meal.foods.map((food, i) => (
          <div key={i} className="flex justify-between text-xs text-gray-400">
            <span>{food.name} ({food.portion})</span>
            <span>{Math.round(food.calories)} kcal</span>
          </div>
        ))}
      </div>

      {/* Macros */}
      <div className="flex gap-4 text-xs text-gray-300">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>{Math.round(meal.total.protein)}g P</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span>{Math.round(meal.total.carbs)}g C</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span>{Math.round(meal.total.fat)}g G</span>
        </div>
      </div>

      {/* Image thumbnail */}
      {meal.imageUrl && (
        <div className="mt-3">
          <img
            src={meal.imageUrl}
            alt="Meal"
            className="w-full h-20 object-cover rounded-lg"
          />
        </div>
      )}
    </motion.div>
  );
};
