import { FoodDatabaseItem, foodDatabase } from './foodDatabase';

export interface MealPlanMeal {
  type: 'breakfast' | 'snack_morning' | 'lunch' | 'snack_afternoon' | 'dinner' | 'pre_workout' | 'post_workout';
  name: string;
  foods: FoodDatabaseItem[];
  time: string;
}

export interface DayMealPlan {
  day: string;
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
  name: string;
  description: string;
  goal: 'cut' | 'maintain' | 'bulk';
  calorieRange: { min: number; max: number };
  proteinPerKg: number;
  days: DayMealPlan[];
  tips: string[];
}

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
  name: 'Plano de Definição',
  description: 'Défice calórico com alta proteína para manter massa muscular',
  goal: 'cut',
  calorieRange: { min: 1600, max: 2000 },
  proteinPerKg: 2.2,
  tips: [
    'Mantém proteína alta (2-2.2g/kg) para preservar músculo',
    'Come vegetais a cada refeição para saciedade',
    'Hidrata bem - 3L de água por dia',
    'Evita carbs à noite exceto pós-treino',
    'Treina em jejum se te sentires bem',
  ],
  days: [
    {
      day: 'Dia de Treino',
      isTrainingDay: true,
      meals: [
        {
          type: 'breakfast',
          name: 'Pequeno-almoço proteico',
          time: '07:30',
          foods: [getFood('claras-ovo')!, getFood('aveia')!, getFood('mirtilos')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'snack_morning',
          name: 'Snack manhã',
          time: '10:30',
          foods: [getFood('iogurte-grego')!, getFood('amendoas')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'lunch',
          name: 'Almoço',
          time: '13:00',
          foods: [getFood('frango-grelhado')!, getFood('arroz-integral')!, getFood('broculos')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'pre_workout',
          name: 'Pré-treino',
          time: '16:30',
          foods: [getFood('banana')!, getFood('bolachas-arroz')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'post_workout',
          name: 'Pós-treino',
          time: '18:30',
          foods: [getFood('whey-protein')!, getFood('banana')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'dinner',
          name: 'Jantar',
          time: '20:00',
          foods: [getFood('salmao-grelhado')!, getFood('espinafres')!, getFood('couve-flor')!].filter(Boolean) as FoodDatabaseItem[],
        },
      ],
      totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    },
    {
      day: 'Dia de Descanso',
      isTrainingDay: false,
      meals: [
        {
          type: 'breakfast',
          name: 'Pequeno-almoço',
          time: '08:00',
          foods: [getFood('ovos')!, getFood('ovos')!, getFood('pao-integral')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'snack_morning',
          name: 'Snack manhã',
          time: '11:00',
          foods: [getFood('queijo-cottage')!, getFood('maca')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'lunch',
          name: 'Almoço',
          time: '13:00',
          foods: [getFood('atum-lata')!, getFood('atum-lata')!, getFood('batata-doce')!, getFood('alface')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'snack_afternoon',
          name: 'Snack tarde',
          time: '16:00',
          foods: [getFood('iogurte-grego')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'dinner',
          name: 'Jantar',
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
  name: 'Plano de Manutenção',
  description: 'Calorias equilibradas para manter peso e performance',
  goal: 'maintain',
  calorieRange: { min: 2200, max: 2600 },
  proteinPerKg: 1.8,
  tips: [
    'Equilibra macros em cada refeição',
    'Carbs complexos antes do treino',
    'Proteína distribuída ao longo do dia',
    'Gorduras saudáveis para hormonas',
    'Flexibilidade aos fins-de-semana',
  ],
  days: [
    {
      day: 'Dia de Treino',
      isTrainingDay: true,
      meals: [
        {
          type: 'breakfast',
          name: 'Pequeno-almoço completo',
          time: '07:30',
          foods: [getFood('aveia')!, getFood('banana')!, getFood('leite-meio-gordo')!, getFood('manteiga-amendoim')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'snack_morning',
          name: 'Snack manhã',
          time: '10:30',
          foods: [getFood('iogurte-grego')!, getFood('nozes')!, getFood('maca')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'lunch',
          name: 'Almoço',
          time: '13:00',
          foods: [getFood('frango-grelhado')!, getFood('arroz-branco')!, getFood('broculos')!, getFood('azeite')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'pre_workout',
          name: 'Pré-treino',
          time: '16:30',
          foods: [getFood('pao-branco')!, getFood('banana')!, getFood('manteiga-amendoim')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'post_workout',
          name: 'Pós-treino',
          time: '18:30',
          foods: [getFood('whey-protein')!, getFood('banana')!, getFood('bolachas-arroz')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'dinner',
          name: 'Jantar',
          time: '20:30',
          foods: [getFood('salmao-grelhado')!, getFood('batata-cozida')!, getFood('espinafres')!].filter(Boolean) as FoodDatabaseItem[],
        },
      ],
      totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    },
    {
      day: 'Dia de Descanso',
      isTrainingDay: false,
      meals: [
        {
          type: 'breakfast',
          name: 'Pequeno-almoço',
          time: '08:30',
          foods: [getFood('ovos')!, getFood('ovos')!, getFood('pao-integral')!, getFood('abacate')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'snack_morning',
          name: 'Snack',
          time: '11:00',
          foods: [getFood('iogurte-grego')!, getFood('mirtilos')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'lunch',
          name: 'Almoço',
          time: '13:30',
          foods: [getFood('bife-vaca')!, getFood('batata-doce')!, getFood('alface')!, getFood('tomate')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'snack_afternoon',
          name: 'Lanche',
          time: '17:00',
          foods: [getFood('queijo-fresco')!, getFood('nozes')!, getFood('laranja')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'dinner',
          name: 'Jantar',
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
  name: 'Plano de Volume',
  description: 'Superávit calórico para ganho de massa muscular',
  goal: 'bulk',
  calorieRange: { min: 2800, max: 3500 },
  proteinPerKg: 2.0,
  tips: [
    'Come a cada 2-3 horas',
    'Carbs em todas as refeições',
    'Shakes para atingir calorias facilmente',
    'Não saltes refeições nunca',
    'Prioriza sono para recuperação',
  ],
  days: [
    {
      day: 'Dia de Treino',
      isTrainingDay: true,
      meals: [
        {
          type: 'breakfast',
          name: 'Pequeno-almoço pesado',
          time: '07:00',
          foods: [getFood('aveia')!, getFood('aveia')!, getFood('banana')!, getFood('manteiga-amendoim')!, getFood('leite-meio-gordo')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'snack_morning',
          name: 'Snack 1',
          time: '10:00',
          foods: [getFood('pao-branco')!, getFood('pao-branco')!, getFood('manteiga-amendoim')!, getFood('banana')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'lunch',
          name: 'Almoço',
          time: '13:00',
          foods: [getFood('frango-grelhado')!, getFood('frango-grelhado')!, getFood('arroz-branco')!, getFood('arroz-branco')!, getFood('broculos')!, getFood('azeite')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'snack_afternoon',
          name: 'Snack 2',
          time: '16:00',
          foods: [getFood('iogurte-grego')!, getFood('aveia')!, getFood('amendoas')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'pre_workout',
          name: 'Pré-treino',
          time: '17:30',
          foods: [getFood('banana')!, getFood('banana')!, getFood('bolachas-arroz')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'post_workout',
          name: 'Pós-treino',
          time: '19:30',
          foods: [getFood('whey-protein')!, getFood('banana')!, getFood('arroz-branco')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'dinner',
          name: 'Jantar',
          time: '21:00',
          foods: [getFood('bife-vaca')!, getFood('batata-cozida')!, getFood('batata-cozida')!, getFood('espinafres')!].filter(Boolean) as FoodDatabaseItem[],
        },
      ],
      totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    },
    {
      day: 'Dia de Descanso',
      isTrainingDay: false,
      meals: [
        {
          type: 'breakfast',
          name: 'Pequeno-almoço',
          time: '08:00',
          foods: [getFood('ovos')!, getFood('ovos')!, getFood('ovos')!, getFood('pao-branco')!, getFood('pao-branco')!, getFood('abacate')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'snack_morning',
          name: 'Snack',
          time: '10:30',
          foods: [getFood('smoothie-fruta')!, getFood('manteiga-amendoim')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'lunch',
          name: 'Almoço',
          time: '13:00',
          foods: [getFood('salmao-grelhado')!, getFood('massa-cozida')!, getFood('massa-cozida')!, getFood('broculos')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'snack_afternoon',
          name: 'Lanche',
          time: '16:30',
          foods: [getFood('iogurte-grego')!, getFood('aveia')!, getFood('banana')!, getFood('nozes')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'dinner',
          name: 'Jantar',
          time: '20:00',
          foods: [getFood('frango-grelhado')!, getFood('arroz-branco')!, getFood('feijao-preto')!, getFood('azeite')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'snack_afternoon',
          name: 'Ceia',
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
  name: 'Plano Vegetariano',
  description: 'Alimentação 100% baseada em plantas com proteína completa',
  goal: 'maintain',
  calorieRange: { min: 2000, max: 2400 },
  proteinPerKg: 1.8,
  tips: [
    'Combina leguminosas com cereais para proteína completa',
    'Tofu e tempeh são ótimas fontes de proteína',
    'Suplementa B12 se necessário',
    'Varia as fontes de proteína vegetal',
    'Inclui sementes e frutos secos diariamente',
  ],
  days: [
    {
      day: 'Dia de Treino',
      isTrainingDay: true,
      meals: [
        {
          type: 'breakfast',
          name: 'Pequeno-almoço proteico vegetal',
          time: '07:30',
          foods: [getFood('aveia')!, getFood('banana')!, getFood('manteiga-amendoim')!, getFood('leite-meio-gordo')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'snack_morning',
          name: 'Snack manhã',
          time: '10:30',
          foods: [getFood('iogurte-grego')!, getFood('nozes')!, getFood('mirtilos')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'lunch',
          name: 'Almoço',
          time: '13:00',
          foods: [getFood('tofu')!, getFood('tofu')!, getFood('quinoa')!, getFood('broculos')!, getFood('azeite')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'pre_workout',
          name: 'Pré-treino',
          time: '16:30',
          foods: [getFood('banana')!, getFood('bolachas-arroz')!, getFood('amendoas')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'post_workout',
          name: 'Pós-treino',
          time: '18:30',
          foods: [getFood('whey-protein')!, getFood('banana')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'dinner',
          name: 'Jantar',
          time: '20:00',
          foods: [getFood('lentilhas')!, getFood('lentilhas')!, getFood('arroz-integral')!, getFood('espinafres')!].filter(Boolean) as FoodDatabaseItem[],
        },
      ],
      totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    },
    {
      day: 'Dia de Descanso',
      isTrainingDay: false,
      meals: [
        {
          type: 'breakfast',
          name: 'Pequeno-almoço',
          time: '08:00',
          foods: [getFood('ovos')!, getFood('ovos')!, getFood('pao-integral')!, getFood('abacate')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'snack_morning',
          name: 'Snack manhã',
          time: '11:00',
          foods: [getFood('queijo-cottage')!, getFood('maca')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'lunch',
          name: 'Almoço',
          time: '13:00',
          foods: [getFood('grao-bico')!, getFood('grao-bico')!, getFood('quinoa')!, getFood('tomate')!, getFood('azeite')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'snack_afternoon',
          name: 'Snack tarde',
          time: '16:00',
          foods: [getFood('iogurte-grego')!, getFood('amendoas')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'dinner',
          name: 'Jantar',
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
  name: 'Plano Low-Carb',
  description: 'Baixo em hidratos para acelerar a queima de gordura',
  goal: 'cut',
  calorieRange: { min: 1500, max: 1900 },
  proteinPerKg: 2.4,
  tips: [
    'Mantém carbs abaixo de 100g por dia',
    'Aumenta gorduras saudáveis para saciedade',
    'Proteína alta para preservar músculo',
    'Vegetais verdes à vontade',
    'Evita açúcares e amidos refinados',
  ],
  days: [
    {
      day: 'Dia de Treino',
      isTrainingDay: true,
      meals: [
        {
          type: 'breakfast',
          name: 'Pequeno-almoço proteico',
          time: '07:30',
          foods: [getFood('ovos')!, getFood('ovos')!, getFood('ovos')!, getFood('abacate')!, getFood('espinafres')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'snack_morning',
          name: 'Snack manhã',
          time: '10:30',
          foods: [getFood('queijo-cottage')!, getFood('amendoas')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'lunch',
          name: 'Almoço',
          time: '13:00',
          foods: [getFood('salmao-grelhado')!, getFood('broculos')!, getFood('broculos')!, getFood('azeite')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'pre_workout',
          name: 'Pré-treino',
          time: '16:30',
          foods: [getFood('iogurte-grego')!, getFood('nozes')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'post_workout',
          name: 'Pós-treino',
          time: '18:30',
          foods: [getFood('whey-protein')!, getFood('amendoas')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'dinner',
          name: 'Jantar',
          time: '20:00',
          foods: [getFood('frango-grelhado')!, getFood('frango-grelhado')!, getFood('espinafres')!, getFood('couve-flor')!, getFood('azeite')!].filter(Boolean) as FoodDatabaseItem[],
        },
      ],
      totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    },
    {
      day: 'Dia de Descanso',
      isTrainingDay: false,
      meals: [
        {
          type: 'breakfast',
          name: 'Pequeno-almoço',
          time: '08:00',
          foods: [getFood('claras-ovo')!, getFood('ovos')!, getFood('espinafres')!, getFood('queijo-fresco')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'snack_morning',
          name: 'Snack manhã',
          time: '11:00',
          foods: [getFood('iogurte-grego')!, getFood('nozes')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'lunch',
          name: 'Almoço',
          time: '13:00',
          foods: [getFood('bife-vaca')!, getFood('alface')!, getFood('tomate')!, getFood('abacate')!, getFood('azeite')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'snack_afternoon',
          name: 'Snack tarde',
          time: '16:00',
          foods: [getFood('queijo-cottage')!, getFood('amendoas')!].filter(Boolean) as FoodDatabaseItem[],
        },
        {
          type: 'dinner',
          name: 'Jantar',
          time: '19:30',
          foods: [getFood('bacalhau-cozido')!, getFood('broculos')!, getFood('feijao-verde')!, getFood('azeite')!].filter(Boolean) as FoodDatabaseItem[],
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

export const mealTypeLabelsExtended: Record<string, string> = {
  breakfast: 'Pequeno-almoço',
  snack_morning: 'Snack Manhã',
  lunch: 'Almoço',
  snack_afternoon: 'Snack Tarde',
  dinner: 'Jantar',
  pre_workout: 'Pré-treino',
  post_workout: 'Pós-treino',
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