import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, Apple } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { useNutrition, mealTypeLabels } from '@/hooks/useNutrition';
import { MacroRings } from '@/components/nutrition/MacroRings';
import { FoodScanner } from '@/components/nutrition/FoodScanner';
import { MealCard } from '@/components/nutrition/MealCard';
import { ProfileSetup } from '@/components/nutrition/ProfileSetup';
import { NutritionChart } from '@/components/nutrition/NutritionChart';
import { NutritionHistory } from '@/components/nutrition/NutritionHistory';
import { MealPlanCards } from '@/components/nutrition/MealPlanCards';
import { PostWorkoutSuggestions } from '@/components/nutrition/PostWorkoutSuggestions';
import { NutritionInsights } from '@/components/nutrition/NutritionInsights';
import { HexBadge } from '@/components/ui/HexBadge';

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
    setCustomGoals
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
      <div className="absolute inset-x-0 top-0 h-[420px] overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/40 via-blue-500/20 via-60% to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,_var(--tw-gradient-stops))] from-blue-500/30 via-blue-600/10 via-50% to-transparent" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 px-6 pt-12 pb-4">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HexBadge label="NU" size={38} />
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/30 to-blue-600/20 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Apple className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Nutrição</h1>
              <p className="text-xs text-blue-400">
                {new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>

          {/* Minimalist action buttons */}
          <div className="flex items-center gap-1">
            <NutritionHistory
              allLogs={allLogs}
              monthlyData={monthlyData}
              weeklyStats={weeklyStats}
              goals={goals}
              achievements={achievements} />

            <ProfileSetup
              profile={profile}
              goals={goals}
              onUpdateProfile={updateProfile}
              onSetGoals={setCustomGoals} />

          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 px-6 py-4 space-y-5">
        {/* Macro rings */}
        <MacroRings
          goals={goals}
          consumed={todayLog.totals}
          progress={progress} />

        <div className="h-px bg-white/[0.06]" />

        {/* Plans */}
        <MealPlanCards />

        <div className="h-px bg-white/[0.06]" />

        {/* Post-workout suggestions */}
        <PostWorkoutSuggestions />

        <div className="h-px bg-white/[0.06]" />

        {/* AI Scanner button */}
        <FoodScanner onMealAdded={addMeal} />

        <div className="h-px bg-white/[0.06]" />

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-rose-500/15 to-rose-600/5 p-4 text-center"
            style={{ borderLeft: "2px solid #3B82F6" }}>

            <p className="text-2xl font-black text-[#a51d1d]">{Math.round(remaining.protein)}g</p>
            <p className="text-xs text-gray-300 mt-1">Proteína</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gradient-to-br from-amber-500/15 to-amber-600/5 p-4 text-center"
            style={{ borderLeft: "2px solid #3B82F6" }}>

            <p className="text-2xl font-black text-amber-500">{Math.round(remaining.carbs)}g</p>
            <p className="text-xs text-gray-300 mt-1">Carbs</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-sky-500/15 to-sky-600/5 p-4 text-center"
            style={{ borderLeft: "2px solid #3B82F6" }}>

            <p className="text-2xl font-black text-teal-600">{Math.round(remaining.fat)}g</p>
            <p className="text-xs text-gray-300 mt-1">Gordura</p>
          </motion.div>
        </div>

        <div className="h-px bg-white/[0.06]" />

        {/* Today's meals */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2 text-white">
            <HexBadge label="NU" size={28} />
            <Utensils className="w-4 h-4" />
            Refeições de Hoje
          </h3>

          <AnimatePresence>
            {todayLog.meals.length === 0 ?
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 bg-black">

                <Apple className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <p className="text-sm text-gray-300">Nenhuma refeição registada</p>
                <p className="text-xs text-gray-400">Usa o scanner IA acima para começar</p>
              </motion.div> :

            <div className="space-y-3">
                {todayLog.meals.map((meal) =>
              <MealCard key={meal.id} meal={meal} onRemove={removeMeal} />
              )}
              </div>
            }
          </AnimatePresence>
        </div>

        <div className="h-px bg-white/[0.06]" />

        {/* Weekly chart */}
        <NutritionChart weeklyData={weeklyData} goals={goals} allLogs={allLogs} />

        <div className="h-px bg-white/[0.06]" />

        {/* Insights */}
        <NutritionInsights
          proteinConsumed={Math.round(todayLog.totals.protein)}
          proteinGoal={goals.protein}
        />
      </div>

      <BottomNav />
    </div>);

};

export default Nutrition;
