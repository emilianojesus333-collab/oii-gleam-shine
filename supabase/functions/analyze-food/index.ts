import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** Extract a number from a value that may be number, string like "25g", "300 kcal", etc. */
function parseNumber(value: unknown): number {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const match = value.match(/([\d.]+)/);
    if (match) {
      const num = parseFloat(match[1]);
      return isNaN(num) ? 0 : num;
    }
  }
  return 0;
}

interface ValidatedFood {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  confidence?: string;
}

interface ValidatedResult {
  foods: ValidatedFood[];
  total: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
  tips?: string;
  mealType?: string;
}

/** Validate and normalize the AI response into a safe schema. */
function validateNutritionData(raw: unknown): ValidatedResult {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid nutrition schema returned by AI');
  }

  const obj = raw as Record<string, unknown>;

  // Validate foods array
  const rawFoods = Array.isArray(obj.foods) ? obj.foods : [];

  const foods: ValidatedFood[] = rawFoods
    .filter((f: unknown) => f && typeof f === 'object')
    .map((f: any) => ({
      name: typeof f.name === 'string' ? f.name : 'Alimento desconhecido',
      portion: typeof f.portion === 'string' ? f.portion : '1 porção',
      calories: parseNumber(f.calories),
      protein: parseNumber(f.protein),
      carbs: parseNumber(f.carbs),
      fat: parseNumber(f.fat),
      fiber: parseNumber(f.fiber),
      confidence: typeof f.confidence === 'string' ? f.confidence : 'medium',
    }));

  // Check for non-food detection
  if (foods.length === 0) {
    throw new Error('No food detected in the image');
  }

  // Check average confidence — if all low, likely not food
  const confidenceLevels = foods.map(f => f.confidence);
  const allLow = confidenceLevels.every(c => c === 'low');
  const totalCalories = foods.reduce((s, f) => s + f.calories, 0);
  if (allLow && totalCalories < 10) {
    throw new Error('No food detected in the image');
  }

  // Build or validate total
  const total = {
    calories: obj.total && typeof obj.total === 'object' ? parseNumber((obj.total as any).calories) : 0,
    protein: obj.total && typeof obj.total === 'object' ? parseNumber((obj.total as any).protein) : 0,
    carbs: obj.total && typeof obj.total === 'object' ? parseNumber((obj.total as any).carbs) : 0,
    fat: obj.total && typeof obj.total === 'object' ? parseNumber((obj.total as any).fat) : 0,
    fiber: obj.total && typeof obj.total === 'object' ? parseNumber((obj.total as any).fiber) : 0,
  };

  // If total is all zeros but foods have values, recalculate
  if (total.calories === 0 && foods.length > 0) {
    total.calories = foods.reduce((s, f) => s + f.calories, 0);
    total.protein = foods.reduce((s, f) => s + f.protein, 0);
    total.carbs = foods.reduce((s, f) => s + f.carbs, 0);
    total.fat = foods.reduce((s, f) => s + f.fat, 0);
    total.fiber = foods.reduce((s, f) => s + f.fiber, 0);
  }

  return {
    foods,
    total,
    tips: typeof obj.tips === 'string' ? obj.tips : undefined,
    mealType: typeof obj.mealType === 'string' ? obj.mealType : undefined,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ========== AUTHENTICATION CHECK ==========
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(JSON.stringify({ error: 'Unauthorized - No token provided' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !userData.user) {
      console.error('Authentication error:', userError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized - Invalid session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User authenticated:', userData.user.id);
    // ========== END AUTHENTICATION CHECK ==========

    const { imageBase64, mealDescription } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    let messages: any[] = [
      {
        role: "system",
        content: `Você é um nutricionista profissional especializado em análise de alimentos para atletas e praticantes de musculação. Sua missão é identificar alimentos com ALTA PRECISÃO.

REGRAS CRÍTICAS DE IDENTIFICAÇÃO:
1. Analise CUIDADOSAMENTE cada item visível na imagem
2. Considere o contexto: pratos, recipientes, tamanho relativo dos itens
3. Identifique a CULINÁRIA (portuguesa, brasileira, americana, asiática, etc.)
4. Diferencie alimentos similares: arroz branco vs basmati, batata vs batata doce, frango grelhado vs frito
5. Estime PORÇÕES com base no tamanho do prato/recipiente (prato normal ~24cm diâmetro)
6. Se houver dúvida entre dois alimentos, escolha o mais comum para o contexto da refeição
7. Identifique molhos, temperos e acompanhamentos separadamente

IDENTIFICAÇÃO VISUAL:
- Cor e textura são indicadores chave
- Formato e corte do alimento
- Método de preparação visível (grelhado = marcas, frito = dourado brilhante)
- Guarnições e acompanhamentos típicos

IMPORTANTE: 
- Se a imagem NÃO contiver alimentos, retorne: {"foods": [], "total": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0}, "tips": "Nenhum alimento identificado"}
- Todos os valores numéricos devem ser NÚMEROS, não strings (ex: 25 não "25g")
- Responda APENAS em JSON válido, sem markdown ou texto adicional.

Formato de resposta:
{
  "foods": [
    {
      "name": "Nome específico do alimento (ex: 'Peito de frango grelhado' não apenas 'frango')",
      "portion": "Porção estimada precisa (ex: 150g, 200ml, 1 unidade média)",
      "calories": número,
      "protein": número em gramas,
      "carbs": número em gramas,
      "fat": número em gramas,
      "fiber": número em gramas,
      "confidence": "high" | "medium" | "low"
    }
  ],
  "total": {
    "calories": soma total,
    "protein": soma total,
    "carbs": soma total,
    "fat": soma total,
    "fiber": soma total
  },
  "tips": "Uma dica rápida sobre timing ou combinação para atletas (max 100 chars)",
  "mealType": "breakfast" | "lunch" | "dinner" | "snack" | "pre_workout" | "post_workout",
  "cuisine": "tipo de culinária identificada"
}`
      }
    ];

    if (imageBase64) {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: `Analise esta imagem de comida com MÁXIMA PRECISÃO:

1. IDENTIFIQUE cada alimento visível individualmente
2. ESTIME as porções baseando-se no tamanho do prato/recipiente
3. CALCULE os macros usando tabelas nutricionais padrão
4. CONSIDERE o método de preparação (afeta calorias: grelhado vs frito)
5. NÃO OMITA nenhum item visível, incluindo molhos e temperos
6. Se a imagem NÃO contiver comida, retorne foods como array vazio

Seja específico nos nomes (ex: "Arroz branco cozido" não apenas "arroz").`
          },
          {
            type: "image_url",
            image_url: {
              url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
            }
          }
        ]
      });
    } else if (mealDescription) {
      messages.push({
        role: "user",
        content: `Analise esta refeição descrita e forneça informações nutricionais: "${mealDescription}"`
      });
    } else {
      throw new Error('Provide imageBase64 or mealDescription');
    }

    console.log('Calling OpenAI Vision API...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log('OpenAI response:', content);

    // Parse JSON from response
    let rawData: unknown;
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      rawData = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Raw content:', content);
      throw new Error('Failed to parse nutrition data from AI response');
    }

    // Validate and normalize
    const nutritionData = validateNutritionData(rawData);

    return new Response(JSON.stringify(nutritionData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-food function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
