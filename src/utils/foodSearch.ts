export interface FoodSearchResult {
  id: string;
  name: string;
  brand: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  servingSize: string;
}

export const searchFoodByName = async (query: string): Promise<FoodSearchResult[]> => {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&fields=product_name,brands,nutriments,serving_size,code`;
  const response = await fetch(url);
  const data = await response.json();
  return (
    data.products?.map((p: Record<string, unknown>) => {
      const nutriments = (p.nutriments as Record<string, number>) || {};
      return {
        id: String(p.code || ""),
        name: String(p.product_name || "Sem nome"),
        brand: String(p.brands || ""),
        calories: Math.round(nutriments["energy-kcal_100g"] || 0),
        protein: Math.round(nutriments["proteins_100g"] || 0),
        carbs: Math.round(nutriments["carbohydrates_100g"] || 0),
        fat: Math.round(nutriments["fat_100g"] || 0),
        fiber: Math.round(nutriments["fiber_100g"] || 0),
        servingSize: String(p.serving_size || "100g"),
      };
    }) || []
  );
};

export const searchFoodByBarcode = async (barcode: string): Promise<FoodSearchResult | null> => {
  const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.status !== 1) return null;
  const p = data.product as Record<string, unknown>;
  const nutriments = (p.nutriments as Record<string, number>) || {};
  return {
    id: barcode,
    name: String(p.product_name || "Sem nome"),
    brand: String(p.brands || ""),
    calories: Math.round(nutriments["energy-kcal_100g"] || 0),
    protein: Math.round(nutriments["proteins_100g"] || 0),
    carbs: Math.round(nutriments["carbohydrates_100g"] || 0),
    fat: Math.round(nutriments["fat_100g"] || 0),
    fiber: Math.round(nutriments["fiber_100g"] || 0),
    servingSize: String(p.serving_size || "100g"),
  };
};
