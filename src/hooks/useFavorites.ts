import { useState, useCallback, useEffect } from 'react';
import { FoodDatabaseItem } from '@/data/foodDatabase';
import { useAuth } from './useAuth';

export interface FavoritesState {
  foods: FoodDatabaseItem[];
}

const STORAGE_KEY_PREFIX = 'liftmate_favorites_';

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoritesState>({ foods: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setFavorites({ foods: [] });
      setIsLoading(false);
      return;
    }

    try {
      const userKey = `${STORAGE_KEY_PREFIX}${user.id}`;
      const saved = localStorage.getItem(userKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFavorites({ foods: parsed.foods || [] });
      } else {
        setFavorites({ foods: [] });
      }
    } catch (e) {
      console.error('Error loading favorites:', e);
      setFavorites({ foods: [] });
    }
    setIsLoading(false);
  }, [user]);

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

  const isFoodFavorite = useCallback((foodId: string) => {
    return favorites.foods.some(f => f.id === foodId);
  }, [favorites.foods]);

  const toggleFoodFavorite = useCallback((food: FoodDatabaseItem) => {
    if (isFoodFavorite(food.id)) {
      removeFoodFavorite(food.id);
    } else {
      addFoodFavorite(food);
    }
  }, [isFoodFavorite, removeFoodFavorite, addFoodFavorite]);

  return {
    favorites,
    isLoading,
    addFoodFavorite,
    removeFoodFavorite,
    isFoodFavorite,
    toggleFoodFavorite,
    totalFavorites: favorites.foods.length,
  };
};
