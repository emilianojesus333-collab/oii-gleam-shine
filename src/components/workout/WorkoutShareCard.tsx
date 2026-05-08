import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { X, Share2, Image } from "lucide-react";
import html2canvas from "html2canvas";
import { toast } from "sonner";

export interface ExerciseShareData {
  name: string;
  sets: number;
  reps: string;
  rest: number;
}

export interface WorkoutShareCardData {
  workoutName: string;
  trainingType?: string;
  exercises: ExerciseShareData[];
  durationMin: number;
  totalSets: number;
  totalReps: number;
  date: string;
}

interface WorkoutShareCardProps {
  open: boolean;
  onClose: () => void;
  data: WorkoutShareCardData;
}

// ── Radar chart SVG ──────────────────────────────────────────────────────
function RadarChart({ exercises }: { exercises: ExerciseShareData[] }) {
  const cx = 110, cy = 110, maxR = 72;
  const items = exercises.slice(0, 5);
  if (items.length < 3) return null;
  const n = items.length;
  const maxSets = Math.max(...items.map((e) => e.sets), 1);

  const axisAngles = items.map((_, i) => (i / n) * 2 * Math.PI - Math.PI / 2);
  const axisPoints = axisAngles.map((a) => ({ x: cx + maxR * Math.cos(a), y: cy + maxR * Math.sin(a) }));
  const dataPoints = items.map((ex, i) => {
    const r = Math.max((ex.sets / maxSets) * maxR, 10);
    return { x: cx + r * Math.cos(axisAngles[i]), y: cy + r * Math.sin(axisAngles[i]) };
  });

  return (
    <svg width={220} height={220} style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4ADE80" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#4ADE80" stopOpacity={0.04} />
        </radialGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map((lvl) => (
        <polygon
          key={lvl}
          points={axisAngles.map((a) => `${cx + maxR * lvl * Math.cos(a)},${cy + maxR * lvl * Math.sin(a)}`).join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={0.8}
        />
      ))}

      {/* Axis lines */}
      {axisPoints.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.15)" strokeWidth={0.8} />
      ))}

      {/* Data polygon */}
      <polygon
        points={dataPoints.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="url(#radarFill)"
        stroke="#4ADE80"
        strokeWidth={1.5}
        filter="url(#glow)"
      />

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={3} fill="#4ADE80" opacity={0.5} />

      {/* Labels */}
      {items.map((ex, i) => {
        const labelR = maxR + 24;
        const lx = cx + labelR * Math.cos(axisAngles[i]);
        const ly = cy + labelR * Math.sin(axisAngles[i]);
        const shortName = ex.name.length > 12 ? ex.name.slice(0, 12) + "…" : ex.name;
        return (
          <g key={i}>
            <text x={lx} y={ly - 3} textAnchor="middle" fill="rgba(255,255,255,0.90)" fontSize={7.5} fontWeight="700" fontFamily="system-ui, sans-serif">
              {shortName}
            </text>
            <text x={lx} y={ly + 9} textAnchor="middle" fill="rgba(74,222,128,0.65)" fontSize={6.5} fontFamily="system-ui, sans-serif">
              {ex.sets}×{ex.reps} · {ex.rest}s
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Component ────────────────────────────────────────────────────────────
export const WorkoutShareCard = ({ open, onClose, data }: WorkoutShareCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"dark" | "photo">("dark");
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  if (!open) return null;

  const dateStr = new Date().toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setBgImage(ev.target?.result as string);
      setMode("photo");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 3,
        useCORS: true,
        logging: false,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) { setExporting(false); return; }
        const file = new File([blob], `treino-${data.date}.png`, { type: "image/png" });
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "Meu Treino — LiftMate" });
        } else {
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `treino-${data.date}.png`;
          link.click();
          toast.success("Imagem guardada!");
        }
        setExporting(false);
      }, "image/png");
    } catch {
      toast.error("Erro ao partilhar");
      setExporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 420, padding: "0 16px 44px", display: "flex", flexDirection: "column", gap: 12 }}
      >
        {/* Close */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 20, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <X size={16} color="rgba(255,255,255,0.70)" />
          </button>
        </div>

        {/* ── THE CARD (captured by html2canvas) ── */}
        <div
          ref={cardRef}
          style={{
            borderRadius: 20,
            overflow: "hidden",
            position: "relative",
            background: mode === "dark" ? "#050A0A" : "transparent",
          }}
        >
          {/* Background photo overlay */}
          {mode === "photo" && bgImage && (
            <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
              <img
                src={bgImage}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.3) saturate(0.7)" }}
              />
            </div>
          )}

          <div style={{ position: "relative", zIndex: 1, padding: "24px 20px 20px" }}>

            {/* Header row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontSize: 15, fontWeight: 900, color: "#1D4ED8", letterSpacing: "0.08em" }}>LIFTMATE</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.70)", fontWeight: 600 }}>{dateStr}</span>
            </div>

            {/* Workout name + type */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.01em", marginBottom: 4 }}>
                {data.workoutName || "Treino"}
              </div>
              {data.trainingType && (
                <div style={{ fontSize: 12, fontWeight: 700, color: "#4ADE80", letterSpacing: "0.06em" }}>
                  {data.trainingType.toUpperCase()}
                </div>
              )}
            </div>

            {/* Radar chart */}
            {data.exercises.length >= 3 && (
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                <RadarChart exercises={data.exercises} />
              </div>
            )}

            {/* Stats row */}
            <div style={{
              borderTop: "1px solid rgba(255,255,255,0.07)",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              padding: "14px 0",
              display: "flex",
              justifyContent: "space-around",
              marginBottom: 20,
            }}>
              {[
                { value: `${data.durationMin}'`, label: "Duração" },
                { value: data.totalSets,          label: "Séries" },
                { value: data.totalReps,           label: "Reps" },
              ].map(({ value, label }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.30)", marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Footer branding */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                <rect x="3" y="9" width="3" height="6" rx="1.5" fill="rgba(255,255,255,0.30)" />
                <rect x="18" y="9" width="3" height="6" rx="1.5" fill="rgba(255,255,255,0.30)" />
                <rect x="6" y="7" width="2.5" height="10" rx="1.25" fill="rgba(255,255,255,0.30)" />
                <rect x="15.5" y="7" width="2.5" height="10" rx="1.25" fill="rgba(255,255,255,0.30)" />
                <rect x="8.5" y="11" width="7" height="2" rx="1" fill="rgba(255,255,255,0.30)" />
              </svg>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.30)", letterSpacing: "0.12em" }}>
                LIFTMATE.APP
              </span>
            </div>
          </div>
        </div>

        {/* ── Mode controls ── */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setMode("dark")}
            style={{
              flex: 1, height: 40, borderRadius: 12, cursor: "pointer",
              border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.07)"}`,
              background: mode === "dark" ? "rgba(255,255,255,0.07)" : "transparent",
              color: mode === "dark" ? "#fff" : "rgba(255,255,255,0.50)",
              fontSize: 13, fontWeight: 600,
            }}
          >
            Fundo escuro
          </button>

          <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: "none" }} />

          <button
            onClick={() => photoInputRef.current?.click()}
            style={{
              flex: 1, height: 40, borderRadius: 12, cursor: "pointer",
              border: `1px solid ${mode === "photo" ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.07)"}`,
              background: mode === "photo" ? "rgba(255,255,255,0.07)" : "transparent",
              color: mode === "photo" ? "#fff" : "rgba(255,255,255,0.50)",
              fontSize: 13, fontWeight: 600,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <Image size={14} />
            Adicionar foto
          </button>
        </div>

        {/* ── Share button ── */}
        <button
          onClick={handleShare}
          disabled={exporting}
          style={{
            width: "100%", height: 48, borderRadius: 14, border: "none",
            cursor: exporting ? "not-allowed" : "pointer",
            background: "linear-gradient(90deg, #16A34A, #15803D, #22C55E, #15803D, #16A34A)",
            backgroundSize: "300% 100%",
            animation: "shimmer 3s linear infinite",
            color: "#fff", fontSize: 15, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            opacity: exporting ? 0.6 : 1,
          }}
        >
          <Share2 size={18} />
          {exporting ? "A gerar..." : "Partilhar"}
        </button>
      </motion.div>
    </motion.div>
  );
};
