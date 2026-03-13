export interface FitnessRecipe {
  id: string;
  name: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout';
  prepTime: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  ingredients: string[];
  instructions: string[];
  tips: string;
  imageEmoji: string;
}

export const fitnessRecipes: FitnessRecipe[] = [
  // === PEQUENO-ALMOÇO ===
  {
    id: 'breakfast_omelette_oats',
    name: 'Omelete Proteica com Aveia',
    category: 'breakfast',
    prepTime: '15 min',
    calories: 420,
    protein: 35,
    carbs: 38,
    fat: 14,
    fiber: 4,
    ingredients: [
      '3 ovos inteiros',
      '2 claras de ovo',
      '40g aveia em flocos',
      '30g espinafres',
      'sal e pimenta',
      '1 colher chá azeite',
    ],
    instructions: [
      'Bater os ovos e claras num recipiente.',
      'Aquecer frigideira com azeite em lume médio.',
      'Verter os ovos e adicionar espinafres.',
      'Dobrar a omelete ao meio e servir.',
      'Acompanhar com a aveia cozida em água ou leite.',
    ],
    tips: 'Rica em proteína e fibra. Ideal para começar o dia com energia sustentada.',
    imageEmoji: '🍳',
  },
  {
    id: 'breakfast_yogurt_fruit',
    name: 'Iogurte Grego com Fruta e Aveia',
    category: 'breakfast',
    prepTime: '5 min',
    calories: 350,
    protein: 28,
    carbs: 42,
    fat: 8,
    fiber: 3,
    ingredients: [
      '200g iogurte grego natural',
      '30g aveia em flocos',
      '1 banana pequena',
      '50g morangos',
      '1 colher chá mel',
    ],
    instructions: [
      'Colocar o iogurte numa tigela.',
      'Adicionar a aveia por cima.',
      'Cortar a banana e morangos.',
      'Decorar com mel.',
    ],
    tips: 'Sem cozinhar. Perfeito para manhãs rápidas com boa dose de proteína.',
    imageEmoji: '🥣',
  },
  {
    id: 'breakfast_protein_pancakes',
    name: 'Panquecas Proteicas',
    category: 'breakfast',
    prepTime: '15 min',
    calories: 380,
    protein: 32,
    carbs: 40,
    fat: 10,
    fiber: 3,
    ingredients: [
      '1 banana madura',
      '2 ovos',
      '30g whey protein',
      '30g aveia em flocos',
      '1 colher chá canela',
    ],
    instructions: [
      'Esmagar a banana e misturar com ovos.',
      'Adicionar whey e aveia, mexer bem.',
      'Aquecer frigideira antiaderente em lume médio-baixo.',
      'Verter porções de massa e virar quando fizer bolhas.',
      'Servir com fruta fresca.',
    ],
    tips: 'Podes preparar a massa na noite anterior. Fica mais prática de manhã.',
    imageEmoji: '🥞',
  },

  // === ALMOÇO ===
  {
    id: 'lunch_chicken_rice_veg',
    name: 'Frango Grelhado com Arroz e Legumes',
    category: 'lunch',
    prepTime: '25 min',
    calories: 520,
    protein: 42,
    carbs: 52,
    fat: 12,
    fiber: 4,
    ingredients: [
      '150g peito de frango',
      '120g arroz branco ou integral cozido',
      '100g brócolos',
      '1 cenoura média',
      '1 colher sopa azeite',
      'sal, pimenta, alho em pó',
    ],
    instructions: [
      'Temperar o frango com sal, pimenta e alho em pó.',
      'Grelhar o frango 5-6 min de cada lado.',
      'Cozer o arroz conforme instruções.',
      'Saltear brócolos e cenoura com azeite.',
      'Servir tudo no prato.',
    ],
    tips: 'Clássico do fitness. Prepara em batch para vários dias.',
    imageEmoji: '🍗',
  },
  {
    id: 'lunch_salmon_sweet_potato',
    name: 'Salmão com Batata Doce',
    category: 'lunch',
    prepTime: '30 min',
    calories: 550,
    protein: 38,
    carbs: 45,
    fat: 22,
    fiber: 5,
    ingredients: [
      '150g filete de salmão',
      '200g batata doce',
      '50g espinafres',
      '1 colher sopa azeite',
      'sumo de 1/2 limão',
      'sal e ervas a gosto',
    ],
    instructions: [
      'Pré-aquecer forno a 200°C.',
      'Cortar batata doce em cubos e assar 20 min.',
      'Temperar salmão com limão, sal e ervas.',
      'Assar salmão 12-15 min.',
      'Servir com espinafres frescos.',
    ],
    tips: 'Rico em ómega-3 e vitamina A. Excelente para recuperação muscular.',
    imageEmoji: '🐟',
  },
  {
    id: 'lunch_chicken_quinoa_bowl',
    name: 'Bowl de Frango e Quinoa',
    category: 'lunch',
    prepTime: '25 min',
    calories: 490,
    protein: 40,
    carbs: 48,
    fat: 14,
    fiber: 6,
    ingredients: [
      '150g peito de frango',
      '80g quinoa (peso seco)',
      '50g grão-de-bico cozido',
      '50g tomate cherry',
      '30g abacate',
      '1 colher sopa azeite',
    ],
    instructions: [
      'Cozer a quinoa conforme instruções.',
      'Grelhar o frango cortado em cubos.',
      'Montar a bowl: quinoa na base.',
      'Adicionar frango, grão, tomate e abacate.',
      'Temperar com azeite e sal.',
    ],
    tips: 'Quinoa é proteína completa vegetal. Boa alternativa ao arroz.',
    imageEmoji: '🥗',
  },

  // === JANTAR ===
  {
    id: 'dinner_lean_beef_veg',
    name: 'Carne Magra com Legumes Salteados',
    category: 'dinner',
    prepTime: '20 min',
    calories: 450,
    protein: 38,
    carbs: 25,
    fat: 20,
    fiber: 5,
    ingredients: [
      '150g carne de vaca magra (acém ou lombo)',
      '100g courgette',
      '100g pimento',
      '50g cebola',
      '1 colher sopa azeite',
      'sal, pimenta, oregãos',
    ],
    instructions: [
      'Cortar a carne em tiras finas.',
      'Cortar legumes em pedaços.',
      'Saltear carne em lume alto 3-4 min.',
      'Retirar e saltear legumes no mesmo lume.',
      'Juntar tudo, temperar e servir.',
    ],
    tips: 'Jantar leve mas proteico. Ideal para dias de treino de pernas.',
    imageEmoji: '🥩',
  },
  {
    id: 'dinner_tuna_salad',
    name: 'Atum com Salada Proteica',
    category: 'dinner',
    prepTime: '10 min',
    calories: 380,
    protein: 36,
    carbs: 18,
    fat: 18,
    fiber: 4,
    ingredients: [
      '1 lata atum ao natural (120g)',
      '2 ovos cozidos',
      '50g alface',
      '50g tomate',
      '30g milho',
      '1 colher sopa azeite',
    ],
    instructions: [
      'Escorrer o atum.',
      'Cozer os ovos (10 min).',
      'Montar a salada com alface e tomate.',
      'Adicionar atum, ovos cortados e milho.',
      'Temperar com azeite e vinagre.',
    ],
    tips: 'Sem cozinhar (excepto ovos). Rápido e com proteína elevada.',
    imageEmoji: '🥗',
  },
  {
    id: 'dinner_chicken_oven_veg',
    name: 'Frango com Legumes no Forno',
    category: 'dinner',
    prepTime: '35 min',
    calories: 480,
    protein: 40,
    carbs: 30,
    fat: 18,
    fiber: 6,
    ingredients: [
      '200g coxas de frango desossadas',
      '150g batata',
      '100g cebola',
      '100g pimento',
      '1 colher sopa azeite',
      'alecrim, sal, pimenta',
    ],
    instructions: [
      'Pré-aquecer forno a 200°C.',
      'Cortar legumes em pedaços grandes.',
      'Temperar frango com alecrim, sal e pimenta.',
      'Dispor tudo num tabuleiro com azeite.',
      'Assar 25-30 min até dourar.',
    ],
    tips: 'Receita de um tabuleiro só. Mínima preparação, máximo sabor.',
    imageEmoji: '🍗',
  },

  // === LANCHE ===
  {
    id: 'snack_tuna_wrap',
    name: 'Wrap de Atum',
    category: 'snack',
    prepTime: '5 min',
    calories: 280,
    protein: 24,
    carbs: 28,
    fat: 8,
    fiber: 2,
    ingredients: [
      '1 tortilha integral',
      '1/2 lata atum ao natural',
      '30g alface',
      '20g tomate',
      '1 colher chá mostarda',
    ],
    instructions: [
      'Escorrer o atum.',
      'Espalhar mostarda na tortilha.',
      'Adicionar alface, tomate e atum.',
      'Enrolar bem e cortar ao meio.',
    ],
    tips: 'Lanche rápido e portátil. Leva para o ginásio ou trabalho.',
    imageEmoji: '🌯',
  },
  {
    id: 'snack_yogurt_whey',
    name: 'Iogurte Grego com Whey',
    category: 'snack',
    prepTime: '2 min',
    calories: 220,
    protein: 35,
    carbs: 15,
    fat: 3,
    fiber: 0,
    ingredients: [
      '150g iogurte grego natural',
      '25g whey protein',
      '1 colher chá mel (opcional)',
    ],
    instructions: [
      'Misturar o whey no iogurte.',
      'Adicionar mel se desejado.',
      'Servir imediatamente.',
    ],
    tips: 'O lanche mais simples e proteico que existe. Ideal entre refeições.',
    imageEmoji: '🥛',
  },
  {
    id: 'snack_banana_protein_pancake',
    name: 'Panqueca de Banana e Proteína',
    category: 'snack',
    prepTime: '10 min',
    calories: 260,
    protein: 22,
    carbs: 30,
    fat: 6,
    fiber: 2,
    ingredients: [
      '1 banana madura',
      '1 ovo',
      '20g whey protein',
      '1 colher chá canela',
    ],
    instructions: [
      'Esmagar a banana com um garfo.',
      'Misturar ovo e whey até homogéneo.',
      'Aquecer frigideira antiaderente.',
      'Verter porções e virar quando dourar.',
    ],
    tips: 'Só 4 ingredientes. Perfeito como lanche pré ou pós-treino.',
    imageEmoji: '🍌',
  },

  // === PRÉ-TREINO ===
  {
    id: 'pre_banana_peanut_butter',
    name: 'Banana com Manteiga de Amendoim',
    category: 'pre_workout',
    prepTime: '2 min',
    calories: 290,
    protein: 8,
    carbs: 35,
    fat: 16,
    fiber: 4,
    ingredients: [
      '1 banana média',
      '1 colher sopa manteiga de amendoim',
    ],
    instructions: [
      'Descascar a banana.',
      'Barrar com manteiga de amendoim ou comer separado.',
    ],
    tips: 'Carbs rápidos + gordura saudável. Energia imediata para o treino.',
    imageEmoji: '🍌',
  },
  {
    id: 'pre_toast_egg',
    name: 'Torrada Integral com Ovo',
    category: 'pre_workout',
    prepTime: '8 min',
    calories: 280,
    protein: 16,
    carbs: 30,
    fat: 10,
    fiber: 3,
    ingredients: [
      '2 fatias pão integral',
      '2 ovos',
      'sal e pimenta',
      '1 colher chá azeite',
    ],
    instructions: [
      'Tostar o pão.',
      'Fritar ou escalfar os ovos.',
      'Colocar ovos sobre as torradas.',
      'Temperar com sal e pimenta.',
    ],
    tips: 'Comer 60-90 min antes do treino. Carbs lentos + proteína moderada.',
    imageEmoji: '🍞',
  },
  {
    id: 'pre_oat_whey_smoothie',
    name: 'Smoothie de Aveia e Whey',
    category: 'pre_workout',
    prepTime: '5 min',
    calories: 340,
    protein: 30,
    carbs: 42,
    fat: 6,
    fiber: 4,
    ingredients: [
      '30g aveia em flocos',
      '30g whey protein',
      '1 banana',
      '200ml leite magro ou vegetal',
      '1 colher chá mel',
    ],
    instructions: [
      'Colocar todos os ingredientes no liquidificador.',
      'Bater até ficar cremoso.',
      'Servir imediatamente.',
    ],
    tips: 'Beber 45-60 min antes do treino. Energia rápida e sustentada.',
    imageEmoji: '🥤',
  },

  // === PÓS-TREINO ===
  {
    id: 'post_chicken_rice',
    name: 'Frango com Arroz Pós-Treino',
    category: 'post_workout',
    prepTime: '20 min',
    calories: 520,
    protein: 42,
    carbs: 55,
    fat: 9,
    fiber: 2,
    ingredients: [
      '150g peito de frango',
      '120g arroz branco cozido',
      '1 colher sopa azeite',
      'sal e pimenta',
    ],
    instructions: [
      'Grelhar o frango com sal e pimenta.',
      'Cozer o arroz.',
      'Servir com um fio de azeite.',
    ],
    tips: 'Ideal para recuperação muscular após o treino. Simples e eficaz.',
    imageEmoji: '🍚',
  },
  {
    id: 'post_protein_shake_banana',
    name: 'Shake Proteico com Banana',
    category: 'post_workout',
    prepTime: '3 min',
    calories: 320,
    protein: 32,
    carbs: 38,
    fat: 4,
    fiber: 2,
    ingredients: [
      '30g whey protein',
      '1 banana',
      '250ml leite magro',
      '1 colher chá mel (opcional)',
    ],
    instructions: [
      'Colocar tudo no liquidificador.',
      'Bater até ficar cremoso.',
      'Beber nos 30 min após o treino.',
    ],
    tips: 'A janela anabólica é real. Proteína + carbs rápidos aceleram recuperação.',
    imageEmoji: '🥤',
  },
  {
    id: 'post_omelette_sweet_potato',
    name: 'Omelete com Batata Doce',
    category: 'post_workout',
    prepTime: '20 min',
    calories: 450,
    protein: 30,
    carbs: 45,
    fat: 16,
    fiber: 5,
    ingredients: [
      '3 ovos',
      '150g batata doce',
      '30g queijo fresco',
      'sal e oregãos',
      '1 colher chá azeite',
    ],
    instructions: [
      'Cozer ou assar a batata doce (15 min).',
      'Bater os ovos com sal e oregãos.',
      'Fazer a omelete com azeite.',
      'Servir com batata doce e queijo fresco.',
    ],
    tips: 'Carboidratos de baixo índice glicémico + proteína. Recuperação ideal.',
    imageEmoji: '🍳',
  },
];

// Helper functions
export const categoryLabels: Record<FitnessRecipe['category'], string> = {
  breakfast: 'Pequeno-Almoço',
  lunch: 'Almoço',
  dinner: 'Jantar',
  snack: 'Lanche',
  pre_workout: 'Pré-Treino',
  post_workout: 'Pós-Treino',
};

export const getRecipesByCategory = (category: FitnessRecipe['category']): FitnessRecipe[] => {
  return fitnessRecipes.filter(r => r.category === category);
};

export const searchRecipes = (query: string): FitnessRecipe[] => {
  const lowerQuery = query.toLowerCase();
  return fitnessRecipes.filter(recipe =>
    recipe.name.toLowerCase().includes(lowerQuery) ||
    recipe.ingredients.some(ing => ing.toLowerCase().includes(lowerQuery)) ||
    recipe.category.toLowerCase().includes(lowerQuery)
  );
};

export const getPostWorkoutSuggestions = (count: number = 3): FitnessRecipe[] => {
  const postWorkout = getRecipesByCategory('post_workout');
  const shuffled = [...postWorkout].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, postWorkout.length));
};
