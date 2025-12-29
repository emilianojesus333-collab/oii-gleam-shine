import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, Apple, ChevronRight } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { useNutrition, mealTypeLabels, mealTypeIcons } from '@/hooks/useNutrition';
import { MacroRings } from '@/components/nutrition/MacroRings';
import { FoodScanner } from '@/components/nutrition/FoodScanner';
import { MealCard } from '@/components/nutrition/MealCard';
import { ProfileSetup } from '@/components/nutrition/ProfileSetup';
import { WeeklyChart } from '@/components/nutrition/WeeklyChart';
import { NutritionHistory } from '@/components/nutrition/NutritionHistory';
import { MealPlansView } from '@/components/nutrition/MealPlansView';
import { RecipesView } from '@/components/nutrition/RecipesView';
import { MealPlan } from '@/data/mealPlans';

const Nutrition = () => {
  const {
    profile,
    goals,
    todayLog,
    progress,
    remaining,
    weeklyData,
    weeklyStats,
    monthlyData,
    allLogs,
    achievements,
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
    <div className="min-h-screen bg-black pb-32">
      {/* Hero Background Gradient */}
      <div className="absolute inset-x-0 top-0 h-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-green-500/20 via-black/50 to-black" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 px-6 pt-12 pb-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1E1E1E]/50 flex items-center justify-center">
              <Apple className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white/70">Nutrição</h1>
              <p className="text-xs text-gray-400/70">
                {new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <NutritionHistory
              allLogs={allLogs}
              monthlyData={monthlyData}
              weeklyStats={weeklyStats}
              goals={goals}
              achievements={achievements}
            />
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
      <div className="relative z-10 px-6 py-4 space-y-5">
        {/* Macro rings */}
        <MacroRings
          goals={goals}
          consumed={todayLog.totals}
          progress={progress}
        />

        {/* Meal Plans */}
        <MealPlansView 
          currentGoal={profile.goal} 
          onApplyPlan={(plan: MealPlan) => {
            const avgCalories = Math.round((plan.calorieRange.min + plan.calorieRange.max) / 2);
            updateProfile({ goal: plan.goal });
            setCustomGoals({ calories: avgCalories });
          }}
        />

        {/* Recipes */}
        <RecipesView />

        {/* AI Scanner button */}
        <FoodScanner onMealAdded={addMeal} />

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-[#1E1E1E]/50 p-4 text-center"
          >
            <p className="text-2xl font-black text-red-400">{remaining.protein}g</p>
            <p className="text-xs text-gray-400/70 mt-1">Proteína</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl bg-[#1E1E1E]/50 p-4 text-center"
          >
            <p className="text-2xl font-black text-yellow-400">{remaining.carbs}g</p>
            <p className="text-xs text-gray-400/70 mt-1">Carbs</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-[#1E1E1E]/50 p-4 text-center"
          >
            <p className="text-2xl font-black text-blue-400">{remaining.fat}g</p>
            <p className="text-xs text-gray-400/70 mt-1">Gordura</p>
          </motion.div>
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
                className="text-center py-8"
              >
                <Apple className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <p className="text-sm text-gray-400/70">Ainda não registaste nenhuma refeição</p>
                <p className="text-xs text-gray-500/50">Usa o scanner IA acima para começar!</p>
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
        <div className="space-y-3">
          <h3 className="font-semibold text-white/70">Dicas para Atletas</h3>
          <div className="grid gap-3">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 p-4 rounded-2xl bg-[#1E1E1E]/50"
            >
              <span className="text-xl">💪</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-white/70">Pós-treino</p>
                <p className="text-xs text-gray-400/70">Proteína + carbs até 2h após treino</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-3 p-4 rounded-2xl bg-[#1E1E1E]/50"
            >
              <span className="text-xl">🥛</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-white/70">Proteína distribuída</p>
                <p className="text-xs text-gray-400/70">20-40g por refeição é ideal</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </motion.div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Nutrition;
