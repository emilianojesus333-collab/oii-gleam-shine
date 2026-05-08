import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Apple } from "lucide-react";
import { useNutrition } from "@/hooks/useNutrition";

function nutritionContextText(proteinEaten: number, proteinGoal: number, hasMeals: boolean): string {
  if (!hasMeals) return "Ainda não registaste nada hoje — começa por adicionar o pequeno-almoço.";
  const remaining = Math.max(0, Math.round(proteinGoal - proteinEaten));
  const pct = proteinGoal > 0 ? (proteinEaten / proteinGoal) * 100 : 0;
  if (pct >= 80) return `Quase no objetivo de proteína — mais ${remaining}g e chegaste lá.`;
  if (pct >= 50) return `Bom progresso! Faltam ${remaining}g de proteína para o objetivo.`;
  return `Ainda precisas de ${remaining}g de proteína — considera uma refeição rica em proteína.`;
}

const macros = [
  { key: "protein" as const, label: "Proteína", color: "#60A5FA" },
  { key: "carbs"   as const, label: "Carbs",    color: "#FBBF24" },
  { key: "fat"     as const, label: "Gordura",  color: "#F87171" },
];

export const NutritionWidget = () => {
  const navigate = useNavigate();
  const { todayLog, progress, goals } = useNutrition();

  const calories = todayLog.totals.calories;
  const calGoal  = goals.calories;
  const calPct   = Math.min(Math.round((calories / calGoal) * 100), 100) || 0;
  const hasMeals = todayLog.meals.length > 0;
  const contextText = nutritionContextText(todayLog.totals.protein, goals.protein, hasMeals);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      style={{
        background: "#141414",
        border: "1px solid rgba(74,222,128,0.55)",
        borderRadius: 20,
        boxShadow: "0 0 32px rgba(74,222,128,0.18), 0 0 8px rgba(74,222,128,0.1)",
        padding: 18,
        margin: "0 16px 10px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Clarão decorativo superior direito */}
      <div style={{
        position: "absolute", top: -60, right: -60,
        width: 200, height: 200, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(74,222,128,0.12) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* Conteúdo */}
      <div style={{ position: "relative", zIndex: 1 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Apple size={18} color="#4ADE80" />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Nutrição hoje</span>
        </div>
        <button
          onClick={() => navigate("/nutrition")}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#4ADE80" }}
        >
          Ver tudo →
        </button>
      </div>

      {/* Contexto */}
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.50)", fontWeight: 500, marginBottom: 12, lineHeight: 1.5 }}>
        {contextText}
      </p>

      {/* Calorias */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 26, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
          {Math.round(calories)}
        </span>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.50)" }}>
          de {calGoal} kcal
        </span>
        <span style={{
          marginLeft: "auto",
          padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
          background: "rgba(74,222,128,0.15)", color: "#4ADE80",
        }}>
          {calPct}%
        </span>
      </div>

      {/* Barra de calorias */}
      <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden", marginBottom: 16 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${calPct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ height: "100%", background: "linear-gradient(90deg, #4ADE80, #22C55E)", borderRadius: 2 }}
        />
      </div>

      {/* Macros em 3 colunas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
        {macros.map(({ key, label, color }) => {
          const val  = Math.round(todayLog.totals[key]);
          const goal = Math.round(goals[key]);
          const pct  = Math.min(Math.round(progress[key]), 100) || 0;
          return (
            <div key={key}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{val}g</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.30)", marginBottom: 5 }}>
                {label} / {goal}g
              </div>
              <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                  style={{ height: "100%", background: color, borderRadius: 2 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Botão adicionar refeição */}
      <button
        onClick={() => navigate("/nutrition")}
        style={{
          width: "100%", height: 36, borderRadius: 10,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
          color: "rgba(255,255,255,0.50)", fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}
      >
        + Adicionar refeição
      </button>

      </div>{/* fim conteúdo */}
    </motion.div>
  );
};
