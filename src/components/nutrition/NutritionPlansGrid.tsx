import { useState } from 'react';
import { motion } from 'framer-motion';
import { mealPlans, MealPlan } from '@/data/mealPlans';
import { MealPlansView } from './MealPlansView';

import planCutImg from '@/assets/plan-cut.jpg';
import planLowcarbImg from '@/assets/plan-lowcarb.jpg';
import planMaintainImg from '@/assets/plan-maintain.jpg';
import planVegetarianImg from '@/assets/plan-vegetarian.jpg';

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
      </div>
    </div>
  );
};

const PlanCardTrigger = ({ card, index, currentGoal, onApplyPlan }: {
  card: typeof planCards[0];
  index: number;
  currentGoal: 'cut' | 'maintain' | 'bulk';
  onApplyPlan?: (plan: MealPlan) => void;
}) => {
  const [open, setOpen] = useState(false);

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
          className="relative aspect-[4/5] rounded-none overflow-hidden cursor-pointer group"
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
