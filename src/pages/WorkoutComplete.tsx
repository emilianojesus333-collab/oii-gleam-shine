import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Share2, Home, Clock, BarChart2, Repeat2 } from "lucide-react";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { WorkoutShareCard } from "@/components/workout/WorkoutShareCard";
import type { ExerciseShareData } from "@/components/workout/WorkoutShareCard";

interface WorkoutCompleteState {
  workoutName?: string;
  trainingType?: string;
  exercises?: ExerciseShareData[];
  durationMin?: number;
  totalSets?: number;
  totalReps?: number;
  sessionId?: string;
}

const PHRASE_TTL = 24 * 60 * 60 * 1000;

const WorkoutComplete = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useUserSettings();
  const { user } = useAuth();

  const state = (location.state as WorkoutCompleteState) || {};
  const workoutName  = state.workoutName  || "Treino";
  const trainingType = state.trainingType || "";
  const exercises    = state.exercises    || [];
  const durationMin  = state.durationMin  || 0;
  const totalSets    = state.totalSets    || 0;
  const totalReps    = state.totalReps    || 0;
  const sessionId    = state.sessionId;

  const aiName = settings?.ai_name || "LiftMate AI";
  const [aiPhrase, setAiPhrase] = useState("Excelente trabalho! Cada treino é um investimento no teu futuro.");
  const [showShareCard, setShowShareCard] = useState(false);

  // ── AI completion phrase ─────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    const cacheKey = `liftmate_complete_phrase_${user.id}`;

    // Check cache
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      try {
        const { text, ts } = JSON.parse(raw);
        if (Date.now() - ts < PHRASE_TTL && text) {
          setAiPhrase(text);
          return;
        }
      } catch { /* ignore */ }
    }

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            messages: [{
              role: "user",
              content: `O utilizador acabou de completar um treino de "${workoutName}" com ${exercises.length} exercícios, ${totalSets} séries em ${durationMin} minutos. Gera UMA frase curta de parabéns e motivação (máx. 2 frases, tom energético). Responde APENAS com a frase, sem aspas.`,
            }],
          }),
        });

        if (!res.ok || !res.body) return;

        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6);
            if (payload === "[DONE]") continue;
            try {
              const c = JSON.parse(payload).choices?.[0]?.delta?.content;
              if (c) accumulated += c;
            } catch { /* ignore */ }
          }
        }

        if (accumulated.trim()) {
          setAiPhrase(accumulated.trim());
          localStorage.setItem(cacheKey, JSON.stringify({ text: accumulated.trim(), ts: Date.now() }));
        }
      } catch (e) {
        console.error("[WorkoutComplete] phrase fetch:", e);
      }
    })();
  }, [user?.id]);

  // ── Animation helpers ────────────────────────────────────────────────
  const fadeUp = (delay: number) => ({
    initial:    { opacity: 0, y: 24 },
    animate:    { opacity: 1, y: 0  },
    transition: { delay, duration: 0.4, ease: "easeOut" as const },
  });

  return (
    <div style={{ minHeight: "100vh", background: "#000", padding: "0 16px 48px", display: "flex", flexDirection: "column", alignItems: "center" }}>

      {/* ── Trophy ── */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 16, stiffness: 180, delay: 0.05 }}
        style={{
          marginTop: 80, marginBottom: 24,
          width: 88, height: 88, borderRadius: 28,
          background: "linear-gradient(135deg, #1D4ED8 0%, #7C3AED 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 12px 40px -8px rgba(29,78,216,0.5)",
        }}
      >
        <Trophy size={42} color="#fff" />
      </motion.div>

      {/* ── Title ── */}
      <motion.div {...fadeUp(0.2)} style={{ textAlign: "center", marginBottom: 6 }}>
        <div style={{ fontSize: 30, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
          Treino Concluído!
        </div>
      </motion.div>

      {/* ── Subtitle ── */}
      <motion.div {...fadeUp(0.3)} style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 16, color: "#4ADE80", fontWeight: 700 }}>{workoutName}</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
          {exercises.length > 0 ? `${exercises.length} exercícios completados` : `${totalSets} séries completadas`}
        </div>
      </motion.div>

      {/* ── Stat cards ── */}
      <motion.div
        {...fadeUp(0.42)}
        style={{ width: "100%", maxWidth: 400, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 28 }}
      >
        {[
          { icon: Clock,    value: durationMin > 0 ? `${durationMin}'` : "—", label: "Duração"  },
          { icon: BarChart2, value: totalSets,                                 label: "Séries"   },
          { icon: Repeat2,  value: totalReps,                                  label: "Reps"     },
        ].map(({ icon: Icon, value, label }) => (
          <div
            key={label}
            style={{
              background: "#141414",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 16,
              padding: "16px 10px",
              textAlign: "center",
            }}
          >
            <Icon size={16} color="rgba(255,255,255,0.25)" style={{ margin: "0 auto 8px" }} />
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </motion.div>

      {/* ── AI phrase ── */}
      <motion.div {...fadeUp(0.54)} style={{ width: "100%", maxWidth: 400, textAlign: "center", marginBottom: 6 }}>
        <p style={{ fontSize: 14, fontStyle: "italic", color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
          {aiPhrase}
        </p>
      </motion.div>

      <motion.div {...fadeUp(0.6)} style={{ marginBottom: 32 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.18)", letterSpacing: "0.06em" }}>
          ✦ {aiName}
        </span>
      </motion.div>

      {/* ── Share button ── */}
      <motion.div {...fadeUp(0.66)} style={{ width: "100%", maxWidth: 400, marginBottom: 12 }}>
        <button
          onClick={() => setShowShareCard(true)}
          style={{
            width: "100%", height: 50, borderRadius: 14, border: "none", cursor: "pointer",
            background: "linear-gradient(90deg, #16A34A, #15803D, #22C55E, #15803D, #16A34A)",
            backgroundSize: "300% 100%",
            animation: "shimmer 3s linear infinite",
            color: "#fff", fontSize: 15, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <Share2 size={18} />
          Partilhar treino
        </button>
      </motion.div>

      {/* ── Back home ── */}
      <motion.div {...fadeUp(0.72)} style={{ width: "100%", maxWidth: 400 }}>
        <button
          onClick={() => navigate("/home")}
          style={{
            width: "100%", height: 44, borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "transparent",
            color: "rgba(255,255,255,0.4)",
            fontSize: 14, fontWeight: 600,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <Home size={15} />
          Voltar ao início
        </button>
      </motion.div>

      {/* ── WorkoutShareCard modal ── */}
      <AnimatePresence>
        {showShareCard && (
          <WorkoutShareCard
            open={showShareCard}
            onClose={() => setShowShareCard(false)}
            data={{
              workoutName,
              trainingType,
              exercises,
              durationMin,
              totalSets,
              totalReps,
              date: new Date().toISOString().split("T")[0],
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkoutComplete;
