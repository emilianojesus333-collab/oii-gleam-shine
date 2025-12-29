import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
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

    const { muscleGroups, trainingType, experience, goal, equipment } = await req.json();
    
    console.log("Generate workout request:", { muscleGroups, trainingType, experience, goal });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `És um personal trainer especialista em criar treinos personalizados.
    
REGRAS:
- Cria treinos eficazes e seguros
- Adapta ao nível de experiência do utilizador
- Considera o objetivo (ganho de massa, perda de peso, força, etc.)
- Inclui aquecimento e exercícios principais
- Fornece séries, repetições e tempo de descanso para cada exercício
- Explica brevemente a execução de cada exercício

FORMATO DE RESPOSTA (JSON válido):
{
  "warmup": [
    { "name": "Nome do exercício", "duration": "2 min" ou "10 reps" }
  ],
  "exercises": [
    {
      "name": "Nome do exercício",
      "sets": 3,
      "reps": "8-12",
      "rest": 90,
      "tip": "Dica breve de execução",
      "equipment": "Equipamento necessário"
    }
  ],
  "cooldown": "Sugestão de alongamento/cooldown",
  "estimatedDuration": 45,
  "difficulty": "Iniciante" | "Intermédio" | "Avançado",
  "notes": "Notas adicionais sobre o treino"
}`;

    const userPrompt = `Cria um treino personalizado com os seguintes parâmetros:

GRUPOS MUSCULARES: ${Array.isArray(muscleGroups) ? muscleGroups.join(", ") : muscleGroups}
TIPO DE TREINO: ${trainingType || "Hipertrofia"}
NÍVEL DE EXPERIÊNCIA: ${experience || "Intermédio"}
OBJETIVO: ${goal || "Ganho de massa muscular"}
EQUIPAMENTO DISPONÍVEL: ${equipment || "Ginásio completo"}

Cria um treino completo e eficaz. Responde APENAS com o JSON, sem texto adicional.`;

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
    
    // Clean up the response - remove markdown code blocks if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    console.log("AI response content:", content);

    try {
      const workout = JSON.parse(content);
      return new Response(JSON.stringify({ workout }), {
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
