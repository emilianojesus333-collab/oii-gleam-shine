// Base de dados de receitas fitness internacionais

export interface RecipeIngredient {
  name: string;
  amount: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FitnessRecipe {
  id: string;
  name: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout' | 'smoothie';
  cuisine: string;
  prepTime: number; // minutes
  cookTime: number; // minutes
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  ingredients: RecipeIngredient[];
  steps: string[];
  tips: string[];
  totalMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  tags: string[];
  imageEmoji: string;
}

export const fitnessRecipes: FitnessRecipe[] = [
  // === PEQUENOS-ALMOÇOS ===
  {
    id: 'overnight-oats-protein',
    name: 'Overnight Oats Proteico',
    category: 'breakfast',
    cuisine: 'Internacional',
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    difficulty: 'easy',
    ingredients: [
      { name: 'Aveia em flocos', amount: '50g', calories: 188, protein: 6.5, carbs: 34, fat: 3.5 },
      { name: 'Whey protein (baunilha)', amount: '30g', calories: 120, protein: 24, carbs: 3, fat: 1.5 },
      { name: 'Leite de amêndoa', amount: '200ml', calories: 26, protein: 1, carbs: 0.4, fat: 2.2 },
      { name: 'Iogurte grego', amount: '100g', calories: 59, protein: 10, carbs: 3.5, fat: 0.4 },
      { name: 'Banana', amount: '1/2 unidade', calories: 45, protein: 0.5, carbs: 11, fat: 0.2 },
      { name: 'Mel', amount: '1 colher chá', calories: 21, protein: 0, carbs: 6, fat: 0 },
    ],
    steps: [
      'Mistura a aveia, o whey protein e o iogurte grego num frasco ou recipiente.',
      'Adiciona o leite de amêndoa e mistura bem até ficar homogéneo.',
      'Corta a banana em rodelas e adiciona por cima.',
      'Regue com mel e tapa bem.',
      'Refrigera durante a noite (mínimo 6 horas).',
      'De manhã, podes comer frio ou aquecer ligeiramente.',
    ],
    tips: [
      'Prepara vários frascos ao domingo para a semana toda.',
      'Adiciona sementes de chia para mais fibra e ómega-3.',
      'Experimenta com diferentes frutas e toppings.',
    ],
    totalMacros: { calories: 459, protein: 42, carbs: 58, fat: 8, fiber: 5 },
    tags: ['proteico', 'meal-prep', 'rápido', 'sem-cozinhar'],
    imageEmoji: '🥣',
  },
  {
    id: 'egg-white-omelette',
    name: 'Omelete de Claras com Vegetais',
    category: 'breakfast',
    cuisine: 'Internacional',
    prepTime: 5,
    cookTime: 8,
    servings: 1,
    difficulty: 'easy',
    ingredients: [
      { name: 'Claras de ovo', amount: '6 unidades (180g)', calories: 93, protein: 20, carbs: 1.3, fat: 0.4 },
      { name: 'Ovo inteiro', amount: '1 unidade', calories: 78, protein: 6, carbs: 0.5, fat: 5 },
      { name: 'Espinafres frescos', amount: '50g', calories: 12, protein: 1.5, carbs: 2, fat: 0.2 },
      { name: 'Tomate cherry', amount: '50g', calories: 9, protein: 0.5, carbs: 2, fat: 0.1 },
      { name: 'Queijo feta light', amount: '30g', calories: 55, protein: 4, carbs: 1, fat: 4 },
      { name: 'Azeite', amount: '1 colher chá', calories: 40, protein: 0, carbs: 0, fat: 4.5 },
    ],
    steps: [
      'Bate as claras e o ovo inteiro num recipiente até ficar homogéneo.',
      'Aquece uma frigideira antiaderente em lume médio com o azeite.',
      'Lava e corta os espinafres e tomates.',
      'Verte os ovos batidos na frigideira e deixa cozinhar 2-3 minutos.',
      'Adiciona os espinafres e tomates numa metade da omelete.',
      'Esmigalha o queijo feta por cima dos vegetais.',
      'Dobra a omelete ao meio e cozinha mais 2-3 minutos.',
      'Serve imediatamente.',
    ],
    tips: [
      'Podes adicionar cogumelos ou pimento para mais sabor.',
      'Tempera com ervas frescas como manjericão ou oregãos.',
      'Para mais proteína, adiciona peito de peru fatiado.',
    ],
    totalMacros: { calories: 287, protein: 32, carbs: 7, fat: 14, fiber: 2 },
    tags: ['high-protein', 'low-carb', 'keto-friendly', 'rápido'],
    imageEmoji: '🍳',
  },
  {
    id: 'acai-bowl',
    name: 'Açaí Bowl Energético',
    category: 'breakfast',
    cuisine: 'Brasileira',
    prepTime: 10,
    cookTime: 0,
    servings: 1,
    difficulty: 'easy',
    ingredients: [
      { name: 'Polpa de açaí congelada', amount: '100g', calories: 70, protein: 1, carbs: 4, fat: 5 },
      { name: 'Banana congelada', amount: '1 média', calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
      { name: 'Leite de coco', amount: '100ml', calories: 19, protein: 0.2, carbs: 0.4, fat: 1.8 },
      { name: 'Granola', amount: '30g', calories: 140, protein: 3, carbs: 22, fat: 5 },
      { name: 'Morangos', amount: '50g', calories: 16, protein: 0.3, carbs: 4, fat: 0.2 },
      { name: 'Mel', amount: '1 colher sopa', calories: 64, protein: 0, carbs: 17, fat: 0 },
    ],
    steps: [
      'Coloca a polpa de açaí, banana congelada e leite de coco no liquidificador.',
      'Bate até obter uma consistência cremosa e espessa (tipo gelado).',
      'Se necessário, adiciona mais leite aos poucos.',
      'Verte para uma tigela.',
      'Decora com granola, morangos cortados e mel.',
      'Serve imediatamente antes de derreter.',
    ],
    tips: [
      'Adiciona whey protein à mistura para aumentar a proteína.',
      'Usa outras frutas como manga, mirtilo ou kiwi.',
      'Adiciona sementes de chia ou linhaça para mais nutrientes.',
    ],
    totalMacros: { calories: 414, protein: 6, carbs: 74, fat: 12, fiber: 7 },
    tags: ['antioxidantes', 'energia', 'pré-treino', 'fruta'],
    imageEmoji: '🫐',
  },
  {
    id: 'japanese-breakfast',
    name: 'Pequeno-Almoço Japonês Fit',
    category: 'breakfast',
    cuisine: 'Japonesa',
    prepTime: 15,
    cookTime: 20,
    servings: 1,
    difficulty: 'medium',
    ingredients: [
      { name: 'Arroz japonês', amount: '100g (cozido)', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
      { name: 'Salmão grelhado', amount: '80g', calories: 166, protein: 20, carbs: 0, fat: 9.5 },
      { name: 'Ovo cozido', amount: '1 unidade', calories: 78, protein: 6, carbs: 0.5, fat: 5 },
      { name: 'Tofu macio', amount: '50g', calories: 31, protein: 3, carbs: 0.7, fat: 1.9 },
      { name: 'Edamame', amount: '50g', calories: 60, protein: 5, carbs: 5, fat: 2.5 },
      { name: 'Alga nori', amount: '2 folhas', calories: 10, protein: 1, carbs: 1, fat: 0.2 },
    ],
    steps: [
      'Cozinha o arroz japonês conforme as instruções.',
      'Grelha o salmão com um pouco de sal, 4-5 minutos de cada lado.',
      'Coze o ovo durante 7 minutos (ovo mollet).',
      'Aquece o tofu numa frigideira antiaderente.',
      'Coze o edamame em água com sal durante 5 minutos.',
      'Monta o prato: arroz, salmão, ovo cortado ao meio, tofu e edamame.',
      'Decora com folhas de nori.',
    ],
    tips: [
      'Adiciona um pouco de molho de soja baixo em sódio.',
      'Substitui o salmão por atum para variar.',
      'Ideal para quem treina de manhã - energia sustentada.',
    ],
    totalMacros: { calories: 475, protein: 38, carbs: 35, fat: 19, fiber: 3 },
    tags: ['balanced', 'omega-3', 'asian', 'proteico'],
    imageEmoji: '🍱',
  },

  // === ALMOÇOS/JANTARES ===
  {
    id: 'chicken-stir-fry',
    name: 'Stir-Fry de Frango (Asiático)',
    category: 'lunch',
    cuisine: 'Asiática',
    prepTime: 15,
    cookTime: 12,
    servings: 2,
    difficulty: 'easy',
    ingredients: [
      { name: 'Peito de frango', amount: '300g', calories: 495, protein: 93, carbs: 0, fat: 10.8 },
      { name: 'Brócolos', amount: '150g', calories: 51, protein: 4.2, carbs: 10, fat: 0.6 },
      { name: 'Pimento vermelho', amount: '100g', calories: 31, protein: 1, carbs: 6, fat: 0.3 },
      { name: 'Cenoura', amount: '100g', calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
      { name: 'Molho de soja', amount: '2 colheres sopa', calories: 16, protein: 2, carbs: 1, fat: 0 },
      { name: 'Gengibre fresco', amount: '10g', calories: 8, protein: 0.2, carbs: 2, fat: 0 },
      { name: 'Alho', amount: '2 dentes', calories: 8, protein: 0.4, carbs: 2, fat: 0 },
      { name: 'Azeite de sésamo', amount: '1 colher sopa', calories: 120, protein: 0, carbs: 0, fat: 14 },
    ],
    steps: [
      'Corta o frango em cubos ou tiras finas.',
      'Corta todos os vegetais em pedaços uniformes.',
      'Aquece um wok ou frigideira grande em lume alto com o azeite.',
      'Salteia o alho e gengibre ralado durante 30 segundos.',
      'Adiciona o frango e cozinha até dourar (5-6 minutos).',
      'Adiciona os vegetais mais duros (cenoura) primeiro, depois os mais macios.',
      'Junta o molho de soja e mistura bem.',
      'Cozinha mais 3-4 minutos até os vegetais ficarem al dente.',
    ],
    tips: [
      'Serve com arroz integral ou quinoa.',
      'Adiciona amendoins torrados para textura.',
      'Podes usar cogumelos ou pak choi para variar.',
    ],
    totalMacros: { calories: 385, protein: 51, carbs: 16, fat: 13, fiber: 5 },
    tags: ['high-protein', 'low-carb', 'quick', 'meal-prep'],
    imageEmoji: '🍜',
  },
  {
    id: 'mediterranean-bowl',
    name: 'Mediterranean Power Bowl',
    category: 'lunch',
    cuisine: 'Mediterrânica',
    prepTime: 15,
    cookTime: 25,
    servings: 1,
    difficulty: 'easy',
    ingredients: [
      { name: 'Quinoa', amount: '80g (seca)', calories: 288, protein: 11, carbs: 52, fat: 5 },
      { name: 'Grão-de-bico cozido', amount: '100g', calories: 164, protein: 9, carbs: 27, fat: 2.6 },
      { name: 'Falafel assado', amount: '4 unidades', calories: 140, protein: 6, carbs: 16, fat: 6 },
      { name: 'Hummus', amount: '50g', calories: 130, protein: 4, carbs: 8, fat: 10 },
      { name: 'Pepino', amount: '80g', calories: 12, protein: 0.5, carbs: 3, fat: 0.1 },
      { name: 'Tomate', amount: '80g', calories: 14, protein: 0.7, carbs: 3, fat: 0.1 },
      { name: 'Queijo feta', amount: '30g', calories: 75, protein: 4, carbs: 1, fat: 6 },
      { name: 'Azeite', amount: '1 colher sopa', calories: 119, protein: 0, carbs: 0, fat: 13.5 },
    ],
    steps: [
      'Cozinha a quinoa conforme as instruções da embalagem.',
      'Se usares grão-de-bico de lata, escorre e lava bem.',
      'Prepara ou aquece os falafels (melhor assados para ser mais saudável).',
      'Corta o pepino e tomate em cubos.',
      'Monta a bowl: quinoa na base, grão-de-bico, falafels.',
      'Adiciona os vegetais frescos e o hummus.',
      'Esmigalha o feta por cima e regue com azeite.',
    ],
    tips: [
      'Prepara a quinoa e grão-de-bico em grandes quantidades para a semana.',
      'Adiciona azeitonas kalamata para sabor extra.',
      'Substitui o feta por queijo de cabra para variar.',
    ],
    totalMacros: { calories: 942, protein: 35, carbs: 110, fat: 43, fiber: 15 },
    tags: ['vegetariano', 'fibra', 'meal-prep', 'plant-based'],
    imageEmoji: '🥗',
  },
  {
    id: 'mexican-burrito-bowl',
    name: 'Mexican Burrito Bowl',
    category: 'lunch',
    cuisine: 'Mexicana',
    prepTime: 15,
    cookTime: 20,
    servings: 1,
    difficulty: 'easy',
    ingredients: [
      { name: 'Arroz integral', amount: '100g (cozido)', calories: 111, protein: 2.6, carbs: 23, fat: 0.9 },
      { name: 'Carne picada magra (5%)', amount: '150g', calories: 231, protein: 32, carbs: 0, fat: 11 },
      { name: 'Feijão preto cozido', amount: '80g', calories: 109, protein: 7.2, carbs: 20, fat: 0.5 },
      { name: 'Milho', amount: '50g', calories: 43, protein: 1.6, carbs: 9, fat: 0.5 },
      { name: 'Abacate', amount: '50g', calories: 80, protein: 1, carbs: 4, fat: 7.5 },
      { name: 'Pico de gallo', amount: '60g', calories: 15, protein: 0.7, carbs: 3, fat: 0.1 },
      { name: 'Iogurte grego (sour cream)', amount: '30g', calories: 18, protein: 3, carbs: 1, fat: 0.2 },
      { name: 'Queijo ralado', amount: '20g', calories: 80, protein: 5, carbs: 0.5, fat: 6.5 },
    ],
    steps: [
      'Cozinha o arroz integral conforme as instruções.',
      'Tempera a carne com cominhos, pimentão, alho em pó, sal e pimenta.',
      'Frita a carne numa frigideira até ficar bem cozinhada.',
      'Aquece o feijão preto e o milho.',
      'Prepara o pico de gallo (tomate, cebola, coentros, lima, sal).',
      'Monta a bowl: arroz na base, carne, feijão, milho.',
      'Adiciona fatias de abacate, pico de gallo, iogurte e queijo.',
      'Serve com lima e molho picante a gosto.',
    ],
    tips: [
      'Usa frango desfiado como alternativa à carne.',
      'Adiciona jalapeños para mais picante.',
      'Esta receita é ótima para meal prep.',
    ],
    totalMacros: { calories: 687, protein: 53, carbs: 61, fat: 27, fiber: 12 },
    tags: ['high-protein', 'meal-prep', 'tex-mex', 'balanced'],
    imageEmoji: '🌮',
  },
  {
    id: 'thai-peanut-chicken',
    name: 'Frango Thai com Amendoim',
    category: 'dinner',
    cuisine: 'Tailandesa',
    prepTime: 20,
    cookTime: 15,
    servings: 2,
    difficulty: 'medium',
    ingredients: [
      { name: 'Peito de frango', amount: '400g', calories: 660, protein: 124, carbs: 0, fat: 14.4 },
      { name: 'Manteiga de amendoim', amount: '60g', calories: 354, protein: 15, carbs: 12, fat: 30 },
      { name: 'Leite de coco light', amount: '100ml', calories: 76, protein: 0.7, carbs: 1.6, fat: 7.2 },
      { name: 'Molho de soja', amount: '2 colheres sopa', calories: 16, protein: 2, carbs: 1, fat: 0 },
      { name: 'Lima (sumo)', amount: '1 unidade', calories: 11, protein: 0.2, carbs: 4, fat: 0 },
      { name: 'Mel', amount: '1 colher sopa', calories: 64, protein: 0, carbs: 17, fat: 0 },
      { name: 'Gengibre', amount: '15g', calories: 12, protein: 0.3, carbs: 3, fat: 0 },
      { name: 'Amendoins torrados', amount: '30g', calories: 170, protein: 7, carbs: 5, fat: 14 },
    ],
    steps: [
      'Corta o frango em cubos ou tiras.',
      'Prepara o molho: mistura manteiga de amendoim, leite de coco, molho de soja, sumo de lima, mel e gengibre ralado.',
      'Aquece uma frigideira ou wok em lume alto.',
      'Grelha o frango até dourar e cozinhar por completo (8-10 min).',
      'Reduz o lume e adiciona o molho de amendoim.',
      'Mexe bem e deixa cozinhar 3-4 minutos até engrossar.',
      'Decora com amendoins torrados picados e coentros frescos.',
      'Serve com arroz de jasmim ou noodles de arroz.',
    ],
    tips: [
      'Marinar o frango antes aumenta o sabor.',
      'Adiciona vegetais como couve-pak-choi ou pimentos.',
      'Usa sriracha para adicionar picante.',
    ],
    totalMacros: { calories: 682, protein: 75, carbs: 22, fat: 33, fiber: 3 },
    tags: ['asian', 'high-protein', 'peanut', 'comfort-food'],
    imageEmoji: '🥜',
  },
  {
    id: 'italian-baked-salmon',
    name: 'Salmão Assado à Italiana',
    category: 'dinner',
    cuisine: 'Italiana',
    prepTime: 10,
    cookTime: 25,
    servings: 2,
    difficulty: 'easy',
    ingredients: [
      { name: 'Filetes de salmão', amount: '2 x 150g', calories: 624, protein: 75, carbs: 0, fat: 36 },
      { name: 'Tomate cherry', amount: '200g', calories: 36, protein: 2, carbs: 8, fat: 0.4 },
      { name: 'Alcaparras', amount: '20g', calories: 5, protein: 0.4, carbs: 1, fat: 0.1 },
      { name: 'Azeitonas pretas', amount: '40g', calories: 46, protein: 0.4, carbs: 2, fat: 4 },
      { name: 'Alho', amount: '3 dentes', calories: 12, protein: 0.6, carbs: 3, fat: 0 },
      { name: 'Azeite', amount: '2 colheres sopa', calories: 238, protein: 0, carbs: 0, fat: 27 },
      { name: 'Manjericão fresco', amount: '10g', calories: 2, protein: 0.3, carbs: 0.3, fat: 0 },
      { name: 'Limão', amount: '1 unidade', calories: 17, protein: 0.6, carbs: 5, fat: 0.2 },
    ],
    steps: [
      'Pré-aquece o forno a 200°C.',
      'Coloca os filetes de salmão num tabuleiro.',
      'Corta os tomates cherry ao meio.',
      'Espalha os tomates, alcaparras, azeitonas e alho fatiado à volta do salmão.',
      'Regue tudo com azeite, sumo de limão, sal e pimenta.',
      'Assa durante 20-25 minutos.',
      'Decora com manjericão fresco antes de servir.',
      'Serve com batata assada ou salada verde.',
    ],
    tips: [
      'Não cozinhes demasiado o salmão para ficar suculento.',
      'Podes adicionar espargos ao tabuleiro.',
      'Experimenta com ervas como tomilho ou alecrim.',
    ],
    totalMacros: { calories: 490, protein: 40, carbs: 10, fat: 34, fiber: 2 },
    tags: ['omega-3', 'mediterranean', 'easy', 'one-pan'],
    imageEmoji: '🐟',
  },
  {
    id: 'korean-bibimbap',
    name: 'Bibimbap Coreano Fit',
    category: 'lunch',
    cuisine: 'Coreana',
    prepTime: 25,
    cookTime: 20,
    servings: 2,
    difficulty: 'medium',
    ingredients: [
      { name: 'Arroz integral', amount: '200g (cozido)', calories: 222, protein: 5.2, carbs: 46, fat: 1.8 },
      { name: 'Carne de vaca magra', amount: '200g', calories: 306, protein: 42, carbs: 0, fat: 14 },
      { name: 'Espinafres', amount: '100g', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
      { name: 'Cenoura ralada', amount: '80g', calories: 33, protein: 0.7, carbs: 8, fat: 0.2 },
      { name: 'Cogumelos shiitake', amount: '80g', calories: 27, protein: 1.8, carbs: 5.5, fat: 0.4 },
      { name: 'Ovo frito', amount: '2 unidades', calories: 180, protein: 12, carbs: 1, fat: 14 },
      { name: 'Gochujang (pasta picante)', amount: '2 colheres sopa', calories: 50, protein: 1, carbs: 10, fat: 1 },
      { name: 'Azeite de sésamo', amount: '1 colher sopa', calories: 120, protein: 0, carbs: 0, fat: 14 },
    ],
    steps: [
      'Cozinha o arroz integral.',
      'Marina a carne com molho de soja, alho, azeite de sésamo e um pouco de açúcar.',
      'Escalda os espinafres e tempera com azeite de sésamo e sal.',
      'Salteia a cenoura ralada até ficar macia.',
      'Grelha os cogumelos com um pouco de molho de soja.',
      'Grelha a carne marinada em lume alto.',
      'Frita os ovos com a gema mole.',
      'Monta nas tigelas: arroz na base, vegetais em secções, carne no meio.',
      'Coloca o ovo por cima e serve com gochujang.',
    ],
    tips: [
      'Mistura tudo antes de comer para incorporar os sabores.',
      'Adiciona kimchi para probióticos.',
      'Podes usar tofu em vez de carne para versão vegetariana.',
    ],
    totalMacros: { calories: 481, protein: 33, carbs: 37, fat: 23, fiber: 4 },
    tags: ['korean', 'balanced', 'colorful', 'umami'],
    imageEmoji: '🍚',
  },

  // === SNACKS & PRÉ/PÓS TREINO ===
  {
    id: 'protein-energy-balls',
    name: 'Energy Balls Proteicas',
    category: 'snack',
    cuisine: 'Internacional',
    prepTime: 15,
    cookTime: 0,
    servings: 12,
    difficulty: 'easy',
    ingredients: [
      { name: 'Aveia em flocos', amount: '100g', calories: 375, protein: 13, carbs: 67, fat: 7 },
      { name: 'Manteiga de amendoim', amount: '80g', calories: 472, protein: 20, carbs: 16, fat: 40 },
      { name: 'Mel', amount: '60g', calories: 192, protein: 0, carbs: 52, fat: 0 },
      { name: 'Whey protein (chocolate)', amount: '30g', calories: 120, protein: 24, carbs: 3, fat: 1.5 },
      { name: 'Pepitas de chocolate negro', amount: '40g', calories: 214, protein: 2, carbs: 24, fat: 14 },
      { name: 'Sementes de chia', amount: '20g', calories: 97, protein: 3.3, carbs: 8, fat: 6.1 },
    ],
    steps: [
      'Coloca todos os ingredientes numa tigela grande.',
      'Mistura bem com as mãos ou uma colher até ficar homogéneo.',
      'Se a mistura estiver muito seca, adiciona mais mel.',
      'Se estiver muito húmida, adiciona mais aveia.',
      'Com as mãos húmidas, forma 12 bolas do tamanho de uma noz.',
      'Refrigera durante pelo menos 30 minutos.',
      'Guarda num recipiente fechado no frigorífico até 1 semana.',
    ],
    tips: [
      'Experimenta diferentes sabores de whey.',
      'Adiciona coco ralado por fora para variar.',
      'Perfeitas como snack pré-treino 1 hora antes.',
    ],
    totalMacros: { calories: 123, protein: 5, carbs: 14, fat: 6, fiber: 2 },
    tags: ['snack', 'no-bake', 'meal-prep', 'portable'],
    imageEmoji: '🟤',
  },
  {
    id: 'post-workout-shake',
    name: 'Batido Pós-Treino Completo',
    category: 'post_workout',
    cuisine: 'Internacional',
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    difficulty: 'easy',
    ingredients: [
      { name: 'Whey protein', amount: '40g', calories: 160, protein: 32, carbs: 4, fat: 2 },
      { name: 'Banana', amount: '1 grande', calories: 121, protein: 1.5, carbs: 31, fat: 0.4 },
      { name: 'Leite magro', amount: '300ml', calories: 99, protein: 10, carbs: 15, fat: 0.6 },
      { name: 'Aveia', amount: '30g', calories: 113, protein: 4, carbs: 20, fat: 2 },
      { name: 'Manteiga de amendoim', amount: '15g', calories: 88, protein: 4, carbs: 3, fat: 7.5 },
      { name: 'Mel', amount: '1 colher chá', calories: 21, protein: 0, carbs: 6, fat: 0 },
    ],
    steps: [
      'Coloca todos os ingredientes no liquidificador.',
      'Bate em velocidade alta durante 1-2 minutos.',
      'Se preferires mais líquido, adiciona mais leite.',
      'Bebe imediatamente após o treino (até 30 minutos).',
    ],
    tips: [
      'Congela a banana para um batido mais cremoso.',
      'Adiciona gelo se quiseres mais fresco.',
      'Ideal consumir até 30 minutos após o treino.',
    ],
    totalMacros: { calories: 602, protein: 52, carbs: 79, fat: 13, fiber: 5 },
    tags: ['post-workout', 'high-protein', 'recovery', 'shake'],
    imageEmoji: '🥤',
  },
  {
    id: 'pre-workout-toast',
    name: 'Torrada Pré-Treino',
    category: 'pre_workout',
    cuisine: 'Internacional',
    prepTime: 5,
    cookTime: 3,
    servings: 1,
    difficulty: 'easy',
    ingredients: [
      { name: 'Pão integral', amount: '2 fatias', calories: 138, protein: 7.2, carbs: 24, fat: 2 },
      { name: 'Manteiga de amendoim', amount: '30g', calories: 177, protein: 7.5, carbs: 6, fat: 15 },
      { name: 'Banana', amount: '1 média', calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
      { name: 'Mel', amount: '1 colher chá', calories: 21, protein: 0, carbs: 6, fat: 0 },
      { name: 'Canela', amount: 'pitada', calories: 2, protein: 0, carbs: 0.5, fat: 0 },
    ],
    steps: [
      'Tosta as fatias de pão.',
      'Espalha a manteiga de amendoim uniformemente.',
      'Corta a banana em rodelas e dispõe sobre a torrada.',
      'Regue com mel e polvilha com canela.',
      'Serve imediatamente.',
    ],
    tips: [
      'Come 45-60 minutos antes do treino.',
      'Podes usar manteiga de amêndoa como alternativa.',
      'A combinação de carbs + gorduras + pouca proteína é ideal pré-treino.',
    ],
    totalMacros: { calories: 443, protein: 16, carbs: 64, fat: 17, fiber: 6 },
    tags: ['pre-workout', 'quick', 'energy', 'easy'],
    imageEmoji: '🍞',
  },

  // === SMOOTHIES ===
  {
    id: 'green-power-smoothie',
    name: 'Green Power Smoothie',
    category: 'smoothie',
    cuisine: 'Internacional',
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    difficulty: 'easy',
    ingredients: [
      { name: 'Espinafres frescos', amount: '60g', calories: 14, protein: 1.7, carbs: 2.2, fat: 0.2 },
      { name: 'Banana congelada', amount: '1 média', calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
      { name: 'Maçã verde', amount: '1 pequena', calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
      { name: 'Gengibre fresco', amount: '5g', calories: 4, protein: 0.1, carbs: 1, fat: 0 },
      { name: 'Leite de amêndoa', amount: '250ml', calories: 33, protein: 1.3, carbs: 0.5, fat: 2.8 },
      { name: 'Sementes de chia', amount: '10g', calories: 49, protein: 1.7, carbs: 4, fat: 3 },
    ],
    steps: [
      'Coloca o leite de amêndoa no liquidificador primeiro.',
      'Adiciona os espinafres e bate até ficarem triturados.',
      'Junta a banana, maçã cortada e gengibre.',
      'Bate até ficar cremoso e homogéneo.',
      'Adiciona as sementes de chia e pulsa rapidamente.',
      'Serve imediatamente.',
    ],
    tips: [
      'Usa espinafres baby para um sabor mais suave.',
      'Adiciona proteína em pó para pós-treino.',
      'Congela os espinafres para um smoothie mais fresco.',
    ],
    totalMacros: { calories: 257, protein: 6, carbs: 49, fat: 7, fiber: 8 },
    tags: ['detox', 'vitamins', 'green', 'healthy'],
    imageEmoji: '🥬',
  },
  {
    id: 'berry-protein-smoothie',
    name: 'Berry Protein Smoothie',
    category: 'smoothie',
    cuisine: 'Internacional',
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    difficulty: 'easy',
    ingredients: [
      { name: 'Frutos vermelhos congelados', amount: '150g', calories: 70, protein: 1.5, carbs: 16, fat: 0.5 },
      { name: 'Whey protein (baunilha)', amount: '30g', calories: 120, protein: 24, carbs: 3, fat: 1.5 },
      { name: 'Iogurte grego', amount: '100g', calories: 59, protein: 10, carbs: 3.5, fat: 0.4 },
      { name: 'Leite de aveia', amount: '200ml', calories: 80, protein: 2, carbs: 14, fat: 2 },
      { name: 'Mel', amount: '1 colher chá', calories: 21, protein: 0, carbs: 6, fat: 0 },
    ],
    steps: [
      'Adiciona o leite e iogurte ao liquidificador.',
      'Junta os frutos vermelhos congelados.',
      'Adiciona o whey protein.',
      'Bate em velocidade alta até ficar homogéneo.',
      'Adiciona mel se preferires mais doce.',
      'Serve imediatamente num copo grande.',
    ],
    tips: [
      'Usa frutos frescos + gelo se não tiveres congelados.',
      'Adiciona sementes de linhaça para ómega-3.',
      'Perfeito para recuperação pós-treino.',
    ],
    totalMacros: { calories: 350, protein: 38, carbs: 43, fat: 5, fiber: 4 },
    tags: ['antioxidants', 'post-workout', 'protein', 'berries'],
    imageEmoji: '🍓',
  },

  // === PRATOS INTERNACIONAIS ===
  {
    id: 'indian-chicken-tikka',
    name: 'Chicken Tikka Masala Light',
    category: 'dinner',
    cuisine: 'Indiana',
    prepTime: 20,
    cookTime: 30,
    servings: 4,
    difficulty: 'medium',
    ingredients: [
      { name: 'Peito de frango', amount: '600g', calories: 990, protein: 186, carbs: 0, fat: 21.6 },
      { name: 'Iogurte grego', amount: '200g', calories: 118, protein: 20, carbs: 7, fat: 0.8 },
      { name: 'Tomate pelado (lata)', amount: '400g', calories: 72, protein: 4, carbs: 16, fat: 0.4 },
      { name: 'Cebola', amount: '2 médias', calories: 88, protein: 2.4, carbs: 20, fat: 0.2 },
      { name: 'Leite de coco light', amount: '200ml', calories: 152, protein: 1.4, carbs: 3.2, fat: 14.4 },
      { name: 'Garam masala', amount: '2 colheres sopa', calories: 30, protein: 1, carbs: 5, fat: 1 },
      { name: 'Gengibre', amount: '20g', calories: 16, protein: 0.4, carbs: 4, fat: 0 },
      { name: 'Alho', amount: '4 dentes', calories: 16, protein: 0.8, carbs: 4, fat: 0 },
    ],
    steps: [
      'Marina o frango com iogurte, garam masala, sal e gengibre durante 2 horas.',
      'Grelha o frango no forno a 220°C durante 15-20 minutos.',
      'Numa panela, refoga a cebola, alho e gengibre até dourar.',
      'Adiciona o tomate pelado e deixa cozinhar 10 minutos.',
      'Tritura o molho com a varinha mágica.',
      'Adiciona o leite de coco e mais garam masala.',
      'Junta o frango grelhado e deixa apurar 5-10 minutos.',
      'Serve com arroz basmati.',
    ],
    tips: [
      'A marinada de iogurte torna o frango muito suculento.',
      'Usa coentros frescos para decorar.',
      'Acompanha com naan integral caseiro.',
    ],
    totalMacros: { calories: 371, protein: 54, carbs: 15, fat: 10, fiber: 2 },
    tags: ['indian', 'spicy', 'curry', 'high-protein'],
    imageEmoji: '🍛',
  },
  {
    id: 'greek-grilled-chicken',
    name: 'Frango Grego com Tzatziki',
    category: 'lunch',
    cuisine: 'Grega',
    prepTime: 15,
    cookTime: 20,
    servings: 2,
    difficulty: 'easy',
    ingredients: [
      { name: 'Peito de frango', amount: '400g', calories: 660, protein: 124, carbs: 0, fat: 14.4 },
      { name: 'Iogurte grego', amount: '200g', calories: 118, protein: 20, carbs: 7, fat: 0.8 },
      { name: 'Pepino', amount: '100g', calories: 15, protein: 0.6, carbs: 4, fat: 0.1 },
      { name: 'Alho', amount: '2 dentes', calories: 8, protein: 0.4, carbs: 2, fat: 0 },
      { name: 'Limão', amount: '1 unidade', calories: 17, protein: 0.6, carbs: 5, fat: 0.2 },
      { name: 'Azeite', amount: '2 colheres sopa', calories: 238, protein: 0, carbs: 0, fat: 27 },
      { name: 'Oregãos secos', amount: '1 colher sopa', calories: 8, protein: 0.3, carbs: 2, fat: 0.2 },
      { name: 'Endro fresco', amount: '10g', calories: 4, protein: 0.3, carbs: 1, fat: 0.1 },
    ],
    steps: [
      'Marina o frango com azeite, sumo de limão, oregãos, alho e sal durante 1 hora.',
      'Prepara o tzatziki: rala o pepino e espreme para tirar o líquido.',
      'Mistura o pepino com iogurte, alho picado, endro e azeite.',
      'Tempera com sal e sumo de limão.',
      'Grelha o frango numa frigideira ou grelhador quente, 6-7 min por lado.',
      'Deixa repousar 5 minutos antes de cortar.',
      'Serve com tzatziki, salada grega e pão pita.',
    ],
    tips: [
      'A marinada de limão ajuda a amaciar o frango.',
      'Usa iogurte grego espesso para o tzatziki.',
      'Acompanha com tomate, pepino, azeitonas e feta.',
    ],
    totalMacros: { calories: 534, protein: 73, carbs: 11, fat: 21, fiber: 1 },
    tags: ['greek', 'mediterranean', 'high-protein', 'fresh'],
    imageEmoji: '🇬🇷',
  },
  {
    id: 'teriyaki-salmon-bowl',
    name: 'Salmon Teriyaki Bowl',
    category: 'dinner',
    cuisine: 'Japonesa',
    prepTime: 10,
    cookTime: 15,
    servings: 2,
    difficulty: 'easy',
    ingredients: [
      { name: 'Filetes de salmão', amount: '2 x 150g', calories: 624, protein: 75, carbs: 0, fat: 36 },
      { name: 'Arroz de jasmim', amount: '200g (cozido)', calories: 260, protein: 5.4, carbs: 56, fat: 0.6 },
      { name: 'Molho de soja', amount: '3 colheres sopa', calories: 24, protein: 3, carbs: 1.5, fat: 0 },
      { name: 'Mirin', amount: '2 colheres sopa', calories: 70, protein: 0, carbs: 14, fat: 0 },
      { name: 'Mel', amount: '1 colher sopa', calories: 64, protein: 0, carbs: 17, fat: 0 },
      { name: 'Edamame', amount: '100g', calories: 120, protein: 10, carbs: 10, fat: 5 },
      { name: 'Cenoura', amount: '80g', calories: 33, protein: 0.7, carbs: 8, fat: 0.2 },
      { name: 'Sementes de sésamo', amount: '10g', calories: 57, protein: 1.8, carbs: 2, fat: 5 },
    ],
    steps: [
      'Prepara o molho teriyaki: mistura soja, mirin e mel numa panela pequena.',
      'Aquece até engrossar ligeiramente (2-3 minutos).',
      'Cozinha o arroz conforme as instruções.',
      'Coze o edamame em água com sal durante 5 minutos.',
      'Grelha os filetes de salmão 4-5 minutos por lado.',
      'Pincela com molho teriyaki nos últimos 2 minutos.',
      'Rala a cenoura ou corta em juliana.',
      'Monta as bowls: arroz, salmão, edamame, cenoura.',
      'Polvilha com sementes de sésamo.',
    ],
    tips: [
      'Usa salmão fresco para melhor resultado.',
      'Adiciona abacate para gorduras saudáveis extra.',
      'Podes fazer o molho teriyaki em maior quantidade e guardar.',
    ],
    totalMacros: { calories: 626, protein: 48, carbs: 54, fat: 23, fiber: 4 },
    tags: ['japanese', 'omega-3', 'bowls', 'asian'],
    imageEmoji: '🍣',
  },
];

// Helper functions
export const getRecipesByCategory = (category: FitnessRecipe['category']): FitnessRecipe[] => {
  return fitnessRecipes.filter(recipe => recipe.category === category);
};

export const getRecipesByCuisine = (cuisine: string): FitnessRecipe[] => {
  return fitnessRecipes.filter(recipe => 
    recipe.cuisine.toLowerCase().includes(cuisine.toLowerCase())
  );
};

export const searchRecipes = (query: string): FitnessRecipe[] => {
  const lowerQuery = query.toLowerCase();
  return fitnessRecipes.filter(recipe =>
    recipe.name.toLowerCase().includes(lowerQuery) ||
    recipe.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
    recipe.cuisine.toLowerCase().includes(lowerQuery) ||
    recipe.ingredients.some(ing => ing.name.toLowerCase().includes(lowerQuery))
  );
};

export const getHighProteinRecipes = (minProtein: number = 30): FitnessRecipe[] => {
  return fitnessRecipes.filter(recipe => 
    (recipe.totalMacros.protein / recipe.servings) >= minProtein
  );
};

export const getQuickRecipes = (maxTime: number = 20): FitnessRecipe[] => {
  return fitnessRecipes.filter(recipe => 
    (recipe.prepTime + recipe.cookTime) <= maxTime
  );
};

export const categoryLabels: Record<FitnessRecipe['category'], string> = {
  breakfast: 'Pequeno-Almoço',
  lunch: 'Almoço',
  dinner: 'Jantar',
  snack: 'Snack',
  pre_workout: 'Pré-Treino',
  post_workout: 'Pós-Treino',
  smoothie: 'Smoothie',
};
