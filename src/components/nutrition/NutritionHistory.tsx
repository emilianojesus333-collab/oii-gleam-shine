import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  Calendar, 
  TrendingUp, 
  ChevronLeft, 
  ChevronRight,
  Trophy,
  Flame,
  Target
} from 'lucide-react';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerTrigger 
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DailyLog, mealTypeLabels, mealTypeIcons, MacroGoals, Achievement } from '@/hooks/useNutrition';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface NutritionHistoryProps {
  allLogs: DailyLog[];
  monthlyData: {
    date: string;
    day: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    hasMeals: boolean;
  }[];
  weeklyStats: {
    totalCalories: number;
    totalProtein: number;
    daysLogged: number;
    avgCalories: number;
    avgProtein: number;
    daysMetCalorieGoal: number;
    daysMetProteinGoal: number;
    weeklyCalorieGoal: number;
    weeklyProteinGoal: number;
  };
  goals: MacroGoals;
  achievements: Achievement[];
}

export const NutritionHistory = ({ 
  allLogs, 
  monthlyData, 
  weeklyStats, 
  goals,
  achievements 
}: NutritionHistoryProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'stats' | 'achievements'>('stats');
  const [selectedLogIndex, setSelectedLogIndex] = useState(0);

  const selectedLog = allLogs[selectedLogIndex];

  const navigateLog = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && selectedLogIndex < allLogs.length - 1) {
      setSelectedLogIndex(selectedLogIndex + 1);
    } else if (direction === 'next' && selectedLogIndex > 0) {
      setSelectedLogIndex(selectedLogIndex - 1);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-PT', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/50 border border-border/50 text-sm font-medium"
        >
          <History className="w-4 h-4" />
          Histórico
        </motion.button>
      </DrawerTrigger>

      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Histórico e Estatísticas
          </DrawerTitle>
        </DrawerHeader>

        {/* Tabs */}
        <div className="px-4 mb-4">
          <div className="flex bg-muted/50 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'stats'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              <Target className="w-4 h-4" />
              Metas
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Diário
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'achievements'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              <Trophy className="w-4 h-4" />
              Troféus
            </button>
          </div>
        </div>

        <ScrollArea className="flex-1 max-h-[65vh]">
          <div className="px-4 pb-6 space-y-4">
            <AnimatePresence mode="wait">
              {/* Stats Tab */}
              {activeTab === 'stats' && (
                <motion.div
                  key="stats"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {/* Weekly Summary */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-500" />
                      Resumo Semanal
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-background/50">
                        <p className="text-2xl font-bold">{weeklyStats.daysLogged}/7</p>
                        <p className="text-xs text-muted-foreground">Dias registados</p>
                      </div>
                      <div className="p-3 rounded-xl bg-background/50">
                        <p className="text-2xl font-bold">{weeklyStats.avgCalories}</p>
                        <p className="text-xs text-muted-foreground">Média kcal/dia</p>
                      </div>
                      <div className="p-3 rounded-xl bg-background/50">
                        <p className="text-2xl font-bold text-green-500">{weeklyStats.daysMetCalorieGoal}</p>
                        <p className="text-xs text-muted-foreground">Dias meta calorias</p>
                      </div>
                      <div className="p-3 rounded-xl bg-background/50">
                        <p className="text-2xl font-bold text-blue-500">{weeklyStats.daysMetProteinGoal}</p>
                        <p className="text-xs text-muted-foreground">Dias meta proteína</p>
                      </div>
                    </div>

                    {/* Weekly Progress Bars */}
                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Calorias semanais</span>
                          <span>{weeklyStats.totalCalories} / {weeklyStats.weeklyCalorieGoal} kcal</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all"
                            style={{ width: `${Math.min((weeklyStats.totalCalories / weeklyStats.weeklyCalorieGoal) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Proteína semanal</span>
                          <span>{weeklyStats.totalProtein} / {weeklyStats.weeklyProteinGoal}g</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-red-500 to-pink-500 rounded-full transition-all"
                            style={{ width: `${Math.min((weeklyStats.totalProtein / weeklyStats.weeklyProteinGoal) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Chart */}
                  <div className="p-4 rounded-2xl bg-card/50 border border-border/50">
                    <h3 className="font-semibold mb-3">Últimos 30 Dias</h3>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyData}>
                          <defs>
                            <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorProtein" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis 
                            dataKey="day" 
                            tick={{ fontSize: 10 }}
                            tickLine={false}
                          />
                          <YAxis hide />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              fontSize: '12px'
                            }}
                            formatter={(value: number, name: string) => [
                              name === 'calories' ? `${value} kcal` : `${value}g`,
                              name === 'calories' ? 'Calorias' : 'Proteína'
                            ]}
                          />
                          <Area
                            type="monotone"
                            dataKey="calories"
                            stroke="hsl(var(--primary))"
                            fillOpacity={1}
                            fill="url(#colorCalories)"
                          />
                          <Area
                            type="monotone"
                            dataKey="protein"
                            stroke="#ef4444"
                            fillOpacity={1}
                            fill="url(#colorProtein)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 mt-2 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <span>Calorias</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span>Proteína</span>
                      </div>
                    </div>
                  </div>

                  {/* Daily Goals */}
                  <div className="p-4 rounded-2xl bg-card/50 border border-border/50">
                    <h3 className="font-semibold mb-3">Metas Diárias</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between p-2 rounded-lg bg-muted/30">
                        <span className="text-sm">Calorias</span>
                        <span className="font-semibold">{goals.calories} kcal</span>
                      </div>
                      <div className="flex justify-between p-2 rounded-lg bg-muted/30">
                        <span className="text-sm">Proteína</span>
                        <span className="font-semibold text-red-500">{goals.protein}g</span>
                      </div>
                      <div className="flex justify-between p-2 rounded-lg bg-muted/30">
                        <span className="text-sm">Carboidratos</span>
                        <span className="font-semibold text-yellow-500">{goals.carbs}g</span>
                      </div>
                      <div className="flex justify-between p-2 rounded-lg bg-muted/30">
                        <span className="text-sm">Gordura</span>
                        <span className="font-semibold text-blue-500">{goals.fat}g</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {allLogs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Sem registos ainda</p>
                    </div>
                  ) : (
                    <>
                      {/* Date Navigator */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-card/50 border border-border/50">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigateLog('prev')}
                          disabled={selectedLogIndex >= allLogs.length - 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="text-center">
                          <p className="font-medium text-sm">
                            {selectedLog ? formatDate(selectedLog.date) : 'Sem data'}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigateLog('next')}
                          disabled={selectedLogIndex <= 0}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>

                      {selectedLog && (
                        <>
                          {/* Day Summary */}
                          <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
                            <div className="grid grid-cols-4 gap-2 text-center">
                              <div>
                                <p className="text-lg font-bold">{selectedLog.totals.calories}</p>
                                <p className="text-xs text-muted-foreground">kcal</p>
                              </div>
                              <div>
                                <p className="text-lg font-bold text-red-500">{selectedLog.totals.protein}g</p>
                                <p className="text-xs text-muted-foreground">Proteína</p>
                              </div>
                              <div>
                                <p className="text-lg font-bold text-yellow-500">{selectedLog.totals.carbs}g</p>
                                <p className="text-xs text-muted-foreground">Carbs</p>
                              </div>
                              <div>
                                <p className="text-lg font-bold text-blue-500">{selectedLog.totals.fat}g</p>
                                <p className="text-xs text-muted-foreground">Gordura</p>
                              </div>
                            </div>
                          </div>

                          {/* Meals List */}
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Refeições</h4>
                            {selectedLog.meals.map((meal) => (
                              <div 
                                key={meal.id}
                                className="p-3 rounded-xl bg-card/50 border border-border/50"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span>{mealTypeIcons[meal.type]}</span>
                                    <span className="font-medium text-sm">{mealTypeLabels[meal.type]}</span>
                                  </div>
                                  <span className="text-xs text-muted-foreground">{meal.time}</span>
                                </div>
                                <div className="flex gap-3 text-xs text-muted-foreground">
                                  <span>{meal.total.calories} kcal</span>
                                  <span>P: {meal.total.protein}g</span>
                                  <span>C: {meal.total.carbs}g</span>
                                  <span>G: {meal.total.fat}g</span>
                                </div>
                                <div className="mt-2 text-xs">
                                  {meal.foods.map((food, i) => (
                                    <span key={i} className="text-muted-foreground">
                                      {food.name}{i < meal.foods.length - 1 ? ', ' : ''}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </motion.div>
              )}

              {/* Achievements Tab */}
              {activeTab === 'achievements' && (
                <motion.div
                  key="achievements"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {achievements.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Ainda não tens troféus</p>
                      <p className="text-xs mt-1">Continua a registar as tuas refeições!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {achievements.slice().reverse().map((achievement) => (
                        <motion.div
                          key={achievement.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{achievement.icon}</span>
                            <div className="flex-1">
                              <h4 className="font-semibold">{achievement.title}</h4>
                              <p className="text-xs text-muted-foreground">{achievement.description}</p>
                              <p className="text-xs text-amber-500 mt-1">
                                {new Date(achievement.unlockedAt).toLocaleDateString('pt-PT', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Locked achievements hint */}
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                    <h4 className="font-medium text-sm mb-2">Próximos Desafios</h4>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="opacity-30">🎯</span>
                        <span>Atinge a meta de calorias por 3 dias seguidos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="opacity-30">💪</span>
                        <span>Atinge 150g de proteína num dia</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="opacity-30">🔥</span>
                        <span>Regista refeições durante 30 dias</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
};