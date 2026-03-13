import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Clock, Search, Flame, X, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppModal } from '@/components/ui/app-modal';
import { fitnessRecipes, FitnessRecipe, categoryLabels, searchRecipes, getRecipesByCategory } from '@/data/fitnessRecipes';
import { useFavorites } from '@/hooks/useFavorites';

interface RecipesViewProps {
  customTrigger?: React.ReactNode;
}

export const RecipesView = ({ customTrigger }: RecipesViewProps = {}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<FitnessRecipe | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const { isRecipeFavorite, toggleRecipeFavorite } = useFavorites();

  const filteredRecipes = searchQuery
    ? searchRecipes(searchQuery)
    : activeCategory === 'all'
    ? fitnessRecipes
    : getRecipesByCategory(activeCategory as FitnessRecipe['category']);

  const trigger = customTrigger || (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white text-sm">Receitas Fitness</h3>
          <p className="text-xs text-muted-foreground">{fitnessRecipes.length} receitas</p>
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
        title="Receitas Fitness"
      >
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          <ScrollArea className="w-full whitespace-nowrap" type="scroll">
            <div className="flex gap-1.5 pb-1">
              <Badge
                variant={activeCategory === 'all' ? 'default' : 'outline'}
                className="cursor-pointer shrink-0 text-xs px-2 py-0.5"
                onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}>
                Todas
              </Badge>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <Badge
                  key={key}
                  variant={activeCategory === key ? 'default' : 'outline'}
                  className="cursor-pointer shrink-0 text-xs px-2 py-0.5"
                  onClick={() => { setActiveCategory(key); setSearchQuery(''); }}>
                  {label}
                </Badge>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="opacity-20" />
          </ScrollArea>

          <AnimatePresence mode="popLayout">
            {selectedRecipe ? (
              <RecipeDetail
                recipe={selectedRecipe}
                onBack={() => setSelectedRecipe(null)}
                isFavorite={isRecipeFavorite(selectedRecipe.id)}
                onToggleFavorite={() => toggleRecipeFavorite(selectedRecipe)}
              />
            ) : (
              <div className="space-y-1.5">
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
        </div>
      </AppModal>
    </>
  );
};

const RecipeDetail = ({
  recipe, onBack, isFavorite, onToggleFavorite,
}: {
  recipe: FitnessRecipe; onBack: () => void; isFavorite: boolean; onToggleFavorite: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-3"
  >
    <div className="flex justify-between items-center">
      <Button variant="ghost" size="sm" onClick={onBack} className="text-xs h-7 px-2">
        ← Voltar
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-7 w-7 ${isFavorite ? 'text-rose-400' : 'text-muted-foreground'}`}
        onClick={onToggleFavorite}
      >
        <Heart className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} />
      </Button>
    </div>

    <div className="text-center">
      <h2 className="text-base font-semibold text-white">{recipe.name}</h2>
      <p className="text-xs text-muted-foreground mt-0.5">{categoryLabels[recipe.category]}</p>
    </div>

    <div className="grid grid-cols-4 gap-2 p-2.5 bg-white/5 rounded-xl border border-white/10 text-center">
      <div>
        <p className="text-sm font-bold text-emerald-400">{recipe.calories}</p>
        <p className="text-[11px] text-muted-foreground">kcal</p>
      </div>
      <div>
        <p className="text-sm font-bold text-rose-400">{recipe.protein}g</p>
        <p className="text-[11px] text-muted-foreground">Prot</p>
      </div>
      <div>
        <p className="text-sm font-bold text-amber-400">{recipe.carbs}g</p>
        <p className="text-[11px] text-muted-foreground">Carbs</p>
      </div>
      <div>
        <p className="text-sm font-bold text-sky-400">{recipe.fat}g</p>
        <p className="text-[11px] text-muted-foreground">Gord</p>
      </div>
    </div>

    <Tabs defaultValue="ingredients">
      <TabsList className="w-full h-8">
        <TabsTrigger value="ingredients" className="flex-1 text-xs">Ingredientes</TabsTrigger>
        <TabsTrigger value="steps" className="flex-1 text-xs">Passos</TabsTrigger>
      </TabsList>
      <TabsContent value="ingredients" className="space-y-1 mt-2">
        {recipe.ingredients.map((ing, i) => (
          <div key={i} className="py-1.5 px-2.5 bg-white/5 rounded-lg text-xs border border-white/10 text-white">
            {ing}
          </div>
        ))}
      </TabsContent>
      <TabsContent value="steps" className="space-y-2 mt-2">
        {recipe.instructions.map((step, i) => (
          <div key={i} className="flex gap-2 text-xs">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-[10px] font-bold">
              {i + 1}
            </span>
            <p className="text-gray-300">{step}</p>
          </div>
        ))}
      </TabsContent>
    </Tabs>

    {recipe.tips && (
      <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
        <p className="text-xs text-muted-foreground">{recipe.tips}</p>
      </div>
    )}
  </motion.div>
);

const RecipeListItem = ({
  recipe, isFavorite, onSelect, onToggleFavorite,
}: {
  recipe: FitnessRecipe; isFavorite: boolean; onSelect: () => void; onToggleFavorite: () => void;
}) => (
  <div
    className="flex items-center gap-2.5 py-2.5 px-3 bg-white/[0.03] rounded-lg border border-white/[0.06] cursor-pointer hover:bg-white/[0.06] transition-colors"
  >
    <div className="flex-1 min-w-0" onClick={onSelect}>
      <p className="text-[14px] font-semibold text-white truncate leading-tight">{recipe.name}</p>
      <p className="text-[12px] text-muted-foreground/80 mt-0.5">
        {categoryLabels[recipe.category]} · {recipe.prepTime} · {recipe.calories} kcal · {recipe.protein}g prot
      </p>
    </div>
    <button
      className={`shrink-0 p-1 ${isFavorite ? 'text-rose-400' : 'text-muted-foreground/40'}`}
      onClick={onToggleFavorite}
    >
      <Heart className="w-3.5 h-3.5" fill={isFavorite ? 'currentColor' : 'none'} />
    </button>
  </div>
);
