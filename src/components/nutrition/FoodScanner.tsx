import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Loader2, Sparkles, X, Plus, Utensils, Search, Dumbbell, Zap, Clock, Upload, RotateCcw } from 'lucide-react';
import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { compressBase64Image } from '@/lib/imageCompression';
import { invokeWithAuth } from '@/lib/supabaseHelpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Meal, FoodItem, mealTypeLabels } from '@/hooks/useNutrition';
import { useWorkoutNutritionSync } from '@/hooks/useWorkoutNutritionSync';
import { searchFoods, getPreWorkoutFoods, getPostWorkoutFoods, FoodDatabaseItem, categoryLabels } from '@/data/foodDatabase';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ScrollAreaWithIndicators } from '@/components/ui/scroll-area-with-indicators';

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

// FoodDatabaseItem with a unique instance ID for safe removal
interface SelectedFood extends FoodDatabaseItem {
  instanceId: string;
}

const ANALYSIS_MESSAGES = [
  'A analisar imagem...',
  'Identificando alimentos...',
  'Calculando macros...',
];

const RETRY_DELAY = 1000;
const MAX_RETRIES = 2;
const ANALYSIS_TIMEOUT = 15000;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Simple in-memory analysis cache
const analysisCache = new Map<string, { result: AnalysisResult; timestamp: number }>();

/** Generate a simple hash from a string for cache keys. */
async function hashString(str: string): Promise<string> {
  // Use first 200 chars + length as a fast fingerprint
  const sample = str.slice(0, 200) + '|' + str.length;
  const encoder = new TextEncoder();
  const data = encoder.encode(sample);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

function getCachedResult(key: string): AnalysisResult | null {
  const entry = analysisCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    analysisCache.delete(key);
    return null;
  }
  return entry.result;
}

function setCachedResult(key: string, result: AnalysisResult) {
  analysisCache.set(key, { result, timestamp: Date.now() });
}

/** Invoke with retry + timeout */
async function invokeWithRetry<T>(
  fnName: string,
  options: { body: any },
  maxRetries = MAX_RETRIES,
): Promise<{ data: T; error: null } | { data: null; error: any }> {
  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY));
    }

    try {
      const result = await Promise.race([
        invokeWithAuth<T>(fnName, options),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('__timeout__')), ANALYSIS_TIMEOUT)
        ),
      ]);
      // If no error, return immediately
      if (!result.error) return result as { data: T; error: null };
      lastError = result.error;
    } catch (err) {
      lastError = err;
    }

    console.warn(`[FoodScanner] Attempt ${attempt + 1} failed:`, lastError);
  }

  return { data: null, error: lastError };
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return (error as any).message;
  }
  return String(error);
}

export const FoodScanner = ({ onMealAdded }: FoodScannerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeStatus, setAnalyzeStatus] = useState(0);
  const [analysisFailed, setAnalysisFailed] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<Meal['type']>('lunch');
  const [activeTab, setActiveTab] = useState<'ai' | 'search'>('ai');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>([]);
  const [lastImageBase64, setLastImageBase64] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Progressive loading messages
  useEffect(() => {
    if (!isAnalyzing) {
      setAnalyzeStatus(0);
      return;
    }
    const interval = setInterval(() => {
      setAnalyzeStatus((prev) => Math.min(prev + 1, ANALYSIS_MESSAGES.length - 1));
    }, 2500);
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // Workout sync
  const workoutContext = useWorkoutNutritionSync();

  // Search results
  const searchResults = useMemo(() => {
    return searchFoods(searchQuery);
  }, [searchQuery]);

  // Suggested foods based on workout phase
  const suggestedFoods = useMemo(() => {
    if (workoutContext.phase === 'pre_workout') {
      return getPreWorkoutFoods().slice(0, 6);
    }
    if (workoutContext.phase === 'post_workout') {
      return getPostWorkoutFoods().slice(0, 6);
    }
    return [];
  }, [workoutContext.phase]);

  const resetState = () => {
    setImagePreview(null);
    setManualInput('');
    setAnalysisResult(null);
    setIsAnalyzing(false);
    setAnalysisFailed(false);
    setLastImageBase64(null);
    setSearchQuery('');
    setSelectedFoods([]);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        const compressedBase64 = await compressBase64Image(base64, 1024, 0.7);
        setImagePreview(compressedBase64);
        setLastImageBase64(compressedBase64);
        await analyzeImage(compressedBase64);
      } catch (error) {
        console.error('Error compressing image:', error);
        setImagePreview(base64);
        setLastImageBase64(base64);
        await analyzeImage(base64);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const analyzeImage = useCallback(async (imageBase64: string) => {
    setIsAnalyzing(true);
    setAnalysisFailed(false);

    // Check cache first
    const cacheKey = await hashString(imageBase64);
    const cached = getCachedResult(cacheKey);
    if (cached) {
      setIsAnalyzing(false);
      setAnalysisResult(cached);
      if (cached.mealType) setSelectedMealType(cached.mealType as any);
      toast({ title: 'Análise completa!', description: `${cached.foods.length} alimento(s) (cache)` });
      return;
    }

    const { data, error } = await invokeWithRetry<AnalysisResult>('analyze-food', {
      body: { imageBase64 }
    });

    if (error) {
      const errorMsg = getErrorMessage(error);
      setIsAnalyzing(false);

      if (errorMsg.includes('No food detected')) {
        toast({
          title: 'Sem alimentos detetados',
          description: 'Não foi possível identificar alimentos na imagem. Tenta com outra foto.',
          variant: 'destructive'
        });
        setImagePreview(null);
        setLastImageBase64(null);
        return;
      }

      if (errorMsg === '__timeout__') {
        toast({
          title: 'Análise demorou demais',
          description: 'A análise está a demorar mais que o esperado. Tenta novamente.',
          variant: 'destructive'
        });
      } else if (errorMsg.includes('429') || errorMsg.includes('rate')) {
        toast({
          title: 'Muitos pedidos',
          description: 'Muitos pedidos no momento. Tenta novamente em alguns segundos.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Erro na análise',
          description: 'Não foi possível analisar a imagem. Tenta novamente.',
          variant: 'destructive'
        });
      }

      // Keep image for retry
      setAnalysisFailed(true);
      return;
    }

    setIsAnalyzing(false);
    setAnalysisFailed(false);
    setAnalysisResult(data);
    setCachedResult(cacheKey, data);
    if (data.mealType) {
      setSelectedMealType(data.mealType);
    }

    toast({
      title: 'Análise completa!',
      description: `${data.foods.length} alimento(s) identificado(s)`
    });
  }, [toast]);

  const handleRetryAnalysis = useCallback(() => {
    if (lastImageBase64) {
      analyzeImage(lastImageBase64);
    }
  }, [lastImageBase64, analyzeImage]);

  const analyzeText = async () => {
    if (!manualInput.trim()) return;

    setIsAnalyzing(true);
    setAnalysisFailed(false);

    const { data, error } = await invokeWithRetry<AnalysisResult>('analyze-food', {
      body: { mealDescription: manualInput }
    });

    if (error) {
      const errorMsg = getErrorMessage(error);
      setIsAnalyzing(false);

      if (errorMsg === '__timeout__') {
        toast({
          title: 'Análise demorou demais',
          description: 'Tenta novamente com uma descrição mais simples.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Erro na análise',
          description: 'Não foi possível analisar a descrição.',
          variant: 'destructive'
        });
      }
      return;
    }

    setIsAnalyzing(false);
    setAnalysisResult(data);
    if (data.mealType) {
      setSelectedMealType(data.mealType);
    }
  };

  const addFoodFromDatabase = (food: FoodDatabaseItem) => {
    const instance: SelectedFood = { ...food, instanceId: crypto.randomUUID() };
    setSelectedFoods((prev) => [...prev, instance]);
    toast({
      title: `${food.name} adicionado`,
      description: `${food.calories} kcal`
    });
  };

  const removeFoodFromSelection = (instanceId: string) => {
    setSelectedFoods((prev) => prev.filter((f) => f.instanceId !== instanceId));
  };

  const handleSaveFromDatabase = () => {
    if (selectedFoods.length === 0) return;

    const foods: FoodItem[] = selectedFoods.map((food) => ({
      name: food.name,
      portion: food.portion,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fiber: food.fiber
    }));

    const total = selectedFoods.reduce((acc, food) => ({
      calories: acc.calories + food.calories,
      protein: acc.protein + food.protein,
      carbs: acc.carbs + food.carbs,
      fat: acc.fat + food.fat,
      fiber: acc.fiber + food.fiber
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

    const meal: Omit<Meal, 'id'> = {
      type: selectedMealType,
      time: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
      foods,
      total
    };

    onMealAdded(meal);
    setIsOpen(false);
    resetState();

    toast({
      title: 'Refeição adicionada!',
      description: `${total.calories} kcal registadas`
    });
  };

  const handleSaveMeal = () => {
    if (!analysisResult) return;

    const meal: Omit<Meal, 'id'> = {
      type: selectedMealType,
      time: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
      foods: analysisResult.foods,
      total: analysisResult.total,
      tips: analysisResult.tips,
      imageUrl: imagePreview || undefined
    };

    onMealAdded(meal);
    setIsOpen(false);
    resetState();

    toast({
      title: 'Refeição adicionada!',
      description: `${analysisResult.total.calories} kcal registadas`
    });
  };

  const mealTypes: Meal['type'][] = ['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'];

  // Update default meal type based on workout context
  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setSelectedMealType(workoutContext.suggestedMealType);
    } else {
      resetState();
    }
  };

  return (
    <div className="space-y-3">
      {/* Workout Context Banner */}
      {workoutContext.phase !== 'none' &&
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-3 rounded-xl border flex items-start gap-3 ${
        workoutContext.phase === 'post_workout' ?
        'bg-green-500/10 border-green-500/20' :
        workoutContext.phase === 'pre_workout' ?
        'bg-amber-500/10 border-amber-500/20' :
        'bg-blue-500/10 border-blue-500/20'}`
        }>

          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
        workoutContext.phase === 'post_workout' ?
        'bg-green-500/20' :
        workoutContext.phase === 'pre_workout' ?
        'bg-amber-500/20' :
        'bg-blue-500/20'}`
        }>
            {workoutContext.phase === 'post_workout' ?
          <Zap className="w-4 h-4 text-green-500" /> :
          workoutContext.phase === 'pre_workout' ?
          <Dumbbell className="w-4 h-4 text-amber-500" /> :

          <Clock className="w-4 h-4 text-blue-500" />
          }
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              {workoutContext.phase === 'post_workout' && 'Janela Pós-Treino'}
              {workoutContext.phase === 'pre_workout' && 'Preparação Pré-Treino'}
              {workoutContext.phase === 'recovery' && 'Recuperação Ativa'}
            </p>
            <p className="text-xs text-gray-400">{workoutContext.nutritionTip}</p>
          </div>
        </motion.div>
      }

      <Dialog open={isOpen} onOpenChange={handleOpen}>
        <DialogTrigger asChild>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-primary to-purple-500 text-white font-medium shadow-lg shadow-primary/25">

            <Camera className="w-5 h-5" />
            <span>Adicionar Refeição</span>
            <Sparkles className="w-4 h-4" />
          </motion.button>
        </DialogTrigger>

        <DialogContent className="
          w-[92vw] max-w-[520px] h-[85vh] sm:h-[70vh] max-h-[80vh]
          bg-zinc-900 border-white/[0.08]
          rounded-[20px] sm:rounded-[20px]
          p-0 gap-0
          flex flex-col overflow-hidden
          shadow-[0_30px_80px_rgba(0,0,0,0.4)]
          [&>button]:hidden
        ">
          <DialogHeader className="shrink-0 px-5 pt-5 pb-2">
            <DialogTitle className="flex items-center gap-2 text-white">
              <Utensils className="w-5 h-5" />
              Adicionar Refeição
            </DialogTitle>
          </DialogHeader>

          {/* Tab Switcher */}
          <div className="px-4 mb-3 shrink-0">
            <div className="flex bg-white/5 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'ai' ?
                'bg-white/10 text-white shadow-sm' :
                'text-gray-400'}`
                }>

                <Sparkles className="w-4 h-4" />
                IA Scanner
              </button>
              <button
                onClick={() => setActiveTab('search')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'search' ?
                'bg-white/10 text-white shadow-sm' :
                'text-gray-400'}`
                }>

                <Search className="w-4 h-4" />
                Pesquisar
              </button>
            </div>
          </div>

          <ScrollAreaWithIndicators className="flex-1 min-h-0" showTopIndicator={false}>
            <div className="px-4 pb-6 space-y-4 pr-2">
              {/* AI Tab */}
              {activeTab === 'ai' &&
              <AnimatePresence mode="wait">
                  {!imagePreview && !analysisResult &&
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4">

                        <div className="grid grid-cols-2 gap-3">
                          <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="aspect-video rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center gap-2 hover:bg-primary/10 transition-colors">

                            <Camera className="w-8 h-8 text-primary" />
                            <span className="text-xs text-gray-400">Tirar Foto</span>
                          </button>
                          <button
                      onClick={() => galleryInputRef.current?.click()}
                      className="aspect-video rounded-xl border-2 border-dashed border-pink-500/30 bg-pink-500/5 flex flex-col items-center justify-center gap-2 hover:bg-pink-500/10 transition-colors">

                            <Upload className="w-8 h-8 text-pink-400" />
                            <span className="text-xs text-gray-400">Galeria</span>
                          </button>
                        </div>
                        {/* Camera input - forces camera on mobile */}
                        <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden" />

                        {/* Gallery input - opens file picker */}
                        <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden" />


                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-px bg-white/10" />
                          <span className="text-xs text-gray-400">ou descreve</span>
                          <div className="flex-1 h-px bg-white/10" />
                      </div>

                      <div className="flex gap-2">
                        <Input
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      placeholder="Ex: 200g frango grelhado, arroz integral..."
                      onKeyDown={(e) => e.key === 'Enter' && analyzeText()} />

                        <Button onClick={analyzeText} disabled={!manualInput.trim() || isAnalyzing}>
                          {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        </Button>
                      </div>
                    </motion.div>
                }

                  {imagePreview && !analysisResult &&
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative">

                      <img
                    src={imagePreview}
                    alt="Food preview"
                    className="w-full aspect-video object-cover rounded-xl" />

                      {isAnalyzing &&
                  <div className="absolute inset-0 bg-black/50 rounded-xl flex flex-col items-center justify-center gap-3">
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                          <span className="text-white text-sm">{ANALYSIS_MESSAGES[analyzeStatus]}</span>
                        </div>
                  }
                      {analysisFailed && !isAnalyzing &&
                  <div className="absolute inset-0 bg-black/60 rounded-xl flex flex-col items-center justify-center gap-3">
                          <RotateCcw className="w-8 h-8 text-white" />
                          <span className="text-white text-sm">Análise falhou</span>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={handleRetryAnalysis}
                            className="gap-2"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Tentar novamente
                          </Button>
                        </div>
                  }
                      <button
                    onClick={resetState}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">

                        <X className="w-4 h-4 text-white" />
                      </button>
                    </motion.div>
                }

                  {analysisResult &&
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4">

                      {imagePreview &&
                  <img
                    src={imagePreview}
                    alt="Food"
                    className="w-full h-24 object-cover rounded-xl" />

                  }

                      {/* Meal type selector - horizontal scroll */}
                      <ScrollArea className="w-full" type="scroll">
                        <div className="flex gap-2 pb-2 pr-4">
                          {mealTypes.map((type) =>
                      <button
                        key={type}
                        onClick={() => setSelectedMealType(type)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                        selectedMealType === type ?
                        'bg-primary text-primary-foreground' :
                        'bg-white/5 text-gray-400 hover:bg-white/10'}`
                        }>

                              {mealTypeLabels[type]}
                            </button>
                      )}
                        </div>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>

                        {/* Foods list */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-white">Alimentos identificados</h4>
                          {analysisResult.foods.map((food, i) =>
                    <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-sm text-white">{food.name}</p>
                                  <p className="text-xs text-gray-400">{food.portion}</p>
                                </div>
                                <span className="text-sm font-semibold text-primary">
                                  {Math.round(food.calories)} kcal
                                </span>
                              </div>
                              <div className="flex gap-3 mt-2 text-xs text-gray-400">
                                <span>P: {Math.round(food.protein)}g</span>
                                <span>C: {Math.round(food.carbs)}g</span>
                                <span>G: {Math.round(food.fat)}g</span>
                              </div>
                            </div>
                    )}
                      </div>

                        {/* Totals */}
                        <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-white">Total</span>
                            <span className="text-xl font-bold text-primary">
                              {Math.round(analysisResult.total.calories)} kcal
                            </span>
                        </div>
                          <div className="grid grid-cols-4 gap-2 text-center text-xs">
                            <div>
                              <p className="font-semibold text-white">{Math.round(analysisResult.total.protein)}g</p>
                              <p className="text-gray-400">Proteína</p>
                            </div>
                            <div>
                              <p className="font-semibold text-white">{Math.round(analysisResult.total.carbs)}g</p>
                              <p className="text-gray-400">Carbs</p>
                            </div>
                            <div>
                              <p className="font-semibold text-white">{Math.round(analysisResult.total.fat)}g</p>
                              <p className="text-gray-400">Gordura</p>
                            </div>
                            <div>
                              <p className="font-semibold text-white">{Math.round(analysisResult.total.fiber)}g</p>
                              <p className="text-gray-400">Fibra</p>
                            </div>
                          </div>
                      </div>

                      {analysisResult.tips &&
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                          <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                          <p className="text-xs text-amber-700 dark:text-amber-300">
                            {analysisResult.tips}
                          </p>
                        </div>
                  }
                    </motion.div>
                }
                </AnimatePresence>
              }

              {/* Search Tab */}
              {activeTab === 'search' &&
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4">

                  {/* Meal type selector - horizontal scroll */}
                  <ScrollArea className="w-full" type="scroll">
                    <div className="flex gap-2 pb-2 pr-4">
                      {mealTypes.map((type) =>
                    <button
                      key={type}
                      onClick={() => setSelectedMealType(type)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                      selectedMealType === type ?
                      'bg-primary text-primary-foreground' :
                      'bg-muted/50 text-muted-foreground hover:bg-muted'}`
                      }>

                          {mealTypeLabels[type]}
                        </button>
                    )}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>

                  {/* Search input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Pesquisar alimentos..."
                    className="pl-10" />

                  </div>

                  {/* Suggested foods based on workout */}
                  {suggestedFoods.length > 0 && !searchQuery &&
                <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        Sugestões {workoutContext.phase === 'post_workout' ? 'Pós-Treino' : 'Pré-Treino'}
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {suggestedFoods.map((food) =>
                    <button
                      key={food.id}
                      onClick={() => addFoodFromDatabase(food)}
                      className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-left hover:from-amber-500/20 hover:to-orange-500/20 transition-all">

                            <p className="font-medium text-sm truncate">{food.name}</p>
                            <p className="text-xs text-muted-foreground">{Math.round(food.calories)} kcal</p>
                          </button>
                    )}
                      </div>
                    </div>
                }

                  {/* Search results */}
                  {searchQuery &&
                <div className="space-y-2">
                      <h4 className="text-sm font-medium">Resultados</h4>
                      {searchResults.length === 0 ?
                  <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhum alimento encontrado
                        </p> :

                  <div className="space-y-2">
                          {searchResults.map((food) =>
                    <button
                      key={food.id}
                      onClick={() => addFoodFromDatabase(food)}
                      className="w-full p-3 rounded-xl bg-card/50 border border-border/50 text-left hover:bg-card transition-all">

                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-sm">{food.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {food.portion} • {categoryLabels[food.category]}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-primary">{Math.round(food.calories)} kcal</p>
                                  <p className="text-xs text-muted-foreground">P: {Math.round(food.protein)}g</p>
                                </div>
                              </div>
                            </button>
                    )}
                        </div>
                  }
                    </div>
                }

                  {/* Selected foods */}
                  {selectedFoods.length > 0 &&
                <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center justify-between">
                        <span>Selecionados</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                          {selectedFoods.length} itens
                        </span>
                      </h4>
                      <div className="space-y-2">
                        {selectedFoods.map((food) =>
                    <div
                      key={food.instanceId}
                      className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20">

                            <div>
                              <p className="font-medium text-sm">{food.name}</p>
                              <p className="text-xs text-muted-foreground">{food.portion}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">{Math.round(food.calories)} kcal</span>
                              <button
                          onClick={() => removeFoodFromSelection(food.instanceId)}
                          className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive/20">

                                <X className="w-3 h-3 text-destructive" />
                              </button>
                            </div>
                          </div>
                    )}
                      </div>

                      {/* Totals for selected foods */}
                      <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold">Total</span>
                          <span className="text-xl font-bold text-primary">
                            {Math.round(selectedFoods.reduce((sum, f) => sum + f.calories, 0))} kcal
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center text-xs">
                          <div>
                            <p className="font-semibold">{Math.round(selectedFoods.reduce((sum, f) => sum + f.protein, 0))}g</p>
                            <p className="text-muted-foreground">Proteína</p>
                          </div>
                          <div>
                            <p className="font-semibold">{Math.round(selectedFoods.reduce((sum, f) => sum + f.carbs, 0))}g</p>
                            <p className="text-muted-foreground">Carbs</p>
                          </div>
                          <div>
                            <p className="font-semibold">{Math.round(selectedFoods.reduce((sum, f) => sum + f.fat, 0))}g</p>
                            <p className="text-muted-foreground">Gordura</p>
                          </div>
                          <div>
                            <p className="font-semibold">{Math.round(selectedFoods.reduce((sum, f) => sum + f.fiber, 0))}g</p>
                            <p className="text-muted-foreground">Fibra</p>
                          </div>
                        </div>
                      </div>
                    </div>
                }
                </motion.div>
              }
            </div>
          </ScrollAreaWithIndicators>

          {/* Footer buttons - fixed at bottom */}
          {(activeTab === 'ai' && analysisResult || activeTab === 'search' && selectedFoods.length > 0) &&
          <div className="shrink-0 border-t border-white/10 bg-zinc-900 px-5 py-4">
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetState} className="flex-1">
                  {activeTab === 'ai' ? 'Nova Análise' : 'Limpar'}
                </Button>
                <Button
                onClick={activeTab === 'ai' ? handleSaveMeal : handleSaveFromDatabase}
                className="flex-1">

                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>
          }
        </DialogContent>
      </Dialog>
    </div>);

};