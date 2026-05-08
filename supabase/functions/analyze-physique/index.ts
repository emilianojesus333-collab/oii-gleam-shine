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
    // ========== AUTHENTICATION ==========
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized - Invalid session' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = userData.user.id;
    console.log('User authenticated:', userId);
    // ====================================

    const { imageBase64, previousPhotoPath } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');
    if (!imageBase64) throw new Error('No image provided');

    // Fetch previous photo as base64 if path provided
    let previousImageBase64: string | null = null;
    if (previousPhotoPath) {
      try {
        const { data: signedUrlData } = await supabaseClient.storage
          .from('physique-evaluations')
          .createSignedUrl(previousPhotoPath, 300);

        if (signedUrlData?.signedUrl) {
          const imgRes = await fetch(signedUrlData.signedUrl);
          if (imgRes.ok) {
            const buffer = await imgRes.arrayBuffer();
            const bytes = new Uint8Array(buffer);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
            previousImageBase64 = `data:image/jpeg;base64,${btoa(binary)}`;
          }
        }
      } catch (e) {
        console.warn('Could not load previous photo:', e);
      }
    }

    const hasPreviousPhoto = !!previousImageBase64;

    const systemPrompt = `Você é um avaliador físico profissional e especialista em fisiculturismo com 20 anos de experiência.
Analise a foto do físico do utilizador e forneça uma avaliação REALISTA, HONESTA e JUSTA.

=== VERIFICAÇÃO DE AUTENTICIDADE (OBRIGATÓRIO — FAÇA SEMPRE) ===

a) QUALIDADE DA FOTO: É uma selfie/foto normal ou parece foto profissional/de modelo/de revista?
   - Se parecer foto profissional ou de modelo: inclui no motivationalMessage 'Nota: Esta foto parece ter sido tirada em contexto profissional. Para acompanhamento real do progresso, recomendamos fotos do dia a dia em espelho.'

b) ${hasPreviousPhoto ? `COMPARAÇÃO COM AVALIAÇÃO ANTERIOR:
   Analisa as DUAS fotos — a foto atual e a foto anterior.
   Compara estrutura física: altura estimada, estrutura óssea, género, tom de pele, proporções corporais gerais.
   - Se forem CLARAMENTE pessoas diferentes (género diferente, estrutura óssea completamente distinta, altura muito diferente): responde APENAS com a string exata 'INCONSISTENCIA_DETETADA' sem mais nada
   - Se a evolução for impossível no tempo (ex: +10kg de músculo em 15 dias): menciona que a mudança parece improvável no motivationalMessage
   - Se forem possivelmente a mesma pessoa com mudanças normais: continua a análise normalmente e comenta a evolução

IMPORTANTE: Compara esta foto com a avaliação anterior.
- Sê honesto sobre o progresso — não exageres melhorias para agradar
- Foca em mudanças reais e mensuráveis entre as duas fotos` : `PRIMEIRA AVALIAÇÃO: Não há foto anterior para comparar.`}

c) NUNCA inventes dados. Se não consegues ver claramente o corpo, diz que a foto não tem qualidade suficiente.

=== VALIDAÇÃO DE IMAGEM (OBRIGATÓRIO) ===
- O corpo deve estar visível de forma clara
- Iluminação suficiente para avaliar definição muscular
- Enquadramento adequado (mínimo: meio corpo visível)
- Deve ser uma foto de um corpo humano real

Se a imagem NÃO cumprir estes requisitos, retorna:
{ "success": false, "error": "Não foi possível analisar o teu físico com precisão. Envia uma imagem mais clara, com melhor enquadramento e boa iluminação." }

=== SISTEMA DE PONTUAÇÃO (ESCALA REALISTA E EXIGENTE) ===
Escala de 0 a 10. Seja EXIGENTE e REALISTA.

- 0-2: Iniciante total, sem desenvolvimento muscular visível
- 3-5: Iniciante com algum desenvolvimento, base em construção
- 6-7: Intermédio, boa base muscular mas com falhas evidentes
- 8-9: Avançado, físico muito desenvolvido
- 10: Excecionalmente raro, nível competitivo

REGRAS CRÍTICAS:
- Iniciantes NUNCA recebem nota acima de 6
- Nota 8+ exige: definição muscular clara, proporção entre grupos, volume significativo
- Nunca infles notas para agradar

=== REGRAS DE COMUNICAÇÃO ===
- Seja motivador mas HONESTO
- Use linguagem construtiva: "em desenvolvimento" em vez de "fraco"
- Baseie-se apenas no que é visível

Se a resposta for 'INCONSISTENCIA_DETETADA', retorna APENAS esse texto sem JSON.

Caso contrário, retorna SEMPRE JSON válido:
{
  "success": true,
  "analysis": {
    "overallScore": 5.5,
    "bodyFatEstimate": "18-22%",
    "strengths": [{"muscleGroup": "Ombros", "description": "Boa separação", "score": 6}],
    "weaknesses": [{"muscleGroup": "Pernas", "description": "Em desenvolvimento", "priority": "alta", "score": 4}],
    "recommendations": [{"focus": "Pernas", "frequency": "2x/semana", "exercises": ["Agachamento", "Leg Press"], "tip": "Aumenta o volume"}],
    "motivationalMessage": "Mensagem motivacional honesta aqui."
  }
}`;

    // Build content array with current and optional previous photo
    const userContent: unknown[] = [
      {
        type: 'text',
        text: hasPreviousPhoto
          ? 'Analisa este físico comparando com a avaliação anterior. Foto 1 (ATUAL) = primeira imagem. Foto 2 (ANTERIOR) = segunda imagem.'
          : 'Analisa este físico e fornece uma avaliação completa com pontos fortes, fracos e recomendações de treino.',
      },
      {
        type: 'image_url',
        image_url: { url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` },
      },
    ];

    if (previousImageBase64) {
      userContent.push({
        type: 'image_url',
        image_url: { url: previousImageBase64 },
      });
    }

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
          { role: 'user', content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ success: false, error: 'Limite de pedidos excedido. Tenta novamente em alguns minutos.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ success: false, error: 'Créditos insuficientes.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content: string = data.choices?.[0]?.message?.content ?? '';
    console.log('AI Response received');

    // Detect inconsistency signal
    if (content.trim() === 'INCONSISTENCIA_DETETADA') {
      return new Response(JSON.stringify({ success: false, inconsistency: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse JSON
    let analysis: Record<string, unknown>;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      analysis = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Parse error:', parseError, 'Raw:', content);
      analysis = { success: false, error: 'Não foi possível processar a análise. Tenta com outra foto.' };
    }

    // Save to DB if analysis succeeded
    if (analysis.success === true && analysis.analysis) {
      const a = analysis.analysis as Record<string, unknown>;
      try {
        await supabaseClient.from('physique_evaluations').insert({
          user_id: userId,
          photo_path: null, // will be set by client after storage upload
          score: a.overallScore ?? null,
          body_fat_estimate: a.bodyFatEstimate ?? null,
          strengths: a.strengths ?? [],
          improvements: a.weaknesses ?? [],
          action_plan: a.recommendations ?? [],
          motivational_message: a.motivationalMessage ?? null,
        });
      } catch (dbErr) {
        console.warn('DB save error (non-fatal):', dbErr);
      }
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-physique:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
