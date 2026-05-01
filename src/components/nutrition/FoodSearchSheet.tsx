import { useState, useEffect, useRef, useCallback } from "react";
import { X, Search, Camera, Loader2, Clock, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { searchFoodByName, type FoodSearchResult } from "@/utils/foodSearch";
import { getFoodCache, addToFoodCache } from "@/utils/customMeals";
import { BarcodeScanner } from "./BarcodeScanner";
import type { Meal, FoodItem } from "@/hooks/useNutrition";

interface FoodSearchSheetProps {
  open: boolean;
  onClose: () => void;
  onAddMeal: (meal: Omit<Meal, "id">) => void;
  userId?: string;
}

type MealType = Meal["type"];

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: "breakfast", label: "Pequeno-almoço" },
  { value: "lunch", label: "Almoço" },
  { value: "dinner", label: "Jantar" },
  { value: "snack", label: "Lanche" },
  { value: "pre_workout", label: "Pré-treino" },
  { value: "post_workout", label: "Pós-treino" },
];

const CARD_STYLE: React.CSSProperties = {
  background: "#141414",
  borderRadius: 12,
  padding: "12px 16px",
  border: "1px solid rgba(255,255,255,0.06)",
  cursor: "pointer",
};

const MacroPill = ({ label, color, bg }: { label: string; color: string; bg: string }) => (
  <span style={{
    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
    color, background: bg, flexShrink: 0,
  }}>
    {label}
  </span>
);

const SkeletonCard = () => (
  <div style={{ ...CARD_STYLE, cursor: "default" }}>
    <div style={{ height: 14, width: "60%", background: "rgba(255,255,255,0.07)", borderRadius: 6, marginBottom: 8, animation: "pulse 1.5s infinite" }} />
    <div style={{ height: 10, width: "35%", background: "rgba(255,255,255,0.04)", borderRadius: 6, marginBottom: 10, animation: "pulse 1.5s infinite" }} />
    <div style={{ display: "flex", gap: 6 }}>
      {[40, 40, 40, 40].map((w, i) => (
        <div key={i} style={{ height: 18, width: w, background: "rgba(255,255,255,0.05)", borderRadius: 20, animation: "pulse 1.5s infinite" }} />
      ))}
    </div>
  </div>
);

export const FoodSearchSheet = ({ open, onClose, onAddMeal, userId }: FoodSearchSheetProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<FoodSearchResult | null>(null);
  const [quantity, setQuantity] = useState("100");
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [showScanner, setShowScanner] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const cache = userId ? getFoodCache(userId) : [];

  // Debounced search
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setSearched(false);
      try {
        const res = await searchFoodByName(query);
        setResults(res.filter((f) => f.name && f.name !== "Sem nome"));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
        setSearched(true);
      }
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, open]);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
    else { setQuery(""); setResults([]); setSelected(null); setSearched(false); }
  }, [open]);

  const handleSelect = useCallback((food: FoodSearchResult) => {
    setSelected(food);
    setQuantity("100");
  }, []);

  const getMacrosForQuantity = (food: FoodSearchResult, qty: number) => ({
    calories: Math.round((food.calories * qty) / 100),
    protein:  Math.round((food.protein  * qty) / 100),
    carbs:    Math.round((food.carbs    * qty) / 100),
    fat:      Math.round((food.fat      * qty) / 100),
    fiber:    Math.round((food.fiber    * qty) / 100),
  });

  const handleAdd = () => {
    if (!selected) return;
    const qty = parseFloat(quantity) || 100;
    const macros = getMacrosForQuantity(selected, qty);
    const foodItem: FoodItem = {
      name: selected.name + (selected.brand ? ` (${selected.brand})` : ""),
      portion: `${qty}g`,
      calories: macros.calories,
      protein:  macros.protein,
      carbs:    macros.carbs,
      fat:      macros.fat,
      fiber:    macros.fiber,
    };
    onAddMeal({
      type: mealType,
      time: new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }),
      foods: [foodItem],
      total: macros,
    });
    if (userId) addToFoodCache(userId, selected);
    setSelected(null);
    setQuery("");
    setResults([]);
    setSearched(false);
    onClose();
  };

  const handleScannerFood = (food: FoodSearchResult) => {
    if (userId) addToFoodCache(userId, food);
    handleSelect(food);
  };

  if (!open) return null;

  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>

      {showScanner && (
        <BarcodeScanner
          onFoodFound={handleScannerFood}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 90 }}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 300 }}
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 95,
          background: "#111",
          borderRadius: "20px 20px 0 0",
          maxHeight: "92vh",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Handle */}
        <div style={{ padding: "12px 20px 0", flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", margin: "0 auto 16px" }} />

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: "white" }}>Adicionar Alimento</span>
            <button type="button" onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={16} color="rgba(255,255,255,0.6)" />
            </button>
          </div>

          {/* Meal type selector */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 14 }}>
            {MEAL_TYPES.map((mt) => (
              <button
                key={mt.value}
                type="button"
                onClick={() => setMealType(mt.value)}
                style={{
                  flexShrink: 0,
                  padding: "6px 12px", borderRadius: 20,
                  fontSize: 11, fontWeight: 700, cursor: "pointer",
                  background: mealType === mt.value ? "rgba(37,99,235,0.15)" : "rgba(255,255,255,0.05)",
                  border: mealType === mt.value ? "1px solid rgba(37,99,235,0.3)" : "1px solid rgba(255,255,255,0.07)",
                  color: mealType === mt.value ? "#60A5FA" : "rgba(255,255,255,0.35)",
                  whiteSpace: "nowrap",
                }}
              >
                {mt.label}
              </button>
            ))}
          </div>

          {/* Search row */}
          <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
            <div style={{
              flex: 1, display: "flex", alignItems: "center", gap: 10,
              background: "rgba(255,255,255,0.06)", borderRadius: 12,
              padding: "0 14px", border: "1px solid rgba(255,255,255,0.08)",
            }}>
              <Search size={16} color="rgba(255,255,255,0.3)" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Pesquisar alimento..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  color: "white", fontSize: 14, padding: "13px 0",
                }}
              />
              {loading && <Loader2 size={16} color="rgba(255,255,255,0.3)" className="animate-spin" />}
            </div>
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              style={{
                width: 50, height: 50, borderRadius: 12, flexShrink: 0,
                background: "#141414", border: "1px solid rgba(255,255,255,0.1)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Camera size={20} color="rgba(255,255,255,0.6)" />
            </button>
          </div>
        </div>

        {/* Scrollable list area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px 24px" }}>

          {/* Selected food: quantity picker */}
          <AnimatePresence mode="wait">
            {selected && (
              <motion.div
                key="selected"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                style={{
                  background: "rgba(37,99,235,0.08)",
                  border: "1px solid rgba(37,99,235,0.2)",
                  borderRadius: 14, padding: "16px",
                  marginBottom: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "white", marginBottom: 2 }}>{selected.name}</p>
                    {selected.brand && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{selected.brand}</p>}
                  </div>
                  <button type="button" onClick={() => setSelected(null)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                    <X size={14} color="rgba(255,255,255,0.4)" />
                  </button>
                </div>

                {/* Quantity input */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>QUANTIDADE</span>
                  <div style={{
                    display: "flex", alignItems: "center",
                    background: "rgba(255,255,255,0.06)", borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden",
                  }}>
                    <button type="button"
                      onClick={() => setQuantity(String(Math.max(1, parseFloat(quantity) - 10)))}
                      style={{ width: 36, height: 36, background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                    <input
                      type="text" inputMode="decimal" value={quantity}
                      onChange={(e) => setQuantity(e.target.value.replace(/[^0-9.]/g, ""))}
                      onFocus={(e) => e.currentTarget.select()}
                      style={{ width: 52, textAlign: "center", background: "transparent", border: "none", outline: "none", color: "white", fontSize: 15, fontWeight: 800 }}
                    />
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", paddingRight: 8 }}>g</span>
                    <button type="button"
                      onClick={() => setQuantity(String(parseFloat(quantity) + 10))}
                      style={{ width: 36, height: 36, background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                  </div>
                </div>

                {/* Live macros */}
                {(() => {
                  const qty = parseFloat(quantity) || 100;
                  const m = getMacrosForQuantity(selected, qty);
                  return (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                      <MacroPill label={`${m.calories} kcal`} color="#F97316" bg="rgba(249,115,22,0.12)" />
                      <MacroPill label={`P ${m.protein}g`}    color="#60A5FA" bg="rgba(96,165,250,0.12)" />
                      <MacroPill label={`C ${m.carbs}g`}      color="#FBBF24" bg="rgba(251,191,36,0.12)" />
                      <MacroPill label={`G ${m.fat}g`}        color="#F87171" bg="rgba(248,113,113,0.12)" />
                      {m.fiber > 0 && <MacroPill label={`F ${m.fiber}g`} color="#34D399" bg="rgba(52,211,153,0.12)" />}
                    </div>
                  );
                })()}

                <button type="button" onClick={handleAdd}
                  style={{
                    width: "100%", padding: 13, borderRadius: 12,
                    background: "#1D4ED8", border: "none",
                    color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer",
                  }}>
                  Adicionar à refeição
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading skeletons */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Results */}
          {!loading && results.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {results.map((food) => (
                <FoodResultCard key={food.id} food={food} onSelect={handleSelect} selected={selected?.id === food.id} />
              ))}
            </div>
          )}

          {/* No results */}
          {!loading && searched && results.length === 0 && query.trim() && (
            <div style={{ textAlign: "center", padding: "32px 16px" }}>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Nenhum resultado para "{query}"</p>
              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, marginTop: 6 }}>
                Tenta um nome diferente ou usa o scanner de código de barras.
              </p>
            </div>
          )}

          {/* Recent cache (when no query) */}
          {!query.trim() && !loading && cache.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <Clock size={12} color="rgba(255,255,255,0.3)" />
                <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>
                  RECENTES
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {cache.map((food) => (
                  <FoodResultCard key={food.id} food={food} onSelect={handleSelect} selected={selected?.id === food.id} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!query.trim() && !loading && cache.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 16px" }}>
              <Search size={32} color="rgba(255,255,255,0.15)" style={{ margin: "0 auto 12px" }} />
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                Pesquisa por nome ou lê um código de barras
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};

const FoodResultCard = ({
  food, onSelect, selected,
}: {
  food: FoodSearchResult;
  onSelect: (f: FoodSearchResult) => void;
  selected: boolean;
}) => (
  <div
    onClick={() => onSelect(food)}
    style={{
      ...CARD_STYLE,
      border: selected ? "1px solid rgba(37,99,235,0.4)" : "1px solid rgba(255,255,255,0.06)",
      background: selected ? "rgba(37,99,235,0.08)" : "#141414",
    }}
  >
    <p style={{ fontSize: 13, fontWeight: 700, color: "white", marginBottom: 2, lineHeight: 1.3 }}>
      {food.name}
    </p>
    {food.brand && (
      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>{food.brand}</p>
    )}
    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
      <MacroPill label={`${food.calories} kcal`} color="#F97316" bg="rgba(249,115,22,0.1)" />
      <MacroPill label={`P ${food.protein}g`}    color="#60A5FA" bg="rgba(96,165,250,0.1)" />
      <MacroPill label={`C ${food.carbs}g`}      color="#FBBF24" bg="rgba(251,191,36,0.1)" />
      <MacroPill label={`G ${food.fat}g`}        color="#F87171" bg="rgba(248,113,113,0.1)" />
    </div>
    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 6 }}>por 100g</p>
  </div>
);

// helper needed inside component, defined outside to avoid re-renders
function getMacrosForQuantity(food: FoodSearchResult, qty: number) {
  return {
    calories: Math.round((food.calories * qty) / 100),
    protein:  Math.round((food.protein  * qty) / 100),
    carbs:    Math.round((food.carbs    * qty) / 100),
    fat:      Math.round((food.fat      * qty) / 100),
    fiber:    Math.round((food.fiber    * qty) / 100),
  };
}
