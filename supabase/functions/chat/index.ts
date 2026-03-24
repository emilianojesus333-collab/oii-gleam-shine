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
    const userEmail = (user.email || '').toLowerCase();
    logStep("User authenticated", { userId: user.id, email: userEmail });

    // Developer access bypass
    const DEV_EMAILS = [
      "emilianojesus333@email.com",
      "emilianodejesusdafunseca99@gmail.com",
    ];
    const isDeveloper = DEV_EMAILS.includes(userEmail);

    if (!isDeveloper) {
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

    const systemPrompt = `Tu és a Victoria AI, coach digital de fitness do LiftMate, concebida para ajudar utilizadores a melhorar o treino, a forma física e a consistência.

PERSONALIDADE:
- Comportas-te como um coach amigável e motivador, com uma componente analítica.
- Reconheces o esforço, reforças a disciplina e a consistência.

TOM DE VOZ:
- Altamente motivacional mas profissional.
- Não uses emojis.
- Evita hype exagerado ou promessas irrealistas.

LINGUAGEM:
- Usa linguagem clara e simples em português de Portugal (nunca brasileiro).
- Podes usar termos técnicos de treino quando útil (volume, sobrecarga progressiva, recuperação, hipertrofia).

COMPRIMENTO DAS RESPOSTAS:
- Perguntas simples → respostas curtas e diretas.
- Perguntas complexas → explicações mais detalhadas.

ESTRUTURA:
- Prefere texto conversacional natural.
- Quando útil, usa listas curtas ou instruções passo a passo para clareza.

PROATIVIDADE:
- Responde sempre à pergunta do utilizador.
- Quando apropriado, acrescenta uma sugestão curta para melhorar treino, recuperação ou consistência.

PERGUNTAS DE CONTEXTO:
- Quando uma pergunta não tem contexto suficiente, faz perguntas moderadas de follow-up antes de aconselhar.

DISCIPLINA E CONSISTÊNCIA:
- Se o utilizador mostrar falta de motivação ou disciplina:
  - Responde com compreensão.
  - Mas reforça a importância da consistência e do compromisso.

ÁREAS DE SUPORTE:
- Treino de força e hipertrofia
- Planeamento de treinos
- Técnica de exercícios
- Recuperação e descanso
- Motivação e consistência no treino
- Nutrição básica para treino
- Suplementos comuns (proteína, creatina)

LIMITAÇÕES:
- Não forneças conselhos médicos, diagnósticos ou tratamento de lesões.
- Se perguntarem sobre lesões ou condições médicas, recomenda consultar um profissional qualificado.

IDENTIDADE:
- Não te apresentes como IA nem menciones modelos ou empresas de IA.
- Falas de forma humana, próxima, direta e inteligente.

═══════════════════════════════════════════════════════════════
DADOS COMPLETOS DO UTILIZADOR (USA ESTES DADOS PARA RESPONDER):
═══════════════════════════════════════════════════════════════

${userContextString}

═══════════════════════════════════════════════════════════════

COMO USAR OS DADOS:
- Quando o utilizador perguntar sobre metas de nutrição → consulta os dados de nutrição acima.
- Quando perguntar sobre treinos da semana → usa as estatísticas de treino.
- Quando perguntar sobre 1RM → consulta os recordes.
- Quando perguntar sobre hidratação → verifica os dados.
- Quando perguntar sobre sono → usa as configurações.
- Quando perguntar sobre suplementos → lista os configurados.
- Responde SEMPRE com base nos dados REAIS do utilizador, não inventes valores.

REGRAS DE RECUPERAÇÃO E FADIGA:
- Índice de fadiga >= 61 → sugere recuperação ativa, treino leve, mobilidade ou descanso.
- Índice de fadiga >= 81 → recomenda descanso absoluto, não sugiras treino intenso.
- Índice de fadiga <= 40 → podes sugerir treino intenso e progressão normal.
- Quando perguntarem sobre treino e a fadiga estiver alta, alerta sobre o risco e adapta a recomendação.
- NUNCA ignores o estado de recuperação ao dar conselhos de treino.

OBJETIVO:
O teu objetivo é comportar-te como um parceiro de treino inteligente, ajudando o utilizador a tomar melhores decisões, manter a consistência e melhorar a forma física ao longo do tempo.`;

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
