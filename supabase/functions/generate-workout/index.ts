import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2?target=deno";

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

    const systemPrompt = `You are an expert personal trainer specialized in creating personalized workouts.
    
RULES:
- Create effective and safe workouts
- Adapt to the user's experience level
- Consider the goal (muscle gain, weight loss, strength, etc.)
- Include warm-up and main exercises
- Provide sets, reps, and rest time for each exercise
- Briefly explain the execution of each exercise

RESPONSE FORMAT (valid JSON):
{
  "warmup": [
    { "name": "Exercise name", "duration": "2 min" or "10 reps" }
  ],
  "exercises": [
    {
      "name": "Exercise name",
      "sets": 3,
      "reps": "8-12",
      "rest": 90,
      "tip": "Brief execution tip",
      "equipment": "Required equipment"
    }
  ],
  "cooldown": "Stretching/cooldown suggestion",
  "estimatedDuration": 45,
  "difficulty": "Beginner" | "Intermediate" | "Advanced",
  "notes": "Additional notes about the workout"
}`;

    const userPrompt = `Create a personalized workout with the following parameters:

MUSCLE GROUPS: ${Array.isArray(muscleGroups) ? muscleGroups.join(", ") : muscleGroups}
TRAINING TYPE: ${trainingType || "Hypertrophy"}
EXPERIENCE LEVEL: ${experience || "Intermediate"}
GOAL: ${goal || "Muscle gain"}
AVAILABLE EQUIPMENT: ${equipment || "Full gym"}

Create a complete and effective workout. Respond ONLY with the JSON, no additional text.`;

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
