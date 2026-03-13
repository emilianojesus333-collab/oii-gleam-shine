import { useState, useCallback, useEffect } from 'react';
import { FoodDatabaseItem } from '@/data/foodDatabase';
import { FitnessRecipe } from '@/data/fitnessRecipes';
import { useAuth } from './useAuth';

export interface FavoritesState {
  foods: FoodDatabaseItem[];
  recipes: FitnessRecipe[];
}

const STORAGE_KEY_PREFIX = 'liftmate_favorites_';

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoritesState>({ foods: [], recipes: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites from user-specific localStorage key
  useEffect(() => {
    if (!user) {
      setFavorites({ foods: [], recipes: [] });
      setIsLoading(false);
      return;
    }

    try {
      const userKey = `${STORAGE_KEY_PREFIX}${user.id}`;
      const saved = localStorage.getItem(userKey);
      if (saved) {
        setFavorites(JSON.parse(saved));
      } else {
        setFavorites({ foods: [], recipes: [] });
      }
    } catch (e) {
      console.error('Error loading favorites:', e);
      setFavorites({ foods: [], recipes: [] });
    }
    setIsLoading(false);
  }, [user]);

  // Save to user-specific localStorage key whenever favorites change
  useEffect(() => {
    if (!user || isLoading) return;
    
    const userKey = `${STORAGE_KEY_PREFIX}${user.id}`;
    localStorage.setItem(userKey, JSON.stringify(favorites));
  }, [favorites, user, isLoading]);

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
    isLoading,
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
