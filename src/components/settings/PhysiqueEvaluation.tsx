import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, Loader2, Target, TrendingUp, TrendingDown, Dumbbell, Sparkles, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";

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

export const PhysiqueEvaluation = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<PhysiqueAnalysis | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageCapture = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, seleciona uma imagem válida');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setPreviewImage(base64);
      await analyzePhysique(base64);
    };
    reader.readAsDataURL(file);
  };

  const analyzePhysique = async (imageBase64: string) => {
    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-physique', {
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

      setResults(data);
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

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageCapture(file);
    }
  };

  const resetAnalysis = () => {
    setShowResults(false);
    setResults(null);
    setPreviewImage(null);
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

        <p className="text-sm text-muted-foreground mb-4">
          Envia uma foto do teu físico e recebe uma análise detalhada com pontos fortes, 
          áreas a melhorar e sugestões de treino personalizadas.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
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
            <p className="text-sm text-muted-foreground">A analisar o teu físico...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleUploadClick}
              className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 transition-all"
            >
              <Camera className="w-6 h-6" />
              <span className="text-sm font-medium">Tirar Foto</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleUploadClick}
              className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl bg-pink-500/20 border border-pink-500/30 text-pink-300 hover:bg-pink-500/30 transition-all"
            >
              <Upload className="w-6 h-6" />
              <span className="text-sm font-medium">Carregar</span>
            </motion.button>
          </div>
        )}

        <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-muted/20 border border-border/30">
          <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            A foto não é guardada. A análise é apenas uma estimativa e não substitui avaliação profissional.
          </p>
        </div>
      </motion.div>

      {/* Results Sheet */}
      <Sheet open={showResults} onOpenChange={setShowResults}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
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
                <p className="text-sm text-muted-foreground mb-2">Pontuação Geral</p>
                <div className={`text-5xl font-bold ${getScoreColor(results.analysis.overallScore)}`}>
                  {results.analysis.overallScore.toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">de 10</p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <span className="text-sm text-muted-foreground">Gordura corporal estimada:</span>
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
                        <span className="font-medium text-green-300">{strength.muscleGroup}</span>
                        <span className="text-sm text-green-400">{strength.score}/10</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{strength.description}</p>
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
                        <span className="font-medium text-orange-300">{weakness.muscleGroup}</span>
                        <div className="flex items-center gap-2">
                          {weakness.priority === 'alta' && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">Prioritário</span>
                          )}
                          <span className="text-sm text-orange-400">{weakness.score}/10</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{weakness.description}</p>
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
                        <span className="font-medium text-purple-300">{rec.focus}</span>
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
                      <p className="text-sm text-muted-foreground">{rec.tip}</p>
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

              {/* New Analysis Button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetAnalysis}
                className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold"
              >
                Nova Avaliação
              </motion.button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
