import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, ArrowLeft, Camera, Upload, Calendar, Loader2,
  TrendingUp, TrendingDown, Dumbbell, Sparkles, Target, AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { invokeWithAuth } from "@/lib/supabaseHelpers";
import { compressImage } from "@/lib/imageCompression";
import { useAuth } from "@/hooks/useAuth";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";

// ── Types ──────────────────────────────────────────────────────────────
interface MuscleAnalysis {
  muscleGroup: string;
  description: string;
  score: number;
  priority?: string;
}

interface Recommendation {
  focus: string;
  frequency: string;
  exercises: string[];
  tip: string;
}

interface PhysiqueAnalysis {
  success: boolean;
  error?: string;
  inconsistency?: boolean;
  analysis?: {
    overallScore: number;
    bodyFatEstimate: string;
    strengths: MuscleAnalysis[];
    weaknesses: MuscleAnalysis[];
    recommendations: Recommendation[];
    motivationalMessage: string;
  };
}

interface EvaluationRecord {
  id: string;
  created_at: string;
  score: number | null;
  body_fat_estimate: string | null;
  photo_path: string | null;
  photo_thumb?: string; // signed URL for thumbnail
}

// ── Constants ──────────────────────────────────────────────────────────
const EVALUATION_COOLDOWN_DAYS = 15;
const MAX_BASE64_LENGTH = 6_600_000;

// ── Score ring SVG ─────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(score / 10, 1);
  return (
    <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto" }}>
      <svg width={120} height={120} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={60} cy={60} r={r} stroke="rgba(167,139,250,0.15)" strokeWidth={10} fill="none" />
        <motion.circle
          cx={60} cy={60} r={r}
          stroke="#A78BFA" strokeWidth={10} fill="none"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${pct * circ} ${circ}` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{score.toFixed(1)}</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Score</span>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────
const AvaliacaoFisica = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isAnalyzing, setIsAnalyzing]             = useState(false);
  const [results, setResults]                     = useState<PhysiqueAnalysis | null>(null);
  const [previousResults, setPreviousResults]     = useState<PhysiqueAnalysis | null>(null);
  const [previewImage, setPreviewImage]           = useState<string | null>(null);
  const [lastEvaluationDate, setLastEvaluationDate] = useState<Date | null>(null);
  const [daysRemaining, setDaysRemaining]         = useState(0);
  const [isLocked, setIsLocked]                   = useState(false);
  const [showResults, setShowResults]             = useState(false);
  const [inconsistencyDetected, setInconsistencyDetected] = useState(false);
  const [exifWarning, setExifWarning]             = useState(false);
  const [evaluationHistory, setEvaluationHistory] = useState<EvaluationRecord[]>([]);
  const [previousPhotoPath, setPreviousPhotoPath] = useState<string | null>(null);

  const cameraInputRef  = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Load evaluation history from DB
  useEffect(() => {
    if (!user?.id) return;
    loadHistory();
  }, [user?.id]);

  const loadHistory = async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from("physique_evaluations" as never)
        .select("id, created_at, score, body_fat_estimate, photo_path")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);

      if (!data || data.length === 0) return;

      // Load most recent photo path for comparison
      const mostRecent = (data as EvaluationRecord[])[0];
      if (mostRecent.photo_path) setPreviousPhotoPath(mostRecent.photo_path);

      // Cooldown from DB (most recent entry)
      const lastDate = new Date(mostRecent.created_at);
      setLastEvaluationDate(lastDate);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const evalDay = new Date(lastDate); evalDay.setHours(0, 0, 0, 0);
      const daysSince = Math.floor((today.getTime() - evalDay.getTime()) / 86_400_000);
      if (daysSince > 0 && daysSince < EVALUATION_COOLDOWN_DAYS) {
        setIsLocked(true);
        setDaysRemaining(EVALUATION_COOLDOWN_DAYS - daysSince);
      }

      // Generate signed URLs for thumbnails
      const withThumbs = await Promise.all(
        (data as EvaluationRecord[]).map(async (ev) => {
          if (!ev.photo_path) return ev;
          try {
            const { data: u } = await supabase.storage
              .from("physique-evaluations")
              .createSignedUrl(ev.photo_path, 3600);
            return { ...ev, photo_thumb: u?.signedUrl };
          } catch { return ev; }
        })
      );
      setEvaluationHistory(withThumbs);

      // Set previous results from localStorage if available
      const raw = localStorage.getItem(`liftmate_physique_evaluation_${user.id}`);
      if (raw) {
        try {
          const d = JSON.parse(raw);
          if (d.lastResults) setResults(d.lastResults);
          if (d.previousResults) setPreviousResults(d.previousResults);
        } catch { /* ignore */ }
      }
    } catch (e) {
      console.error("[AvaliacaoFisica] loadHistory error:", e);
    }
  };

  const saveToLocalStorage = (newResults: PhysiqueAnalysis) => {
    if (!user?.id) return;
    const key = `liftmate_physique_evaluation_${user.id}`;
    const existing = (() => { try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; } })();
    localStorage.setItem(key, JSON.stringify({
      lastEvaluationDate: new Date().toISOString(),
      lastResults: newResults,
      previousResults: existing.lastResults || null,
    }));
    if (existing.lastResults) setPreviousResults(existing.lastResults);
    setLastEvaluationDate(new Date());
  };

  const uploadPhoto = async (base64: string): Promise<string | null> => {
    if (!user?.id) return null;
    try {
      const cleanB64 = base64.replace(/^data:image\/\w+;base64,/, "");
      const bytes = Uint8Array.from(atob(cleanB64), c => c.charCodeAt(0));
      const path = `${user.id}/${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from("physique-evaluations")
        .upload(path, bytes, { contentType: "image/jpeg", upsert: false });
      if (error) { console.warn("Storage upload failed:", error.message); return null; }
      return path;
    } catch (e) {
      console.warn("uploadPhoto error:", e);
      return null;
    }
  };

  const checkExif = async (file: File): Promise<boolean> => {
    try {
      // Dynamic import to keep bundle clean
      const exifr = await import("exifr");
      const exif = await exifr.parse(file, { pick: ["Make", "Model", "DateTime"] });
      return !!(exif?.Make || exif?.Model || exif?.DateTime);
    } catch { return false; }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Seleciona uma imagem válida"); return;
    }

    // EXIF check
    const hasCamera = await checkExif(file);
    setExifWarning(!hasCamera);

    try {
      let b64 = await compressImage(file, 1024, 0.7);
      if (b64.length > MAX_BASE64_LENGTH) b64 = await compressImage(file, 800, 0.5);
      if (b64.length > MAX_BASE64_LENGTH) { toast.error("Imagem demasiado grande."); return; }
      setInconsistencyDetected(false);
      setPreviewImage(b64);
      await analyzePhysique(b64, file);
    } catch { toast.error("Erro ao processar imagem"); }
  };

  const analyzePhysique = async (imageBase64: string, file?: File) => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await invokeWithAuth<PhysiqueAnalysis>("analyze-physique", {
        body: { imageBase64, previousPhotoPath },
      });

      if (error) throw error;

      // Inconsistency detected
      if (data.inconsistency) {
        setInconsistencyDetected(true);
        setPreviewImage(null);
        setIsAnalyzing(false);
        return;
      }

      if (data.success === false) {
        toast.error(data.error || "Erro na análise"); setPreviewImage(null);
        setIsAnalyzing(false); return;
      }

      const a = data.analysis;
      if (!a || typeof a.overallScore !== "number" || !Array.isArray(a.strengths)) {
        toast.error("Dados incompletos. Tenta novamente."); setPreviewImage(null);
        setIsAnalyzing(false); return;
      }

      // Upload photo to storage and update DB row
      if (file) {
        const path = await uploadPhoto(imageBase64);
        if (path) {
          setPreviousPhotoPath(path);
          // Update the last inserted DB row with the photo path
          try {
            await supabase
              .from("physique_evaluations" as never)
              .update({ photo_path: path } as never)
              .eq("user_id", user!.id)
              .order("created_at", { ascending: false })
              .limit(1);
          } catch { /* non-fatal */ }
        }
      }

      setResults(data);
      saveToLocalStorage(data);
      setShowResults(true);
      toast.success("Análise concluída!");

      // Refresh history
      await loadHistory();
    } catch (e) {
      console.error("[AvaliacaoFisica]", e);
      toast.error("Erro ao analisar o físico. Tenta novamente.");
      setPreviewImage(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const progressPct = ((EVALUATION_COOLDOWN_DAYS - daysRemaining) / EVALUATION_COOLDOWN_DAYS) * 100;
  const prevScore   = previousResults?.analysis?.overallScore;
  const currScore   = results?.analysis?.overallScore;
  const scoreDelta  = (currScore != null && prevScore != null) ? +(currScore - prevScore).toFixed(1) : null;
  const formatDate  = (d: Date | string) => new Date(d).toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" });
  const formatDateShort = (d: string) => new Date(d).toLocaleDateString("pt-PT", { day: "numeric", month: "short" });

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#000", paddingBottom: 100 }}>

      {/* ── HEADER ── */}
      <div style={{ background: "#000", padding: "48px 24px 0" }}>
        <button onClick={() => navigate(-1)}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.4)", fontSize: 14, padding: 0 }}>
          <ArrowLeft size={18} />
        </button>

        <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, #7C3AED, #A855F7)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 24, marginBottom: 16 }}>
          <Heart size={28} color="#fff" />
        </div>

        <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", marginBottom: 8 }}>
          Avaliação Física
        </div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.5, marginBottom: 28 }}>
          Analisa o teu físico com IA e recebe um plano personalizado
        </div>
      </div>

      {/* ── FILE INPUTS (hidden) ── */}
      <input ref={cameraInputRef}  type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: "none" }} />
      <input ref={galleryInputRef} type="file" accept="image/*"                       onChange={handleFileChange} style={{ display: "none" }} />

      <div style={{ padding: "0 16px" }}>

        {/* ── ANÁLISE A DECORRER ── */}
        {isAnalyzing && (
          <div style={{ background: "#141414", border: "1px solid rgba(167,139,250,0.15)", borderRadius: 16, padding: 32, marginBottom: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            {previewImage && (
              <div style={{ width: 80, height: 80, borderRadius: 12, overflow: "hidden", opacity: 0.5 }}>
                <img src={previewImage} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            <Loader2 size={32} color="#A78BFA" style={{ animation: "spin 1s linear infinite" }} />
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
              {previousPhotoPath ? "A comparar com avaliação anterior..." : "A analisar o teu físico..."}
            </p>
          </div>
        )}

        {/* ── INCONSISTENCY WARNING ── */}
        {inconsistencyDetected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 16, padding: 16, marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
              <AlertTriangle size={18} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                ⚠️ Detetámos uma diferença significativa em relação à tua avaliação anterior. Para um acompanhamento preciso do teu progresso, confirma que és tu na foto e que foi tirada agora.
              </p>
            </div>
            <button
              onClick={() => { setInconsistencyDetected(false); galleryInputRef.current?.click(); }}
              style={{ width: "100%", height: 40, borderRadius: 10, border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.1)", color: "#F87171", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Tentar novamente
            </button>
          </motion.div>
        )}

        {/* ── UPLOAD SECTION ── */}
        {!isAnalyzing && !inconsistencyDetected && (
          <div style={{ marginBottom: 12 }}>

            {/* Banner cooldown */}
            {isLocked && (
              <div style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 12, padding: "12px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>🔒</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#A78BFA" }}>Próxima avaliação em {daysRemaining} dias</p>
                  {lastEvaluationDate && (
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>Última: {formatDate(lastEvaluationDate)}</p>
                  )}
                </div>
                <div style={{ marginLeft: "auto", width: 60, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${progressPct}%`, height: "100%", background: "#A78BFA", borderRadius: 4 }} />
                </div>
              </div>
            )}

            {/* Grid upload */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <button
                onClick={() => { if (isLocked) { toast.error(`Disponível em ${daysRemaining} dias`); return; } cameraInputRef.current?.click(); }}
                style={{ background: "#1A1A1A", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 14, padding: 20, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: isLocked ? 0.5 : 1 }}>
                <Camera size={24} color="#A78BFA" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Tirar Foto</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Câmara agora</span>
              </button>
              <button
                onClick={() => { if (isLocked) { toast.error(`Disponível em ${daysRemaining} dias`); return; } galleryInputRef.current?.click(); }}
                style={{ background: "#1A1A1A", border: "1px solid rgba(236,72,153,0.2)", borderRadius: 14, padding: 20, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: isLocked ? 0.5 : 1 }}>
                <Upload size={24} color="#EC4899" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Carregar</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Da galeria</span>
              </button>
            </div>

            {/* EXIF warning — only shown when no camera metadata */}
            {exifWarning && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 12, padding: "10px 14px", marginBottom: 10, display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
                <p style={{ fontSize: 11, color: "rgba(251,191,36,0.85)", lineHeight: 1.5 }}>
                  Para melhores resultados, usa uma foto tirada agora com a câmara do telemóvel.
                </p>
              </motion.div>
            )}

            {/* Privacy notice — updated text */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 12, marginBottom: 12, display: "flex", alignItems: "flex-start", gap: 10 }}>
              <Calendar size={14} color="rgba(255,255,255,0.3)" style={{ marginTop: 1, flexShrink: 0 }} />
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
                A tua foto é guardada de forma segura e privada para acompanhar o teu progresso. Avaliações disponíveis a cada 15 dias.
              </p>
            </div>

            {/* CTA */}
            {isLocked && results?.analysis ? (
              <button onClick={() => setShowResults(true)}
                style={{ width: "100%", height: 50, borderRadius: 14, border: "1px solid rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.08)", color: "#A78BFA", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                Ver Última Avaliação
              </button>
            ) : !isLocked && (
              <button
                onClick={() => { if (!previewImage) { galleryInputRef.current?.click(); } }}
                style={{ width: "100%", height: 50, borderRadius: 14, border: "none", cursor: "pointer", background: "linear-gradient(90deg, #7C3AED, #A855F7, #7C3AED)", backgroundSize: "200% 100%", animation: "shimmer 3s linear infinite", color: "#fff", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Sparkles size={18} /> ✦ Analisar Físico com IA
              </button>
            )}
          </div>
        )}

        {/* ── HISTÓRICO DE AVALIAÇÕES ── */}
        {evaluationHistory.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
              Histórico
            </p>
            <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
              {evaluationHistory.map((ev, i) => (
                <div key={ev.id} style={{ flexShrink: 0, width: 90, background: "#141414", border: `1px solid ${i === 0 ? "rgba(167,139,250,0.3)" : "rgba(255,255,255,0.06)"}`, borderRadius: 12, overflow: "hidden" }}>
                  {/* Thumbnail */}
                  <div style={{ height: 72, background: "rgba(255,255,255,0.04)", position: "relative" }}>
                    {ev.photo_thumb ? (
                      <img src={ev.photo_thumb} alt="avaliação" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Heart size={20} color="rgba(167,139,250,0.3)" />
                      </div>
                    )}
                    {i === 0 && (
                      <div style={{ position: "absolute", top: 4, right: 4, background: "#7C3AED", borderRadius: 6, padding: "1px 5px", fontSize: 8, fontWeight: 800, color: "#fff" }}>
                        ATUAL
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div style={{ padding: "8px 8px 10px" }}>
                    <p style={{ fontSize: 16, fontWeight: 900, color: "#A78BFA", lineHeight: 1 }}>
                      {ev.score != null ? ev.score.toFixed(1) : "—"}
                    </p>
                    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>
                      {formatDateShort(ev.created_at)}
                    </p>
                  </div>
                </div>
              ))}

              {/* Progress line between cards */}
              {evaluationHistory.length >= 2 && (
                <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 4px" }}>
                  {evaluationHistory.slice(0, -1).map((ev, i) => {
                    const next = evaluationHistory[i + 1];
                    if (!next || ev.score == null || next.score == null) return null;
                    const diff = ev.score - next.score;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        {diff >= 0
                          ? <TrendingUp size={12} color="#4ADE80" />
                          : <TrendingDown size={12} color="#F87171" />}
                        <span style={{ fontSize: 10, fontWeight: 700, color: diff >= 0 ? "#4ADE80" : "#F87171" }}>
                          {diff >= 0 ? "+" : ""}{diff.toFixed(1)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── RESULTADOS ── */}
        <AnimatePresence>
          {showResults && results?.analysis && (
            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

              {/* Score geral */}
              <div style={{ background: "#141414", border: "1px solid rgba(167,139,250,0.15)", borderRadius: 16, padding: 20, marginBottom: 12, textAlign: "center" }}>
                <ScoreRing score={results.analysis.overallScore} />
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 10 }}>
                  Gordura corporal estimada: <span style={{ color: "#fff", fontWeight: 700 }}>{results.analysis.bodyFatEstimate}</span>
                </p>
                {scoreDelta !== null && (
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    {scoreDelta >= 0
                      ? <TrendingUp size={14} color="#4ADE80" />
                      : <TrendingDown size={14} color="#F87171" />}
                    <span style={{ fontSize: 12, fontWeight: 700, color: scoreDelta >= 0 ? "#4ADE80" : "#F87171" }}>
                      {scoreDelta >= 0 ? "+" : ""}{scoreDelta} pontos vs avaliação anterior
                    </span>
                  </div>
                )}
              </div>

              {/* Pontos Fortes */}
              {results.analysis.strengths.length > 0 && (
                <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderLeft: "3px solid #4ADE80", borderRadius: 16, padding: 16, marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <TrendingUp size={16} color="#4ADE80" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Pontos Fortes</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {results.analysis.strengths.map((s, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#4ADE80" }}>{s.muscleGroup}</span>
                          <span style={{ fontSize: 12, color: "#4ADE80" }}>{s.score}/10</span>
                        </div>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.4, marginBottom: 6 }}>{s.description}</p>
                        <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${s.score * 10}%` }} transition={{ duration: 0.6, delay: i * 0.07 }} style={{ height: "100%", background: "#4ADE80", borderRadius: 2 }} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Áreas a Melhorar */}
              {results.analysis.weaknesses.length > 0 && (
                <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderLeft: "3px solid #F87171", borderRadius: 16, padding: 16, marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <TrendingDown size={16} color="#F87171" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Áreas a Melhorar</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {results.analysis.weaknesses.map((w, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.07 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#F87171" }}>{w.muscleGroup}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {w.priority === "alta" && (
                              <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 20, background: "rgba(248,113,113,0.15)", color: "#F87171" }}>PRIORITÁRIO</span>
                            )}
                            <span style={{ fontSize: 12, color: "#F87171" }}>{w.score}/10</span>
                          </div>
                        </div>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.4, marginBottom: 6 }}>{w.description}</p>
                        <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${w.score * 10}%` }} transition={{ duration: 0.6, delay: 0.2 + i * 0.07 }} style={{ height: "100%", background: "#F87171", borderRadius: 2 }} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Plano de Ação */}
              {results.analysis.recommendations.length > 0 && (
                <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 16, marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <Dumbbell size={16} color="#A78BFA" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Plano de Ação</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {results.analysis.recommendations.map((rec, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.07 }}
                        style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.15)", borderRadius: 12, padding: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#A78BFA" }}>{rec.focus}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "rgba(167,139,250,0.15)", color: "#A78BFA" }}>{rec.frequency}</span>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                          {rec.exercises.map((ex, j) => (
                            <span key={j} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>{ex}</span>
                          ))}
                        </div>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>{rec.tip}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mensagem motivacional */}
              {results.analysis.motivationalMessage && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
                  style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 16, padding: 16, marginBottom: 12, display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <Target size={16} color="#A78BFA" style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: 13, fontStyle: "italic", color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                    "{results.analysis.motivationalMessage}"
                  </p>
                </motion.div>
              )}

              {/* Fechar */}
              <button onClick={() => setShowResults(false)}
                style={{ width: "100%", height: 44, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 16 }}>
                Fechar resultados
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      <BottomNav />
    </div>
  );
};

export default AvaliacaoFisica;
