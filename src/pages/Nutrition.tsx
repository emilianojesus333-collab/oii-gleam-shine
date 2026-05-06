import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, Apple, Plus } from 'lucide-react';
import { useState, useMemo } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { useNutrition, mealTypeLabels } from '@/hooks/useNutrition';
import { useAuth } from '@/hooks/useAuth';
import { useUserSettings } from '@/hooks/useUserSettings';
import { MacroRings } from '@/components/nutrition/MacroRings';
import { FoodScanner } from '@/components/nutrition/FoodScanner';
import { MealCard } from '@/components/nutrition/MealCard';
import { ProfileSetup } from '@/components/nutrition/ProfileSetup';
import { NutritionChart } from '@/components/nutrition/NutritionChart';
import { NutritionHistory } from '@/components/nutrition/NutritionHistory';
import { MealPlanCards } from '@/components/nutrition/MealPlanCards';
import { PostWorkoutSuggestions } from '@/components/nutrition/PostWorkoutSuggestions';
import { MealSuggestionsSection } from '@/components/nutrition/MealSuggestionsSection';
import { NutritionInsights } from '@/components/nutrition/NutritionInsights';
import { useWorkoutNutritionSync } from '@/hooks/useWorkoutNutritionSync';
import { FoodSearchSheet } from '@/components/nutrition/FoodSearchSheet';
import { CustomMealsSection } from '@/components/nutrition/CustomMealsSection';
import type { CustomMealFood } from '@/utils/customMeals';
import { markTaskComplete, isTaskComplete } from '@/utils/onboardingFlow';

const weekDaysMap: Record<number, string> = {
  0: "Domingo", 1: "Segunda-feira", 2: "Terça-feira",
  3: "Quarta-feira", 4: "Quinta-feira", 5: "Sexta-feira", 6: "Sábado",
};


const Nutrition = () => {
  const {
    profile,
    goals,
    todayLog,
    progress,
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
  const { user } = useAuth();
  const { settings } = useUserSettings();
  const { todayMuscleGroups } = useWorkoutNutritionSync();
  const todayWorkoutType = todayMuscleGroups.length > 0 ? todayMuscleGroups.join(' + ') : null;
  const [foodSearchOpen, setFoodSearchOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [suggestionsTrigger, setSuggestionsTrigger] = useState(0);

  // Derive today's workout type from user schedule
  const addMealAndMark = (meal: Parameters<typeof addMeal>[0]) => {
    addMeal(meal);
    if (user?.id && !isTaskComplete(user.id, "first_meal_done")) {
      markTaskComplete(user.id, "first_meal_done");
    }
  };

  // Group meals by type
  const mealsByType = todayLog.meals.reduce((acc, meal) => {
    if (!acc[meal.type]) acc[meal.type] = [];
    acc[meal.type].push(meal);
    return acc;
  }, {} as Record<string, typeof todayLog.meals>);

  // Build currentFoods from today's meals for "save as custom meal"
  const currentFoods: CustomMealFood[] = todayLog.meals.flatMap((meal) =>
    meal.foods.map((f) => ({
      name:     f.name,
      brand:    "",
      quantity: parseFloat(f.portion) || 100,
      calories: f.calories,
      protein:  f.protein,
      carbs:    f.carbs,
      fat:      f.fat,
      fiber:    f.fiber ?? 0,
    }))
  );

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: "#000000", position: "relative", zIndex: 1 }}>

      {/* Hero — fundo verde escuro */}
      <div style={{ background: "linear-gradient(180deg, #1A5C30 0%, #0D2818 60%, #000000 100%)" }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 px-6 pt-12 pb-4">

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Ícone Apple */}
              <Apple size={28} color="#fff" />
              <div>
                <h1 className="text-2xl font-black text-white">Nutrição</h1>
                <p className="text-xs" style={{ color: "rgba(134,239,172,0.8)" }}>
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

        {/* MacroRings dentro do hero verde */}
        <div className="relative z-10">
          <MacroRings
            goals={goals}
            consumed={todayLog.totals}
            progress={progress} />
        </div>

      </div>{/* fim hero */}

        <MealPlanCards onActivate={setCustomGoals} />

        <PostWorkoutSuggestions />

        {/* ── Botões de Ação ── */}
        <div style={{ padding: "12px 16px 4px" }}>
          <button
            type="button"
            onClick={() => setFoodSearchOpen(true)}
            style={{
              width: "100%", height: 52, borderRadius: 14, border: "none",
              background: "#16A34A", color: "white", fontSize: 15, fontWeight: 700,
              boxShadow: "0 8px 24px rgba(22,163,74,0.25)", cursor: "pointer",
              marginBottom: 10,
              position: "relative", overflow: "hidden",
              animation: "breathe 3s ease-in-out infinite",
            }}
          >
            {/* Shimmer interior */}
            <div style={{
              position: "absolute", inset: 0, borderRadius: 14,
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
              backgroundSize: "200% 100%",
              animation: "shimmer 2s linear infinite",
              pointerEvents: "none",
            }} />
            + Adicionar Refeição
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              style={{
                flex: 1, height: 46, borderRadius: 12,
                background: "#141414", border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}
            >
              📷 Scanner
            </button>
            <button
              type="button"
              onClick={() => setSuggestionsTrigger(t => t + 1)}
              style={{
                flex: 1, height: 46, borderRadius: 12,
                background: "#141414", border: "1px solid rgba(74,222,128,0.2)",
                color: "#4ADE80", fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}
            >
              ✨ Sugestões IA
            </button>
          </div>
        </div>

        {/* Sugestões IA — aparece quando o botão é premido */}
        {user?.id && suggestionsTrigger > 0 && (
          <MealSuggestionsSection
            userId={user.id}
            todayWorkoutType={todayWorkoutType}
            onAddMeal={addMealAndMark}
            externalTrigger={suggestionsTrigger}
          />
        )}

        {/* Food Search Sheet */}
        <AnimatePresence>
          {foodSearchOpen && (
            <FoodSearchSheet
              open={foodSearchOpen}
              onClose={() => setFoodSearchOpen(false)}
              onAddMeal={addMealAndMark}
              userId={user?.id}
            />
          )}
        </AnimatePresence>

        {/* Scanner (controlled externally) */}
        <FoodScanner
          onMealAdded={addMealAndMark}
          controlledOpen={scannerOpen}
          onControlledChange={setScannerOpen}
        />

        {/* Today's meals */}
        <div style={{ background: "#1A1A1A", borderRadius: 0, border: "none", borderBottom: "1px solid #2A2A2A", padding: "20px 16px", width: "100%", marginTop: 12, marginBottom: 12 }}>
          <h3 className="font-semibold flex items-center gap-2 text-white mb-3">
            <Utensils className="w-4 h-4" />
            Refeições de Hoje
          </h3>
          <AnimatePresence>
            {todayLog.meals.length === 0 ?
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8">
                <Apple className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <p className="text-sm text-gray-300">Nenhuma refeição registada</p>
                <p className="text-xs text-gray-400">Usa o scanner IA acima para começar</p>
              </motion.div> :
            <div>
                {todayLog.meals.map((meal) =>
              <MealCard key={meal.id} meal={meal} onRemove={removeMeal} />
              )}
              </div>
            }
          </AnimatePresence>
        </div>

        {/* ── Refeições Personalizadas ── */}
        {user?.id && (
          <CustomMealsSection
            userId={user.id}
            currentFoods={currentFoods}
            onUseMeal={addMealAndMark}
          />
        )}

        <NutritionChart weeklyData={weeklyData} goals={goals} allLogs={allLogs} />

        <NutritionInsights
          proteinConsumed={Math.round(todayLog.totals.protein)}
          proteinGoal={goals.protein}
        />

      <BottomNav />
    </div>);

};

export default Nutrition;
