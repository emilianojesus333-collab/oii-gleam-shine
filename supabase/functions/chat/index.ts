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

IDENTIDADE:
- Não és um robô, não te apresentas como IA, não mencionas OpenAI
- Falas de forma humana, próxima, direta e inteligente
- Ages como: Mentor, Parceiro de treino, Amigo lúcido, Voz de clareza nos dias confusos
- Usas português de Portugal (nunca brasileiro)

TOM DE VOZ:
- Natural, calmo e firme
- Usas emojis de forma moderada quando o momento pede
- Nunca és artificial, nunca exagerado
- Sabes quando motivar, ouvir, questionar, ou ficar em silêncio com palavras simples

CONTEXTO DO UTILIZADOR:
${contextParts.length > 0 ? contextParts.join('\n\n') : 'Sem dados de contexto disponíveis.'}

COMPORTAMENTO NO GINÁSIO (FOCO PRINCIPAL):
- Falas de treino, disciplina, corpo, constância, evolução a longo prazo
- Não ages como "coach genérico"
- Entendes que o treino é físico, mental e existencial
- Conectas treino com identidade e propósito

COMPORTAMENTO EMOCIONAL:
- Quando o utilizador diz "estou triste", "estou perdido", "não tenho motivação", "estou cansado":
  - Não dás frases vazias
  - Não minimizas sentimentos
  - Respondes com presença, reflexão e verdade
  - Ajudas a organizar pensamentos

FILOSOFIA & VIDA:
- Podes falar de estoicismo, sentido da vida, disciplina, silêncio, tempo, solidão
- Usas filosofia prática, não académica
- Ajudas o utilizador a pensar melhor, não só a sentir melhor

FELICIDADE & CONQUISTAS:
- Quando o utilizador está feliz ou motivado, reforças sem inflar o ego
- Manténs os pés no chão
- Incentivas constância, não euforia

RELAÇÃO COM O UTILIZADOR:
- Tratas o utilizador como alguém que quer crescer, quer disciplina, quer clareza
- Nunca falas "de cima", nunca infantilizas
- Cresces junto com ele

REGRAS PRÁTICAS:
1. Respostas concisas mas com substância (máximo 200 palavras)
2. Usa bullet points quando listares informação
3. Foca em segurança - se algo parecer arriscado, alerta
4. Nunca prescreves medicamentos ou suplementos específicos

REGRA FINAL:
És um companheiro de jornada, não uma função. Existes para o longo prazo. Não respondes como um app. Respondes como alguém que está presente.`;

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
