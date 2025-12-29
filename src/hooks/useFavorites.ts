import { useState, useCallback, useEffect } from 'react';
import { FoodDatabaseItem } from '@/data/foodDatabase';
import { FitnessRecipe } from '@/data/fitnessRecipes';

export interface FavoritesState {
  foods: FoodDatabaseItem[];
  recipes: FitnessRecipe[];
}

const STORAGE_KEY = 'liftmate_favorites';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoritesState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading favorites:', e);
    }
    return { foods: [], recipes: [] };
  });

  // Save to localStorage whenever favorites change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const addFoodFavorite = useCallback((food: FoodDatabaseItem) => {
    setFavorites(prev => {
      const exists = prev.foods.some(f => f.id === food.id);
      if (exists) return prev;
      return { ...prev, foods: [...prev.foods, food] };
    });
  }, []);

  const removeFoodFavorite = useCallback((foodId: string) => {
    setFavorites(prev => ({
      ...prev,
      foods: prev.foods.filter(f => f.id !== foodId),
    }));
  }, []);

  const addRecipeFavorite = useCallback((recipe: FitnessRecipe) => {
    setFavorites(prev => {
      const exists = prev.recipes.some(r => r.id === recipe.id);
      if (exists) return prev;
      return { ...prev, recipes: [...prev.recipes, recipe] };
    });
  }, []);

  const removeRecipeFavorite = useCallback((recipeId: string) => {
    setFavorites(prev => ({
      ...prev,
      recipes: prev.recipes.filter(r => r.id !== recipeId),
    }));
  }, []);

  const isFoodFavorite = useCallback((foodId: string) => {
    return favorites.foods.some(f => f.id === foodId);
  }, [favorites.foods]);

  const isRecipeFavorite = useCallback((recipeId: string) => {
    return favorites.recipes.some(r => r.id === recipeId);
  }, [favorites.recipes]);

  const toggleFoodFavorite = useCallback((food: FoodDatabaseItem) => {
    if (isFoodFavorite(food.id)) {
      removeFoodFavorite(food.id);
    } else {
      addFoodFavorite(food);
    }
  }, [isFoodFavorite, removeFoodFavorite, addFoodFavorite]);

  const toggleRecipeFavorite = useCallback((recipe: FitnessRecipe) => {
    if (isRecipeFavorite(recipe.id)) {
      removeRecipeFavorite(recipe.id);
    } else {
      addRecipeFavorite(recipe);
    }
  }, [isRecipeFavorite, removeRecipeFavorite, addRecipeFavorite]);

  return {
    favorites,
    addFoodFavorite,
    removeFoodFavorite,
    addRecipeFavorite,
    removeRecipeFavorite,
    isFoodFavorite,
    isRecipeFavorite,
    toggleFoodFavorite,
    toggleRecipeFavorite,
    totalFavorites: favorites.foods.length + favorites.recipes.length,
  };
};
