import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, Apple, ChevronRight } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { useNutrition, mealTypeLabels, mealTypeIcons } from '@/hooks/useNutrition';
import { MacroRings } from '@/components/nutrition/MacroRings';
import { FoodScanner } from '@/components/nutrition/FoodScanner';
import { MealCard } from '@/components/nutrition/MealCard';
import { ProfileSetup } from '@/components/nutrition/ProfileSetup';
import { WeeklyChart } from '@/components/nutrition/WeeklyChart';

const Nutrition = () => {
  const {
    profile,
    goals,
    todayLog,
    progress,
    remaining,
    weeklyData,
    addMeal,
    removeMeal,
    updateProfile,
    setCustomGoals,
  } = useNutrition();

  // Group meals by type
  const mealsByType = todayLog.meals.reduce((acc, meal) => {
    if (!acc[meal.type]) acc[meal.type] = [];
    acc[meal.type].push(meal);
    return acc;
  }, {} as Record<string, typeof todayLog.meals>);

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50"
      >
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Apple className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Nutrição</h1>
                <p className="text-xs text-muted-foreground">
                  {new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>
            
            <ProfileSetup
              profile={profile}
              goals={goals}
              onUpdateProfile={updateProfile}
              onSetGoals={setCustomGoals}
            />
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Macro rings */}
        <MacroRings
          goals={goals}
          consumed={todayLog.totals}
          progress={progress}
        />

        {/* AI Scanner button */}
        <FoodScanner onMealAdded={addMeal} />

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
            <p className="text-lg font-bold text-red-500">{remaining.protein}g</p>
            <p className="text-xs text-muted-foreground">Proteína restante</p>
          </div>
          <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
            <p className="text-lg font-bold text-yellow-500">{remaining.carbs}g</p>
            <p className="text-xs text-muted-foreground">Carbs restantes</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
            <p className="text-lg font-bold text-blue-500">{remaining.fat}g</p>
            <p className="text-xs text-muted-foreground">Gordura restante</p>
          </div>
        </div>

        {/* Today's meals */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Utensils className="w-4 h-4" />
            Refeições de Hoje
          </h3>
          
          <AnimatePresence>
            {todayLog.meals.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-muted-foreground"
              >
                <Apple className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Ainda não registaste nenhuma refeição</p>
                <p className="text-xs">Usa o scanner IA acima para começar!</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {todayLog.meals.map((meal) => (
                  <MealCard key={meal.id} meal={meal} onRemove={removeMeal} />
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Weekly chart */}
        <WeeklyChart data={weeklyData} />

        {/* Tips section */}
        <div className="space-y-2">
          <h3 className="font-semibold">Dicas para Atletas</h3>
          <div className="grid gap-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/50">
              <span className="text-xl">💪</span>
              <div className="flex-1">
                <p className="text-sm font-medium">Pós-treino</p>
                <p className="text-xs text-muted-foreground">Proteína + carbs até 2h após treino</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/50">
              <span className="text-xl">🥛</span>
              <div className="flex-1">
                <p className="text-sm font-medium">Proteína distribuída</p>
                <p className="text-xs text-muted-foreground">20-40g por refeição é ideal</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Nutrition;
