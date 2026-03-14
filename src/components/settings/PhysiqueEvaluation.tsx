import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, Loader2, Target, TrendingUp, TrendingDown, Dumbbell, Sparkles, Lock, Calendar } from "lucide-react";
import { toast } from "sonner";
import { invokeWithAuth } from "@/lib/supabaseHelpers";
import { compressImage } from "@/lib/imageCompression";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";

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
  analysis?: {
    overallScore: number;
    bodyFatEstimate: string;
    strengths: MuscleAnalysis[];
    weaknesses: MuscleAnalysis[];
    recommendations: Recommendation[];
    motivationalMessage: string;
  };
}

const EVALUATION_COOLDOWN_DAYS = 15;
const STORAGE_KEY_PREFIX = 'liftmate_physique_evaluation_';

export const PhysiqueEvaluation = () => {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<PhysiqueAnalysis | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [lastEvaluationDate, setLastEvaluationDate] = useState<Date | null>(null);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Helper to get user-scoped storage key
  const getStorageKey = () => user?.id ? `${STORAGE_KEY_PREFIX}${user.id}` : null;

  useEffect(() => {
    if (!user) return;
    
    const key = getStorageKey();
    if (!key) return;
    
    // Load last evaluation date from localStorage
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.lastEvaluationDate) {
          const lastDate = new Date(data.lastEvaluationDate);
          setLastEvaluationDate(lastDate);
          
          // Calculate days remaining - lock starts the day AFTER evaluation
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const evalDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
          const daysSinceEval = Math.floor((today.getTime() - evalDay.getTime()) / (1000 * 60 * 60 * 24));
          
          // Lock only if more than 0 days have passed (i.e., not on the same day)
          if (daysSinceEval > 0 && daysSinceEval < EVALUATION_COOLDOWN_DAYS) {
            setIsLocked(true);
            setDaysRemaining(EVALUATION_COOLDOWN_DAYS - daysSinceEval);
          } else if (daysSinceEval === 0) {
            // Same day - not locked
            setIsLocked(false);
            setDaysRemaining(0);
          } else {
            setIsLocked(false);
            setDaysRemaining(0);
          }
          
          // Load last results
          if (data.lastResults) {
            setResults(data.lastResults);
          }
        }
      } catch (e) {
        console.error('Error loading physique evaluation data:', e);
      }
    }
  }, [user]);

  const saveEvaluation = (analysisResults: PhysiqueAnalysis) => {
    const key = getStorageKey();
    if (!key) return;
    
    const data = {
      lastEvaluationDate: new Date().toISOString(),
      lastResults: analysisResults
    };
    localStorage.setItem(key, JSON.stringify(data));
    setLastEvaluationDate(new Date());
  };

  const handleImageCapture = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, seleciona uma imagem válida');
      return;
    }

    try {
      // Compress image before analysis
      let compressedBase64 = await compressImage(file, 1024, 0.7);
      
      // If still too large (>5MB base64 ≈ ~6.6M chars), re-compress more aggressively
      const MAX_BASE64_LENGTH = 6_600_000;
      if (compressedBase64.length > MAX_BASE64_LENGTH) {
        console.log(`Image still large (${(compressedBase64.length / 1024).toFixed(0)}KB base64), re-compressing...`);
        compressedBase64 = await compressImage(file, 800, 0.5);
      }
      
      if (compressedBase64.length > MAX_BASE64_LENGTH) {
        toast.error('A imagem é demasiado grande. Usa uma foto mais pequena.');
        return;
      }

      setPreviewImage(compressedBase64);
      await analyzePhysique(compressedBase64);
    } catch (error) {
      console.error('Error compressing image:', error);
      toast.error('Erro ao processar a imagem');
    }
  };

  const analyzePhysique = async (imageBase64: string) => {
    setIsAnalyzing(true);
    
    try {
      const { data, error } = await invokeWithAuth<PhysiqueAnalysis>('analyze-physique', {
        body: { imageBase64 }
      });

      if (error) {
        throw error;
      }

      if (data.success === false) {
        toast.error(data.error || 'Erro na análise');
        setPreviewImage(null);
        return;
      }

      // Validate response structure
      const analysis = data.analysis;
      if (!analysis || typeof analysis.overallScore !== 'number' || !Array.isArray(analysis.strengths) || !Array.isArray(analysis.weaknesses) || !Array.isArray(analysis.recommendations)) {
        console.error('Invalid physique analysis structure:', data);
        toast.error('A análise retornou dados incompletos. Tenta novamente.');
        setPreviewImage(null);
        return;
      }

      setResults(data);
      saveEvaluation(data);
      setShowResults(true);
      toast.success('Análise concluída!');
    } catch (error) {
      console.error('Error analyzing physique:', error);
      toast.error('Erro ao analisar o físico. Tenta novamente.');
      setPreviewImage(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCameraClick = () => {
    if (isLocked) {
      toast.error(`Avaliação bloqueada. Disponível em ${daysRemaining} dias.`);
      return;
    }
    cameraInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    if (isLocked) {
      toast.error(`Avaliação bloqueada. Disponível em ${daysRemaining} dias.`);
      return;
    }
    galleryInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageCapture(file);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const viewLastResults = () => {
    if (results) {
      setShowResults(true);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 8) return 'from-green-500/20 to-green-500/5';
    if (score >= 6) return 'from-yellow-500/20 to-yellow-500/5';
    return 'from-orange-500/20 to-orange-500/5';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-PT', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-500/10 via-card to-pink-500/10 rounded-[20px] p-5 border border-purple-500/20"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Avaliação Física IA</h2>
            <p className="text-xs text-muted-foreground">Analisa o teu progresso com IA</p>
          </div>
        </div>

        <p className="text-sm text-foreground/80 mb-4">
          Envia uma foto do teu físico e recebe uma análise detalhada com pontos fortes, 
          áreas a melhorar e sugestões de treino personalizadas.
        </p>

        {/* Camera input - forces camera on mobile */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        {/* Gallery input - opens file picker */}
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            {previewImage && (
              <div className="w-24 h-24 rounded-xl overflow-hidden opacity-50">
                <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            <p className="text-sm text-foreground/70">A analisar o teu físico...</p>
          </div>
        ) : isLocked ? (
          <div className="space-y-4">
            {/* Locked State */}
            <div className="flex flex-col items-center justify-center py-6 gap-3 bg-muted/20 rounded-xl border border-border/30">
              <div className="w-14 h-14 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Lock className="w-7 h-7 text-orange-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">Avaliação Bloqueada</p>
                <p className="text-sm text-foreground/70 mt-1">
                  Disponível em <span className="font-bold text-orange-400">{daysRemaining} dias</span>
                </p>
              </div>
              {lastEvaluationDate && (
                <div className="flex items-center gap-2 text-xs text-foreground/60">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Última avaliação: {formatDate(lastEvaluationDate)}</span>
                </div>
              )}
            </div>

            {/* View Last Results Button */}
            {results && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={viewLastResults}
                className="w-full py-3 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 font-medium hover:bg-purple-500/30 transition-all"
              >
                Ver Última Avaliação
              </motion.button>
            )}

            {/* Progress to next evaluation */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-foreground/60">
                <span>Progresso</span>
                <span>{EVALUATION_COOLDOWN_DAYS - daysRemaining} de {EVALUATION_COOLDOWN_DAYS} dias</span>
              </div>
              <Progress 
                value={((EVALUATION_COOLDOWN_DAYS - daysRemaining) / EVALUATION_COOLDOWN_DAYS) * 100} 
                className="h-2 bg-muted/30" 
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCameraClick}
              className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 transition-all"
            >
              <Camera className="w-6 h-6" />
              <span className="text-sm font-medium">Tirar Foto</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleGalleryClick}
              className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl bg-pink-500/20 border border-pink-500/30 text-pink-300 hover:bg-pink-500/30 transition-all"
            >
              <Upload className="w-6 h-6" />
              <span className="text-sm font-medium">Carregar</span>
            </motion.button>
          </div>
        )}

        <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-muted/20 border border-border/30">
          <Calendar className="w-4 h-4 text-foreground/60 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-foreground/60">
            Avaliações disponíveis a cada 15 dias para tracking de progresso consistente. A foto não é guardada.
          </p>
        </div>
      </motion.div>

      {/* Results Sheet */}
      <Sheet open={showResults} onOpenChange={setShowResults}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Resultado da Avaliação
            </SheetTitle>
          </SheetHeader>

          {results?.analysis && (
            <div className="space-y-6 pb-8">
              {/* Overall Score */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`bg-gradient-to-br ${getScoreGradient(results.analysis.overallScore)} rounded-2xl p-5 text-center`}
              >
                <p className="text-sm text-foreground/70 mb-2">Pontuação Geral</p>
                <div className={`text-5xl font-bold ${getScoreColor(results.analysis.overallScore)}`}>
                  {results.analysis.overallScore.toFixed(1)}
                </div>
                <p className="text-xs text-foreground/60 mt-1">de 10</p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <span className="text-sm text-foreground/70">Gordura corporal estimada:</span>
                  <span className="text-sm font-medium text-foreground">{results.analysis.bodyFatEstimate}</span>
                </div>
              </motion.div>

              {/* Strengths */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <h3 className="font-semibold text-foreground">Pontos Fortes</h3>
                </div>
                <div className="space-y-2">
                  {results.analysis.strengths.map((strength, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-green-500/10 border border-green-500/20 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-green-400">{strength.muscleGroup}</span>
                        <span className="text-sm text-green-400">{strength.score}/10</span>
                      </div>
                      <p className="text-sm text-foreground/70">{strength.description}</p>
                      <Progress value={strength.score * 10} className="mt-2 h-1.5 bg-green-500/20" />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Weaknesses */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="w-5 h-5 text-orange-400" />
                  <h3 className="font-semibold text-foreground">Áreas a Melhorar</h3>
                </div>
                <div className="space-y-2">
                  {results.analysis.weaknesses.map((weakness, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-orange-400">{weakness.muscleGroup}</span>
                        <div className="flex items-center gap-2">
                          {weakness.priority === 'alta' && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">Prioritário</span>
                          )}
                          <span className="text-sm text-orange-400">{weakness.score}/10</span>
                        </div>
                      </div>
                      <p className="text-sm text-foreground/70">{weakness.description}</p>
                      <Progress value={weakness.score * 10} className="mt-2 h-1.5 bg-orange-500/20" />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Dumbbell className="w-5 h-5 text-purple-400" />
                  <h3 className="font-semibold text-foreground">Recomendações de Treino</h3>
                </div>
                <div className="space-y-3">
                  {results.analysis.recommendations.map((rec, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-purple-400">{rec.focus}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                          {rec.frequency}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {rec.exercises.map((exercise, i) => (
                          <span key={i} className="text-xs px-2 py-1 rounded-lg bg-card border border-border/30 text-foreground">
                            {exercise}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-foreground/70">{rec.tip}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Motivational Message */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-xl p-4 border border-primary/30"
              >
                <p className="text-sm text-foreground italic">"{results.analysis.motivationalMessage}"</p>
              </motion.div>

              {/* Close Button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowResults(false)}
                className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold"
              >
                Fechar
              </motion.button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
