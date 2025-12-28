import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Loader2, Sparkles, X, Plus, Utensils } from 'lucide-react';
import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Meal, FoodItem, mealTypeLabels } from '@/hooks/useNutrition';

interface FoodScannerProps {
  onMealAdded: (meal: Omit<Meal, 'id'>) => void;
}

interface AnalysisResult {
  foods: FoodItem[];
  total: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  tips?: string;
  mealType?: Meal['type'];
}

export const FoodScanner = ({ onMealAdded }: FoodScannerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<Meal['type']>('lunch');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const resetState = () => {
    setImagePreview(null);
    setManualInput('');
    setAnalysisResult(null);
    setIsAnalyzing(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setImagePreview(base64);
      await analyzeImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (imageBase64: string) => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-food', {
        body: { imageBase64 },
      });

      if (error) throw error;

      setAnalysisResult(data);
      if (data.mealType) {
        setSelectedMealType(data.mealType);
      }

      toast({
        title: 'Análise completa!',
        description: `${data.foods.length} alimento(s) identificado(s)`,
      });
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast({
        title: 'Erro na análise',
        description: 'Não foi possível analisar a imagem. Tenta novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeText = async () => {
    if (!manualInput.trim()) return;

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-food', {
        body: { mealDescription: manualInput },
      });

      if (error) throw error;

      setAnalysisResult(data);
      if (data.mealType) {
        setSelectedMealType(data.mealType);
      }
    } catch (error) {
      console.error('Error analyzing text:', error);
      toast({
        title: 'Erro na análise',
        description: 'Não foi possível analisar a descrição.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveMeal = () => {
    if (!analysisResult) return;

    const meal: Omit<Meal, 'id'> = {
      type: selectedMealType,
      time: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
      foods: analysisResult.foods,
      total: analysisResult.total,
      tips: analysisResult.tips,
      imageUrl: imagePreview || undefined,
    };

    onMealAdded(meal);
    setIsOpen(false);
    resetState();

    toast({
      title: 'Refeição adicionada!',
      description: `${analysisResult.total.calories} kcal registadas`,
    });
  };

  const mealTypes: Meal['type'][] = ['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'];

  return (
    <Drawer open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetState(); }}>
      <DrawerTrigger asChild>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-primary to-purple-500 text-white font-medium shadow-lg shadow-primary/25"
        >
          <Camera className="w-5 h-5" />
          <span>Escanear Refeição com IA</span>
          <Sparkles className="w-4 h-4" />
        </motion.button>
      </DrawerTrigger>

      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Utensils className="w-5 h-5" />
            Adicionar Refeição
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-4 overflow-y-auto">
          {/* Image upload / preview */}
          <AnimatePresence mode="wait">
            {!imagePreview && !analysisResult && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Camera button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-video rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center gap-3 hover:bg-primary/10 transition-colors"
                >
                  <Camera className="w-10 h-10 text-primary" />
                  <span className="text-sm text-muted-foreground">Tirar foto ou escolher imagem</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">ou descreve</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Manual input */}
                <div className="flex gap-2">
                  <Input
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Ex: 200g frango grelhado, arroz integral..."
                    onKeyDown={(e) => e.key === 'Enter' && analyzeText()}
                  />
                  <Button onClick={analyzeText} disabled={!manualInput.trim() || isAnalyzing}>
                    {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  </Button>
                </div>
              </motion.div>
            )}

            {imagePreview && !analysisResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="relative"
              >
                <img
                  src={imagePreview}
                  alt="Food preview"
                  className="w-full aspect-video object-cover rounded-xl"
                />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/50 rounded-xl flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                    <span className="text-white text-sm">A analisar com IA...</span>
                  </div>
                )}
                <button
                  onClick={resetState}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </motion.div>
            )}

            {analysisResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Image preview small */}
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Food"
                    className="w-full h-24 object-cover rounded-xl"
                  />
                )}

                {/* Meal type selector */}
                <div className="flex flex-wrap gap-2">
                  {mealTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedMealType(type)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        selectedMealType === type
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {mealTypeLabels[type]}
                    </button>
                  ))}
                </div>

                {/* Foods list */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Alimentos identificados</h4>
                  {analysisResult.foods.map((food, i) => (
                    <div key={i} className="p-3 rounded-xl bg-card/50 border border-border/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{food.name}</p>
                          <p className="text-xs text-muted-foreground">{food.portion}</p>
                        </div>
                        <span className="text-sm font-semibold text-primary">
                          {food.calories} kcal
                        </span>
                      </div>
                      <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                        <span>P: {food.protein}g</span>
                        <span>C: {food.carbs}g</span>
                        <span>G: {food.fat}g</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold text-primary">
                      {analysisResult.total.calories} kcal
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div>
                      <p className="font-semibold">{analysisResult.total.protein}g</p>
                      <p className="text-muted-foreground">Proteína</p>
                    </div>
                    <div>
                      <p className="font-semibold">{analysisResult.total.carbs}g</p>
                      <p className="text-muted-foreground">Carbs</p>
                    </div>
                    <div>
                      <p className="font-semibold">{analysisResult.total.fat}g</p>
                      <p className="text-muted-foreground">Gordura</p>
                    </div>
                    <div>
                      <p className="font-semibold">{analysisResult.total.fiber}g</p>
                      <p className="text-muted-foreground">Fibra</p>
                    </div>
                  </div>
                </div>

                {/* Tips */}
                {analysisResult.tips && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      {analysisResult.tips}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {analysisResult && (
          <DrawerFooter>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetState} className="flex-1">
                Nova Análise
              </Button>
              <Button onClick={handleSaveMeal} className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
};
