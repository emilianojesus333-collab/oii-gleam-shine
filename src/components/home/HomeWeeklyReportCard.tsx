import { useState } from "react";
import { Calendar, TrendingUp, Dumbbell, Sparkles, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAIWeeklyReport, shouldShowWeeklyReport } from "@/hooks/useAIWeeklyReport";
import { useAuth } from "@/hooks/useAuth";

const MacroPill = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div style={{
    flex: 1, minWidth: 0,
    background: "rgba(255,255,255,0.06)", borderRadius: 10,
    padding: "10px 8px", textAlign: "center",
  }}>
    <p style={{ fontSize: 18, fontWeight: 900, color, lineHeight: 1 }}>{value}</p>
    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 4, fontWeight: 600 }}>{label}</p>
  </div>
);

export const HomeWeeklyReportCard = () => {
  const { user } = useAuth();
  const report = useAIWeeklyReport();
  const [expanded, setExpanded] = useState(false);
  const [forceShown, setForceShown] = useState(false);

  if (!user) return null;

  // Only show on Mondays or if there's a cached report from this week
  const shouldShow = forceShown || shouldShowWeeklyReport(user.id);
  if (!shouldShow && !report.loading) return null;

  const formatDate = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("pt-PT", { day: "numeric", month: "short" });
  };

  const volumeT = (report.stats.totalVolume / 1000).toFixed(1);
  const cleanSummary = typeof report.aiSummary === "string" &&
    !report.aiSummary.includes("{") &&
    !report.aiSummary.includes("chatcmpl") &&
    !report.aiSummary.includes('"type"')
    ? report.aiSummary
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        margin: "0 8px 12px",
        background: "linear-gradient(135deg, #0A1A0F 0%, #0D2818 60%, #0A1510 100%)",
        border: "1px solid rgba(74,222,128,0.2)",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ padding: "16px 16px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: "rgba(74,222,128,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Calendar size={16} color="#4ADE80" />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 800, color: "white", lineHeight: 1.1 }}>Relatório Semanal</p>
              {report.weekStart && (
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>
                  {formatDate(report.weekStart)} — {formatDate(report.weekEnd)}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
            >
              {expanded
                ? <ChevronUp size={16} color="rgba(255,255,255,0.4)" />
                : <ChevronDown size={16} color="rgba(255,255,255,0.4)" />
              }
            </button>
          </div>
        </div>

        {/* Stats strip */}
        {!report.loading && (
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <MacroPill label="TREINOS"  value={String(report.stats.totalSessions)} color="#4ADE80" />
            <MacroPill label="VOLUME"   value={`${volumeT}t`}                      color="#60A5FA" />
            <MacroPill label="SÉRIES"   value={String(report.stats.totalSets)}      color="#FBBF24" />
          </div>
        )}

        {/* Loading skeleton */}
        {report.loading && (
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
                flex: 1, height: 52, borderRadius: 10,
                background: "rgba(255,255,255,0.05)", animation: "pulse 1.5s infinite",
              }} />
            ))}
          </div>
        )}

        {/* AI Summary */}
        {report.loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 20, height: 20, borderRadius: "50%",
              border: "2px solid rgba(74,222,128,0.2)", borderTopColor: "#4ADE80",
              animation: "spin 0.8s linear infinite", flexShrink: 0,
            }} />
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>
              A gerar resumo da semana...
            </p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
          </div>
        ) : cleanSummary ? (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <Sparkles size={13} color="#4ADE80" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{
              fontSize: 12, color: "rgba(255,255,255,0.7)",
              lineHeight: 1.6, fontStyle: "italic",
            }}>
              {cleanSummary}
            </p>
          </div>
        ) : report.error ? (
          <p style={{ fontSize: 12, color: "rgba(248,113,113,0.7)" }}>{report.error}</p>
        ) : null}
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && !report.loading && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              borderTop: "1px solid rgba(74,222,128,0.1)",
              padding: "14px 16px",
            }}>
              {/* Muscle groups */}
              {report.stats.muscleGroupsHit.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", fontWeight: 700, marginBottom: 6 }}>
                    GRUPOS MUSCULARES
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {report.stats.muscleGroupsHit.map((mg) => (
                      <span key={mg} style={{
                        fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                        background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.15)",
                        color: "#4ADE80",
                      }}>
                        {mg}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Best exercise */}
              {report.stats.bestExercise && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <TrendingUp size={13} color="#60A5FA" />
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Melhor exercício</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "white" }}>{report.stats.bestExercise}</p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                      {(report.stats.bestVolume / 1000).toFixed(1)}t de volume
                    </p>
                  </div>
                </div>
              )}

              {/* Per session average */}
              {report.stats.totalSessions > 0 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Dumbbell size={13} color="#FBBF24" />
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Volume médio / sessão</span>
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "white" }}>
                    {(report.stats.avgVolumePerSession / 1000).toFixed(1)}t
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
