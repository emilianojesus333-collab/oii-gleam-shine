import { supabase } from "@/integrations/supabase/client";
import { collectUserContext, formatContextForAI } from "./userContextCollector";

export interface MealSuggestion {
  name: string;
  foods: string[];
  calories: number;
  protein: number;
  timing: string;
  reason: string;
}

interface SuggestionsCache {
  suggestions: MealSuggestion[];
  timestamp: number;
  workoutType: string | null;
}

const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

const cacheKey = (userId: string) => `liftmate_meal_suggestions_${userId}`;

export const getCachedSuggestions = (
  userId: string,
  currentWorkoutType: string | null
): MealSuggestion[] | null => {
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    if (!raw) return null;
    const cache: SuggestionsCache = JSON.parse(raw);
    const expired = Date.now() - cache.timestamp > TTL_MS;
    const workoutChanged = cache.workoutType !== currentWorkoutType;
    if (expired || workoutChanged) return null;
    return cache.suggestions;
  } catch {
    return null;
  }
};

const saveSuggestionsCache = (
  userId: string,
  suggestions: MealSuggestion[],
  workoutType: string | null
) => {
  const cache: SuggestionsCache = { suggestions, timestamp: Date.now(), workoutType };
  localStorage.setItem(cacheKey(userId), JSON.stringify(cache));
};

export const getMealSuggestions = async (userId: string): Promise<MealSuggestion[]> => {
  const userContext = await collectUserContext(userId);
  const formattedContext = formatContextForAI(userContext);

  // Check cache first
  const cached = getCachedSuggestions(userId, userContext.workout.todayWorkoutType);
  if (cached) return cached;

  const prompt = `${formattedContext}

Com base no treino de hoje (${userContext.workout.todayWorkoutType || "descanso"}) e nos objetivos do utilizador (${userContext.profile.goal || "não definido"}), sugere 3 refeições ideais para hoje.

Para cada refeição indica:
- Nome da refeição
- Alimentos principais (3-5 ingredientes)
- Calorias aproximadas
- Proteína aproximada (g)
- Momento ideal para comer (pré-treino / pós-treino / jantar / pequeno-almoço / lanche)
- Razão da sugestão em 1 frase

Responde APENAS em JSON válido com este formato, sem texto adicional:
[{"name":"","foods":[],"calories":0,"protein":0,"timing":"","reason":""}]`;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const authHeaders: Record<string, string> = {};
    if (session?.access_token) {
      authHeaders["Authorization"] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          context: formattedContext,
        }),
      }
    );

    if (!response.ok) throw new Error(`Edge function error: ${response.status}`);

    // Read stream to completion
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // Strip SSE "data: " prefix if present
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const content = line.slice(6).trim();
            if (content && content !== "[DONE]") {
              try {
                const parsed = JSON.parse(content);
                if (parsed.type === "content_block_delta") {
                  fullText += parsed.delta?.text || "";
                } else if (typeof parsed === "string") {
                  fullText += parsed;
                }
              } catch {
                fullText += content;
              }
            }
          } else if (line.trim() && !line.startsWith("event:") && !line.startsWith(":")) {
            fullText += line;
          }
        }
      }
    }

    const jsonMatch = fullText.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? jsonMatch[0] : fullText.replace(/```json|```/g, "").trim();
    const suggestions: MealSuggestion[] = JSON.parse(jsonStr);

    saveSuggestionsCache(userId, suggestions, userContext.workout.todayWorkoutType);
    return suggestions;
  } catch (err) {
    console.error("[mealSuggestions] Error:", err);
    return [];
  }
};
