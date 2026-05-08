import { supabase } from "@/integrations/supabase/client";
import type { FoodSearchResult } from "./foodSearch";

export interface CustomMealFood {
  name: string;
  brand: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface CustomMeal {
  id: string;
  name: string;
  foods: CustomMealFood[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  created_at: string;
}

export const saveCustomMeal = async (
  userId: string,
  meal: Omit<CustomMeal, "id" | "created_at">
) => {
  const { error } = await (supabase.from("custom_meals") as any).insert({
    user_id: userId,
    name: meal.name,
    foods: meal.foods,
    total_calories: meal.total_calories,
    total_protein: meal.total_protein,
    total_carbs: meal.total_carbs,
    total_fat: meal.total_fat,
  });
  if (error) throw error;
};

export const loadCustomMeals = async (userId: string): Promise<CustomMeal[]> => {
  const { data, error } = await supabase
    .from("custom_meals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as CustomMeal[];
};

export const deleteCustomMeal = async (mealId: string) => {
  const { error } = await supabase.from("custom_meals").delete().eq("id", mealId);
  if (error) throw error;
};

// Cache dos últimos 10 alimentos pesquisados
export const getFoodCache = (userId: string): FoodSearchResult[] => {
  try {
    return JSON.parse(localStorage.getItem(`liftmate_food_cache_${userId}`) || "[]");
  } catch {
    return [];
  }
};

export const addToFoodCache = (userId: string, food: FoodSearchResult) => {
  const cache = getFoodCache(userId);
  const filtered = cache.filter((f) => f.id !== food.id);
  const updated = [food, ...filtered].slice(0, 10);
  localStorage.setItem(`liftmate_food_cache_${userId}`, JSON.stringify(updated));
};
