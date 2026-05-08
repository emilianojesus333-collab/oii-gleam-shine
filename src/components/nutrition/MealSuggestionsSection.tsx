import { useState, useEffect } from "react";
import { Sparkles, Loader2, ChevronRight, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getMealSuggestions,
  getCachedSuggestions,
  type MealSuggestion,
} from "@/utils/mealSuggestions";
import { toast } from "sonner";
import type { Meal, FoodItem } from "@/hooks/useNutrition";

interface MealSuggestionsSectionProps {
  userId: string;
  todayWorkoutType: string | null;
  onAddMeal: (meal: Omit<Meal, "id">) => void;
  externalTrigger?: number;
}

const TIMING_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  "pré-treino":       { color: "#60A5FA", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.2)"  },
  "pós-treino":       { color: "#4ADE80", bg: "rgba(74,222,128,0.12)",  border: "rgba(74,222,128,0.2)"  },
  "jantar":           { color: "#A78BFA", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.2)" },
  "pequeno-almoço":   { color: "#FBBF24", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.2)"  },
  "lanche":           { color: "#FB923C", bg: "rgba(251,146,60,0.12)",  border: "rgba(251,146,60,0.2)"  },
  "almoço":           { color: "#22D3EE", bg: "rgba(34,211,238,0.12)",  border: "rgba(34,211,238,0.2)"  },
};

const timingStyle = (timing: string) => {
  const key = Object.keys(TIMING_STYLE).find((k) =>
    timing.toLowerCase().includes(k)
  );
  return TIMING_STYLE[key ?? ""] ?? { color: "rgba(255,255,255,0.50)", bg: "rgba(255,255,255,0.07)", border: "rgba(255,255,255,0.15)" };
};

const timingToMealType = (timing: string): Meal["type"] => {
  const t = timing.toLowerCase();
  if (t.includes("pré"))      return "pre_workout";
  if (t.includes("pós"))      return "post_workout";
  if (t.includes("jantar"))   return "dinner";
  if (t.includes("almoço"))   return "lunch";
  if (t.includes("pequeno"))  return "breakfast";
  return "snack";
};

const SkeletonCard = () => (
  <div style={{ background: "#141414", borderRadius: 16, padding: 16, border: "1px solid rgba(255,255,255,0.07)" }}>
    <div style={{ height: 20, width: 60, borderRadius: 20, background: "rgba(255,255,255,0.07)", marginBottom: 12, animation: "pulse 1.5s infinite" }} />
    <div style={{ height: 16, width: "70%", borderRadius: 6, background: "rgba(255,255,255,0.07)", marginBottom: 8, animation: "pulse 1.5s infinite" }} />
    <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
      {[50, 60, 45].map((w, i) => (
        <div key={i} style={{ height: 22, width: w, borderRadius: 20, background: "rgba(255,255,255,0.04)", animation: "pulse 1.5s infinite" }} />
      ))}
    </div>
    <div style={{ height: 12, width: "85%", borderRadius: 4, background: "rgba(255,255,255,0.04)", animation: "pulse 1.5s infinite" }} />
  </div>
);

export const MealSuggestionsSection = ({
  userId,
  todayWorkoutType,
  onAddMeal,
  externalTrigger,
}: MealSuggestionsSectionProps) => {
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  // Load from cache on mount
  useEffect(() => {
    const cached = getCachedSuggestions(userId, todayWorkoutType);
    if (cached && cached.length > 0) {
      setSuggestions(cached);
      setGenerated(true);
    }
  }, [userId, todayWorkoutType]);

  // Auto-regenerate when workout type changes (cache invalidated)
  useEffect(() => {
    if (!generated) return;
    const cached = getCachedSuggestions(userId, todayWorkoutType);
    if (!cached) {
      setSuggestions([]);
      setGenerated(false);
    }
  }, [todayWorkoutType]);

  useEffect(() => {
    if (externalTrigger && externalTrigger > 0) handleGenerate();
  }, [externalTrigger]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await getMealSuggestions(userId);
      if (result.length === 0) {
        toast.error("Não foi possível gerar sugestões. Tenta novamente.");
      } else {
        setSuggestions(result);
        setGenerated(true);
      }
    } catch {
      toast.error("Erro ao gerar sugestões.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (s: MealSuggestion) => {
    const foods: FoodItem[] = s.foods.map((name) => ({
      name,
      portion: "1 porção",
      calories: Math.round(s.calories / s.foods.length),
      protein:  Math.round(s.protein  / s.foods.length),
      carbs:    0,
      fat:      0,
      fiber:    0,
    }));
    onAddMeal({
      type: timingToMealType(s.timing),
      time: new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }),
      foods,
      total: { calories: s.calories, protein: s.protein, carbs: 0, fat: 0, fiber: 0 },
    });
    toast.success(`"${s.name}" adicionada ao diário!`);
  };

  return (
    <div style={{
      background: "#1A1A1A", borderRadius: 0, border: "none",
      borderBottom: "1px solid #2A2A2A", padding: "20px 16px", width: "100%",
    }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={16} color="#FBBF24" />
          <span style={{ fontSize: 14, fontWeight: 800, color: "white" }}>Sugestões para hoje</span>
          {todayWorkoutType && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
              background: "rgba(96,165,250,0.1)", color: "#60A5FA",
              border: "1px solid rgba(96,165,250,0.2)",
            }}>
              {todayWorkoutType}
            </span>
          )}
        </div>

        {generated && !loading && (
          <button
            type="button"
            onClick={() => { setSuggestions([]); setGenerated(false); handleGenerate(); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
            title="Regenerar"
          >
            <RefreshCw size={14} color="rgba(255,255,255,0.30)" />
          </button>
        )}
      </div>

      {/* Not yet generated — hide when controlled externally */}
      {!generated && !loading && externalTrigger === undefined && (
        <button
          type="button"
          onClick={handleGenerate}
          style={{
            width: "100%", padding: "15px 0", borderRadius: 14, cursor: "pointer",
            background: "rgba(74,222,128,0.06)",
            border: "1px solid rgba(74,222,128,0.15)",
            color: "#4ADE80", fontSize: 13, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            position: "relative", overflow: "hidden",
          }}
        >
          {/* Shimmer */}
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{
              position: "absolute", top: 0, bottom: 0, width: "40%",
              background: "linear-gradient(90deg, transparent, rgba(74,222,128,0.12), transparent)",
              pointerEvents: "none",
            }}
          />
          <Sparkles size={15} />
          Gerar sugestões de refeição
        </button>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {!loading && suggestions.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {suggestions.map((s, i) => {
              const ts = timingStyle(s.timing);
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  style={{
                    background: "#141414",
                    borderRadius: 16,
                    padding: 16,
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  {/* Timing badge */}
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                    color: ts.color, background: ts.bg,
                    border: `1px solid ${ts.border}`,
                    display: "inline-block", marginBottom: 10,
                  }}>
                    {s.timing}
                  </span>

                  {/* Name */}
                  <p style={{ fontSize: 15, fontWeight: 800, color: "white", marginBottom: 8 }}>
                    {s.name}
                  </p>

                  {/* Food chips */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                    {s.foods.map((food, fi) => (
                      <span key={fi} style={{
                        fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20,
                        background: "rgba(255,255,255,0.07)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        color: "rgba(255,255,255,0.50)",
                      }}>
                        {food}
                      </span>
                    ))}
                  </div>

                  {/* Macros */}
                  <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                    <div>
                      <span style={{ fontSize: 20, fontWeight: 900, color: "#F97316" }}>{s.calories}</span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.30)", marginLeft: 2 }}>kcal</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 20, fontWeight: 900, color: "#60A5FA" }}>{s.protein}</span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.30)", marginLeft: 2 }}>g prot</span>
                    </div>
                  </div>

                  {/* Reason */}
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.30)", fontStyle: "italic", marginBottom: 12, lineHeight: 1.5 }}>
                    {s.reason}
                  </p>

                  {/* Add button */}
                  <button
                    type="button"
                    onClick={() => handleAdd(s)}
                    style={{
                      width: "100%", padding: "9px 0", borderRadius: 10, cursor: "pointer",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      color: "rgba(255,255,255,0.70)", fontSize: 12, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                  >
                    Adicionar esta refeição
                    <ChevronRight size={13} />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
