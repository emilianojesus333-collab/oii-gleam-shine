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
      goalParts.push(userGoals.weightGoal > 0 ? `Wants to GAIN ${userGoals.weightGoal}kg` : `Wants to LOSE ${Math.abs(userGoals.weightGoal)}kg`);
    }
    if (userGoals.trainingFocus) {
      const focusLabels: Record<string, string> = { hypertrophy: 'Hypertrophy', strength: 'Strength', endurance: 'Endurance' };
      goalParts.push(`Training focus: ${focusLabels[userGoals.trainingFocus] || userGoals.trainingFocus}`);
    }
    if (userGoals.focusMuscles?.length) {
      goalParts.push(`Priority muscles: ${userGoals.focusMuscles.join(', ')}`);
    }

    const systemPrompt = `You are an experienced and EXTREMELY focused fitness coach.
The user has set specific goals. Respond ONLY about those goals.

USER GOALS:
${goalParts.length > 0 ? goalParts.join('\n') : 'No specific goals defined'}

MANDATORY RULES:
1. RESPOND ONLY about how to achieve the defined goals
2. FORBIDDEN to talk about: nutrition, calories, protein, hydration, sleep, supplements, recovery
3. Focus ONLY on: exercises, sets, reps, training frequency, load progression, techniques
4. Be direct and practical - say EXACTLY what to do at the gym
5. Use English language
6. Maximum 3-4 TRAINING tips only
7. NO emojis

${userGoals.weightGoal > 0 ? `
TO GAIN ${userGoals.weightGoal}KG - FOCUS ON:
- Heavy compound exercises (squat, bench press, deadlift, row)
- Weekly load progression (add 1-2.5kg per week)
- Volume: 10-20 sets per muscle group/week
- Reps: 6-12 for hypertrophy
- Rest: 2-3 minutes between heavy sets
` : ''}

${userGoals.weightGoal < 0 ? `
TO LOSE ${Math.abs(userGoals.weightGoal)}KG - FOCUS ON:
- Strength training to maintain muscle mass
- Circuits with little rest
- Compound exercises that burn more energy
- Supersets and dropsets for intensity
- HIIT cardio after strength training
` : ''}

${userGoals.focusMuscles?.includes('Full Body') ? `
FOR FULL BODY TRAINING:
- Split into 3-4 full body workouts per week
- 1-2 exercises per muscle group per session
- Alternate between push/pull/legs exercises
- Prioritize compounds: squat, bench press, row, shoulders
` : userGoals.focusMuscles?.length ? `
TO DEVELOP ${userGoals.focusMuscles.join(', ').toUpperCase()}:
- Specific exercises and variations for these muscles
- Frequency: 2x per week per group
- Volume: 12-20 weekly sets per priority group
- Techniques: drop sets, rest-pause, slow tempo
` : ''}

ALWAYS respond in valid JSON with this structure:
{
  "success": true,
  "summary": "Short summary focused on user goals (1-2 sentences)",
  "tips": [
    {
      "category": "training" | "nutrition" | "recovery" | "general",
      "title": "Short direct title",
      "message": "Practical explanation focused on the goal",
      "priority": "high" | "medium" | "low",
      "actionable": "Specific action to take"
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
