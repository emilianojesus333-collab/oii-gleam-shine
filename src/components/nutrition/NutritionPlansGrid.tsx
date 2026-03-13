import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { mealPlans, MealPlan } from '@/data/mealPlans';
import { MealPlansView } from './MealPlansView';
import { RecipesView } from './RecipesView';
import { FavoritesView } from './FavoritesView';
import { useFavorites } from '@/hooks/useFavorites';
import { fitnessRecipes } from '@/data/fitnessRecipes';

import planCutImg from '@/assets/plan-cut.jpg';
import planLowcarbImg from '@/assets/plan-lowcarb.jpg';
import planMaintainImg from '@/assets/plan-maintain.jpg';
import planVegetarianImg from '@/assets/plan-vegetarian.jpg';
import planRecipesImg from '@/assets/plan-recipes.jpg';

interface NutritionPlansGridProps {
  currentGoal: 'cut' | 'maintain' | 'bulk';
  onApplyPlan?: (plan: MealPlan) => void;
}

const planCards = [
  { id: 'cut-standard', title: 'Plano de\nDefinição', subtitle: 'Défice calórico com alta proteína', image: planCutImg },
  { id: 'lowcarb-standard', title: 'Plano\nLow-Carb', subtitle: 'Baixo em hidratos', image: planLowcarbImg },
  { id: 'maintain-standard', title: 'Plano de\nManutenção', subtitle: 'Calorias equilibradas', image: planMaintainImg },
  { id: 'vegetarian-standard', title: 'Plano\nVegetariano', subtitle: 'Baseado em plantas', image: planVegetarianImg },
];

export const NutritionPlansGrid = ({ currentGoal, onApplyPlan }: NutritionPlansGridProps) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const { totalFavorites } = useFavorites();

  const selectedPlan = selectedPlanId ? mealPlans.find(p => p.id === selectedPlanId) : null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {planCards.map((card, index) => (
          <PlanCardTrigger
            key={card.id}
            card={card}
            index={index}
            currentGoal={currentGoal}
            onApplyPlan={onApplyPlan}
          />
        ))}

        {/* Recipes card - wraps RecipesView trigger */}
        <RecipesCardWrapper index={4} />

        {/* Favorites card - wraps FavoritesView trigger */}
        <FavoritesCardWrapper index={5} totalFavorites={totalFavorites} />
      </div>
    </div>
  );
};

// Wrapper that renders the MealPlansView with a custom trigger via the card
const PlanCardTrigger = ({ card, index, currentGoal, onApplyPlan }: {
  card: typeof planCards[0];
  index: number;
  currentGoal: 'cut' | 'maintain' | 'bulk';
  onApplyPlan?: (plan: MealPlan) => void;
}) => {
  const [open, setOpen] = useState(false);
  const plan = mealPlans.find(p => p.id === card.id);

  return (
    <MealPlansView
      currentGoal={currentGoal}
      onApplyPlan={onApplyPlan}
      preSelectedPlanId={card.id}
      externalOpen={open}
      onExternalOpenChange={setOpen}
      customTrigger={
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setOpen(true)}
          className="relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer group"
        >
          <img
            src={card.image}
            alt={card.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="text-base font-bold text-white leading-tight whitespace-pre-line">
              {card.title}
            </h3>
            <p className="text-[11px] text-gray-300 mt-0.5">{card.subtitle}</p>
          </div>
        </motion.div>
      }
    />
  );
};

// Recipes card wrapper
const RecipesCardWrapper = ({ index }: { index: number }) => {
  return (
    <RecipesView
      customTrigger={
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          whileTap={{ scale: 0.97 }}
          className="relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer group"
        >
          <img
            src={planRecipesImg}
            alt="Receitas"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="text-base font-bold text-white leading-tight">Receitas</h3>
            <p className="text-[11px] text-gray-300 mt-0.5">{fitnessRecipes.length} receitas internacionais</p>
          </div>
        </motion.div>
      }
    />
  );
};

// Favorites card wrapper
const FavoritesCardWrapper = ({ index, totalFavorites }: { index: number; totalFavorites: number }) => {
  return (
    <FavoritesView
      customTrigger={
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          whileTap={{ scale: 0.97 }}
          className="relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer group bg-gradient-to-br from-rose-950/80 to-zinc-900"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="flex items-center justify-center pt-8">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/30 flex items-center justify-center">
              <Heart className="w-7 h-7 text-rose-400" fill="currentColor" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="text-base font-bold text-white leading-tight">Favoritos</h3>
            <p className="text-[11px] text-gray-300 mt-0.5">{totalFavorites} itens guardados</p>
          </div>
        </motion.div>
      }
    />
  );
};
