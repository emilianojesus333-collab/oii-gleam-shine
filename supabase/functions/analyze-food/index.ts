import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, mealDescription } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    let messages: any[] = [
      {
        role: "system",
        content: `Você é um nutricionista especializado em análise de alimentos para atletas e praticantes de musculação.

IMPORTANTE: Responda APENAS em JSON válido, sem markdown ou texto adicional.

Formato de resposta:
{
  "foods": [
    {
      "name": "Nome do alimento",
      "portion": "Porção estimada (ex: 150g, 1 unidade)",
      "calories": número,
      "protein": número em gramas,
      "carbs": número em gramas,
      "fat": número em gramas,
      "fiber": número em gramas
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
  "mealType": "breakfast" | "lunch" | "dinner" | "snack" | "pre_workout" | "post_workout"
}`
      }
    ];

    if (imageBase64) {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: "Analise esta imagem de comida e identifique todos os alimentos visíveis com suas informações nutricionais estimadas. Seja preciso nas porções."
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
