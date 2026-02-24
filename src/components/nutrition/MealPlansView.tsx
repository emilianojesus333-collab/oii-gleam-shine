import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  TrendingDown,
  TrendingUp,
  Scale,
  ChevronRight,
  Clock,
  Utensils,
  Info,
  Check,
  Sparkles } from
'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter } from
'@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { mealPlans, MealPlan, mealTypeLabelsExtended, mealTypeIconsExtended } from '@/data/mealPlans';
import { toast } from 'sonner';

interface MealPlansViewProps {
  currentGoal: 'cut' | 'maintain' | 'bulk';
  onApplyPlan?: (plan: MealPlan) => void;
}

const goalConfig = {
  cut: {
    icon: TrendingDown,
    label: 'Definição',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    gradient: 'from-blue-500/10 to-cyan-500/10'
  },
  maintain: {
    icon: Scale,
    label: 'Manutenção',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    gradient: 'from-green-500/10 to-emerald-500/10'
  },
  bulk: {
    icon: TrendingUp,
    label: 'Volume',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    gradient: 'from-orange-500/10 to-red-500/10'
  }
};

export const MealPlansView = ({ currentGoal, onApplyPlan }: MealPlansViewProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);

  const handleSelectPlan = (plan: MealPlan) => {
    setSelectedPlan(plan);
    setSelectedDay(0);
  };

  const handleApplyPlan = () => {
    if (selectedPlan && onApplyPlan) {
      onApplyPlan(selectedPlan);
      toast.success(`Plano "${selectedPlan.name}" aplicado!`, {
        description: 'As tuas metas foram atualizadas.'
      });
      setIsOpen(false);
      setSelectedPlan(null);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => {setIsOpen(open);if (!open) setSelectedPlan(null);}}>
      <DrawerTrigger asChild className="mx-[3px] my-[4px]">
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">

          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium">Planos Alimentares</p>
            <p className="text-xs text-muted-foreground">Cut, Manutenção ou Bulk</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </motion.button>
      </DrawerTrigger>

      <DrawerContent className="max-h-[90vh] bg-zinc-900 border-white/10">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2 text-white">
            <Utensils className="w-5 h-5" />
            {selectedPlan ? selectedPlan.name : 'Planos Alimentares'}
          </DrawerTitle>
        </DrawerHeader>

        <ScrollArea className="flex-1 max-h-[60vh]" type="scroll">
          <div className="px-4 pb-6 space-y-4">
            <AnimatePresence mode="wait">
              {!selectedPlan ?
              <motion.div
                key="plans-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3">

                  {mealPlans && mealPlans.length > 0 ?
                mealPlans.map((plan) => {
                  const config = goalConfig[plan.goal];
                  const Icon = config.icon;
                  const isCurrentGoal = plan.goal === currentGoal;

                  return (
                    <motion.button
                      key={plan.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectPlan(plan)}
                      className={`w-full p-4 rounded-2xl text-left transition-all border ${
                      isCurrentGoal ?
                      `bg-gradient-to-r ${config.gradient} ${config.border}` :
                      'bg-card/50 border-border/50 hover:bg-card'}`
                      }>

                          <div className="flex items-start gap-3">
                            <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center`}>
                              <Icon className={`w-6 h-6 ${config.color}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-white">{plan.name}</h3>
                                {isCurrentGoal &&
                            <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                                    Atual
                                  </span>
                            }
                              </div>
                              <p className="text-sm text-gray-400 mt-0.5">{plan.description}</p>
                              <div className="flex gap-3 mt-2 text-xs text-gray-400">
                                <span>{plan.calorieRange.min}-{plan.calorieRange.max} kcal</span>
                                <span>•</span>
                                <span>{plan.proteinPerKg}g/kg proteína</span>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground mt-3" />
                          </div>
                        </motion.button>);

                }) :

                <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">Nenhum plano disponível</p>
                    </div>
                }

                  {/* Info card */}
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="text-xs text-muted-foreground">
                        <p>Os planos são sugestões baseadas nos teus objetivos. Adapta as porções ao teu peso e nível de atividade.</p>
                      </div>
                    </div>
                  </div>
                </motion.div> :

              <motion.div
                key="plan-detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4">

                  {/* Back button */}
                  <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPlan(null)}
                  className="mb-2">

                    ← Voltar aos planos
                  </Button>

                  {/* Plan summary */}
                  <div className={`p-4 rounded-2xl bg-gradient-to-r ${goalConfig[selectedPlan.goal].gradient} border ${goalConfig[selectedPlan.goal].border}`}>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-xl font-bold">{selectedPlan.calorieRange.min}-{selectedPlan.calorieRange.max}</p>
                        <p className="text-xs text-muted-foreground">kcal/dia</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold">{selectedPlan.proteinPerKg}g</p>
                        <p className="text-xs text-muted-foreground">proteína/kg</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold">{selectedPlan.days[0].meals.length}</p>
                        <p className="text-xs text-muted-foreground">refeições</p>
                      </div>
                    </div>
                  </div>

                  {/* Day selector */}
                  <div className="flex gap-2">
                    {selectedPlan.days.map((day, index) =>
                  <button
                    key={index}
                    onClick={() => setSelectedDay(index)}
                    className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                    selectedDay === index ?
                    'bg-primary text-primary-foreground' :
                    'bg-muted/30 text-muted-foreground'}`
                    }>

                        {day.isTrainingDay ? '🏋️ Treino' : '😴 Descanso'}
                      </button>
                  )}
                  </div>

                  {/* Day totals */}
                  <div className="p-3 rounded-xl bg-card/50 border border-border/50">
                    <div className="grid grid-cols-4 gap-2 text-center text-sm">
                      <div className="min-w-0">
                        <p className="font-bold truncate">{Math.round(selectedPlan.days[selectedDay].totals.calories)}</p>
                        <p className="text-xs text-muted-foreground">kcal</p>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-red-500 truncate">{Math.round(selectedPlan.days[selectedDay].totals.protein)}g</p>
                        <p className="text-xs text-muted-foreground">Prot</p>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-yellow-500 truncate">{Math.round(selectedPlan.days[selectedDay].totals.carbs)}g</p>
                        <p className="text-xs text-muted-foreground">Carbs</p>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-blue-500 truncate">{Math.round(selectedPlan.days[selectedDay].totals.fat)}g</p>
                        <p className="text-xs text-muted-foreground">Gord</p>
                      </div>
                    </div>
                  </div>

                  {/* Meals list */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Refeições</h4>
                    {selectedPlan.days[selectedDay].meals.map((meal, index) => {
                    const mealTotals = meal.foods.reduce((acc, f) => ({
                      calories: acc.calories + f.calories,
                      protein: acc.protein + f.protein
                    }), { calories: 0, protein: 0 });

                    return (
                      <div key={index} className="p-3 rounded-xl bg-card/50 border border-border/50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span>{mealTypeIconsExtended[meal.type] || '🍽️'}</span>
                              <span className="font-medium text-sm">{meal.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {meal.time}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {meal.foods.map((food, i) =>
                          <span key={i} className="px-2 py-0.5 rounded-full bg-muted/50 text-xs">
                                {food.name}
                              </span>
                          )}
                          </div>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span>{Math.round(mealTotals.calories)} kcal</span>
                            <span>P: {Math.round(mealTotals.protein)}g</span>
                          </div>
                        </div>);

                  })}
                  </div>

                  {/* Tips */}
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Dicas para {goalConfig[selectedPlan.goal].label}
                    </h4>
                    <ul className="space-y-1">
                      {selectedPlan.tips.map((tip, index) =>
                    <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                          <Check className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                          {tip}
                        </li>
                    )}
                    </ul>
                  </div>
                </motion.div>
              }
            </AnimatePresence>
          </div>
        </ScrollArea>

        {selectedPlan &&
        <DrawerFooter>
            <Button onClick={handleApplyPlan} className="w-full">
              <Check className="w-4 h-4 mr-2" />
              Aplicar este plano
            </Button>
          </DrawerFooter>
        }
      </DrawerContent>
    </Drawer>);

};