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
    const goalsInfo = [];
    if (userGoals.weightGoal) {
      goalsInfo.push(userGoals.weightGoal > 0 ? `Quer ganhar ${userGoals.weightGoal}kg` : `Quer perder ${Math.abs(userGoals.weightGoal)}kg`);
    }
    if (userGoals.trainingFocus) {
      const focusLabels: Record<string, string> = { hypertrophy: 'Hipertrofia', strength: 'Força', endurance: 'Resistência' };
      goalsInfo.push(`Foco: ${focusLabels[userGoals.trainingFocus] || userGoals.trainingFocus}`);
    }
    if (userGoals.focusMuscles?.length) {
      goalsInfo.push(`Músculos prioritários: ${userGoals.focusMuscles.join(', ')}`);
    }

    const systemPrompt = `Você é um coach de fitness e nutrição experiente e motivador.
Analise os dados do utilizador e forneça dicas personalizadas e acionáveis.

CONTEXTO DO UTILIZADOR:
- Treino: ${JSON.stringify(context.workout)}
- Nutrição: ${JSON.stringify(context.nutrition)}
- Recuperação: ${JSON.stringify(context.recovery)}
${goalsInfo.length > 0 ? `- OBJETIVOS DO UTILIZADOR: ${goalsInfo.join(' | ')}` : ''}

REGRAS:
1. Seja motivador mas realista
2. Baseie as dicas nos dados fornecidos
3. ${goalsInfo.length > 0 ? 'PRIORIZE dicas relacionadas aos objetivos definidos pelo utilizador!' : 'Foque em melhorias incrementais'}
4. Use linguagem portuguesa de Portugal
5. Máximo 4 dicas priorizadas
6. ${userGoals.focusMuscles?.length ? `Inclua dicas específicas para trabalhar: ${userGoals.focusMuscles.join(', ')}` : ''}
7. ${userGoals.weightGoal ? `Adapte dicas de nutrição ao objetivo de ${userGoals.weightGoal > 0 ? 'ganhar' : 'perder'} peso` : ''}

Responda SEMPRE em JSON válido com esta estrutura:
{
  "success": true,
  "summary": "Resumo curto da análise (1-2 frases) ${goalsInfo.length > 0 ? 'mencionando os objetivos do utilizador' : ''}",
  "tips": [
    {
      "category": "treino" | "nutrição" | "recuperação" | "geral",
      "title": "Título curto",
      "message": "Explicação da dica baseada nos dados",
      "priority": "low" | "medium" | "high",
      "actionable": "Ação específica a tomar hoje"
    }
  ]
}

EXEMPLOS DE DICAS BASEADAS EM PADRÕES:
- Se proteína < 80% do objetivo: dica de nutrição alta prioridade
- Se streak > 5: elogio + dica de recuperação
- Se hidratação < 50%: dica de recuperação alta prioridade
- Se sono < 7h: dica de recuperação
- Se treinou muito um grupo muscular: dica de variar treino
${userGoals.focusMuscles?.length ? `- PRIORIDADE: Dicas específicas para desenvolver ${userGoals.focusMuscles.join(', ')}` : ''}`;

    const userPrompt = `Analisa os meus dados e dá-me dicas personalizadas para hoje.
${goalsInfo.length > 0 ? `\nOS MEUS OBJETIVOS:\n${goalsInfo.map(g => `- ${g}`).join('\n')}\n` : ''}
Dados:
- Treinos esta semana: ${context.workout.thisWeek}
- Streak atual: ${context.workout.streak} dias
- Taxa de conclusão: ${(context.workout.completionRate * 100).toFixed(0)}%
- Grupos mais treinados: ${context.workout.mostTrained?.map((m: any) => m.muscle).join(', ') || 'Nenhum'}
- Calorias hoje: ${context.nutrition.todayCalories}/${context.nutrition.goalCalories}
- Proteína hoje: ${context.nutrition.todayProtein}g/${context.nutrition.goalProtein}g
- Média semanal calorias: ${context.nutrition.weeklyAverage || 0}
- Hidratação: ${context.recovery.hydration}/${context.recovery.hydrationGoal}ml
- Sono: ${context.recovery.sleepHours || 'não registado'}h`;

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

    // Parse the JSON response
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
