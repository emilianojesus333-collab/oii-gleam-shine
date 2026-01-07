import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

IMPORTANTE: Responda APENAS em JSON válido, sem markdown ou texto adicional.

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
    let nutritionData;
    try {
      // Try to extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      nutritionData = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Failed to parse nutrition data from AI response');
    }

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
