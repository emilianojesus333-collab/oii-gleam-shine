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

    const systemPrompt = `Você é um coach de fitness experiente e direto.
O utilizador definiu objetivos específicos e quer dicas FOCADAS nesses objetivos.

OBJETIVOS DO UTILIZADOR:
${goalParts.length > 0 ? goalParts.join('\n') : 'Nenhum objetivo específico definido'}

REGRAS IMPORTANTES:
1. FOQUE APENAS nos objetivos definidos pelo utilizador
2. NÃO mencione nutrição, sono ou hidratação a menos que seja diretamente relevante ao objetivo
3. Dê dicas práticas e acionáveis para alcançar os objetivos
4. Seja motivador mas realista
5. Use linguagem portuguesa de Portugal
6. Máximo 3-4 dicas focadas
7. NÃO use emojis excessivos - apenas onde realmente necessário

${userGoals.weightGoal > 0 ? `
DICAS PARA GANHAR ${userGoals.weightGoal}KG:
- Foque em superávit calórico
- Treino de hipertrofia
- Progressão de carga
- Exercícios compostos
` : ''}

${userGoals.weightGoal < 0 ? `
DICAS PARA PERDER ${Math.abs(userGoals.weightGoal)}KG:
- Déficit calórico moderado
- Manter proteína alta
- Cardio complementar
- Treino de força para manter massa
` : ''}

${userGoals.focusMuscles?.length ? `
DICAS PARA DESENVOLVER ${userGoals.focusMuscles.join(', ').toUpperCase()}:
- Exercícios específicos para estes grupos
- Frequência ideal de treino
- Técnicas de intensificação
- Volume adequado
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
