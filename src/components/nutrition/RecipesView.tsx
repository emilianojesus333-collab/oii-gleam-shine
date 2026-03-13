import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Clock, Search, ChevronRight, Flame, X, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { fitnessRecipes, FitnessRecipe, categoryLabels, searchRecipes, getRecipesByCategory } from '@/data/fitnessRecipes';
import { useFavorites } from '@/hooks/useFavorites';

interface RecipesViewProps {
  customTrigger?: React.ReactNode;
}

export const RecipesView = ({ customTrigger }: RecipesViewProps = {}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<FitnessRecipe | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const { isRecipeFavorite, toggleRecipeFavorite } = useFavorites();

  const filteredRecipes = searchQuery
    ? searchRecipes(searchQuery)
    : activeCategory === 'all'
    ? fitnessRecipes
    : getRecipesByCategory(activeCategory as FitnessRecipe['category']);

  return (
    <Sheet>
      {customTrigger ? (
        <SheetTrigger asChild>{customTrigger}</SheetTrigger>
      ) : (
        <SheetTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/20 via-amber-500/15 to-yellow-500/20 border border-orange-500/30 cursor-pointer relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/30 to-amber-500/30 flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <ChefHat className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Receitas Fitness</h3>
                  <p className="text-xs text-orange-300/70">{fitnessRecipes.length} receitas simples</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-orange-400/70" />
            </div>
          </motion.div>
        </SheetTrigger>
      )}

      <SheetContent side="bottom" className="h-[90vh] max-h-[90vh] rounded-t-3xl bg-gradient-to-b from-zinc-900 to-black border-white/10 flex flex-col overflow-hidden">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 text-white">
            <ChefHat className="w-5 h-5 text-orange-500" />
            Receitas Fitness
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 flex flex-col min-h-0 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar receitas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="w-full whitespace-nowrap" type="scroll">
            <div className="flex gap-2 pb-2">
              <Badge
                variant={activeCategory === 'all' ? 'default' : 'outline'}
                className="cursor-pointer shrink-0"
                onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}>
                Todas
              </Badge>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <Badge
                  key={key}
                  variant={activeCategory === key ? 'default' : 'outline'}
                  className="cursor-pointer shrink-0"
                  onClick={() => { setActiveCategory(key); setSearchQuery(''); }}>
                  {label}
                </Badge>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="opacity-20" />
          </ScrollArea>

          <ScrollArea className="flex-1 min-h-0" type="scroll">
            <AnimatePresence mode="popLayout">
              {selectedRecipe ? (
                <RecipeDetail
                  recipe={selectedRecipe}
                  onBack={() => setSelectedRecipe(null)}
                  isFavorite={isRecipeFavorite(selectedRecipe.id)}
                  onToggleFavorite={() => toggleRecipeFavorite(selectedRecipe)}
                />
              ) : (
                <div className="grid gap-3 pr-2">
                  {filteredRecipes.map((recipe) => (
                    <RecipeListItem
                      key={recipe.id}
                      recipe={recipe}
                      isFavorite={isRecipeFavorite(recipe.id)}
                      onSelect={() => setSelectedRecipe(recipe)}
                      onToggleFavorite={() => toggleRecipeFavorite(recipe)}
                    />
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

// --- Subcomponents ---

const RecipeDetail = ({
  recipe,
  onBack,
  isFavorite,
  onToggleFavorite,
}: {
  recipe: FitnessRecipe;
  onBack: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-4 pr-2"
  >
    <div className="flex justify-between items-center">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <X className="w-4 h-4 mr-2" /> Voltar
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={isFavorite ? 'text-rose-400' : 'text-muted-foreground'}
        onClick={onToggleFavorite}
      >
        <Heart className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} />
      </Button>
    </div>

    <div className="text-center">
      <span className="text-5xl">{recipe.imageEmoji}</span>
      <h2 className="text-xl font-bold mt-2 text-white">{recipe.name}</h2>
      <p className="text-sm text-gray-400">{categoryLabels[recipe.category]}</p>
    </div>

    <div className="flex justify-center gap-4 text-sm text-gray-300">
      <div className="flex items-center gap-1">
        <Clock className="w-4 h-4" />
        {recipe.prepTime}
      </div>
    </div>

    <div className="grid grid-cols-4 gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
      <div className="text-center">
        <p className="text-lg font-bold text-emerald-400">{recipe.calories}</p>
        <p className="text-xs text-gray-400">kcal</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-rose-400">{recipe.protein}g</p>
        <p className="text-xs text-gray-400">Proteína</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-amber-400">{recipe.carbs}g</p>
        <p className="text-xs text-gray-400">Carbs</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-sky-400">{recipe.fat}g</p>
        <p className="text-xs text-gray-400">Gordura</p>
      </div>
    </div>

    <Tabs defaultValue="ingredients">
      <TabsList className="w-full">
        <TabsTrigger value="ingredients" className="flex-1">Ingredientes</TabsTrigger>
        <TabsTrigger value="steps" className="flex-1">Passos</TabsTrigger>
      </TabsList>
      <TabsContent value="ingredients" className="space-y-2 mt-3">
        {recipe.ingredients.map((ing, i) => (
          <div key={i} className="p-2 bg-white/5 rounded-lg text-sm border border-white/10">
            <span className="text-white">{ing}</span>
          </div>
        ))}
      </TabsContent>
      <TabsContent value="steps" className="space-y-3 mt-3">
        {recipe.instructions.map((step, i) => (
          <div key={i} className="flex gap-3 text-sm">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold">
              {i + 1}
            </span>
            <p className="text-gray-300">{step}</p>
          </div>
        ))}
      </TabsContent>
    </Tabs>

    {recipe.tips && (
      <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
        <p className="font-semibold text-sm mb-1 text-white">💡 Dica</p>
        <p className="text-xs text-gray-400">{recipe.tips}</p>
      </div>
    )}
  </motion.div>
);

const RecipeListItem = ({
  recipe,
  isFavorite,
  onSelect,
  onToggleFavorite,
}: {
  recipe: FitnessRecipe;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
  >
    <span className="text-3xl" onClick={onSelect}>{recipe.imageEmoji}</span>
    <div className="flex-1 min-w-0" onClick={onSelect}>
      <h4 className="font-medium truncate text-white">{recipe.name}</h4>
      <p className="text-xs text-gray-400">{categoryLabels[recipe.category]}</p>
      <div className="flex items-center gap-2 mt-1 text-gray-400">
        <span className="text-xs flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {recipe.prepTime}
        </span>
        <span className="text-xs flex items-center gap-1">
          <Flame className="w-3 h-3" />
          {recipe.calories} kcal
        </span>
        <span className="text-xs text-rose-400">{recipe.protein}g prot</span>
      </div>
    </div>
    <Button
      variant="ghost"
      size="icon"
      className={isFavorite ? 'text-rose-400' : 'text-gray-400 hover:text-rose-400'}
      onClick={onToggleFavorite}
    >
      <Heart className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} />
    </Button>
  </motion.div>
);
