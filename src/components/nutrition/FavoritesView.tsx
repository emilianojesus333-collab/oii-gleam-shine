import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, ChefHat, Apple, Clock, Flame, Trash2, X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useFavorites } from '@/hooks/useFavorites';
import { FitnessRecipe } from '@/data/fitnessRecipes';

export const FavoritesView = () => {
  const { favorites, removeFoodFavorite, removeRecipeFavorite, totalFavorites } = useFavorites();
  const [selectedRecipe, setSelectedRecipe] = useState<FitnessRecipe | null>(null);

  const difficultyColors = {
    easy: 'bg-emerald-500/20 text-emerald-400',
    medium: 'bg-amber-500/20 text-amber-400',
    hard: 'bg-rose-500/20 text-rose-400',
  };

  const difficultyLabels = { easy: 'Fácil', medium: 'Médio', hard: 'Difícil' };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/20 via-pink-500/15 to-purple-500/20 border border-rose-500/30 cursor-pointer relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-purple-500/5 animate-pulse" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/30 to-pink-500/30 flex items-center justify-center">
                <Heart className="w-6 h-6 text-rose-400" fill="currentColor" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Favoritos</h3>
                <p className="text-xs text-rose-300/70">{totalFavorites} itens guardados</p>
              </div>
            </div>
            {totalFavorites > 0 && (
              <div className="w-8 h-8 rounded-full bg-rose-500/30 flex items-center justify-center">
                <span className="text-sm font-bold text-rose-300">{totalFavorites}</span>
              </div>
            )}
          </div>
        </motion.div>
      </SheetTrigger>

      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl bg-gradient-to-b from-card to-background">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-400" fill="currentColor" />
            Favoritos
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="foods" className="w-full">
          <TabsList className="w-full bg-muted/50">
            <TabsTrigger value="foods" className="flex-1 gap-2">
              <Apple className="w-4 h-4" />
              Alimentos ({favorites.foods.length})
            </TabsTrigger>
            <TabsTrigger value="recipes" className="flex-1 gap-2">
              <ChefHat className="w-4 h-4" />
              Receitas ({favorites.recipes.length})
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(90vh-160px)] mt-4">
            <TabsContent value="foods" className="space-y-3 pr-2 mt-0">
              {favorites.foods.length === 0 ? (
                <div className="text-center py-12">
                  <Apple className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground">Ainda não tens alimentos favoritos</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Adiciona alimentos usando o scanner IA</p>
                </div>
              ) : (
                favorites.foods.map((food) => (
                  <motion.div
                    key={food.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center gap-3 p-4 bg-card/50 rounded-xl border border-border/50"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <Apple className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{food.name}</h4>
                      <p className="text-xs text-muted-foreground">{food.portion}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span className="text-emerald-400">{food.calories} kcal</span>
                        <span className="text-rose-400">{food.protein}g prot</span>
                        <span className="text-amber-400">{food.carbs}g carbs</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/20"
                      onClick={() => removeFoodFavorite(food.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))
              )}
            </TabsContent>

            <TabsContent value="recipes" className="space-y-3 pr-2 mt-0">
              <AnimatePresence mode="popLayout">
                {selectedRecipe ? (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <Button variant="ghost" size="sm" onClick={() => setSelectedRecipe(null)}>
                      <X className="w-4 h-4 mr-2" /> Voltar
                    </Button>

                    <div className="text-center">
                      <span className="text-5xl">{selectedRecipe.imageEmoji}</span>
                      <h2 className="text-xl font-bold mt-2">{selectedRecipe.name}</h2>
                      <p className="text-sm text-muted-foreground">{selectedRecipe.cuisine}</p>
                    </div>

                    <div className="flex justify-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {selectedRecipe.prepTime + selectedRecipe.cookTime}min
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {selectedRecipe.servings} porções
                      </div>
                      <Badge className={difficultyColors[selectedRecipe.difficulty]}>
                        {difficultyLabels[selectedRecipe.difficulty]}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-4 gap-2 p-3 bg-card rounded-xl">
                      <div className="text-center">
                        <p className="text-lg font-bold text-emerald-400">{Math.round(selectedRecipe.totalMacros.calories / selectedRecipe.servings)}</p>
                        <p className="text-xs text-muted-foreground">kcal</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-rose-400">{Math.round(selectedRecipe.totalMacros.protein / selectedRecipe.servings)}g</p>
                        <p className="text-xs text-muted-foreground">Proteína</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-amber-400">{Math.round(selectedRecipe.totalMacros.carbs / selectedRecipe.servings)}g</p>
                        <p className="text-xs text-muted-foreground">Carbs</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-sky-400">{Math.round(selectedRecipe.totalMacros.fat / selectedRecipe.servings)}g</p>
                        <p className="text-xs text-muted-foreground">Gordura</p>
                      </div>
                    </div>

                    <Tabs defaultValue="ingredients">
                      <TabsList className="w-full">
                        <TabsTrigger value="ingredients" className="flex-1">Ingredientes</TabsTrigger>
                        <TabsTrigger value="steps" className="flex-1">Passos</TabsTrigger>
                      </TabsList>
                      <TabsContent value="ingredients" className="space-y-2 mt-3">
                        {selectedRecipe.ingredients.map((ing, i) => (
                          <div key={i} className="flex justify-between p-2 bg-card/50 rounded-lg text-sm">
                            <span>{ing.name}</span>
                            <span className="text-muted-foreground">{ing.amount}</span>
                          </div>
                        ))}
                      </TabsContent>
                      <TabsContent value="steps" className="space-y-3 mt-3">
                        {selectedRecipe.steps.map((step, i) => (
                          <div key={i} className="flex gap-3 text-sm">
                            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold">
                              {i + 1}
                            </span>
                            <p>{step}</p>
                          </div>
                        ))}
                      </TabsContent>
                    </Tabs>
                  </motion.div>
                ) : favorites.recipes.length === 0 ? (
                  <div className="text-center py-12">
                    <ChefHat className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-muted-foreground">Ainda não tens receitas favoritas</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Explora as receitas fitness e guarda as tuas preferidas</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {favorites.recipes.map((recipe) => (
                      <motion.div
                        key={recipe.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-center gap-3 p-3 bg-card/50 rounded-xl border border-border/50"
                      >
                        <span 
                          className="text-3xl cursor-pointer" 
                          onClick={() => setSelectedRecipe(recipe)}
                        >
                          {recipe.imageEmoji}
                        </span>
                        <div 
                          className="flex-1 min-w-0 cursor-pointer" 
                          onClick={() => setSelectedRecipe(recipe)}
                        >
                          <h4 className="font-medium truncate">{recipe.name}</h4>
                          <p className="text-xs text-muted-foreground">{recipe.cuisine}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {recipe.prepTime + recipe.cookTime}min
                            </span>
                            <span className="text-xs flex items-center gap-1">
                              <Flame className="w-3 h-3" />
                              {Math.round(recipe.totalMacros.calories / recipe.servings)} kcal
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/20"
                          onClick={() => removeRecipeFavorite(recipe.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
