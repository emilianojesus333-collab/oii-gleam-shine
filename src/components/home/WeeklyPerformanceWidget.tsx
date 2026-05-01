import { motion } from "framer-motion";
import { TrendingUp, Minus, TrendingDown, Activity } from "lucide-react";
import { useWeeklyPerformance } from "@/hooks/useWeeklyPerformance";

export function WeeklyPerformanceWidget() {
  const { data, loading } = useWeeklyPerformance();

  if (loading || !data || data.totalSessions === 0) return null;

  const stats = [
  { value: data.totalSessions, label: "Sessões", icon: Activity, color: "#fff" },
  { value: data.progressCount, label: "Progressos", icon: TrendingUp, color: "#4ade80" },
  { value: data.maintainCount, label: "Manutenção", icon: Minus, color: "#facc15" }];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.43 }}
      className="mx-4 mb-3"
      style={{ background: "#0F1923", borderRadius: 20, border: "1px solid rgba(255,255,255,0.07)", padding: "18px" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <TrendingUp size={16} color="rgba(255,255,255,0.4)" />
        <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.6)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Esta Semana
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ textAlign: "center" }}>
              <Icon size={14} color={s.color} style={{ margin: "0 auto 4px" }} />
              <div style={{ fontSize: 24, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 4, fontWeight: 600 }}>{s.label}</div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
