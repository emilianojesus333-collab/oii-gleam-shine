import { motion } from "framer-motion";
import { Clock, Dumbbell, Droplets, BarChart2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useMuscleFatigue, getMuscleLabel } from "@/hooks/useMuscleFatigue";
import { useWeeklyStats } from "@/hooks/useWeeklyStats";

function trendColor(curr: number, prev: number) {
  if (prev === 0) return "rgba(255,255,255,0.50)";
  return curr >= prev ? "#4ADE80" : "#F87171";
}
function trendPct(curr: number, prev: number): string {
  if (prev === 0) return "—";
  const pct = Math.round(((curr - prev) / prev) * 100);
  return `${pct > 0 ? "+" : ""}${pct}%`;
}
function TrendIcon({ curr, prev }: { curr: number; prev: number }) {
  if (prev === 0) return <Minus size={10} color="rgba(255,255,255,0.50)" />;
  if (curr >= prev) return <TrendingUp size={10} color="#4ADE80" />;
  return <TrendingDown size={10} color="#F87171" />;
}

const CARD_STYLE = {
  background: "#141414",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16,
  padding: "16px",
};

function getRecoveryPct(fatigue: number) {
  return Math.max(0, Math.min(100, 100 - fatigue));
}

export const StatusCarousel = () => {
  const navigate = useNavigate();
  const { muscles, fatigued, mostRecovered, hydrationContext, loading } = useMuscleFatigue();
  const { data: weeklyData } = useWeeklyStats();

  if (loading) return null;

  // ── Weekly ring params ───────────────────────────────────────
  const completedSessions = weeklyData?.completedSessions ?? 0;
  const plannedSessions = weeklyData?.plannedSessions ?? 0;
  const totalSets = weeklyData?.totalSets ?? 0;
  const totalReps = weeklyData?.totalReps ?? 0;
  const totalMinutes = weeklyData?.totalMinutes ?? 0;
  const prevSets = weeklyData?.prevSets ?? 0;
  const prevReps = weeklyData?.prevReps ?? 0;
  const prevSessions = weeklyData?.prevSessions ?? 0;
  const dailyActivity = weeklyData?.dailyActivity ?? [false, false, false, false, false, false, false];
  const planned = Math.max(plannedSessions, 1);
  const pct = Math.min(Math.round((completedSessions / planned) * 100), 100);
  const ringSize = 56;
  const ringStroke = 5;
  const ringRadius = (ringSize - ringStroke) / 2;
  const circumference = 2 * Math.PI * ringRadius;
  const offset = circumference - (pct / 100) * circumference;

  const display = muscles.slice(0, 4);
  const recovering = muscles.filter((m) => m.current_fatigue > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-4"
    >
      <Carousel opts={{ align: "start", loop: false }} className="w-full">
        <CarouselContent className="-ml-0">

          {/* ── SLIDE 1: Recovery grid + Weekly progress ── */}
          <CarouselItem className="basis-full pl-0">
            <div className="mx-2 flex flex-col gap-3">

              {/* Recovery 2x2 grid */}
              <div className="grid grid-cols-2 gap-3">
                {display.map((m, i) => {
                  const pct = getRecoveryPct(m.current_fatigue);
                  const isRecovered = pct >= 80;
                  const label = getMuscleLabel(m.muscle_group);
                  return (
                    <motion.div
                      key={m.muscle_group}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.07 }}
                      style={CARD_STYLE}
                    >
                      <p className="text-sm font-bold text-white mb-3">{label}</p>
                      <div className="w-full h-1.5 rounded-full mb-2" style={{ background: "rgba(255,255,255,0.15)" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, ease: "easeOut", delay: 0.2 + i * 0.07 }}
                          className="h-full rounded-full"
                          style={{ background: isRecovered ? "#4ADE80" : "#FBBF24" }}
                        />
                      </div>
                      <p className="text-xs font-semibold" style={{ color: isRecovered ? "#4ADE80" : "#FBBF24" }}>
                        {isRecovered ? "Recuperado" : `${pct}%`}
                      </p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.30)", fontWeight: 500, marginTop: 3 }}>
                        {m.last_trained_at
                          ? `Último treino há ${Math.max(0, Math.floor((Date.now() - new Date(m.last_trained_at).getTime()) / (1000 * 60 * 60 * 24)))} dias`
                          : "Sem histórico"}
                      </p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Weekly progress card */}
              <div style={CARD_STYLE}>
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <svg width={ringSize} height={ringSize} className="-rotate-90">
                      <circle cx={ringSize / 2} cy={ringSize / 2} r={ringRadius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={ringStroke} />
                      <motion.circle
                        cx={ringSize / 2} cy={ringSize / 2} r={ringRadius} fill="none"
                        stroke="#4ADE80" strokeWidth={ringStroke} strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-black text-white leading-none">
                        {completedSessions}/{plannedSessions}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">
                      {completedSessions} de {plannedSessions} treinos
                    </p>
                    <p className="text-xs text-white/40">
                      {totalSets} séries · {totalReps} reps · {totalMinutes} min
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-3">
                  {dailyActivity.map((active, i) => (
                    <div
                      key={i}
                      className="h-1.5 flex-1 rounded-full"
                      style={{ backgroundColor: active ? "#4ADE80" : "rgba(255,255,255,0.07)" }}
                    />
                  ))}
                </div>
              </div>

            </div>
          </CarouselItem>

          {/* ── SLIDE 2: Recovery in progress + hydration + fatigue ── */}
          <CarouselItem className="basis-full pl-0">
            <div className="mx-2 flex flex-col gap-3">

              {/* Recovery in progress */}
              <div style={{ ...CARD_STYLE, minHeight: 160 }}>
                <div className="flex items-center gap-3 mb-4">
                  <p className="text-sm font-bold text-white">Recuperação em progresso</p>
                </div>
                <div className="flex flex-col gap-3">
                  {recovering.length === 0 ? (
                    <p className="text-sm text-white/40">Todos os músculos estão recuperados. Bom treino!</p>
                  ) : (
                    recovering
                      .sort((a, b) => b.hours_to_recovery - a.hours_to_recovery)
                      .map((m) => (
                        <div key={m.muscle_group} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-white/40" />
                            <span className="text-sm text-white">{getMuscleLabel(m.muscle_group)}</span>
                          </div>
                          <span className="text-xs text-white/40">≈ {m.hours_to_recovery}h</span>
                        </div>
                      ))
                  )}
                  {mostRecovered.length > 0 && (
                    <div className="border-t border-white/5 pt-3 mt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Dumbbell className="h-3.5 w-3.5 text-[#4ADE80]" />
                        <span className="text-xs font-medium text-[#4ADE80]">Sugestão de treino hoje</span>
                      </div>
                      <p className="text-xs text-white/40">
                        Mais recuperados:{" "}
                        <span className="text-white font-medium">
                          {mostRecovered.map((m) => getMuscleLabel(m.muscle_group)).join(", ")}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Hydration */}
              <div className="rounded-xl p-3" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-start gap-2">
                  <Droplets className="mt-0.5 h-4 w-4 shrink-0 text-[#4ADE80]" />
                  <div>
                    <p className="text-xs font-medium text-white">Hidratação</p>
                    <p className="mt-1 text-xs text-white/40 leading-relaxed">{hydrationContext.message}</p>
                    <p className="mt-1 text-[11px] text-white/30">
                      {hydrationContext.currentIntakeLiters.toFixed(1)} / {hydrationContext.goalLiters.toFixed(1)} L
                    </p>
                  </div>
                </div>
              </div>

              {/* Fatigue alert (optional) */}
              {fatigued.length > 0 && (
                <motion.div
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/chat", {
                    state: {
                      prefill: `Os meus músculos com fadiga alta são: ${fatigued
                        .map((m) => `${getMuscleLabel(m.muscle_group)} (${m.current_fatigue}%)`)
                        .join(", ")}. Que treino recomendam para hoje?`
                    }
                  })}
                  style={CARD_STYLE}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <p className="text-sm font-bold text-white">Fadiga elevada detectada</p>
                  </div>
                  <div className="space-y-2 mb-3">
                    {fatigued.map((m) => (
                      <p key={m.muscle_group} className="text-sm text-red-400">
                        {getMuscleLabel(m.muscle_group)} — fadiga {m.current_fatigue}%
                      </p>
                    ))}
                  </div>
                  <p className="text-xs text-white/40">Treinar agora pode reduzir desempenho.</p>
                  <p className="mt-2 text-xs font-medium text-[#4ADE80]">Toca para pedir conselho à IA →</p>
                </motion.div>
              )}

            </div>
          </CarouselItem>

          {/* ── SLIDE 3: Volume + Tendência ── */}
          <CarouselItem className="basis-full pl-0">
            <div className="mx-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>

              {/* Card Volume */}
              <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.30)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
                  <BarChart2 size={10} />
                  VOLUME
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { value: totalSets, label: "séries" },
                    { value: totalReps, label: "reps" },
                    { value: totalMinutes, label: "min" },
                  ].map(({ value, label }) => (
                    <div key={label} style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>{value}</span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.30)" }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Tendência */}
              <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.30)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
                  <TrendingUp size={10} />
                  TENDÊNCIA
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { label: "Volume", curr: totalSets, prev: prevSets },
                    { label: "Consistência", curr: completedSessions, prev: prevSessions },
                    { label: "Frequência", curr: totalReps, prev: prevReps },
                  ].map(({ label, curr, prev }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.50)" }}>{label}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <TrendIcon curr={curr} prev={prev} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: prev === 0 ? "rgba(255,255,255,0.50)" : trendColor(curr, prev) }}>
                          {trendPct(curr, prev)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: "rgba(255,255,255,0.30)" }}>
                  Comparado à semana passada
                </div>
              </div>

            </div>
          </CarouselItem>

        </CarouselContent>
      </Carousel>

      {/* Dot indicators */}
      <div className="mt-3 flex justify-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.30)" }} />
        ))}
      </div>
    </motion.div>
  );
};
