import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Dumbbell, Leaf } from "lucide-react";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useAuth } from "@/hooks/useAuth";
import { useMuscleFatigue } from "@/hooks/useMuscleFatigue";
import { collectUserContext, formatContextForAI } from "@/utils/userContextCollector";
import { supabase } from "@/integrations/supabase/client";

const TIP_TTL = 4 * 60 * 60 * 1000; // 4 horas
const DEFAULT_TIP = "Foca na técnica hoje. A carga certa é aquela que te permite executar bem todos os sets.";

interface TodayWorkoutCardProps {
  workout: string | null;
  stimulus: string;
  isRestDay: boolean;
}

function getWorkoutName(workout: string | null, isRestDay: boolean): string {
  if (isRestDay) return "Descanso";
  if (!workout) return "Treino livre";
  const parts = workout.split(/[•+]/).map((s) => s.trim()).filter(Boolean);
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} & ${parts[1]}`;
  return parts.join(" · ");
}

const muscleChipStyle: Record<string, { bg: string; color: string }> = {
  "peito":        { bg: "rgba(96,165,250,0.2)",  color: "#60A5FA" },
  "costas":       { bg: "rgba(167,139,250,0.2)", color: "#A78BFA" },
  "perna":        { bg: "rgba(74,222,128,0.2)",  color: "#4ADE80" },
  "ombro":        { bg: "rgba(251,191,36,0.2)",  color: "#FBBF24" },
  "bícep":        { bg: "rgba(248,113,113,0.2)", color: "#F87171" },
  "tricep":       { bg: "rgba(251,146,60,0.2)",  color: "#FB923C" },
  "trícep":       { bg: "rgba(251,146,60,0.2)",  color: "#FB923C" },
  "core":         { bg: "rgba(236,72,153,0.2)",  color: "#EC4899" },
};
const restChipStyle = { bg: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", border: undefined as string | undefined };

const recoveryChip = {
  label: "🛋 Descanso ou recuperação ativa",
  bg: "rgba(251,191,36,0.12)",
  color: "#FBBF24",
  border: "1px solid rgba(251,191,36,0.2)",
};

function getMuscleChips(workout: string | null): { label: string; bg: string; color: string; border?: string }[] {
  if (!workout) return [];
  const parts = workout.split(/[·•+,]/).map((s) => s.trim()).filter(Boolean);
  return parts.map((p) => {
    const key = Object.keys(muscleChipStyle).find((k) => p.toLowerCase().includes(k));
    const style = key ? muscleChipStyle[key] : restChipStyle;
    return { label: p, ...style };
  });
}

export function TodayWorkoutCard({ workout, stimulus, isRestDay }: TodayWorkoutCardProps) {
  const navigate = useNavigate();
  const { settings } = useUserSettings();
  const { user } = useAuth();
  const { muscles } = useMuscleFatigue();
  const [tip, setTip] = useState<string>(DEFAULT_TIP);
  const [displayedTip, setDisplayedTip] = useState<string>("");
  const [showCursor, setShowCursor] = useState(false);
  const [restSignals, setRestSignals] = useState({ consecutiveDays: 0, lastSessionSets: 0 });

  const aiName = settings?.ai_name || "LiftMate AI";
  const workoutName = getWorkoutName(workout, isRestDay);
  const muscleChips = getMuscleChips(workout);

  // Fetch consecutive days + last session sets
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - 5);
      const { data } = await supabase
        .from("workout_sessions")
        .select("date, exercise_logs")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("date", since.toISOString().split("T")[0])
        .order("date", { ascending: false });
      if (!data) return;
      let consecutive = 0;
      const today = new Date();
      for (let i = 0; i < 5; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        if (data.some((s) => s.date === d.toISOString().split("T")[0])) consecutive++;
        else break;
      }
      const logs: any[] = data.length > 0 && Array.isArray(data[0].exercise_logs) ? data[0].exercise_logs : [];
      const lastSessionSets = logs.reduce((acc, log) => acc + (Number(log.sets) || 0), 0);
      setRestSignals({ consecutiveDays: consecutive, lastSessionSets });
    })();
  }, [user?.id]);

  const showRecoveryChip = useMemo(() => {
    if (isRestDay) return true;
    const highFatigueCount = muscles.filter((m) => m.current_fatigue > 60).length;
    return (
      highFatigueCount >= 2 ||
      restSignals.consecutiveDays > 4 ||
      restSignals.lastSessionSets > 20
    );
  }, [isRestDay, muscles, restSignals]);

  useEffect(() => {
    if (!user?.id) return;

    const cacheKey = `liftmate_dynamic_tip_${user.id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { text, ts } = JSON.parse(cached);
        if (Date.now() - ts < TIP_TTL && text) {
          setTip(text);
          return;
        }
      } catch {
        // cache corrompida, ignora
      }
    }

    (async () => {
      try {
        const ctx = await collectUserContext(user.id);
        const contextStr = formatContextForAI(ctx);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const res = await fetch(`${supabaseUrl}/functions/v1/chat`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
            apikey: supabaseAnonKey,
          },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: `Com base no que sabes sobre este utilizador, gera UMA dica curta (máximo 2 frases) personalizada para o treino de hoje: ${workoutName}. Baseia-te no histórico real — última sessão, dores mencionadas, progressão de carga. Responde APENAS com a dica.`,
              },
            ],
            context: contextStr,
          }),
        });

        if (!res.ok || !res.body) return;

        const reader = res.body.getReader();
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
              const parsed = JSON.parse(payload);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) accumulated += content;
            } catch {
              // linha mal formada, ignora
            }
          }
        }

        if (accumulated.trim()) {
          setTip(accumulated.trim());
          localStorage.setItem(
            cacheKey,
            JSON.stringify({ text: accumulated.trim(), ts: Date.now() })
          );
        }
      } catch (err) {
        console.error("[TodayWorkoutCard] Erro ao buscar dica dinâmica:", err);
      }
    })();
  }, [user?.id, workoutName]);

  // Typewriter: revela a dica letra a letra sempre que `tip` muda
  useEffect(() => {
    if (!tip) return;
    setDisplayedTip("");
    setShowCursor(true);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayedTip(tip.slice(0, i));
      if (i >= tip.length) {
        clearInterval(interval);
        setShowCursor(false);
      }
    }, 25);
    return () => clearInterval(interval);
  }, [tip]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      style={{ marginBottom: 16 }}
    >
      {/* Label HOJE */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.15em",
          color: "rgba(255,255,255,0.5)",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        HOJE
      </div>

      {/* Chips de músculos + recuperação */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {muscleChips.map((chip, i) => (
          <span
            key={i}
            style={{
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              background: chip.bg,
              color: chip.color,
              border: chip.border,
            }}
          >
            {chip.label}
          </span>
        ))}
        {showRecoveryChip && (
          <span style={{
            padding: "4px 12px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
            background: recoveryChip.bg,
            color: recoveryChip.color,
            border: recoveryChip.border,
          }}>
            {recoveryChip.label}
          </span>
        )}
      </div>

      {/* Dica dinâmica da IA — typewriter */}
      <div
        style={{
          fontSize: 11,
          fontStyle: "italic",
          color: "rgba(255,255,255,0.45)",
          fontWeight: 500,
          lineHeight: 1.5,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical" as const,
          overflow: "hidden",
          marginBottom: 4,
          minHeight: 16,
        }}
      >
        {displayedTip}
        {showCursor && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
            style={{ marginLeft: 1, fontStyle: "normal", fontWeight: 400 }}
          >
            |
          </motion.span>
        )}
      </div>

      {/* Assinatura do assistente */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: "rgba(255,255,255,0.2)",
          letterSpacing: "0.06em",
          marginBottom: 16,
        }}
      >
        ✦ {aiName}
      </div>

      {/* Wrapper contém o breathe sem ultrapassar a tela */}
      <div style={{ overflow: "hidden", paddingLeft: 2, paddingRight: 2, paddingTop: 2, paddingBottom: 2 }}>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate("/workout")}
          style={{
            width: "100%",
            marginLeft: 0,
            marginRight: 0,
            height: 52,
            borderRadius: 100,
            background: "transparent",
            border: "2px solid #2563EB",
            color: "#2563EB",
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: "0.02em",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            position: "relative",
            overflow: "hidden",
            animation: "breathe 3s ease-in-out infinite",
          }}
        >
          {/* Shimmer interior */}
          <div style={{
            position: "absolute", inset: 0, borderRadius: 100,
            background: "linear-gradient(90deg, transparent, rgba(37,99,235,0.2), transparent)",
            backgroundSize: "200% 100%",
            animation: "shimmer 2s linear infinite",
            pointerEvents: "none",
          }} />
          {isRestDay ? (
            <>
              <Leaf style={{ width: 18, height: 18, color: "#2563EB" }} />
              Iniciar recuperação
            </>
          ) : (
            <>
              <Dumbbell style={{ width: 18, height: 18, color: "#2563EB" }} />
              Iniciar treino
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
