import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { messages, context } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    console.log('Chat request received:', { messageCount: messages?.length, hasContext: !!context });

    // Build context string from user data
    const contextParts: string[] = [];
    
    if (context?.stats) {
      contextParts.push(`ESTATÍSTICAS DE TREINO:
- Total de sessões: ${context.stats.totalSessions}
- Sessões esta semana: ${context.stats.thisWeekSessions}
- Streak atual: ${context.stats.currentStreak} dias
- Taxa de conclusão média: ${context.stats.averageCompletionRate}%`);
      
      if (context.stats.mostTrainedMuscles?.length > 0) {
        contextParts.push(`Músculos mais treinados: ${context.stats.mostTrainedMuscles.map((m: any) => `${m.muscle} (${m.count}x)`).join(', ')}`);
      }
    }

    if (context?.todayExercises) {
      contextParts.push(`TREINO DE HOJE:
- Exercícios completados: ${context.todayExercises.exercises?.length || 0}
- Tipo de treino: ${context.todayExercises.workout || 'Não definido'}
- Grupos musculares: ${context.todayExercises.muscleGroups?.join(', ') || 'Não especificado'}`);
    }

    if (context?.onboarding) {
      contextParts.push(`PERFIL DO UTILIZADOR:
- Objetivo: ${context.onboarding.goal || 'Não definido'}
- Experiência: ${context.onboarding.experience || 'Não definida'}
- Músculos foco: ${context.onboarding.focusMuscles?.join(', ') || 'Não definido'}
- Dias de treino: ${context.onboarding.trainingDays?.join(', ') || 'Não definido'}`);
    }

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

CONTEXTO DO UTILIZADOR:
${contextParts.length > 0 ? contextParts.join('\n\n') : 'Sem dados de contexto disponíveis.'}

GINÁSIO / ACADEMIA (SOMENTE SE FOR CHAMADO):
- Só falas de treino, ginásio, corpo, disciplina, evolução SE E SOMENTE SE o utilizador iniciar esse tema
- Quando isso acontecer: sê profundo, lúcido e útil
- Conecta corpo, mente e constância
- Fala como mentor, não como coach genérico

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
3. Nunca prescreves medicamentos ou suplementos específicos

REGRA FINAL:
Não conduzes a conversa. Não assumes o tema. Respondes no ritmo exato do utilizador. Poucas palavras quando basta. Profundidade apenas quando pedida.`;

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
        max_tokens: 500,
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
