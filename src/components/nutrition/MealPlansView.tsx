import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingDown, TrendingUp, Scale,
  ChevronRight, Clock, Info, Check, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppModal } from '@/components/ui/app-modal';
import { mealPlans, MealPlan, mealTypeIconsExtended } from '@/data/mealPlans';
import { toast } from 'sonner';

interface MealPlansViewProps {
  currentGoal: 'cut' | 'maintain' | 'bulk';
  onApplyPlan?: (plan: MealPlan) => void;
  preSelectedPlanId?: string;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
  customTrigger?: React.ReactNode;
}

const goalConfig = {
  cut: { label: 'Definição', border: 'border-blue-500/20', gradient: 'from-blue-500/10 to-cyan-500/10' },
  maintain: { label: 'Manutenção', border: 'border-green-500/20', gradient: 'from-green-500/10 to-emerald-500/10' },
  bulk: { label: 'Volume', border: 'border-orange-500/20', gradient: 'from-orange-500/10 to-red-500/10' },
};

export const MealPlansView = ({ currentGoal, onApplyPlan, preSelectedPlanId, externalOpen, onExternalOpenChange, customTrigger }: MealPlansViewProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = (open: boolean) => {
    if (onExternalOpenChange) onExternalOpenChange(open);
    else setInternalOpen(open);
  };
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (!open) setSelectedPlan(null);
    else if (preSelectedPlanId) {
      const p = mealPlans.find(mp => mp.id === preSelectedPlanId);
      if (p) { setSelectedPlan(p); setSelectedDay(0); }
    }
  };

  const handleApplyPlan = () => {
    if (selectedPlan && onApplyPlan) {
      onApplyPlan(selectedPlan);
      toast.success(`Plano "${selectedPlan.name}" aplicado!`, { description: 'As tuas metas foram atualizadas.' });
      setIsOpen(false);
      setSelectedPlan(null);
    }
  };

  const trigger = customTrigger || (
    <motion.button whileTap={{ scale: 0.95 }} className="w-full p-3 rounded-none text-left mb-2" style={{ borderLeft: "2px solid #3B82F6" }}>
      <p className="font-semibold text-white text-sm">Planos Alimentares</p>
      <p className="text-xs text-muted-foreground">Cut, Manutenção ou Bulk</p>
    </motion.button>
  );

  return (
    <>
      <div onClick={() => handleOpen(true)}>{trigger}</div>
      <AppModal
        open={isOpen}
        onOpenChange={handleOpen}
        title={selectedPlan ? selectedPlan.name : 'Planos Alimentares'}
      >
        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {!selectedPlan ? (
              <motion.div key="plans-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-1.5">
                {mealPlans && mealPlans.length > 0 ? mealPlans.map((plan) => {
                  const config = goalConfig[plan.goal];
                  const isCurrentGoal = plan.goal === currentGoal;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => { setSelectedPlan(plan); setSelectedDay(0); }}
                      className={`py-2.5 px-3 rounded-lg cursor-pointer transition-colors border ${
                        isCurrentGoal
                          ? `bg-gradient-to-r ${config.gradient} ${config.border}`
                          : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[14px] font-semibold text-white">{plan.name}</p>
                            {isCurrentGoal && <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-medium">Atual</span>}
                          </div>
                          <p className="text-[12px] text-muted-foreground/80 mt-0.5">
                            {plan.calorieRange.min}-{plan.calorieRange.max} kcal · {plan.proteinPerKg}g/kg prot
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">Nenhum plano disponível</p>
                  </div>
                )}
                <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                  <p className="text-[11px] text-muted-foreground">Os planos são sugestões. Adapta as porções ao teu peso e nível de atividade.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div key="plan-detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <Button variant="ghost" size="sm" onClick={() => setSelectedPlan(null)} className="text-xs h-7 px-2">
                  ← Voltar
                </Button>

                <div className={`p-3 rounded-xl bg-gradient-to-r ${goalConfig[selectedPlan.goal].gradient} border ${goalConfig[selectedPlan.goal].border}`}>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div><p className="text-base font-bold">{selectedPlan.calorieRange.min}-{selectedPlan.calorieRange.max}</p><p className="text-[11px] text-muted-foreground">kcal/dia</p></div>
                    <div><p className="text-base font-bold">{selectedPlan.proteinPerKg}g</p><p className="text-[11px] text-muted-foreground">prot/kg</p></div>
                    <div><p className="text-base font-bold">{selectedPlan.days[0].meals.length}</p><p className="text-[11px] text-muted-foreground">refeições</p></div>
                  </div>
                </div>

                <div className="flex gap-1.5">
                  {selectedPlan.days.map((day, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedDay(index)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                        selectedDay === index ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground'
                      }`}
                    >
                      {day.isTrainingDay ? '🏋️ Treino' : '😴 Descanso'}
                    </button>
                  ))}
                </div>

                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div><p className="font-bold">{Math.round(selectedPlan.days[selectedDay].totals.calories)}</p><p className="text-[10px] text-muted-foreground">kcal</p></div>
                    <div><p className="font-bold text-rose-400">{Math.round(selectedPlan.days[selectedDay].totals.protein)}g</p><p className="text-[10px] text-muted-foreground">Prot</p></div>
                    <div><p className="font-bold text-amber-400">{Math.round(selectedPlan.days[selectedDay].totals.carbs)}g</p><p className="text-[10px] text-muted-foreground">Carbs</p></div>
                    <div><p className="font-bold text-sky-400">{Math.round(selectedPlan.days[selectedDay].totals.fat)}g</p><p className="text-[10px] text-muted-foreground">Gord</p></div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-xs font-medium text-muted-foreground">Refeições</h4>
                  {selectedPlan.days[selectedDay].meals.map((meal, index) => {
                    const mealTotals = meal.foods.reduce((acc, f) => ({ calories: acc.calories + f.calories, protein: acc.protein + f.protein }), { calories: 0, protein: 0 });
                    return (
                      <div key={index} className="py-2 px-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                        <div className="flex items-center justify-between">
                          <p className="text-[13px] font-medium text-white">{meal.name}</p>
                          <p className="text-[11px] text-muted-foreground">{meal.time}</p>
                        </div>
                        <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                          {meal.foods.map(f => f.name).join(', ')}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {Math.round(mealTotals.calories)} kcal · {Math.round(mealTotals.protein)}g prot
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <h4 className="text-xs font-medium flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Dicas para {goalConfig[selectedPlan.goal].label}
                  </h4>
                  <ul className="space-y-0.5">
                    {selectedPlan.tips.map((tip, index) => (
                      <li key={index} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                        <Check className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />{tip}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button onClick={handleApplyPlan} className="w-full h-9 text-sm">
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Aplicar este plano
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </AppModal>
    </>
  );
};
