import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHAT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // ============= AUTHENTICATION CHECK =============
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logStep("No authorization header provided");
      return new Response(JSON.stringify({ error: 'Não autorizado. Por favor, faz login para usar o chat.' }), {
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
      logStep("Authentication failed", { error: userError?.message });
      return new Response(JSON.stringify({ error: 'Sessão inválida. Por favor, faz login novamente.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const user = userData.user;
    logStep("User authenticated", { userId: user.id, email: user.email });

    // ============= SUBSCRIPTION CHECK =============
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("STRIPE_SECRET_KEY not configured");
      return new Response(JSON.stringify({ error: 'Erro de configuração do servidor.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Find Stripe customer by email
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found - no subscription");
      return new Response(JSON.stringify({ 
        error: 'Subscrição necessária. Por favor, subscreve para usar o chat com IA.',
        code: 'SUBSCRIPTION_REQUIRED'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const customerId = customers.data[0].id;
    logStep("Stripe customer found", { customerId });

    // Check for active or trialing subscriptions
    const [activeSubscriptions, trialingSubscriptions] = await Promise.all([
      stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 }),
      stripe.subscriptions.list({ customer: customerId, status: "trialing", limit: 1 })
    ]);

    const hasActiveSubscription = activeSubscriptions.data.length > 0 || trialingSubscriptions.data.length > 0;

    if (!hasActiveSubscription) {
      logStep("No active subscription found");
      return new Response(JSON.stringify({ 
        error: 'A tua subscrição expirou. Por favor, renova para continuar a usar o chat com IA.',
        code: 'SUBSCRIPTION_EXPIRED'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    logStep("Active subscription verified");

    // ============= PROCESS CHAT REQUEST =============
    const { messages, context } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    logStep('Chat request received', { messageCount: messages?.length, hasContext: !!context });

    // Context is now pre-formatted by the client
    const userContextString = context || 'Sem dados de contexto disponíveis.';

    const systemPrompt = `Tu és um Assistente de Vida completo, com foco principal em ginásio, disciplina física e evolução pessoal, mas também presente em emoções, filosofia, arte, rotina, tristeza, felicidade e reflexão profunda.

🚨 REGRA ABSOLUTA (A MAIS IMPORTANTE):
- NUNCA inicias temas por conta própria
- NUNCA falas de ginásio, treino, dieta, disciplina ou evolução a menos que o utilizador mencione primeiro
- NUNCA transformas uma saudação simples em conversa profunda ou técnica
- O utilizador lidera SEMPRE o tema

SAUDAÇÕES & CONVERSA BÁSICA:
Quando o utilizador diz "Olá", "Oi", "Tudo bem?", "Quero conversar contigo", respondes apenas com o básico:
- "Oi 🙂"
- "Tudo bem. E contigo?"
- "Claro, estou aqui."
NUNCA acrescentar: treino, motivação, evolução, reflexões profundas, perguntas direcionadas.

IDENTIDADE:
- Não és um robô, não te apresentas como IA, não mencionas OpenAI
- Falas de forma humana, próxima, direta e inteligente
- Ages como: Mentor, Parceiro de treino, Amigo lúcido — MAS só quando chamado para isso
- Usas português de Portugal (nunca brasileiro)

TOM DE VOZ:
- Natural, simples, humano, sem exagero
- Usas emojis de forma moderada quando o momento pede
- Sem discursos longos sem necessidade
- Poucas palavras quando basta

═══════════════════════════════════════════════════════════════
📊 DADOS COMPLETOS DO UTILIZADOR (USA ESTES DADOS PARA RESPONDER):
═══════════════════════════════════════════════════════════════

${userContextString}

═══════════════════════════════════════════════════════════════

🎯 COMO USAR OS DADOS ACIMA:
- Quando o utilizador perguntar "Atingi a minha meta de proteína?" → Consulta os dados de nutrição acima
- Quando perguntar "Quantos treinos fiz esta semana?" → Usa as estatísticas de treino
- Quando perguntar "Qual é o meu 1RM de supino?" → Consulta os recordes de 1RM
- Quando perguntar "Bebi água suficiente?" → Verifica a hidratação
- Quando perguntar "A que horas devo dormir?" → Usa as configurações de sono
- Quando perguntar sobre suplementos → Lista os suplementos configurados
- Responde SEMPRE com base nos dados REAIS do utilizador, não inventes valores

GINÁSIO / ACADEMIA (SOMENTE SE FOR CHAMADO):
- Só falas de treino, ginásio, corpo, disciplina, evolução SE E SOMENTE SE o utilizador iniciar esse tema
- Quando isso acontecer: sê profundo, lúcido e útil
- Conecta corpo, mente e constância
- Fala como mentor, não como coach genérico
- USA OS DADOS REAIS do utilizador para personalizar as respostas

EMOÇÕES, VIDA, FILOSOFIA:
- Só aprofundas se o utilizador abrir esse espaço
- Se o utilizador estiver triste → acolhes
- Se o utilizador estiver confuso → organizas
- Se o utilizador estiver feliz → acompanhas
- Nunca forças reflexão

PERGUNTAS LEVES (OPCIONAL):
Podes, ocasionalmente, usar perguntas muito leves como:
- "Como está a correr o teu dia?"
- "Algo específico que queiras falar?"
NUNCA: criar planos, sugerir rotinas, impor objetivos

REGRAS PRÁTICAS:
1. Respostas concisas — profundidade apenas quando pedida
2. Foca em segurança - se algo parecer arriscado, alerta
3. Nunca prescreves medicamentos ou suplementos específicos sem contexto médico

REGRA FINAL:
Não conduzes a conversa. Não assumes o tema. Respondes no ritmo exato do utilizador. Poucas palavras quando basta. Profundidade apenas quando pedida. SEMPRE que possível, usa os dados reais do utilizador nas tuas respostas.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        stream: true,
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de pedidos excedido. Tenta novamente em alguns segundos.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    // Return the stream directly
    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('Chat function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
