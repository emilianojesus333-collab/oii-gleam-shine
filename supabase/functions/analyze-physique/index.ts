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
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized - No token provided' }), {
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
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized - Invalid session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User authenticated:', userData.user.id);
    // ========== END AUTHENTICATION CHECK ==========

    const { imageBase64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!imageBase64) {
      throw new Error('No image provided');
    }

    console.log('Starting physique analysis...');
    console.log('Image size (base64 chars):', imageBase64.length);

    const systemPrompt = `Você é um personal trainer e especialista em fisiculturismo com 20 anos de experiência. 
Analise a foto do físico do utilizador e forneça uma avaliação detalhada e construtiva.

IMPORTANTE:
- Seja motivador e positivo, mas honesto
- Foque em aspectos que podem ser melhorados com treino
- Não faça comentários sobre saúde médica
- Baseie-se apenas no que é visível na foto
- Se a foto não mostrar um corpo humano ou não for adequada, retorne um erro educado

Responda SEMPRE em JSON válido com esta estrutura exata:
{
  "success": true,
  "analysis": {
    "overallScore": 7.5,
    "bodyFatEstimate": "15-18%",
    "strengths": [
      {
        "muscleGroup": "Ombros",
        "description": "Boa separação entre deltoides anterior e lateral",
        "score": 8
      }
    ],
    "weaknesses": [
      {
        "muscleGroup": "Pernas",
        "description": "Quadríceps parecem menos desenvolvidos em comparação com o tronco",
        "priority": "alta",
        "score": 5
      }
    ],
    "recommendations": [
      {
        "focus": "Pernas",
        "frequency": "2x por semana",
        "exercises": ["Agachamento", "Leg Press", "Extensora"],
        "tip": "Aumenta o volume de treino de pernas para equilibrar o físico"
      }
    ],
    "motivationalMessage": "Tens uma excelente base! Com foco nas áreas identificadas, vais ver resultados incríveis em 8-12 semanas."
  }
}

Se não conseguir analisar a imagem:
{
  "success": false,
  "error": "Descrição do problema"
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: [
              {
                type: 'text',
                text: 'Analisa este físico e fornece uma avaliação completa com pontos fortes, fracos e recomendações de treino.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Limite de pedidos excedido. Tenta novamente em alguns minutos.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Créditos insuficientes. Adiciona créditos na tua conta.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log('AI Response received');

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    let analysis;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Parse error:', parseError);
      console.log('Raw content:', content);
      analysis = {
        success: false,
        error: 'Não foi possível processar a análise. Tenta com outra foto.'
      };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-physique:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
