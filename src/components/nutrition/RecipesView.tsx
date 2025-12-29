import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Clock, Users, Search, ChevronRight, Flame, X, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { fitnessRecipes, FitnessRecipe, categoryLabels, searchRecipes, getRecipesByCategory } from '@/data/fitnessRecipes';
import { useFavorites } from '@/hooks/useFavorites';

export const RecipesView = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<FitnessRecipe | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const { isRecipeFavorite, toggleRecipeFavorite } = useFavorites();

  const filteredRecipes = searchQuery 
    ? searchRecipes(searchQuery)
    : activeCategory === 'all' 
      ? fitnessRecipes 
      : getRecipesByCategory(activeCategory as FitnessRecipe['category']);

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
          className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/20 via-amber-500/15 to-yellow-500/20 border border-orange-500/30 cursor-pointer relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-amber-500/5 animate-pulse" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/30 to-amber-500/30 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <ChefHat className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Receitas Fitness</h3>
                <p className="text-xs text-orange-300/70">{fitnessRecipes.length} receitas internacionais</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-orange-400/70" />
          </div>
        </motion.div>
      </SheetTrigger>

      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-orange-500" />
            Receitas Fitness
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar receitas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              <Badge 
                variant={activeCategory === 'all' ? 'default' : 'outline'}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
              >
                Todas
              </Badge>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <Badge
                  key={key}
                  variant={activeCategory === key ? 'default' : 'outline'}
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => { setActiveCategory(key); setSearchQuery(''); }}
                >
                  {label}
                </Badge>
              ))}
            </div>
          </ScrollArea>

          <ScrollArea className="h-[calc(90vh-200px)]">
            <AnimatePresence mode="popLayout">
              {selectedRecipe ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4 pr-2"
                >
                  <div className="flex justify-between items-center">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedRecipe(null)}>
                      <X className="w-4 h-4 mr-2" /> Voltar
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={isRecipeFavorite(selectedRecipe.id) ? 'text-rose-400' : 'text-muted-foreground'}
                      onClick={() => toggleRecipeFavorite(selectedRecipe)}
                    >
                      <Heart className="w-5 h-5" fill={isRecipeFavorite(selectedRecipe.id) ? 'currentColor' : 'none'} />
                    </Button>
                  </div>

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

                  {selectedRecipe.tips.length > 0 && (
                    <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                      <p className="font-semibold text-sm mb-2">💡 Dicas</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {selectedRecipe.tips.map((tip, i) => (
                          <li key={i}>• {tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="grid gap-3 pr-2">
                  {filteredRecipes.map((recipe) => (
                    <motion.div
                      key={recipe.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-center gap-3 p-3 bg-card/50 rounded-xl border border-border/50 cursor-pointer hover:bg-card transition-colors"
                    >
                      <span className="text-3xl" onClick={() => setSelectedRecipe(recipe)}>{recipe.imageEmoji}</span>
                      <div className="flex-1 min-w-0" onClick={() => setSelectedRecipe(recipe)}>
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
                        className={isRecipeFavorite(recipe.id) ? 'text-rose-400' : 'text-muted-foreground hover:text-rose-400'}
                        onClick={() => toggleRecipeFavorite(recipe)}
                      >
                        <Heart className="w-4 h-4" fill={isRecipeFavorite(recipe.id) ? 'currentColor' : 'none'} />
                      </Button>
                      <Badge className={difficultyColors[recipe.difficulty]} variant="outline">
                        {difficultyLabels[recipe.difficulty]}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};
