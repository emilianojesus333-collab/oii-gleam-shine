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
      return new Response(JSON.stringify({ error: 'Unauthorized - Invalid session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = userData.user.id;
    console.log('User authenticated:', userId);

    const { muscleGroups, trainingType, experience, goal, equipment } = await req.json();

    // ========== FETCH FATIGUE INDEX ==========
    const { data: settingsData } = await supabaseClient
      .from("user_settings")
      .select("fatigue_index")
      .eq("user_id", userId)
      .maybeSingle();

    const fatigueIndex = settingsData?.fatigue_index ?? 0;
    console.log(`[GENERATE-WORKOUT] fatigue_index=${fatigueIndex}`);

    // Determine fatigue adjustment and exercise range
    let fatigueInstruction = "";
    let volumeModifier = "normal";
    let exerciseRange = { min: 8, max: 12, recommended: 10 };

    if (fatigueIndex >= 81) {
      fatigueInstruction = `\n\nATENÇÃO CRÍTICA: O utilizador tem fadiga MUITO ALTA (${fatigueIndex}/100). NÃO reduzir o número de exercícios abaixo de 7. Em vez disso: reduzir séries para 2 por exercício, reduzir reps em 30%, usar cargas leves. Focar em técnica e controlo.`;
      volumeModifier = "very_low";
      exerciseRange = { min: 7, max: 9, recommended: 7 };
    } else if (fatigueIndex >= 61) {
      fatigueInstruction = `\n\nATENÇÃO: O utilizador tem fadiga ALTA (${fatigueIndex}/100). NÃO reduzir o número de exercícios. Em vez disso: reduzir séries para 2-3 por exercício, manter reps moderadas, evitar cargas máximas.`;
      volumeModifier = "reduced_20";
      exerciseRange = { min: 7, max: 10, recommended: 8 };
    } else if (fatigueIndex >= 41) {
      fatigueInstruction = `\n\nNOTA: O utilizador tem fadiga MODERADA (${fatigueIndex}/100). Manter volume normal com ligeira redução de intensidade. Séries de 3, cargas moderadas.`;
      volumeModifier = "reduced_10";
      exerciseRange = { min: 8, max: 11, recommended: 9 };
    }

    console.log("[GENERATE-WORKOUT] Request:", { muscleGroups, trainingType, experience, goal, volumeModifier, exerciseRange });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `És um personal trainer especialista em criar treinos personalizados.
    
REGRAS OBRIGATÓRIAS:
- O treino deve ter entre ${exerciseRange.min} e ${exerciseRange.max} exercícios REAIS (categoria "main" ou "accessory")
- Recomendado: ${exerciseRange.recommended} exercícios reais
- Aquecimento e alongamento NÃO contam para o total de exercícios
- NUNCA gerar menos de 7 exercícios reais (main + accessory)
- Adapta ao nível de experiência do utilizador
- Considera o objetivo (ganho de massa, perda de peso, força, etc.)
- Garante variedade de exercícios — não repetir padrões de movimento
- Prioriza exercícios compostos principais + acessórios complementares
- Mantém equilíbrio entre músculos trabalhados
- Fornece séries, repetições e tempo de descanso para cada exercício
- Explica brevemente a execução de cada exercício

GESTÃO DE FADIGA:
- Se fadiga alta: NÃO reduzir número de exercícios. Em vez disso, reduzir séries e intensidade por exercício.
- Se fadiga baixa: pode gerar até ${exerciseRange.max} exercícios.${fatigueInstruction}

FORMATO DE RESPOSTA (JSON válido):
{
  "warmup": [
    { "name": "Nome do exercício", "duration": "2 min" ou "10 reps" }
  ],
  "exercises": [
    {
      "name": "Nome do exercício",
      "category": "main" | "accessory",
      "sets": 3,
      "reps": "8-12",
      "rest": 90,
      "tip": "Dica breve de execução",
      "equipment": "Equipamento necessário"
    }
  ],
  "stretching": [
    { "name": "Nome do alongamento", "duration": "30 seg" }
  ],
  "cooldown": "Sugestão de cooldown",
  "estimatedDuration": 45,
  "difficulty": "Iniciante" | "Intermédio" | "Avançado",
  "recommendedCount": ${exerciseRange.recommended},
  "notes": "Notas adicionais sobre o treino",
  "fatigue_adjustment": "${volumeModifier}"
}

ESTRUTURA OBRIGATÓRIA DO TREINO:
1. Aquecimento (warmup) — opcional mas recomendado
2. Exercícios principais (main) — compostos e de alta prioridade
3. Exercícios acessórios (accessory) — complementares e isoladores
4. Alongamento (stretching) — opcional

A soma de exercícios com category "main" + "accessory" deve ser entre ${exerciseRange.min} e ${exerciseRange.max}.`;

    const userPrompt = `Cria um treino personalizado com os seguintes parâmetros:

GRUPOS MUSCULARES: ${Array.isArray(muscleGroups) ? muscleGroups.join(", ") : muscleGroups}
TIPO DE TREINO: ${trainingType || "Hipertrofia"}
NÍVEL DE EXPERIÊNCIA: ${experience || "Intermédio"}
OBJETIVO: ${goal || "Ganho de massa muscular"}
EQUIPAMENTO DISPONÍVEL: ${equipment || "Ginásio completo"}
ÍNDICE DE FADIGA: ${fatigueIndex}/100

IMPORTANTE:
- Gera exatamente entre ${exerciseRange.min} e ${exerciseRange.max} exercícios reais (main + accessory)
- Recomendado: ${exerciseRange.recommended} exercícios
- O utilizador não é obrigado a fazer todos — a lista são opções disponíveis
- Garante variedade e equilíbrio muscular

Responde APENAS com o JSON, sem texto adicional.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    console.log("AI response content:", content);

    try {
      const workout = JSON.parse(content);

      // ========== VALIDATE EXERCISE COUNT ==========
      const realExercises = (workout.exercises || []).filter(
        (ex: any) => ex.category === "main" || ex.category === "accessory" || !ex.category
      );
      
      const totalReal = realExercises.length;
      console.log(`[GENERATE-WORKOUT] Real exercises: ${totalReal}, range: ${exerciseRange.min}-${exerciseRange.max}`);

      if (totalReal < exerciseRange.min) {
        console.warn(`[GENERATE-WORKOUT] Below minimum (${totalReal} < ${exerciseRange.min}), returning anyway with warning`);
      }

      // Ensure all exercises have a category
      workout.exercises = (workout.exercises || []).map((ex: any) => ({
        ...ex,
        category: ex.category || "main",
      }));

      return new Response(JSON.stringify({ 
        workout,
        fatigue_index_used: fatigueIndex,
        fatigue_adjustment_applied: volumeModifier,
        exercise_count: {
          total: workout.exercises.length,
          real: totalReal,
          warmup: (workout.warmup || []).length,
          stretching: (workout.stretching || []).length,
          recommended: exerciseRange.recommended,
          range: { min: exerciseRange.min, max: exerciseRange.max },
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (parseError) {
      console.error("Failed to parse workout JSON:", parseError);
      return new Response(JSON.stringify({ 
        error: "Failed to generate workout",
        raw: content 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  } catch (error) {
    console.error("Error in generate-workout function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
