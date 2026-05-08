import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Flame, Clock, Sparkles, Loader2 } from 'lucide-react';
import { useWorkoutNutritionSync } from '@/hooks/useWorkoutNutritionSync';
import { supabase } from "@/integrations/supabase/client";

interface PostWorkoutMeal {
  id: string;
  title: string;
  prepTime: string;
  calories: number;
  protein: number;
}

const FALLBACK_MEALS: PostWorkoutMeal[] = [
  { id: 'pw1', title: 'Frango grelhado com arroz', prepTime: '20 min', calories: 520, protein: 42 },
  { id: 'pw2', title: 'Shake proteico com banana', prepTime: '2 min', calories: 320, protein: 30 },
  { id: 'pw3', title: 'Omelete de claras com batata-doce', prepTime: '10 min', calories: 410, protein: 35 },
];

export const PostWorkoutSuggestions = () => {
  const { trainedToday, phase, todayMuscleGroups } = useWorkoutNutritionSync();
  const [suggestions, setSuggestions] = useState<PostWorkoutMeal[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  const shouldShow = trainedToday || phase === 'post_workout' || phase === 'recovery';

  useEffect(() => {
    if (!shouldShow || fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setSuggestions(FALLBACK_MEALS); setLoading(false); return; }

        const muscles = todayMuscleGroups.length > 0 ? todayMuscleGroups.join(', ') : 'corpo inteiro';
        const prompt = `Treino de hoje: ${muscles}. Sugere 3 refeições pós-treino ideais para recuperação muscular. Responde APENAS com um array JSON válido, sem texto adicional:
[{"title":"Nome da refeição","prepTime":"X min","calories":000,"protein":00},{"title":"...","prepTime":"...","calories":000,"protein":00},{"title":"...","prepTime":"...","calories":000,"protein":00}]`;

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              messages: [{ role: 'user', content: prompt }],
              context: 'És um nutricionista de desporto. Responde APENAS com JSON válido, sem markdown, sem texto adicional.',
            }),
          }
        );

        if (!res.ok || !res.body) throw new Error('API error');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let newline: number;
          while ((newline = buffer.indexOf('\n')) !== -1) {
            const line = buffer.slice(0, newline).replace(/\r$/, '');
            buffer = buffer.slice(newline + 1);
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (raw === '[DONE]') break;
            try {
              const parsed = JSON.parse(raw);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) accumulated += content;
            } catch {}
          }
        }

        const match = accumulated.match(/\[[\s\S]*?\]/);
        if (match) {
          const parsed: Array<{ title: string; prepTime: string; calories: number; protein: number }> = JSON.parse(match[0]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSuggestions(parsed.slice(0, 3).map((m, i) => ({ id: `ai-${i}`, ...m })));
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error('[PostWorkoutSuggestions] AI error:', e);
      }
      setSuggestions(FALLBACK_MEALS);
      setLoading(false);
    };

    fetchSuggestions();
  }, [shouldShow]);

  if (!shouldShow) return null;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '20px 0', color: 'rgba(255,255,255,0.30)' }}>
        <Loader2 style={{ width: 14, height: 14, flexShrink: 0, animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: 12 }}>A gerar sugestões pós-treino com IA...</span>
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-semibold text-white text-sm">Recuperação Pós-Treino</h3>
        <Sparkles style={{ width: 12, height: 12, color: '#60A5FA' }} />
      </div>
      <p className="text-xs text-muted-foreground mb-2">Sugestões IA para recuperação muscular</p>

      <div className="grid gap-2">
        {suggestions.map((meal, i) => (
          <motion.div
            key={meal.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3"
            style={{ background: '#1A1A1A', borderBottom: '1px solid #2A2A2A', padding: '20px 16px', width: '100%', margin: 0 }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{meal.title}</p>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Flame className="w-3 h-3 text-blue-400" />
                  {meal.calories} kcal
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-rose-400 font-medium">{meal.protein}g</span> prot
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {meal.prepTime}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
