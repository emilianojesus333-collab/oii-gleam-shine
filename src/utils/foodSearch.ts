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

// Rejects names that are purely numeric (e.g. barcodes used as names)
const isNumericName = (name: string) => /^\d+$/.test(name.trim());

// Rejects names containing Arabic, Hebrew, CJK, Cyrillic, or other non-Latin scripts
const hasNonLatinChars = (name: string) =>
  /[؀-ۿݐ-ݿ一-鿿぀-ヿ가-힯Ѐ-ӿא-׿]/.test(name);

// Returns a quality score for sorting (higher = better)
const qualityScore = (r: FoodSearchResult): number => {
  let score = 0;
  if (r.calories > 0) score += 2;
  if (r.protein > 0) score += 2;
  if (r.carbs > 0)   score += 1;
  if (r.fat > 0)     score += 1;
  if (r.brand)       score += 1;
  return score;
};

export const searchFoodByName = async (query: string): Promise<FoodSearchResult[]> => {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=30&lc=pt,en&cc=pt,br,en&fields=product_name,brands,nutriments,serving_size,code`;
  const response = await fetch(url);
  const data = await response.json();

  const mapped: FoodSearchResult[] = (data.products ?? [])
    .map((p: Record<string, unknown>) => {
      const nutriments = (p.nutriments as Record<string, number>) || {};
      return {
        id: String(p.code || ""),
        name: String(p.product_name || "").trim(),
        brand: String(p.brands || "").trim(),
        calories: Math.round(nutriments["energy-kcal_100g"] || 0),
        protein:  Math.round(nutriments["proteins_100g"]    || 0),
        carbs:    Math.round(nutriments["carbohydrates_100g"] || 0),
        fat:      Math.round(nutriments["fat_100g"]          || 0),
        fiber:    Math.round(nutriments["fiber_100g"]        || 0),
        servingSize: String(p.serving_size || "100g"),
      };
    })
    .filter((r: FoodSearchResult) => {
      if (!r.name || r.name.length < 2)  return false; // sem nome
      if (isNumericName(r.name))         return false; // nome é só números (barcode)
      if (hasNonLatinChars(r.name))      return false; // árabe, chinês, cirílico, etc.
      // sem absolutamente nenhum dado nutricional
      if (r.calories === 0 && r.protein === 0 && r.carbs === 0 && r.fat === 0) return false;
      return true;
    });

  // Sort by quality descending, keep top 10
  mapped.sort((a, b) => qualityScore(b) - qualityScore(a));
  return mapped.slice(0, 10);
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
