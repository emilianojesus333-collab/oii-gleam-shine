import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const muscleGroups = context.todayMuscleGroups?.length > 0 
      ? context.todayMuscleGroups.join(", ")
      : "treino completo (full body)";

    const systemPrompt = `Tu és um personal trainer de elite especializado em criar treinos personalizados.
Cria treinos científicos, eficazes e adaptados ao nível do utilizador.
Responde SEMPRE em português de Portugal.
IMPORTANTE: Responde APENAS com JSON válido, sem markdown, sem texto extra.`;

    const userPrompt = `Cria um treino completo para hoje com estas especificações:

PERFIL DO UTILIZADOR:
- Objetivo: ${context.goal || "hipertrofia"}
- Nível de experiência: ${context.experience || "intermediário"}
- Áreas de foco: ${context.focusAreas?.join(", ") || "geral"}
- Grupos musculares de hoje: ${muscleGroups}
- Equipamento disponível: ${context.equipment?.join(", ") || "halteres, barra, máquinas"}

Responde com este JSON exato:
{
  "title": "Nome criativo do treino",
  "duration": "XX min",
  "difficulty": "Iniciante" ou "Intermediário" ou "Avançado",
  "warmup": ["exercício 1", "exercício 2", "exercício 3"],
  "exercises": [
    {
      "name": "Nome do exercício",
      "sets": 3,
      "reps": "8-12",
      "rest": "60s",
      "notes": "Dica de execução opcional"
    }
  ],
  "cooldown": ["alongamento 1", "alongamento 2"],
  "tips": ["dica 1", "dica 2", "dica 3"]
}

Inclui 5-8 exercícios principais, 3 exercícios de aquecimento e 2-3 de retorno à calma.
Adapta a dificuldade, volume e intensidade ao nível de experiência.`;

    console.log("Generating workout for:", muscleGroups);

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
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de pedidos excedido. Tenta novamente mais tarde." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("AI response:", content);

    // Parse the JSON from the response
    let workout;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        workout = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Parse error:", parseError);
      // Return a fallback workout
      workout = {
        title: "Treino Personalizado",
        duration: "45 min",
        difficulty: "Intermediário",
        warmup: ["5 min cardio leve", "Rotação de ombros", "Agachamento sem peso"],
        exercises: [
          { name: "Agachamento", sets: 4, reps: "10-12", rest: "90s", notes: "Mantém o core contraído" },
          { name: "Supino", sets: 4, reps: "8-10", rest: "90s", notes: "Controla a descida" },
          { name: "Remada", sets: 3, reps: "10-12", rest: "60s", notes: "Aperta as escápulas no topo" },
          { name: "Shoulder Press", sets: 3, reps: "10-12", rest: "60s" },
          { name: "Curl Bíceps", sets: 3, reps: "12-15", rest: "45s" },
        ],
        cooldown: ["Alongamento de peito", "Alongamento de costas", "Respiração profunda"],
        tips: ["Hidrata-te bem durante o treino", "Foca na técnica antes de aumentar peso"],
      };
    }

    return new Response(JSON.stringify({ workout }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-workout:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
