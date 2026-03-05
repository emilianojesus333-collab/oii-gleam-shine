import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, Apple } from 'lucide-react';
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
import { FavoritesView } from '@/components/nutrition/FavoritesView';
import { NutritionCarousel } from '@/components/nutrition/NutritionCarousel';
import { MealPlan } from '@/data/mealPlans';
import { useLanguage } from '@/hooks/useLanguage';

const Nutrition = () => {
  const { t } = useLanguage();
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
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-600/40 via-emerald-500/20 via-60% to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,_var(--tw-gradient-stops))] from-emerald-500/30 via-emerald-600/10 via-50% to-transparent" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 px-6 pt-12 pb-4">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 to-green-600/20 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Apple className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">{t("nutrition.title")}</h1>
              <p className="text-xs text-emerald-400">
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


        {/* Carousel: Planos & Receitas */}
        <NutritionCarousel title={t("nutrition.plansAndRecipes")}>
          <MealPlansView
            currentGoal={profile.goal}
            onApplyPlan={(plan: MealPlan) => {
              const avgCalories = Math.round((plan.calorieRange.min + plan.calorieRange.max) / 2);
              updateProfile({ goal: plan.goal });
              setCustomGoals({ calories: avgCalories });
            }} />

          <RecipesView />
          <FavoritesView />
        </NutritionCarousel>

        {/* AI Scanner button */}
        <FoodScanner onMealAdded={addMeal} />

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-gradient-to-br from-rose-500/15 to-rose-600/5 border p-4 text-center border-stone-950 bg-[#111311]">

            <p className="text-2xl font-black text-[#a51d1d]">{Math.round(remaining.protein)}g</p>
            <p className="text-xs text-gray-300 mt-1">{t("nutrition.protein")}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl bg-gradient-to-br from-amber-500/15 to-amber-600/5 border p-4 text-center bg-stone-950 border-stone-950">

            <p className="text-2xl font-black text-amber-500">{Math.round(remaining.carbs)}g</p>
            <p className="text-xs text-gray-300 mt-1">{t("nutrition.carbs")}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-gradient-to-br from-sky-500/15 to-sky-600/5 border p-4 text-center bg-stone-950 border-stone-950">

            <p className="text-2xl font-black text-teal-600">{Math.round(remaining.fat)}g</p>
            <p className="text-xs text-gray-300 mt-1">{t("nutrition.fat")}</p>
          </motion.div>
        </div>

        {/* Today's meals */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2 text-white">
            <Utensils className="w-4 h-4" />
            {t("nutrition.todayMeals")}
          </h3>
          
          <AnimatePresence>
            {todayLog.meals.length === 0 ?
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 bg-black">

                <Apple className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <p className="text-sm text-gray-300">{t("nutrition.noMealsYet")}</p>
                <p className="text-xs text-gray-400">{t("nutrition.useScannerHint")}</p>
              </motion.div> :

            <div className="space-y-3">
                {todayLog.meals.map((meal) =>
              <MealCard key={meal.id} meal={meal} onRemove={removeMeal} />
              )}
              </div>
            }
          </AnimatePresence>
        </div>

        {/* Weekly chart */}
        <WeeklyChart data={weeklyData} />

        {/* Tips section */}
        <div className="space-y-3">
          <h3 className="font-semibold text-white">​Insights De Hoje  </h3>
          <div className="grid gap-3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 p-4 rounded-2xl border border-white/10 bg-[#111311]">

              <span className="text-xl">​🏋️</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Pós-treino</p>
                <p className="text-xs text-gray-400">​Consumir 30g de proteína nas próximas 2h melhora recuperação.</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-3 p-4 rounded-2xl border border-white/10 bg-[#111311]">

              <span className="text-xl">​🍽️</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Distribui a proteína</p>
                <p className="text-xs text-gray-400">​20–40g por refeição melhora absorção e recuperação</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>);

};

export default Nutrition;