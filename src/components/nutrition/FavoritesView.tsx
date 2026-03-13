import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Apple, Clock, Flame, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppModal } from '@/components/ui/app-modal';
import { useFavorites } from '@/hooks/useFavorites';
import { FitnessRecipe, categoryLabels } from '@/data/fitnessRecipes';

interface FavoritesViewProps {
  customTrigger?: React.ReactNode;
}

export const FavoritesView = ({ customTrigger }: FavoritesViewProps = {}) => {
  const [open, setOpen] = useState(false);
  const { favorites, removeFoodFavorite, removeRecipeFavorite, totalFavorites } = useFavorites();
  const [selectedRecipe, setSelectedRecipe] = useState<FitnessRecipe | null>(null);

  const trigger = customTrigger || (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white text-sm">Favoritos</h3>
          <p className="text-xs text-muted-foreground">{totalFavorites} itens</p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <AppModal
        open={open}
        onOpenChange={(v) => { setOpen(v); if (!v) setSelectedRecipe(null); }}
        title="Favoritos"
      >
        <Tabs defaultValue="foods" className="space-y-3">
          <TabsList className="w-full h-8 bg-muted/50">
            <TabsTrigger value="foods" className="flex-1 text-xs">
              Alimentos ({favorites.foods.length})
            </TabsTrigger>
            <TabsTrigger value="recipes" className="flex-1 text-xs">
              Receitas ({favorites.recipes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="foods" className="space-y-1.5 mt-0">
            {favorites.foods.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Sem alimentos favoritos</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Usa o scanner IA para adicionar</p>
              </div>
            ) : (
              favorites.foods.map((food) => (
                <div
                  key={food.id}
                  className="flex items-center gap-2.5 py-2.5 px-3 bg-white/[0.03] rounded-lg border border-white/[0.06]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-white truncate leading-tight">{food.name}</p>
                    <p className="text-[12px] text-muted-foreground/80 mt-0.5">
                      {food.portion} · {food.calories} kcal · {food.protein}g prot
                    </p>
                  </div>
                  <button
                    className="shrink-0 p-1 text-rose-400/60 hover:text-rose-400"
                    onClick={() => removeFoodFavorite(food.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="recipes" className="space-y-1.5 mt-0">
            <AnimatePresence mode="popLayout">
              {selectedRecipe ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3"
                >
                  <Button variant="ghost" size="sm" onClick={() => setSelectedRecipe(null)} className="text-xs h-7 px-2">
                    ← Voltar
                  </Button>
                  <div className="text-center">
                    <h2 className="text-base font-semibold text-white">{selectedRecipe.name}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{categoryLabels[selectedRecipe.category]}</p>
                  </div>
                  <div className="grid grid-cols-4 gap-2 p-2.5 bg-white/5 rounded-xl border border-white/10 text-center">
                    <div><p className="text-sm font-bold text-emerald-400">{selectedRecipe.calories}</p><p className="text-[11px] text-muted-foreground">kcal</p></div>
                    <div><p className="text-sm font-bold text-rose-400">{selectedRecipe.protein}g</p><p className="text-[11px] text-muted-foreground">Prot</p></div>
                    <div><p className="text-sm font-bold text-amber-400">{selectedRecipe.carbs}g</p><p className="text-[11px] text-muted-foreground">Carbs</p></div>
                    <div><p className="text-sm font-bold text-sky-400">{selectedRecipe.fat}g</p><p className="text-[11px] text-muted-foreground">Gord</p></div>
                  </div>
                  <Tabs defaultValue="ingredients">
                    <TabsList className="w-full h-8">
                      <TabsTrigger value="ingredients" className="flex-1 text-xs">Ingredientes</TabsTrigger>
                      <TabsTrigger value="steps" className="flex-1 text-xs">Passos</TabsTrigger>
                    </TabsList>
                    <TabsContent value="ingredients" className="space-y-1 mt-2">
                      {selectedRecipe.ingredients.map((ing, i) => (
                        <div key={i} className="py-1.5 px-2.5 bg-white/5 rounded-lg text-xs border border-white/10 text-white">{ing}</div>
                      ))}
                    </TabsContent>
                    <TabsContent value="steps" className="space-y-2 mt-2">
                      {selectedRecipe.instructions.map((step, i) => (
                        <div key={i} className="flex gap-2 text-xs">
                          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-[10px] font-bold">{i + 1}</span>
                          <p className="text-gray-300">{step}</p>
                        </div>
                      ))}
                    </TabsContent>
                  </Tabs>
                  {selectedRecipe.tips && (
                    <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
                      <p className="text-xs text-muted-foreground">{selectedRecipe.tips}</p>
                    </div>
                  )}
                </motion.div>
              ) : favorites.recipes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Sem receitas favoritas</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Explora as receitas fitness</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {favorites.recipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      className="flex items-center gap-2.5 py-2.5 px-3 bg-white/[0.03] rounded-lg border border-white/[0.06] cursor-pointer hover:bg-white/[0.06] transition-colors"
                    >
                      <div className="flex-1 min-w-0" onClick={() => setSelectedRecipe(recipe)}>
                        <p className="text-[14px] font-semibold text-white truncate leading-tight">{recipe.name}</p>
                        <p className="text-[12px] text-muted-foreground/80 mt-0.5">
                          {categoryLabels[recipe.category]} · {recipe.prepTime} · {recipe.calories} kcal
                        </p>
                      </div>
                      <button
                        className="shrink-0 p-1 text-rose-400/60 hover:text-rose-400"
                        onClick={() => removeRecipeFavorite(recipe.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </AppModal>
    </>
  );
};
