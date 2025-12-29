import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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

    const { context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Starting AI coaching analysis...', context);

    const userGoals = context.userGoals || {};
    
    // Build goal description for the prompt
    const goalParts = [];
    if (userGoals.weightGoal) {
      goalParts.push(userGoals.weightGoal > 0 ? `Quer GANHAR ${userGoals.weightGoal}kg` : `Quer PERDER ${Math.abs(userGoals.weightGoal)}kg`);
    }
    if (userGoals.trainingFocus) {
      const focusLabels: Record<string, string> = { hypertrophy: 'Hipertrofia', strength: 'Força', endurance: 'Resistência' };
      goalParts.push(`Foco de treino: ${focusLabels[userGoals.trainingFocus] || userGoals.trainingFocus}`);
    }
    if (userGoals.focusMuscles?.length) {
      goalParts.push(`Músculos prioritários: ${userGoals.focusMuscles.join(', ')}`);
    }

    const systemPrompt = `Você é um coach de fitness experiente e EXTREMAMENTE focado.
O utilizador definiu objetivos específicos. Responda APENAS sobre esses objetivos.

OBJETIVOS DO UTILIZADOR:
${goalParts.length > 0 ? goalParts.join('\n') : 'Nenhum objetivo específico definido'}

REGRAS OBRIGATÓRIAS:
1. RESPONDA APENAS sobre como alcançar os objetivos definidos
2. PROIBIDO falar sobre: nutrição, calorias, proteína, hidratação, sono, suplementos, recuperação
3. Foque APENAS em: exercícios, séries, repetições, frequência de treino, progressão de carga, técnicas
4. Seja direto e prático - diga EXATAMENTE o que fazer no ginásio
5. Use linguagem portuguesa de Portugal
6. Máximo 3-4 dicas de TREINO apenas
7. SEM emojis

${userGoals.weightGoal > 0 ? `
PARA GANHAR ${userGoals.weightGoal}KG - FOQUE EM:
- Exercícios compostos pesados (agachamento, supino, peso morto, remada)
- Progressão de carga semanal (adicionar 1-2.5kg por semana)
- Volume: 10-20 séries por grupo muscular/semana
- Repetições: 6-12 para hipertrofia
- Descanso: 2-3 minutos entre séries pesadas
` : ''}

${userGoals.weightGoal < 0 ? `
PARA PERDER ${Math.abs(userGoals.weightGoal)}KG - FOQUE EM:
- Treino de força para manter massa muscular
- Circuitos com pouco descanso
- Exercícios compostos que gastam mais energia
- Supersets e dropsets para intensidade
- Cardio HIIT após treino de força
` : ''}

${userGoals.focusMuscles?.includes('Full Body') ? `
PARA TREINO FULL BODY:
- Divide em 3-4 treinos full body por semana
- 1-2 exercícios por grupo muscular por sessão
- Alterna entre exercícios de push/pull/legs
- Prioriza compostos: agachamento, supino, remada, ombros
` : userGoals.focusMuscles?.length ? `
PARA DESENVOLVER ${userGoals.focusMuscles.join(', ').toUpperCase()}:
- Exercícios específicos e variações para estes músculos
- Frequência: 2x por semana por grupo
- Volume: 12-20 séries semanais por grupo prioritário
- Técnicas: drop sets, rest-pause, tempo lento
` : ''}

Responda SEMPRE em JSON válido com esta estrutura:
{
  "success": true,
  "summary": "Resumo curto focado nos objetivos do utilizador (1-2 frases)",
  "tips": [
    {
      "category": "treino" | "nutrição" | "recuperação" | "geral",
      "title": "Título curto e direto",
      "message": "Explicação prática focada no objetivo",
      "priority": "high" | "medium" | "low",
      "actionable": "Ação específica a tomar"
    }
  ]
}`;

    const userPrompt = `Com base nos meus objetivos, dá-me dicas específicas para alcançá-los.

Os meus objetivos:
${goalParts.length > 0 ? goalParts.map(g => `- ${g}`).join('\n') : '- Melhorar o treino em geral'}

Dados de contexto (use apenas se relevante para os objetivos):
- Treinos esta semana: ${context.workout.thisWeek}
- Streak atual: ${context.workout.streak} dias
- Grupos mais treinados: ${context.workout.mostTrained?.map((m: any) => m.muscle).join(', ') || 'Nenhum'}`;

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
          { role: 'user', content: userPrompt }
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

    let analysis;
    try {
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
        error: 'Não foi possível processar a análise. Tenta novamente.'
      };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-coaching:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
