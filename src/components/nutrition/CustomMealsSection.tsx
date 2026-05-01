import { useState, useEffect } from "react";
import { BookmarkPlus, ChefHat, Trash2, Loader2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  loadCustomMeals,
  saveCustomMeal,
  deleteCustomMeal,
  type CustomMeal,
  type CustomMealFood,
} from "@/utils/customMeals";
import { toast } from "sonner";
import type { Meal, FoodItem } from "@/hooks/useNutrition";

interface CustomMealsSectionProps {
  userId: string;
  currentFoods?: CustomMealFood[];
  onUseMeal: (meal: Omit<Meal, "id">) => void;
}

const MacroPill = ({ label, color, bg }: { label: string; color: string; bg: string }) => (
  <span style={{
    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
    color, background: bg,
  }}>
    {label}
  </span>
);

export const CustomMealsSection = ({ userId, currentFoods = [], onUseMeal }: CustomMealsSectionProps) => {
  const [meals, setMeals] = useState<CustomMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [mealName, setMealName] = useState("");

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await loadCustomMeals(userId);
      setMeals(data);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, [userId]);

  const handleSaveCurrent = async () => {
    if (!mealName.trim() || currentFoods.length === 0) return;
    setSaving(true);
    try {
      await saveCustomMeal(userId, {
        name: mealName.trim(),
        foods: currentFoods,
        total_calories: currentFoods.reduce((s, f) => s + f.calories, 0),
        total_protein:  currentFoods.reduce((s, f) => s + f.protein,  0),
        total_carbs:    currentFoods.reduce((s, f) => s + f.carbs,    0),
        total_fat:      currentFoods.reduce((s, f) => s + f.fat,      0),
      });
      toast.success(`Refeição "${mealName.trim()}" guardada!`);
      setMealName("");
      setShowSaveForm(false);
      refresh();
    } catch {
      toast.error("Erro ao guardar refeição.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteCustomMeal(id);
      toast.success(`"${name}" eliminada.`);
      setMeals((prev) => prev.filter((m) => m.id !== id));
    } catch {
      toast.error("Erro ao eliminar refeição.");
    }
  };

  const handleUseMeal = (meal: CustomMeal) => {
    const foods: FoodItem[] = meal.foods.map((f) => ({
      name:     f.name,
      portion:  `${f.quantity}g`,
      calories: f.calories,
      protein:  f.protein,
      carbs:    f.carbs,
      fat:      f.fat,
      fiber:    f.fiber,
    }));
    onUseMeal({
      type: "snack",
      time: new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }),
      foods,
      total: {
        calories: meal.total_calories,
        protein:  meal.total_protein,
        carbs:    meal.total_carbs,
        fat:      meal.total_fat,
        fiber:    0,
      },
    });
    toast.success(`"${meal.name}" adicionada ao diário!`);
  };

  return (
    <div style={{
      background: "#1A1A1A", borderRadius: 0, border: "none",
      borderBottom: "1px solid #2A2A2A", padding: "20px 16px", width: "100%",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ChefHat size={18} color="rgba(255,255,255,0.6)" />
          <span style={{ fontSize: 14, fontWeight: 800, color: "white" }}>As minhas refeições</span>
        </div>

        {currentFoods.length > 0 && (
          <button
            type="button"
            onClick={() => setShowSaveForm((v) => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 12px", borderRadius: 10,
              background: "rgba(37,99,235,0.12)",
              border: "1px solid rgba(37,99,235,0.2)",
              color: "#60A5FA", fontSize: 11, fontWeight: 700, cursor: "pointer",
            }}
          >
            <BookmarkPlus size={13} />
            Guardar atual
          </button>
        )}
      </div>

      {/* Save form */}
      <AnimatePresence>
        {showSaveForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden", marginBottom: 14 }}
          >
            <div style={{
              background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)",
              borderRadius: 12, padding: "14px",
            }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8, fontWeight: 600 }}>
                NOME DA REFEIÇÃO
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  placeholder="Ex: Almoço pré-treino..."
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveCurrent()}
                  style={{
                    flex: 1, padding: "10px 12px", borderRadius: 10,
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "white", fontSize: 13, outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={handleSaveCurrent}
                  disabled={saving || !mealName.trim()}
                  style={{
                    padding: "10px 16px", borderRadius: 10,
                    background: "#1D4ED8", border: "none",
                    color: "white", fontSize: 13, fontWeight: 700,
                    cursor: saving || !mealName.trim() ? "not-allowed" : "pointer",
                    opacity: saving || !mealName.trim() ? 0.5 : 1,
                    display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Guardar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
          <Loader2 size={20} color="rgba(255,255,255,0.3)" className="animate-spin" />
        </div>
      ) : meals.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <ChefHat size={28} color="rgba(255,255,255,0.12)" style={{ margin: "0 auto 8px" }} />
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Ainda sem refeições guardadas</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>
            Adiciona alimentos e usa "Guardar atual" para criar a primeira.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {meals.map((meal) => (
            <div key={meal.id} style={{
              background: "#141414", borderRadius: 12,
              padding: "12px 14px",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "white", marginBottom: 2 }}>{meal.name}</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>
                    {meal.foods.length} alimento{meal.foods.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(meal.id, meal.name)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
                >
                  <Trash2 size={14} color="rgba(255,255,255,0.25)" />
                </button>
              </div>

              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                <MacroPill label={`${meal.total_calories} kcal`} color="#F97316" bg="rgba(249,115,22,0.12)" />
                <MacroPill label={`P ${meal.total_protein}g`}    color="#60A5FA" bg="rgba(96,165,250,0.12)" />
                <MacroPill label={`C ${meal.total_carbs}g`}      color="#FBBF24" bg="rgba(251,191,36,0.12)" />
                <MacroPill label={`G ${meal.total_fat}g`}        color="#F87171" bg="rgba(248,113,113,0.12)" />
              </div>

              <button
                type="button"
                onClick={() => handleUseMeal(meal)}
                style={{
                  width: "100%", padding: "9px 0", borderRadius: 10,
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}
              >
                Usar esta refeição
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
