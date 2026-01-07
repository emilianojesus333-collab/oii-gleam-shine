// Bilingual fitness recipes database
import { getCurrentLanguage } from '@/hooks/useLanguage';

export interface RecipeIngredient {
  name: { en: string; pt: string };
  amount: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FitnessRecipe {
  id: string;
  name: { en: string; pt: string };
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout' | 'smoothie';
  cuisine: { en: string; pt: string };
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  ingredients: RecipeIngredient[];
  steps: { en: string; pt: string }[];
  tips: { en: string; pt: string }[];
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

// Helper to get localized text
export const getLocalizedText = (text: { en: string; pt: string }): string => {
  const lang = getCurrentLanguage();
  return text[lang] || text.en;
};

export const fitnessRecipesData: FitnessRecipe[] = [
  // === BREAKFASTS ===
  {
    id: 'overnight-oats-protein',
    name: { en: 'Protein Overnight Oats', pt: 'Overnight Oats Proteico' },
    category: 'breakfast',
    cuisine: { en: 'International', pt: 'Internacional' },
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    difficulty: 'easy',
    ingredients: [
      { name: { en: 'Rolled oats', pt: 'Aveia em flocos' }, amount: '50g', calories: 188, protein: 6.5, carbs: 34, fat: 3.5 },
      { name: { en: 'Vanilla whey protein', pt: 'Whey protein (baunilha)' }, amount: '30g', calories: 120, protein: 24, carbs: 3, fat: 1.5 },
      { name: { en: 'Almond milk', pt: 'Leite de amêndoa' }, amount: '200ml', calories: 26, protein: 1, carbs: 0.4, fat: 2.2 },
      { name: { en: 'Greek yogurt', pt: 'Iogurte grego' }, amount: '100g', calories: 59, protein: 10, carbs: 3.5, fat: 0.4 },
      { name: { en: 'Banana', pt: 'Banana' }, amount: '1/2', calories: 45, protein: 0.5, carbs: 11, fat: 0.2 },
      { name: { en: 'Honey', pt: 'Mel' }, amount: '1 tsp', calories: 21, protein: 0, carbs: 6, fat: 0 },
    ],
    steps: [
      { en: 'Mix oats, whey protein, and Greek yogurt in a jar or container.', pt: 'Mistura a aveia, o whey protein e o iogurte grego num frasco ou recipiente.' },
      { en: 'Add almond milk and mix well until smooth.', pt: 'Adiciona o leite de amêndoa e mistura bem até ficar homogéneo.' },
      { en: 'Slice the banana and add on top.', pt: 'Corta a banana em rodelas e adiciona por cima.' },
      { en: 'Drizzle with honey and seal well.', pt: 'Regue com mel e tapa bem.' },
      { en: 'Refrigerate overnight (minimum 6 hours).', pt: 'Refrigera durante a noite (mínimo 6 horas).' },
      { en: 'In the morning, eat cold or heat slightly.', pt: 'De manhã, podes comer frio ou aquecer ligeiramente.' },
    ],
    tips: [
      { en: 'Prepare several jars on Sunday for the whole week.', pt: 'Prepara vários frascos ao domingo para a semana toda.' },
      { en: 'Add chia seeds for more fiber and omega-3.', pt: 'Adiciona sementes de chia para mais fibra e ómega-3.' },
      { en: 'Try with different fruits and toppings.', pt: 'Experimenta com diferentes frutas e toppings.' },
    ],
    totalMacros: { calories: 459, protein: 42, carbs: 58, fat: 8, fiber: 5 },
    tags: ['high-protein', 'meal-prep', 'quick', 'no-cook'],
    imageEmoji: '🥣',
  },
  {
    id: 'egg-white-omelette',
    name: { en: 'Egg White Vegetable Omelette', pt: 'Omelete de Claras com Vegetais' },
    category: 'breakfast',
    cuisine: { en: 'International', pt: 'Internacional' },
    prepTime: 5,
    cookTime: 8,
    servings: 1,
    difficulty: 'easy',
    ingredients: [
      { name: { en: 'Egg whites', pt: 'Claras de ovo' }, amount: '6 (180g)', calories: 93, protein: 20, carbs: 1.3, fat: 0.4 },
      { name: { en: 'Whole egg', pt: 'Ovo inteiro' }, amount: '1', calories: 78, protein: 6, carbs: 0.5, fat: 5 },
      { name: { en: 'Fresh spinach', pt: 'Espinafres frescos' }, amount: '50g', calories: 12, protein: 1.5, carbs: 2, fat: 0.2 },
      { name: { en: 'Cherry tomatoes', pt: 'Tomate cherry' }, amount: '50g', calories: 9, protein: 0.5, carbs: 2, fat: 0.1 },
      { name: { en: 'Light feta cheese', pt: 'Queijo feta light' }, amount: '30g', calories: 55, protein: 4, carbs: 1, fat: 4 },
      { name: { en: 'Olive oil', pt: 'Azeite' }, amount: '1 tsp', calories: 40, protein: 0, carbs: 0, fat: 4.5 },
    ],
    steps: [
      { en: 'Beat the egg whites and whole egg in a bowl until smooth.', pt: 'Bate as claras e o ovo inteiro num recipiente até ficar homogéneo.' },
      { en: 'Heat a non-stick pan over medium heat with olive oil.', pt: 'Aquece uma frigideira antiaderente em lume médio com o azeite.' },
      { en: 'Wash and cut spinach and tomatoes.', pt: 'Lava e corta os espinafres e tomates.' },
      { en: 'Pour beaten eggs into the pan and cook for 2-3 minutes.', pt: 'Verte os ovos batidos na frigideira e deixa cozinhar 2-3 minutos.' },
      { en: 'Add spinach and tomatoes to one half of the omelette.', pt: 'Adiciona os espinafres e tomates numa metade da omelete.' },
      { en: 'Crumble feta cheese over the vegetables.', pt: 'Esmigalha o queijo feta por cima dos vegetais.' },
      { en: 'Fold the omelette in half and cook 2-3 more minutes.', pt: 'Dobra a omelete ao meio e cozinha mais 2-3 minutos.' },
      { en: 'Serve immediately.', pt: 'Serve imediatamente.' },
    ],
    tips: [
      { en: 'You can add mushrooms or peppers for more flavor.', pt: 'Podes adicionar cogumelos ou pimento para mais sabor.' },
      { en: 'Season with fresh herbs like basil or oregano.', pt: 'Tempera com ervas frescas como manjericão ou oregãos.' },
      { en: 'For more protein, add sliced turkey breast.', pt: 'Para mais proteína, adiciona peito de peru fatiado.' },
    ],
    totalMacros: { calories: 287, protein: 32, carbs: 7, fat: 14, fiber: 2 },
    tags: ['high-protein', 'low-carb', 'keto-friendly', 'quick'],
    imageEmoji: '🍳',
  },
  {
    id: 'acai-bowl',
    name: { en: 'Energizing Açaí Bowl', pt: 'Açaí Bowl Energético' },
    category: 'breakfast',
    cuisine: { en: 'Brazilian', pt: 'Brasileira' },
    prepTime: 10,
    cookTime: 0,
    servings: 1,
    difficulty: 'easy',
    ingredients: [
      { name: { en: 'Frozen açaí pulp', pt: 'Polpa de açaí congelada' }, amount: '100g', calories: 70, protein: 1, carbs: 4, fat: 5 },
      { name: { en: 'Frozen banana', pt: 'Banana congelada' }, amount: '1 medium', calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
      { name: { en: 'Coconut milk', pt: 'Leite de coco' }, amount: '100ml', calories: 19, protein: 0.2, carbs: 0.4, fat: 1.8 },
      { name: { en: 'Granola', pt: 'Granola' }, amount: '30g', calories: 140, protein: 3, carbs: 22, fat: 5 },
      { name: { en: 'Strawberries', pt: 'Morangos' }, amount: '50g', calories: 16, protein: 0.3, carbs: 4, fat: 0.2 },
      { name: { en: 'Honey', pt: 'Mel' }, amount: '1 tbsp', calories: 64, protein: 0, carbs: 17, fat: 0 },
    ],
    steps: [
      { en: 'Put açaí pulp, frozen banana, and coconut milk in the blender.', pt: 'Coloca a polpa de açaí, banana congelada e leite de coco no liquidificador.' },
      { en: 'Blend until smooth and thick (like ice cream consistency).', pt: 'Bate até obter uma consistência cremosa e espessa (tipo gelado).' },
      { en: 'If needed, add more milk gradually.', pt: 'Se necessário, adiciona mais leite aos poucos.' },
      { en: 'Pour into a bowl.', pt: 'Verte para uma tigela.' },
      { en: 'Top with granola, sliced strawberries, and honey.', pt: 'Decora com granola, morangos cortados e mel.' },
      { en: 'Serve immediately before melting.', pt: 'Serve imediatamente antes de derreter.' },
    ],
    tips: [
      { en: 'Add whey protein to the mix to increase protein.', pt: 'Adiciona whey protein à mistura para aumentar a proteína.' },
      { en: 'Use other fruits like mango, blueberry, or kiwi.', pt: 'Usa outras frutas como manga, mirtilo ou kiwi.' },
      { en: 'Add chia or flax seeds for more nutrients.', pt: 'Adiciona sementes de chia ou linhaça para mais nutrientes.' },
    ],
    totalMacros: { calories: 414, protein: 6, carbs: 74, fat: 12, fiber: 7 },
    tags: ['antioxidants', 'energy', 'pre-workout', 'fruit'],
    imageEmoji: '🫐',
  },
  {
    id: 'japanese-breakfast',
    name: { en: 'Fit Japanese Breakfast', pt: 'Pequeno-Almoço Japonês Fit' },
    category: 'breakfast',
    cuisine: { en: 'Japanese', pt: 'Japonesa' },
    prepTime: 15,
    cookTime: 20,
    servings: 1,
    difficulty: 'medium',
    ingredients: [
      { name: { en: 'Japanese rice', pt: 'Arroz japonês' }, amount: '100g (cooked)', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
      { name: { en: 'Grilled salmon', pt: 'Salmão grelhado' }, amount: '80g', calories: 166, protein: 20, carbs: 0, fat: 9.5 },
      { name: { en: 'Boiled egg', pt: 'Ovo cozido' }, amount: '1', calories: 78, protein: 6, carbs: 0.5, fat: 5 },
      { name: { en: 'Soft tofu', pt: 'Tofu macio' }, amount: '50g', calories: 31, protein: 3, carbs: 0.7, fat: 1.9 },
      { name: { en: 'Edamame', pt: 'Edamame' }, amount: '50g', calories: 60, protein: 5, carbs: 5, fat: 2.5 },
      { name: { en: 'Nori seaweed', pt: 'Alga nori' }, amount: '2 sheets', calories: 10, protein: 1, carbs: 1, fat: 0.2 },
    ],
    steps: [
      { en: 'Cook Japanese rice according to instructions.', pt: 'Cozinha o arroz japonês conforme as instruções.' },
      { en: 'Grill salmon with a bit of salt, 4-5 minutes each side.', pt: 'Grelha o salmão com um pouco de sal, 4-5 minutos de cada lado.' },
      { en: 'Boil egg for 7 minutes (soft-boiled).', pt: 'Coze o ovo durante 7 minutos (ovo mollet).' },
      { en: 'Heat tofu in a non-stick pan.', pt: 'Aquece o tofu numa frigideira antiaderente.' },
      { en: 'Boil edamame in salted water for 5 minutes.', pt: 'Coze o edamame em água com sal durante 5 minutos.' },
      { en: 'Plate: rice, salmon, halved egg, tofu, and edamame.', pt: 'Monta o prato: arroz, salmão, ovo cortado ao meio, tofu e edamame.' },
      { en: 'Garnish with nori sheets.', pt: 'Decora com folhas de nori.' },
    ],
    tips: [
      { en: 'Add a bit of low-sodium soy sauce.', pt: 'Adiciona um pouco de molho de soja baixo em sódio.' },
      { en: 'Substitute salmon with tuna for variety.', pt: 'Substitui o salmão por atum para variar.' },
      { en: 'Ideal for morning trainers - sustained energy.', pt: 'Ideal para quem treina de manhã - energia sustentada.' },
    ],
    totalMacros: { calories: 475, protein: 38, carbs: 35, fat: 19, fiber: 3 },
    tags: ['balanced', 'omega-3', 'asian', 'high-protein'],
    imageEmoji: '🍱',
  },

  // === LUNCHES/DINNERS ===
  {
    id: 'chicken-stir-fry',
    name: { en: 'Asian Chicken Stir-Fry', pt: 'Stir-Fry de Frango (Asiático)' },
    category: 'lunch',
    cuisine: { en: 'Asian', pt: 'Asiática' },
    prepTime: 15,
    cookTime: 12,
    servings: 2,
    difficulty: 'easy',
    ingredients: [
      { name: { en: 'Chicken breast', pt: 'Peito de frango' }, amount: '300g', calories: 495, protein: 93, carbs: 0, fat: 10.8 },
      { name: { en: 'Broccoli', pt: 'Brócolos' }, amount: '150g', calories: 51, protein: 4.2, carbs: 10, fat: 0.6 },
      { name: { en: 'Red bell pepper', pt: 'Pimento vermelho' }, amount: '100g', calories: 31, protein: 1, carbs: 6, fat: 0.3 },
      { name: { en: 'Carrot', pt: 'Cenoura' }, amount: '100g', calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
      { name: { en: 'Soy sauce', pt: 'Molho de soja' }, amount: '2 tbsp', calories: 16, protein: 2, carbs: 1, fat: 0 },
      { name: { en: 'Fresh ginger', pt: 'Gengibre fresco' }, amount: '10g', calories: 8, protein: 0.2, carbs: 2, fat: 0 },
      { name: { en: 'Garlic', pt: 'Alho' }, amount: '2 cloves', calories: 8, protein: 0.4, carbs: 2, fat: 0 },
      { name: { en: 'Sesame oil', pt: 'Azeite de sésamo' }, amount: '1 tbsp', calories: 120, protein: 0, carbs: 0, fat: 14 },
    ],
    steps: [
      { en: 'Cut chicken into cubes or thin strips.', pt: 'Corta o frango em cubos ou tiras finas.' },
      { en: 'Cut all vegetables into uniform pieces.', pt: 'Corta todos os vegetais em pedaços uniformes.' },
      { en: 'Heat a wok or large pan over high heat with oil.', pt: 'Aquece um wok ou frigideira grande em lume alto com o azeite.' },
      { en: 'Sauté garlic and grated ginger for 30 seconds.', pt: 'Salteia o alho e gengibre ralado durante 30 segundos.' },
      { en: 'Add chicken and cook until golden (5-6 minutes).', pt: 'Adiciona o frango e cozinha até dourar (5-6 minutos).' },
      { en: 'Add harder vegetables (carrots) first, then softer ones.', pt: 'Adiciona os vegetais mais duros (cenoura) primeiro, depois os mais macios.' },
      { en: 'Add soy sauce and mix well.', pt: 'Junta o molho de soja e mistura bem.' },
      { en: 'Cook 3-4 more minutes until vegetables are al dente.', pt: 'Cozinha mais 3-4 minutos até os vegetais ficarem al dente.' },
    ],
    tips: [
      { en: 'Serve with brown rice or quinoa.', pt: 'Serve com arroz integral ou quinoa.' },
      { en: 'Add roasted peanuts for texture.', pt: 'Adiciona amendoins torrados para textura.' },
      { en: 'You can use mushrooms or bok choy for variety.', pt: 'Podes usar cogumelos ou pak choi para variar.' },
    ],
    totalMacros: { calories: 385, protein: 51, carbs: 16, fat: 13, fiber: 5 },
    tags: ['high-protein', 'low-carb', 'quick', 'meal-prep'],
    imageEmoji: '🍜',
  },
  {
    id: 'mediterranean-bowl',
    name: { en: 'Mediterranean Power Bowl', pt: 'Mediterranean Power Bowl' },
    category: 'lunch',
    cuisine: { en: 'Mediterranean', pt: 'Mediterrânica' },
    prepTime: 15,
    cookTime: 25,
    servings: 1,
    difficulty: 'easy',
    ingredients: [
      { name: { en: 'Quinoa', pt: 'Quinoa' }, amount: '80g (dry)', calories: 288, protein: 11, carbs: 52, fat: 5 },
      { name: { en: 'Cooked chickpeas', pt: 'Grão-de-bico cozido' }, amount: '100g', calories: 164, protein: 9, carbs: 27, fat: 2.6 },
      { name: { en: 'Baked falafel', pt: 'Falafel assado' }, amount: '4 pieces', calories: 140, protein: 6, carbs: 16, fat: 6 },
      { name: { en: 'Hummus', pt: 'Hummus' }, amount: '50g', calories: 130, protein: 4, carbs: 8, fat: 10 },
      { name: { en: 'Cucumber', pt: 'Pepino' }, amount: '80g', calories: 12, protein: 0.5, carbs: 3, fat: 0.1 },
      { name: { en: 'Tomato', pt: 'Tomate' }, amount: '80g', calories: 14, protein: 0.7, carbs: 3, fat: 0.1 },
      { name: { en: 'Feta cheese', pt: 'Queijo feta' }, amount: '30g', calories: 75, protein: 4, carbs: 1, fat: 6 },
      { name: { en: 'Olive oil', pt: 'Azeite' }, amount: '1 tbsp', calories: 119, protein: 0, carbs: 0, fat: 13.5 },
    ],
    steps: [
      { en: 'Cook quinoa according to package instructions.', pt: 'Cozinha a quinoa conforme as instruções da embalagem.' },
      { en: 'If using canned chickpeas, drain and rinse well.', pt: 'Se usares grão-de-bico de lata, escorre e lava bem.' },
      { en: 'Prepare or heat falafel (baked is healthier).', pt: 'Prepara ou aquece os falafels (melhor assados para ser mais saudável).' },
      { en: 'Cut cucumber and tomato into cubes.', pt: 'Corta o pepino e tomate em cubos.' },
      { en: 'Assemble bowl: quinoa base, chickpeas, falafel.', pt: 'Monta a bowl: quinoa na base, grão-de-bico, falafels.' },
      { en: 'Add fresh vegetables and hummus.', pt: 'Adiciona os vegetais frescos e o hummus.' },
      { en: 'Crumble feta on top and drizzle with olive oil.', pt: 'Esmigalha o feta por cima e regue com azeite.' },
    ],
    tips: [
      { en: 'Prep quinoa and chickpeas in bulk for the week.', pt: 'Prepara a quinoa e grão-de-bico em grandes quantidades para a semana.' },
      { en: 'Add kalamata olives for extra flavor.', pt: 'Adiciona azeitonas kalamata para sabor extra.' },
      { en: 'Substitute feta with goat cheese for variety.', pt: 'Substitui o feta por queijo de cabra para variar.' },
    ],
    totalMacros: { calories: 942, protein: 35, carbs: 110, fat: 43, fiber: 15 },
    tags: ['vegetarian', 'fiber', 'meal-prep', 'plant-based'],
    imageEmoji: '🥗',
  },
  {
    id: 'mexican-burrito-bowl',
    name: { en: 'Mexican Burrito Bowl', pt: 'Mexican Burrito Bowl' },
    category: 'lunch',
    cuisine: { en: 'Mexican', pt: 'Mexicana' },
    prepTime: 15,
    cookTime: 20,
    servings: 1,
    difficulty: 'easy',
    ingredients: [
      { name: { en: 'Brown rice', pt: 'Arroz integral' }, amount: '100g (cooked)', calories: 111, protein: 2.6, carbs: 23, fat: 0.9 },
      { name: { en: 'Lean ground beef (5%)', pt: 'Carne picada magra (5%)' }, amount: '150g', calories: 231, protein: 32, carbs: 0, fat: 11 },
      { name: { en: 'Cooked black beans', pt: 'Feijão preto cozido' }, amount: '80g', calories: 109, protein: 7.2, carbs: 20, fat: 0.5 },
      { name: { en: 'Corn', pt: 'Milho' }, amount: '50g', calories: 43, protein: 1.6, carbs: 9, fat: 0.5 },
      { name: { en: 'Avocado', pt: 'Abacate' }, amount: '50g', calories: 80, protein: 1, carbs: 4, fat: 7.5 },
      { name: { en: 'Pico de gallo', pt: 'Pico de gallo' }, amount: '60g', calories: 15, protein: 0.7, carbs: 3, fat: 0.1 },
      { name: { en: 'Greek yogurt (sour cream)', pt: 'Iogurte grego (sour cream)' }, amount: '30g', calories: 18, protein: 3, carbs: 1, fat: 0.2 },
      { name: { en: 'Shredded cheese', pt: 'Queijo ralado' }, amount: '20g', calories: 80, protein: 5, carbs: 0.5, fat: 6.5 },
    ],
    steps: [
      { en: 'Cook brown rice according to instructions.', pt: 'Cozinha o arroz integral conforme as instruções.' },
      { en: 'Season meat with cumin, paprika, garlic powder, salt and pepper.', pt: 'Tempera a carne com cominhos, pimentão, alho em pó, sal e pimenta.' },
      { en: 'Fry meat in a pan until fully cooked.', pt: 'Frita a carne numa frigideira até ficar bem cozinhada.' },
      { en: 'Heat black beans and corn.', pt: 'Aquece o feijão preto e o milho.' },
      { en: 'Make pico de gallo (tomato, onion, cilantro, lime, salt).', pt: 'Prepara o pico de gallo (tomate, cebola, coentros, lima, sal).' },
      { en: 'Assemble bowl: rice base, meat, beans, corn.', pt: 'Monta a bowl: arroz na base, carne, feijão, milho.' },
      { en: 'Add avocado slices, pico de gallo, yogurt, and cheese.', pt: 'Adiciona fatias de abacate, pico de gallo, iogurte e queijo.' },
      { en: 'Serve with lime and hot sauce to taste.', pt: 'Serve com lima e molho picante a gosto.' },
    ],
    tips: [
      { en: 'Use shredded chicken as an alternative to beef.', pt: 'Usa frango desfiado como alternativa à carne.' },
      { en: 'Add jalapeños for more spice.', pt: 'Adiciona jalapeños para mais picante.' },
      { en: 'This recipe is great for meal prep.', pt: 'Esta receita é ótima para meal prep.' },
    ],
    totalMacros: { calories: 687, protein: 53, carbs: 61, fat: 27, fiber: 12 },
    tags: ['high-protein', 'meal-prep', 'tex-mex', 'balanced'],
    imageEmoji: '🌮',
  },
  {
    id: 'thai-peanut-chicken',
    name: { en: 'Thai Peanut Chicken', pt: 'Frango Thai com Amendoim' },
    category: 'dinner',
    cuisine: { en: 'Thai', pt: 'Tailandesa' },
    prepTime: 20,
    cookTime: 15,
    servings: 2,
    difficulty: 'medium',
    ingredients: [
      { name: { en: 'Chicken breast', pt: 'Peito de frango' }, amount: '400g', calories: 660, protein: 124, carbs: 0, fat: 14.4 },
      { name: { en: 'Peanut butter', pt: 'Manteiga de amendoim' }, amount: '60g', calories: 354, protein: 15, carbs: 12, fat: 30 },
      { name: { en: 'Light coconut milk', pt: 'Leite de coco light' }, amount: '100ml', calories: 76, protein: 0.7, carbs: 1.6, fat: 7.2 },
      { name: { en: 'Soy sauce', pt: 'Molho de soja' }, amount: '2 tbsp', calories: 16, protein: 2, carbs: 1, fat: 0 },
      { name: { en: 'Lime juice', pt: 'Lima (sumo)' }, amount: '1', calories: 11, protein: 0.2, carbs: 4, fat: 0 },
      { name: { en: 'Honey', pt: 'Mel' }, amount: '1 tbsp', calories: 64, protein: 0, carbs: 17, fat: 0 },
      { name: { en: 'Ginger', pt: 'Gengibre' }, amount: '15g', calories: 12, protein: 0.3, carbs: 3, fat: 0 },
      { name: { en: 'Roasted peanuts', pt: 'Amendoins torrados' }, amount: '30g', calories: 170, protein: 7, carbs: 5, fat: 14 },
    ],
    steps: [
      { en: 'Cut chicken into cubes or strips.', pt: 'Corta o frango em cubos ou tiras.' },
      { en: 'Make sauce: mix peanut butter, coconut milk, soy sauce, lime juice, honey, and grated ginger.', pt: 'Prepara o molho: mistura manteiga de amendoim, leite de coco, molho de soja, sumo de lima, mel e gengibre ralado.' },
      { en: 'Heat a pan or wok over high heat.', pt: 'Aquece uma frigideira ou wok em lume alto.' },
      { en: 'Grill chicken until golden and fully cooked (8-10 min).', pt: 'Grelha o frango até dourar e cozinhar por completo (8-10 min).' },
      { en: 'Reduce heat and add peanut sauce.', pt: 'Reduz o lume e adiciona o molho de amendoim.' },
      { en: 'Stir well and cook 3-4 minutes until thickened.', pt: 'Mexe bem e deixa cozinhar 3-4 minutos até engrossar.' },
      { en: 'Garnish with chopped roasted peanuts and fresh cilantro.', pt: 'Decora com amendoins torrados picados e coentros frescos.' },
      { en: 'Serve with jasmine rice or rice noodles.', pt: 'Serve com arroz de jasmim ou noodles de arroz.' },
    ],
    tips: [
      { en: 'Marinating the chicken beforehand increases flavor.', pt: 'Marinar o frango antes aumenta o sabor.' },
      { en: 'Add vegetables like bok choy or bell peppers.', pt: 'Adiciona vegetais como couve-pak-choi ou pimentos.' },
      { en: 'Use sriracha to add spice.', pt: 'Usa sriracha para adicionar picante.' },
    ],
    totalMacros: { calories: 682, protein: 75, carbs: 22, fat: 33, fiber: 3 },
    tags: ['asian', 'high-protein', 'peanut', 'comfort-food'],
    imageEmoji: '🥜',
  },
  {
    id: 'italian-baked-salmon',
    name: { en: 'Italian Baked Salmon', pt: 'Salmão Assado à Italiana' },
    category: 'dinner',
    cuisine: { en: 'Italian', pt: 'Italiana' },
    prepTime: 10,
    cookTime: 25,
    servings: 2,
    difficulty: 'easy',
    ingredients: [
      { name: { en: 'Salmon fillets', pt: 'Filetes de salmão' }, amount: '2 x 150g', calories: 624, protein: 75, carbs: 0, fat: 36 },
      { name: { en: 'Cherry tomatoes', pt: 'Tomate cherry' }, amount: '200g', calories: 36, protein: 2, carbs: 8, fat: 0.4 },
      { name: { en: 'Capers', pt: 'Alcaparras' }, amount: '20g', calories: 5, protein: 0.4, carbs: 1, fat: 0.1 },
      { name: { en: 'Black olives', pt: 'Azeitonas pretas' }, amount: '40g', calories: 46, protein: 0.4, carbs: 2, fat: 4 },
      { name: { en: 'Garlic', pt: 'Alho' }, amount: '3 cloves', calories: 12, protein: 0.6, carbs: 3, fat: 0 },
      { name: { en: 'Olive oil', pt: 'Azeite' }, amount: '2 tbsp', calories: 238, protein: 0, carbs: 0, fat: 27 },
      { name: { en: 'Fresh basil', pt: 'Manjericão fresco' }, amount: '10g', calories: 2, protein: 0.3, carbs: 0.3, fat: 0 },
      { name: { en: 'Lemon', pt: 'Limão' }, amount: '1', calories: 17, protein: 0.6, carbs: 5, fat: 0.2 },
    ],
    steps: [
      { en: 'Preheat oven to 200°C.', pt: 'Pré-aquece o forno a 200°C.' },
      { en: 'Place salmon fillets on a baking tray.', pt: 'Coloca os filetes de salmão num tabuleiro.' },
      { en: 'Cut cherry tomatoes in half.', pt: 'Corta os tomates cherry ao meio.' },
      { en: 'Spread tomatoes, capers, olives, and sliced garlic around salmon.', pt: 'Espalha os tomates, alcaparras, azeitonas e alho fatiado à volta do salmão.' },
      { en: 'Drizzle everything with olive oil, lemon juice, salt, and pepper.', pt: 'Regue tudo com azeite, sumo de limão, sal e pimenta.' },
      { en: 'Bake for 20-25 minutes.', pt: 'Assa durante 20-25 minutos.' },
      { en: 'Garnish with fresh basil before serving.', pt: 'Decora com manjericão fresco antes de servir.' },
      { en: 'Serve with roasted potato or green salad.', pt: 'Serve com batata assada ou salada verde.' },
    ],
    tips: [
      { en: "Don't overcook salmon to keep it juicy.", pt: 'Não cozinhes demasiado o salmão para ficar suculento.' },
      { en: 'You can add asparagus to the tray.', pt: 'Podes adicionar espargos ao tabuleiro.' },
      { en: 'Try with herbs like thyme or rosemary.', pt: 'Experimenta com ervas como tomilho ou alecrim.' },
    ],
    totalMacros: { calories: 490, protein: 40, carbs: 10, fat: 34, fiber: 2 },
    tags: ['omega-3', 'mediterranean', 'easy', 'one-pan'],
    imageEmoji: '🐟',
  },
  {
    id: 'korean-bibimbap',
    name: { en: 'Fit Korean Bibimbap', pt: 'Bibimbap Coreano Fit' },
    category: 'lunch',
    cuisine: { en: 'Korean', pt: 'Coreana' },
    prepTime: 25,
    cookTime: 20,
    servings: 2,
    difficulty: 'medium',
    ingredients: [
      { name: { en: 'Brown rice', pt: 'Arroz integral' }, amount: '200g (cooked)', calories: 222, protein: 5.2, carbs: 46, fat: 1.8 },
      { name: { en: 'Lean beef', pt: 'Carne de vaca magra' }, amount: '200g', calories: 306, protein: 42, carbs: 0, fat: 14 },
      { name: { en: 'Spinach', pt: 'Espinafres' }, amount: '100g', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
      { name: { en: 'Shredded carrot', pt: 'Cenoura ralada' }, amount: '80g', calories: 33, protein: 0.7, carbs: 8, fat: 0.2 },
      { name: { en: 'Shiitake mushrooms', pt: 'Cogumelos shiitake' }, amount: '80g', calories: 27, protein: 1.8, carbs: 5.5, fat: 0.4 },
      { name: { en: 'Fried egg', pt: 'Ovo frito' }, amount: '2', calories: 180, protein: 12, carbs: 1, fat: 14 },
      { name: { en: 'Gochujang (spicy paste)', pt: 'Gochujang (pasta picante)' }, amount: '2 tbsp', calories: 50, protein: 1, carbs: 10, fat: 1 },
      { name: { en: 'Sesame oil', pt: 'Azeite de sésamo' }, amount: '1 tbsp', calories: 120, protein: 0, carbs: 0, fat: 14 },
    ],
    steps: [
      { en: 'Cook brown rice.', pt: 'Cozinha o arroz integral.' },
      { en: 'Marinate beef with soy sauce, garlic, sesame oil, and a bit of sugar.', pt: 'Marina a carne com molho de soja, alho, azeite de sésamo e um pouco de açúcar.' },
      { en: 'Blanch spinach and season with sesame oil and salt.', pt: 'Escalda os espinafres e tempera com azeite de sésamo e sal.' },
      { en: 'Sauté shredded carrot until soft.', pt: 'Salteia a cenoura ralada até ficar macia.' },
      { en: 'Grill mushrooms with a bit of soy sauce.', pt: 'Grelha os cogumelos com um pouco de molho de soja.' },
      { en: 'Grill marinated beef over high heat.', pt: 'Grelha a carne marinada em lume alto.' },
      { en: 'Fry eggs sunny-side up.', pt: 'Frita os ovos estrelados.' },
      { en: 'Assemble: rice base, arrange toppings around, egg on top, gochujang in center.', pt: 'Monta: arroz na base, dispõe os ingredientes à volta, ovo por cima, gochujang no centro.' },
    ],
    tips: [
      { en: 'Mix everything before eating for the authentic experience.', pt: 'Mistura tudo antes de comer para a experiência autêntica.' },
      { en: 'Add kimchi for more probiotics.', pt: 'Adiciona kimchi para mais probióticos.' },
      { en: 'Use tofu instead of beef for vegetarian option.', pt: 'Usa tofu em vez de carne para versão vegetariana.' },
    ],
    totalMacros: { calories: 481, protein: 33, carbs: 37, fat: 23, fiber: 5 },
    tags: ['asian', 'balanced', 'colorful', 'korean'],
    imageEmoji: '🍚',
  },

  // === SNACKS ===
  {
    id: 'protein-energy-balls',
    name: { en: 'Protein Energy Balls', pt: 'Energy Balls Proteicas' },
    category: 'snack',
    cuisine: { en: 'International', pt: 'Internacional' },
    prepTime: 15,
    cookTime: 0,
    servings: 12,
    difficulty: 'easy',
    ingredients: [
      { name: { en: 'Rolled oats', pt: 'Aveia em flocos' }, amount: '100g', calories: 376, protein: 13, carbs: 68, fat: 7 },
      { name: { en: 'Peanut butter', pt: 'Manteiga de amendoim' }, amount: '80g', calories: 472, protein: 20, carbs: 16, fat: 40 },
      { name: { en: 'Honey', pt: 'Mel' }, amount: '40g', calories: 128, protein: 0, carbs: 34, fat: 0 },
      { name: { en: 'Chocolate whey protein', pt: 'Whey protein (chocolate)' }, amount: '30g', calories: 120, protein: 24, carbs: 3, fat: 1.5 },
      { name: { en: 'Dark chocolate chips', pt: 'Pepitas de chocolate negro' }, amount: '40g', calories: 220, protein: 2.4, carbs: 24, fat: 14 },
      { name: { en: 'Chia seeds', pt: 'Sementes de chia' }, amount: '20g', calories: 97, protein: 3.3, carbs: 8.4, fat: 6.2 },
    ],
    steps: [
      { en: 'Mix all dry ingredients in a large bowl.', pt: 'Mistura todos os ingredientes secos numa tigela grande.' },
      { en: 'Add peanut butter and honey.', pt: 'Adiciona a manteiga de amendoim e o mel.' },
      { en: 'Mix well until mixture is uniform.', pt: 'Mistura bem até a massa ficar uniforme.' },
      { en: 'Refrigerate for 15 minutes to firm up.', pt: 'Refrigera 15 minutos para firmar.' },
      { en: 'Form small balls (about 25g each).', pt: 'Forma pequenas bolas (cerca de 25g cada).' },
      { en: 'Store in fridge for up to 2 weeks.', pt: 'Guarda no frigorífico até 2 semanas.' },
    ],
    tips: [
      { en: "If too dry, add more honey; if too wet, add oats.", pt: 'Se ficar seco demais, adiciona mais mel; se húmido, mais aveia.' },
      { en: 'Perfect for pre-workout or afternoon snack.', pt: 'Perfeito para pré-treino ou lanche da tarde.' },
      { en: 'Try different flavors: vanilla, coconut, matcha.', pt: 'Experimenta sabores diferentes: baunilha, coco, matcha.' },
    ],
    totalMacros: { calories: 1413, protein: 63, carbs: 153, fat: 69, fiber: 12 },
    tags: ['no-cook', 'meal-prep', 'portable', 'high-protein'],
    imageEmoji: '🍫',
  },
  {
    id: 'greek-tzatziki-veggies',
    name: { en: 'Tzatziki with Veggies', pt: 'Tzatziki com Vegetais' },
    category: 'snack',
    cuisine: { en: 'Greek', pt: 'Grega' },
    prepTime: 10,
    cookTime: 0,
    servings: 2,
    difficulty: 'easy',
    ingredients: [
      { name: { en: 'Greek yogurt', pt: 'Iogurte grego' }, amount: '200g', calories: 118, protein: 20, carbs: 7, fat: 0.8 },
      { name: { en: 'Cucumber', pt: 'Pepino' }, amount: '100g', calories: 15, protein: 0.6, carbs: 3.6, fat: 0.1 },
      { name: { en: 'Garlic', pt: 'Alho' }, amount: '2 cloves', calories: 8, protein: 0.4, carbs: 2, fat: 0 },
      { name: { en: 'Lemon juice', pt: 'Sumo de limão' }, amount: '1 tbsp', calories: 4, protein: 0.1, carbs: 1.3, fat: 0 },
      { name: { en: 'Carrot sticks', pt: 'Palitos de cenoura' }, amount: '100g', calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
      { name: { en: 'Celery sticks', pt: 'Palitos de aipo' }, amount: '100g', calories: 16, protein: 0.7, carbs: 3, fat: 0.2 },
    ],
    steps: [
      { en: 'Grate cucumber and squeeze out excess water.', pt: 'Rala o pepino e espreme para tirar o excesso de água.' },
      { en: 'Mince garlic very finely.', pt: 'Pica o alho muito finamente.' },
      { en: 'Mix yogurt with cucumber and garlic.', pt: 'Mistura o iogurte com pepino e alho.' },
      { en: 'Add lemon juice, salt, pepper, and olive oil.', pt: 'Adiciona sumo de limão, sal, pimenta e azeite.' },
      { en: 'Cut carrots and celery into sticks.', pt: 'Corta cenouras e aipo em palitos.' },
      { en: 'Serve tzatziki with vegetable sticks.', pt: 'Serve o tzatziki com os palitos de vegetais.' },
    ],
    tips: [
      { en: 'Add fresh dill for authentic flavor.', pt: 'Adiciona endro fresco para sabor autêntico.' },
      { en: 'Use cucumber sticks and bell peppers too.', pt: 'Usa também pepino e pimentos em palitos.' },
      { en: 'Great protein-rich snack.', pt: 'Ótimo snack rico em proteína.' },
    ],
    totalMacros: { calories: 202, protein: 23, carbs: 27, fat: 1, fiber: 5 },
    tags: ['greek', 'high-protein', 'low-carb', 'vegetarian'],
    imageEmoji: '🥒',
  },

  // === SMOOTHIES ===
  {
    id: 'green-power-smoothie',
    name: { en: 'Green Power Smoothie', pt: 'Smoothie Verde Power' },
    category: 'smoothie',
    cuisine: { en: 'International', pt: 'Internacional' },
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    difficulty: 'easy',
    ingredients: [
      { name: { en: 'Spinach', pt: 'Espinafres' }, amount: '50g', calories: 12, protein: 1.5, carbs: 2, fat: 0.2 },
      { name: { en: 'Banana', pt: 'Banana' }, amount: '1 medium', calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
      { name: { en: 'Pineapple', pt: 'Ananás' }, amount: '100g', calories: 50, protein: 0.5, carbs: 13, fat: 0.1 },
      { name: { en: 'Vanilla whey protein', pt: 'Whey protein (baunilha)' }, amount: '30g', calories: 120, protein: 24, carbs: 3, fat: 1.5 },
      { name: { en: 'Almond milk', pt: 'Leite de amêndoa' }, amount: '250ml', calories: 33, protein: 1.3, carbs: 0.5, fat: 2.8 },
      { name: { en: 'Chia seeds', pt: 'Sementes de chia' }, amount: '10g', calories: 49, protein: 1.7, carbs: 4.2, fat: 3.1 },
    ],
    steps: [
      { en: 'Add all ingredients to blender.', pt: 'Adiciona todos os ingredientes ao liquidificador.' },
      { en: 'Blend for 1-2 minutes until smooth.', pt: 'Bate durante 1-2 minutos até ficar cremoso.' },
      { en: 'Add ice if you prefer colder.', pt: 'Adiciona gelo se preferires mais fresco.' },
      { en: 'Serve immediately.', pt: 'Serve imediatamente.' },
    ],
    tips: [
      { en: 'Use frozen banana for thicker texture.', pt: 'Usa banana congelada para textura mais espessa.' },
      { en: 'Add fresh ginger for extra boost.', pt: 'Adiciona gengibre fresco para boost extra.' },
      { en: 'Perfect for breakfast or post-workout.', pt: 'Perfeito para pequeno-almoço ou pós-treino.' },
    ],
    totalMacros: { calories: 369, protein: 30, carbs: 50, fat: 8, fiber: 7 },
    tags: ['smoothie', 'green', 'high-protein', 'quick'],
    imageEmoji: '🥬',
  },
  {
    id: 'berry-blast-smoothie',
    name: { en: 'Berry Blast Smoothie', pt: 'Smoothie Explosão de Berries' },
    category: 'smoothie',
    cuisine: { en: 'International', pt: 'Internacional' },
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    difficulty: 'easy',
    ingredients: [
      { name: { en: 'Mixed berries (frozen)', pt: 'Mix de berries (congelados)' }, amount: '150g', calories: 60, protein: 1, carbs: 14, fat: 0.5 },
      { name: { en: 'Greek yogurt', pt: 'Iogurte grego' }, amount: '150g', calories: 89, protein: 15, carbs: 5, fat: 0.6 },
      { name: { en: 'Vanilla whey protein', pt: 'Whey protein (baunilha)' }, amount: '25g', calories: 100, protein: 20, carbs: 2.5, fat: 1.3 },
      { name: { en: 'Almond milk', pt: 'Leite de amêndoa' }, amount: '150ml', calories: 20, protein: 0.8, carbs: 0.3, fat: 1.7 },
      { name: { en: 'Honey', pt: 'Mel' }, amount: '1 tsp', calories: 21, protein: 0, carbs: 6, fat: 0 },
    ],
    steps: [
      { en: 'Add all ingredients to blender.', pt: 'Adiciona todos os ingredientes ao liquidificador.' },
      { en: 'Blend for 1-2 minutes until creamy.', pt: 'Bate durante 1-2 minutos até ficar cremoso.' },
      { en: 'Adjust consistency with more milk if needed.', pt: 'Ajusta a consistência com mais leite se necessário.' },
      { en: 'Serve cold.', pt: 'Serve fresco.' },
    ],
    tips: [
      { en: 'Rich in antioxidants from berries.', pt: 'Rico em antioxidantes dos berries.' },
      { en: 'Perfect for post-workout.', pt: 'Perfeito para pós-treino.' },
      { en: 'Add oats for more carbs.', pt: 'Adiciona aveia para mais hidratos.' },
    ],
    totalMacros: { calories: 290, protein: 37, carbs: 28, fat: 4, fiber: 4 },
    tags: ['smoothie', 'berries', 'high-protein', 'antioxidants'],
    imageEmoji: '🫐',
  },

  // === PRE/POST WORKOUT ===
  {
    id: 'pre-workout-toast',
    name: { en: 'Pre-Workout Energy Toast', pt: 'Tosta Energética Pré-Treino' },
    category: 'pre_workout',
    cuisine: { en: 'International', pt: 'Internacional' },
    prepTime: 5,
    cookTime: 2,
    servings: 1,
    difficulty: 'easy',
    ingredients: [
      { name: { en: 'Whole grain bread', pt: 'Pão integral' }, amount: '2 slices', calories: 160, protein: 8, carbs: 26, fat: 2 },
      { name: { en: 'Peanut butter', pt: 'Manteiga de amendoim' }, amount: '30g', calories: 177, protein: 7.5, carbs: 6, fat: 15 },
      { name: { en: 'Banana', pt: 'Banana' }, amount: '1 medium', calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
      { name: { en: 'Honey', pt: 'Mel' }, amount: '1 tsp', calories: 21, protein: 0, carbs: 6, fat: 0 },
    ],
    steps: [
      { en: 'Toast bread to your liking.', pt: 'Tosta o pão a gosto.' },
      { en: 'Spread peanut butter on both slices.', pt: 'Barra com manteiga de amendoim.' },
      { en: 'Slice banana and place on top.', pt: 'Corta a banana e coloca por cima.' },
      { en: 'Drizzle with honey.', pt: 'Regue com mel.' },
    ],
    tips: [
      { en: 'Eat 30-60 minutes before training.', pt: 'Come 30-60 minutos antes do treino.' },
      { en: 'Quick carbs for immediate energy.', pt: 'Hidratos rápidos para energia imediata.' },
      { en: 'Add cinnamon for extra flavor.', pt: 'Adiciona canela para sabor extra.' },
    ],
    totalMacros: { calories: 463, protein: 17, carbs: 65, fat: 17, fiber: 6 },
    tags: ['pre-workout', 'quick', 'carbs', 'energy'],
    imageEmoji: '🍞',
  },
  {
    id: 'post-workout-shake',
    name: { en: 'Anabolic Post-Workout Shake', pt: 'Batido Anabólico Pós-Treino' },
    category: 'post_workout',
    cuisine: { en: 'International', pt: 'Internacional' },
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    difficulty: 'easy',
    ingredients: [
      { name: { en: 'Whey protein', pt: 'Whey protein' }, amount: '40g', calories: 160, protein: 32, carbs: 4, fat: 2 },
      { name: { en: 'Banana', pt: 'Banana' }, amount: '1 large', calories: 121, protein: 1.5, carbs: 31, fat: 0.5 },
      { name: { en: 'Rolled oats', pt: 'Aveia em flocos' }, amount: '40g', calories: 150, protein: 5.2, carbs: 27, fat: 2.8 },
      { name: { en: 'Skim milk', pt: 'Leite magro' }, amount: '300ml', calories: 99, protein: 10.2, carbs: 15, fat: 0.6 },
      { name: { en: 'Honey', pt: 'Mel' }, amount: '1 tbsp', calories: 64, protein: 0, carbs: 17, fat: 0 },
    ],
    steps: [
      { en: 'Add all ingredients to blender.', pt: 'Adiciona todos os ingredientes ao liquidificador.' },
      { en: 'Blend for 2 minutes until completely smooth.', pt: 'Bate durante 2 minutos até ficar completamente homogéneo.' },
      { en: 'Drink within 30 minutes of training.', pt: 'Bebe nos 30 minutos após o treino.' },
    ],
    tips: [
      { en: 'Ideal ratio of protein and carbs for recovery.', pt: 'Proporção ideal de proteína e hidratos para recuperação.' },
      { en: 'Add creatine if you supplement.', pt: 'Adiciona creatina se suplementares.' },
      { en: 'Use chocolate whey for flavor variety.', pt: 'Usa whey de chocolate para variar o sabor.' },
    ],
    totalMacros: { calories: 594, protein: 49, carbs: 94, fat: 6, fiber: 4 },
    tags: ['post-workout', 'high-protein', 'recovery', 'anabolic'],
    imageEmoji: '💪',
  },

  // === MORE INTERNATIONAL RECIPES ===
  {
    id: 'indian-chicken-curry',
    name: { en: 'Healthy Indian Chicken Curry', pt: 'Caril de Frango Indiano Saudável' },
    category: 'dinner',
    cuisine: { en: 'Indian', pt: 'Indiana' },
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    difficulty: 'medium',
    ingredients: [
      { name: { en: 'Chicken breast', pt: 'Peito de frango' }, amount: '500g', calories: 825, protein: 155, carbs: 0, fat: 18 },
      { name: { en: 'Light coconut milk', pt: 'Leite de coco light' }, amount: '200ml', calories: 152, protein: 1.4, carbs: 3.2, fat: 14.4 },
      { name: { en: 'Greek yogurt', pt: 'Iogurte grego' }, amount: '100g', calories: 59, protein: 10, carbs: 3.5, fat: 0.4 },
      { name: { en: 'Onion', pt: 'Cebola' }, amount: '1 large', calories: 44, protein: 1.2, carbs: 10, fat: 0.1 },
      { name: { en: 'Crushed tomatoes', pt: 'Tomate triturado' }, amount: '200g', calories: 36, protein: 1.8, carbs: 8, fat: 0.2 },
      { name: { en: 'Curry powder', pt: 'Curry em pó' }, amount: '2 tbsp', calories: 40, protein: 1.6, carbs: 7, fat: 1.4 },
      { name: { en: 'Turmeric', pt: 'Curcuma' }, amount: '1 tsp', calories: 8, protein: 0.3, carbs: 1.4, fat: 0.2 },
      { name: { en: 'Olive oil', pt: 'Azeite' }, amount: '2 tbsp', calories: 238, protein: 0, carbs: 0, fat: 27 },
    ],
    steps: [
      { en: 'Cut chicken into cubes and marinate with yogurt and half the spices.', pt: 'Corta o frango em cubos e marina com iogurte e metade das especiarias.' },
      { en: 'Sauté diced onion in olive oil until golden.', pt: 'Refoga a cebola picada em azeite até dourar.' },
      { en: 'Add remaining spices and cook for 1 minute.', pt: 'Adiciona o resto das especiarias e cozinha 1 minuto.' },
      { en: 'Add crushed tomatoes and simmer for 10 minutes.', pt: 'Adiciona o tomate triturado e deixa ferver 10 minutos.' },
      { en: 'Add marinated chicken and cook for 15 minutes.', pt: 'Adiciona o frango marinado e cozinha 15 minutos.' },
      { en: 'Add coconut milk and simmer for 5 more minutes.', pt: 'Adiciona o leite de coco e deixa apurar 5 minutos.' },
      { en: 'Garnish with fresh cilantro.', pt: 'Decora com coentros frescos.' },
      { en: 'Serve with basmati rice.', pt: 'Serve com arroz basmati.' },
    ],
    tips: [
      { en: 'Use Greek yogurt for creaminess without extra fat.', pt: 'Usa iogurte grego para cremosidade sem gordura extra.' },
      { en: 'Add spinach for more nutrients.', pt: 'Adiciona espinafres para mais nutrientes.' },
      { en: 'Adjust spice level to taste.', pt: 'Ajusta o nível de picante a gosto.' },
    ],
    totalMacros: { calories: 350, protein: 43, carbs: 8, fat: 15, fiber: 2 },
    tags: ['indian', 'curry', 'high-protein', 'spicy'],
    imageEmoji: '🍛',
  },
  {
    id: 'teriyaki-salmon-bowl',
    name: { en: 'Teriyaki Salmon Bowl', pt: 'Bowl de Salmão Teriyaki' },
    category: 'dinner',
    cuisine: { en: 'Japanese', pt: 'Japonesa' },
    prepTime: 15,
    cookTime: 15,
    servings: 2,
    difficulty: 'easy',
    ingredients: [
      { name: { en: 'Salmon fillets', pt: 'Filetes de salmão' }, amount: '2 x 150g', calories: 624, protein: 75, carbs: 0, fat: 36 },
      { name: { en: 'Sushi rice', pt: 'Arroz para sushi' }, amount: '200g (cooked)', calories: 260, protein: 5.4, carbs: 56, fat: 0.6 },
      { name: { en: 'Soy sauce', pt: 'Molho de soja' }, amount: '3 tbsp', calories: 24, protein: 3, carbs: 1.5, fat: 0 },
      { name: { en: 'Honey', pt: 'Mel' }, amount: '2 tbsp', calories: 128, protein: 0, carbs: 34, fat: 0 },
      { name: { en: 'Edamame', pt: 'Edamame' }, amount: '100g', calories: 120, protein: 10, carbs: 10, fat: 5 },
      { name: { en: 'Avocado', pt: 'Abacate' }, amount: '1 medium', calories: 160, protein: 2, carbs: 8, fat: 15 },
      { name: { en: 'Sesame seeds', pt: 'Sementes de sésamo' }, amount: '1 tbsp', calories: 52, protein: 1.6, carbs: 2, fat: 4.5 },
    ],
    steps: [
      { en: 'Make teriyaki sauce: mix soy sauce, honey, and a bit of ginger.', pt: 'Prepara o molho teriyaki: mistura molho de soja, mel e um pouco de gengibre.' },
      { en: 'Marinate salmon in half the sauce for 10 minutes.', pt: 'Marina o salmão em metade do molho durante 10 minutos.' },
      { en: 'Cook sushi rice according to package.', pt: 'Cozinha o arroz para sushi conforme a embalagem.' },
      { en: 'Grill or bake salmon for 10-12 minutes.', pt: 'Grelha ou assa o salmão durante 10-12 minutos.' },
      { en: 'Cook edamame in boiling salted water.', pt: 'Coze o edamame em água a ferver com sal.' },
      { en: 'Assemble bowl: rice, flaked salmon, sliced avocado, edamame.', pt: 'Monta a bowl: arroz, salmão desfiado, abacate fatiado, edamame.' },
      { en: 'Drizzle with remaining teriyaki sauce.', pt: 'Regue com o resto do molho teriyaki.' },
      { en: 'Sprinkle with sesame seeds.', pt: 'Polvilha com sementes de sésamo.' },
    ],
    tips: [
      { en: 'Add pickled ginger for authentic flavor.', pt: 'Adiciona gengibre em conserva para sabor autêntico.' },
      { en: 'Use wild salmon for more omega-3.', pt: 'Usa salmão selvagem para mais ómega-3.' },
      { en: 'Add cucumber for freshness.', pt: 'Adiciona pepino para frescura.' },
    ],
    totalMacros: { calories: 684, protein: 49, carbs: 56, fat: 31, fiber: 8 },
    tags: ['japanese', 'omega-3', 'balanced', 'asian'],
    imageEmoji: '🍣',
  },
];

// Helper functions with localized output
export const getRecipesByCategory = (category: FitnessRecipe['category']): FitnessRecipe[] => {
  return fitnessRecipesData.filter(recipe => recipe.category === category);
};

export const getRecipesByCuisine = (cuisine: string): FitnessRecipe[] => {
  return fitnessRecipesData.filter(recipe => {
    const recipeCuisine = getLocalizedText(recipe.cuisine);
    return recipeCuisine.toLowerCase().includes(cuisine.toLowerCase());
  });
};

export const searchRecipes = (query: string): FitnessRecipe[] => {
  const lowerQuery = query.toLowerCase();
  return fitnessRecipesData.filter(recipe => {
    const name = getLocalizedText(recipe.name);
    const cuisine = getLocalizedText(recipe.cuisine);
    return name.toLowerCase().includes(lowerQuery) ||
      recipe.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      cuisine.toLowerCase().includes(lowerQuery) ||
      recipe.ingredients.some(ing => getLocalizedText(ing.name).toLowerCase().includes(lowerQuery));
  });
};

export const getHighProteinRecipes = (minProtein: number = 30): FitnessRecipe[] => {
  return fitnessRecipesData.filter(recipe => 
    (recipe.totalMacros.protein / recipe.servings) >= minProtein
  );
};

export const getQuickRecipes = (maxTime: number = 20): FitnessRecipe[] => {
  return fitnessRecipesData.filter(recipe => 
    (recipe.prepTime + recipe.cookTime) <= maxTime
  );
};

// Bilingual category labels
export const categoryLabels: Record<FitnessRecipe['category'], { en: string; pt: string }> = {
  breakfast: { en: 'Breakfast', pt: 'Pequeno-Almoço' },
  lunch: { en: 'Lunch', pt: 'Almoço' },
  dinner: { en: 'Dinner', pt: 'Jantar' },
  snack: { en: 'Snack', pt: 'Snack' },
  pre_workout: { en: 'Pre-Workout', pt: 'Pré-Treino' },
  post_workout: { en: 'Post-Workout', pt: 'Pós-Treino' },
  smoothie: { en: 'Smoothie', pt: 'Smoothie' },
};

export const getCategoryLabel = (category: FitnessRecipe['category']): string => {
  return getLocalizedText(categoryLabels[category]);
};

// Bilingual difficulty labels
export const difficultyLabels: Record<'easy' | 'medium' | 'hard', { en: string; pt: string }> = {
  easy: { en: 'Easy', pt: 'Fácil' },
  medium: { en: 'Medium', pt: 'Médio' },
  hard: { en: 'Hard', pt: 'Difícil' },
};

export const getDifficultyLabel = (difficulty: 'easy' | 'medium' | 'hard'): string => {
  return getLocalizedText(difficultyLabels[difficulty]);
};

// Legacy export for compatibility
export const fitnessRecipes = fitnessRecipesData;
