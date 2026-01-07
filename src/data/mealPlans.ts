import { FoodDatabaseItem, foodDatabase } from './foodDatabase';
import { getCurrentLanguage } from '@/hooks/useLanguage';

export interface MealPlanMeal {
  type: 'breakfast' | 'snack_morning' | 'lunch' | 'snack_afternoon' | 'dinner' | 'pre_workout' | 'post_workout';
  name: { en: string; pt: string };
  foods: FoodDatabaseItem[];
  time: string;
}

export interface DayMealPlan {
  day: { en: string; pt: string };
  isTrainingDay: boolean;
  meals: MealPlanMeal[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

export interface MealPlan {
  id: string;
  name: { en: string; pt: string };
  description: { en: string; pt: string };
  goal: 'cut' | 'maintain' | 'bulk';
  calorieRange: { min: number; max: number };
  proteinPerKg: number;
  days: DayMealPlan[];
  tips: { en: string; pt: string }[];
}

// Helper to get localized text
export const getLocalizedText = (text: { en: string; pt: string }): string => {
  const lang = getCurrentLanguage();
  return text[lang] || text.en;
};

// Helper to get food by ID with safe fallback
const getFood = (id: string): FoodDatabaseItem | undefined => {
  const food = foodDatabase.find(f => f.id === id);
  if (!food) {
    console.warn(`Food with id "${id}" not found in database`);
  }
  return food;
};

// Helper to calculate meal totals
const calculateMealTotals = (foods: FoodDatabaseItem[]) => {
  return foods.reduce((acc, food) => ({
    calories: acc.calories + food.calories,
    protein: acc.protein + food.protein,
    carbs: acc.carbs + food.carbs,
    fat: acc.fat + food.fat,
    fiber: acc.fiber + food.fiber,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
};

// Helper to calculate day totals
const calculateDayTotals = (meals: MealPlanMeal[]) => {
  return meals.reduce((acc, meal) => {
    const mealTotals = calculateMealTotals(meal.foods);
    return {
      calories: acc.calories + mealTotals.calories,
      protein: acc.protein + mealTotals.protein,
      carbs: acc.carbs + mealTotals.carbs,
      fat: acc.fat + mealTotals.fat,
      fiber: acc.fiber + mealTotals.fiber,
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
};

// CUT Plan - High protein, calorie deficit
export const cutPlan: MealPlan = {
  id: 'cut-standard',
  name: { en: 'Definition Plan', pt: 'Plano de Definição' },
  description: { en: 'Calorie deficit with high protein to maintain muscle mass', pt: 'Défice calórico com alta proteína para manter massa muscular' },
  goal: 'cut',
  calorieRange: { min: 1600, max: 2000 },
  proteinPerKg: 2.2,
  tips: [
    { en: 'Keep protein high (2-2.2g/kg) to preserve muscle', pt: 'Mantém proteína alta (2-2.2g/kg) para preservar músculo' },
    { en: 'Eat vegetables with every meal for satiety', pt: 'Come vegetais a cada refeição para saciedade' },
    { en: 'Stay well hydrated - 3L of water per day', pt: 'Hidrata bem - 3L de água por dia' },
    { en: 'Avoid carbs at night except post-workout', pt: 'Evita carbs à noite exceto pós-treino' },
    { en: 'Train fasted if you feel good', pt: 'Treina em jejum se te sentires bem' },
  ],
  days: [
    {
      day: { en: 'Training Day', pt: 'Dia de Treino' },
      isTrainingDay: true,
      meals: [
        {
          type: 'breakfast',
          name: { en: 'Protein breakfast', pt: 'Pequeno-almoço proteico' },
          time: '07:30',
          foods: [getFood('claras-ovo')!, getFood('aveia')!, getFood('mirtilos')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'snack_morning',
          name: { en: 'Morning snack', pt: 'Snack manhã' },
          time: '10:30',
          foods: [getFood('iogurte-grego')!, getFood('amendoas')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'lunch',
          name: { en: 'Lunch', pt: 'Almoço' },
          time: '13:00',
          foods: [getFood('frango-grelhado')!, getFood('arroz-integral')!, getFood('broculos')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'pre_workout',
          name: { en: 'Pre-workout', pt: 'Pré-treino' },
          time: '16:30',
          foods: [getFood('banana')!, getFood('bolachas-arroz')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'post_workout',
          name: { en: 'Post-workout', pt: 'Pós-treino' },
          time: '18:30',
          foods: [getFood('whey-protein')!, getFood('banana')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'dinner',
          name: { en: 'Dinner', pt: 'Jantar' },
          time: '20:00',
          foods: [getFood('salmao-grelhado')!, getFood('espinafres')!, getFood('couve-flor')!].filter(Boolean) as FoodDatabaseItem[],
        },
      ],
      totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    },
    {
      day: { en: 'Rest Day', pt: 'Dia de Descanso' },
      isTrainingDay: false,
      meals: [
        {
          type: 'breakfast',
          name: { en: 'Breakfast', pt: 'Pequeno-almoço' },
          time: '08:00',
          foods: [getFood('ovos')!, getFood('ovos')!, getFood('pao-integral')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'snack_morning',
          name: { en: 'Morning snack', pt: 'Snack manhã' },
          time: '11:00',
          foods: [getFood('queijo-cottage')!, getFood('maca')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'lunch',
          name: { en: 'Lunch', pt: 'Almoço' },
          time: '13:00',
          foods: [getFood('atum-lata')!, getFood('atum-lata')!, getFood('batata-doce')!, getFood('alface')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'snack_afternoon',
          name: { en: 'Afternoon snack', pt: 'Snack tarde' },
          time: '16:00',
          foods: [getFood('iogurte-grego')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'dinner',
          name: { en: 'Dinner', pt: 'Jantar' },
          time: '19:30',
          foods: [getFood('bacalhau-cozido')!, getFood('broculos')!, getFood('feijao-verde')!].filter(Boolean) as FoodDatabaseItem[],
        },
      ],
      totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    },
  ],
};

// MAINTAIN Plan - Balanced macros
export const maintainPlan: MealPlan = {
  id: 'maintain-standard',
  name: { en: 'Maintenance Plan', pt: 'Plano de Manutenção' },
  description: { en: 'Balanced calories to maintain weight and performance', pt: 'Calorias equilibradas para manter peso e performance' },
  goal: 'maintain',
  calorieRange: { min: 2200, max: 2600 },
  proteinPerKg: 1.8,
  tips: [
    { en: 'Balance macros in each meal', pt: 'Equilibra macros em cada refeição' },
    { en: 'Complex carbs before training', pt: 'Carbs complexos antes do treino' },
    { en: 'Protein distributed throughout the day', pt: 'Proteína distribuída ao longo do dia' },
    { en: 'Healthy fats for hormones', pt: 'Gorduras saudáveis para hormonas' },
    { en: 'Flexibility on weekends', pt: 'Flexibilidade aos fins-de-semana' },
  ],
  days: [
    {
      day: { en: 'Training Day', pt: 'Dia de Treino' },
      isTrainingDay: true,
      meals: [
        {
          type: 'breakfast',
          name: { en: 'Complete breakfast', pt: 'Pequeno-almoço completo' },
          time: '07:30',
          foods: [getFood('aveia')!, getFood('banana')!, getFood('leite-meio-gordo')!, getFood('manteiga-amendoim')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'snack_morning',
          name: { en: 'Morning snack', pt: 'Snack manhã' },
          time: '10:30',
          foods: [getFood('iogurte-grego')!, getFood('nozes')!, getFood('maca')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'lunch',
          name: { en: 'Lunch', pt: 'Almoço' },
          time: '13:00',
          foods: [getFood('frango-grelhado')!, getFood('arroz-branco')!, getFood('broculos')!, getFood('azeite')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'pre_workout',
          name: { en: 'Pre-workout', pt: 'Pré-treino' },
          time: '16:30',
          foods: [getFood('pao-branco')!, getFood('banana')!, getFood('manteiga-amendoim')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'post_workout',
          name: { en: 'Post-workout', pt: 'Pós-treino' },
          time: '18:30',
          foods: [getFood('whey-protein')!, getFood('banana')!, getFood('bolachas-arroz')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'dinner',
          name: { en: 'Dinner', pt: 'Jantar' },
          time: '20:30',
          foods: [getFood('salmao-grelhado')!, getFood('batata-cozida')!, getFood('espinafres')!].filter(Boolean) as FoodDatabaseItem[],
        },
      ],
      totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    },
    {
      day: { en: 'Rest Day', pt: 'Dia de Descanso' },
      isTrainingDay: false,
      meals: [
        {
          type: 'breakfast',
          name: { en: 'Breakfast', pt: 'Pequeno-almoço' },
          time: '08:30',
          foods: [getFood('ovos')!, getFood('ovos')!, getFood('pao-integral')!, getFood('abacate')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'snack_morning',
          name: { en: 'Snack', pt: 'Snack' },
          time: '11:00',
          foods: [getFood('iogurte-grego')!, getFood('mirtilos')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'lunch',
          name: { en: 'Lunch', pt: 'Almoço' },
          time: '13:30',
          foods: [getFood('bife-vaca')!, getFood('batata-doce')!, getFood('alface')!, getFood('tomate')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'snack_afternoon',
          name: { en: 'Snack', pt: 'Lanche' },
          time: '17:00',
          foods: [getFood('queijo-fresco')!, getFood('nozes')!, getFood('laranja')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'dinner',
          name: { en: 'Dinner', pt: 'Jantar' },
          time: '20:00',
          foods: [getFood('bacalhau-cozido')!, getFood('grao-bico')!, getFood('couve-flor')!].filter(Boolean) as FoodDatabaseItem[],
        },
      ],
      totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    },
  ],
};

// BULK Plan - Calorie surplus with high carbs
export const bulkPlan: MealPlan = {
  id: 'bulk-standard',
  name: { en: 'Bulking Plan', pt: 'Plano de Volume' },
  description: { en: 'Calorie surplus for muscle mass gain', pt: 'Superávit calórico para ganho de massa muscular' },
  goal: 'bulk',
  calorieRange: { min: 2800, max: 3500 },
  proteinPerKg: 2.0,
  tips: [
    { en: 'Eat every 2-3 hours', pt: 'Come a cada 2-3 horas' },
    { en: 'Carbs with every meal', pt: 'Carbs em todas as refeições' },
    { en: 'Shakes to easily reach calories', pt: 'Shakes para atingir calorias facilmente' },
    { en: 'Never skip meals', pt: 'Não saltes refeições nunca' },
    { en: 'Prioritize sleep for recovery', pt: 'Prioriza sono para recuperação' },
  ],
  days: [
    {
      day: { en: 'Training Day', pt: 'Dia de Treino' },
      isTrainingDay: true,
      meals: [
        {
          type: 'breakfast',
          name: { en: 'Heavy breakfast', pt: 'Pequeno-almoço pesado' },
          time: '07:00',
          foods: [getFood('aveia')!, getFood('aveia')!, getFood('banana')!, getFood('manteiga-amendoim')!, getFood('leite-meio-gordo')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'snack_morning',
          name: { en: 'Snack 1', pt: 'Snack 1' },
          time: '10:00',
          foods: [getFood('pao-branco')!, getFood('pao-branco')!, getFood('manteiga-amendoim')!, getFood('banana')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'lunch',
          name: { en: 'Lunch', pt: 'Almoço' },
          time: '13:00',
          foods: [getFood('frango-grelhado')!, getFood('frango-grelhado')!, getFood('arroz-branco')!, getFood('arroz-branco')!, getFood('broculos')!, getFood('azeite')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'snack_afternoon',
          name: { en: 'Snack 2', pt: 'Snack 2' },
          time: '16:00',
          foods: [getFood('iogurte-grego')!, getFood('aveia')!, getFood('amendoas')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'pre_workout',
          name: { en: 'Pre-workout', pt: 'Pré-treino' },
          time: '17:30',
          foods: [getFood('banana')!, getFood('banana')!, getFood('bolachas-arroz')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'post_workout',
          name: { en: 'Post-workout', pt: 'Pós-treino' },
          time: '19:30',
          foods: [getFood('whey-protein')!, getFood('banana')!, getFood('arroz-branco')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'dinner',
          name: { en: 'Dinner', pt: 'Jantar' },
          time: '21:00',
          foods: [getFood('bife-vaca')!, getFood('batata-cozida')!, getFood('batata-cozida')!, getFood('espinafres')!].filter(Boolean) as FoodDatabaseItem[],
        },
      ],
      totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    },
    {
      day: { en: 'Rest Day', pt: 'Dia de Descanso' },
      isTrainingDay: false,
      meals: [
        {
          type: 'breakfast',
          name: { en: 'Breakfast', pt: 'Pequeno-almoço' },
          time: '08:00',
          foods: [getFood('ovos')!, getFood('ovos')!, getFood('ovos')!, getFood('pao-branco')!, getFood('pao-branco')!, getFood('abacate')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'snack_morning',
          name: { en: 'Snack', pt: 'Snack' },
          time: '10:30',
          foods: [getFood('smoothie-fruta')!, getFood('manteiga-amendoim')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'lunch',
          name: { en: 'Lunch', pt: 'Almoço' },
          time: '13:00',
          foods: [getFood('salmao-grelhado')!, getFood('massa-cozida')!, getFood('massa-cozida')!, getFood('broculos')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'snack_afternoon',
          name: { en: 'Snack', pt: 'Lanche' },
          time: '16:30',
          foods: [getFood('iogurte-grego')!, getFood('aveia')!, getFood('banana')!, getFood('nozes')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'dinner',
          name: { en: 'Dinner', pt: 'Jantar' },
          time: '20:00',
          foods: [getFood('frango-grelhado')!, getFood('arroz-branco')!, getFood('feijao-preto')!, getFood('azeite')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'snack_afternoon',
          name: { en: 'Late night snack', pt: 'Ceia' },
          time: '22:30',
          foods: [getFood('caseina')!, getFood('amendoas')!].filter(Boolean) as FoodDatabaseItem[],
        },
      ],
      totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    },
  ],
};

// VEGETARIAN Plan - Plant-based protein sources
export const vegetarianPlan: MealPlan = {
  id: 'vegetarian-standard',
  name: { en: 'Vegetarian Plan', pt: 'Plano Vegetariano' },
  description: { en: '100% plant-based diet with complete protein', pt: 'Alimentação 100% baseada em plantas com proteína completa' },
  goal: 'maintain',
  calorieRange: { min: 2000, max: 2400 },
  proteinPerKg: 1.8,
  tips: [
    { en: 'Combine legumes with grains for complete protein', pt: 'Combina leguminosas com cereais para proteína completa' },
    { en: 'Tofu and tempeh are great protein sources', pt: 'Tofu e tempeh são ótimas fontes de proteína' },
    { en: 'Supplement B12 if needed', pt: 'Suplementa B12 se necessário' },
    { en: 'Vary plant protein sources', pt: 'Varia as fontes de proteína vegetal' },
    { en: 'Include seeds and nuts daily', pt: 'Inclui sementes e frutos secos diariamente' },
  ],
  days: [
    {
      day: { en: 'Training Day', pt: 'Dia de Treino' },
      isTrainingDay: true,
      meals: [
        {
          type: 'breakfast',
          name: { en: 'Plant protein breakfast', pt: 'Pequeno-almoço proteico vegetal' },
          time: '07:30',
          foods: [getFood('aveia')!, getFood('banana')!, getFood('manteiga-amendoim')!, getFood('leite-meio-gordo')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'snack_morning',
          name: { en: 'Morning snack', pt: 'Snack manhã' },
          time: '10:30',
          foods: [getFood('iogurte-grego')!, getFood('nozes')!, getFood('mirtilos')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'lunch',
          name: { en: 'Lunch', pt: 'Almoço' },
          time: '13:00',
          foods: [getFood('tofu')!, getFood('tofu')!, getFood('quinoa')!, getFood('broculos')!, getFood('azeite')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'pre_workout',
          name: { en: 'Pre-workout', pt: 'Pré-treino' },
          time: '16:30',
          foods: [getFood('banana')!, getFood('bolachas-arroz')!, getFood('amendoas')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'post_workout',
          name: { en: 'Post-workout', pt: 'Pós-treino' },
          time: '18:30',
          foods: [getFood('whey-protein')!, getFood('banana')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'dinner',
          name: { en: 'Dinner', pt: 'Jantar' },
          time: '20:00',
          foods: [getFood('lentilhas')!, getFood('lentilhas')!, getFood('arroz-integral')!, getFood('espinafres')!].filter(Boolean) as FoodDatabaseItem[],
        },
      ],
      totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    },
    {
      day: { en: 'Rest Day', pt: 'Dia de Descanso' },
      isTrainingDay: false,
      meals: [
        {
          type: 'breakfast',
          name: { en: 'Breakfast', pt: 'Pequeno-almoço' },
          time: '08:00',
          foods: [getFood('ovos')!, getFood('ovos')!, getFood('pao-integral')!, getFood('abacate')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'snack_morning',
          name: { en: 'Morning snack', pt: 'Snack manhã' },
          time: '11:00',
          foods: [getFood('queijo-cottage')!, getFood('maca')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'lunch',
          name: { en: 'Lunch', pt: 'Almoço' },
          time: '13:00',
          foods: [getFood('grao-bico')!, getFood('grao-bico')!, getFood('quinoa')!, getFood('tomate')!, getFood('azeite')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'snack_afternoon',
          name: { en: 'Afternoon snack', pt: 'Snack tarde' },
          time: '16:00',
          foods: [getFood('iogurte-grego')!, getFood('amendoas')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'dinner',
          name: { en: 'Dinner', pt: 'Jantar' },
          time: '19:30',
          foods: [getFood('feijao-preto')!, getFood('arroz-branco')!, getFood('couve-flor')!].filter(Boolean) as FoodDatabaseItem[],
        },
      ],
      totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    },
  ],
};

// LOW-CARB Plan - High protein, low carbohydrates for definition
export const lowCarbPlan: MealPlan = {
  id: 'lowcarb-standard',
  name: { en: 'Low-Carb Plan', pt: 'Plano Low-Carb' },
  description: { en: 'Low carb to accelerate fat burning', pt: 'Baixo em hidratos para acelerar a queima de gordura' },
  goal: 'cut',
  calorieRange: { min: 1500, max: 1900 },
  proteinPerKg: 2.4,
  tips: [
    { en: 'Keep carbs below 100g per day', pt: 'Mantém carbs abaixo de 100g por dia' },
    { en: 'Increase healthy fats for satiety', pt: 'Aumenta gorduras saudáveis para saciedade' },
    { en: 'High protein to preserve muscle', pt: 'Proteína alta para preservar músculo' },
    { en: 'Green vegetables unlimited', pt: 'Vegetais verdes à vontade' },
    { en: 'Avoid sugars and refined starches', pt: 'Evita açúcares e amidos refinados' },
  ],
  days: [
    {
      day: { en: 'Training Day', pt: 'Dia de Treino' },
      isTrainingDay: true,
      meals: [
        {
          type: 'breakfast',
          name: { en: 'Protein breakfast', pt: 'Pequeno-almoço proteico' },
          time: '07:30',
          foods: [getFood('ovos')!, getFood('ovos')!, getFood('ovos')!, getFood('abacate')!, getFood('espinafres')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'snack_morning',
          name: { en: 'Morning snack', pt: 'Snack manhã' },
          time: '10:30',
          foods: [getFood('queijo-cottage')!, getFood('nozes')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'lunch',
          name: { en: 'Lunch', pt: 'Almoço' },
          time: '13:00',
          foods: [getFood('frango-grelhado')!, getFood('broculos')!, getFood('azeite')!, getFood('espinafres')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'pre_workout',
          name: { en: 'Pre-workout', pt: 'Pré-treino' },
          time: '16:30',
          foods: [getFood('amendoas')!, getFood('queijo-fresco')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'post_workout',
          name: { en: 'Post-workout', pt: 'Pós-treino' },
          time: '18:30',
          foods: [getFood('whey-protein')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'dinner',
          name: { en: 'Dinner', pt: 'Jantar' },
          time: '20:00',
          foods: [getFood('salmao-grelhado')!, getFood('couve-flor')!, getFood('feijao-verde')!].filter(Boolean) as FoodDatabaseItem[],
        },
      ],
      totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    },
    {
      day: { en: 'Rest Day', pt: 'Dia de Descanso' },
      isTrainingDay: false,
      meals: [
        {
          type: 'breakfast',
          name: { en: 'Breakfast', pt: 'Pequeno-almoço' },
          time: '08:00',
          foods: [getFood('claras-ovo')!, getFood('ovos')!, getFood('espinafres')!, getFood('azeite')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'snack_morning',
          name: { en: 'Morning snack', pt: 'Snack manhã' },
          time: '11:00',
          foods: [getFood('iogurte-grego')!, getFood('amendoas')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'lunch',
          name: { en: 'Lunch', pt: 'Almoço' },
          time: '13:00',
          foods: [getFood('bife-vaca')!, getFood('alface')!, getFood('tomate')!, getFood('azeite')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'snack_afternoon',
          name: { en: 'Afternoon snack', pt: 'Snack tarde' },
          time: '16:00',
          foods: [getFood('nozes')!, getFood('queijo-fresco')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'dinner',
          name: { en: 'Dinner', pt: 'Jantar' },
          time: '19:30',
          foods: [getFood('bacalhau-cozido')!, getFood('broculos')!, getFood('couve-flor')!].filter(Boolean) as FoodDatabaseItem[],
        },
      ],
      totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    },
  ],
};

// Calculate totals for all plans
const calculatePlanTotals = (plan: MealPlan): MealPlan => {
  return {
    ...plan,
    days: plan.days.map(day => ({
      ...day,
      totals: calculateDayTotals(day.meals),
    })),
  };
};

export const mealPlans: MealPlan[] = [
  calculatePlanTotals(cutPlan),
  calculatePlanTotals(lowCarbPlan),
  calculatePlanTotals(maintainPlan),
  calculatePlanTotals(vegetarianPlan),
  calculatePlanTotals(bulkPlan),
];

export const getMealPlanByGoal = (goal: 'cut' | 'maintain' | 'bulk'): MealPlan | undefined => {
  return mealPlans.find(p => p.goal === goal);
};

// Bilingual meal type labels
export const mealTypeLabelsExtended: Record<string, { en: string; pt: string }> = {
  breakfast: { en: 'Breakfast', pt: 'Pequeno-almoço' },
  snack_morning: { en: 'Morning Snack', pt: 'Snack Manhã' },
  lunch: { en: 'Lunch', pt: 'Almoço' },
  snack_afternoon: { en: 'Afternoon Snack', pt: 'Snack Tarde' },
  dinner: { en: 'Dinner', pt: 'Jantar' },
  pre_workout: { en: 'Pre-workout', pt: 'Pré-treino' },
  post_workout: { en: 'Post-workout', pt: 'Pós-treino' },
};

export const getMealTypeLabel = (type: string): string => {
  const label = mealTypeLabelsExtended[type];
  return label ? getLocalizedText(label) : type;
};

export const mealTypeIconsExtended: Record<string, string> = {
  breakfast: '🌅',
  snack_morning: '🍎',
  lunch: '☀️',
  snack_afternoon: '🥜',
  dinner: '🌙',
  pre_workout: '💪',
  post_workout: '🥤',
};

// Bilingual goal labels
export const goalLabels: Record<'cut' | 'maintain' | 'bulk', { en: string; pt: string }> = {
  cut: { en: 'Definition', pt: 'Definição' },
  maintain: { en: 'Maintenance', pt: 'Manutenção' },
  bulk: { en: 'Bulking', pt: 'Volume' },
};

export const getGoalLabel = (goal: 'cut' | 'maintain' | 'bulk'): string => {
  return getLocalizedText(goalLabels[goal]);
};
