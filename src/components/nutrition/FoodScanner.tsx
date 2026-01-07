import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Loader2, Sparkles, X, Plus, Utensils, Search, Dumbbell, Zap, Clock, Upload } from 'lucide-react';
import { useState, useRef, useMemo } from 'react';
import { compressBase64Image } from '@/lib/imageCompression';
import { invokeWithAuth } from '@/lib/supabaseHelpers';
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

export const FoodScanner = ({ onMealAdded }: FoodScannerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<Meal['type']>('lunch');
  const [activeTab, setActiveTab] = useState<'ai' | 'search'>('ai');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFoods, setSelectedFoods] = useState<FoodDatabaseItem[]>([]);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
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
        // Compress image before analysis
        const compressedBase64 = await compressBase64Image(base64, 1024, 0.7);
        setImagePreview(compressedBase64);
        await analyzeImage(compressedBase64);
      } catch (error) {
        console.error('Error compressing image:', error);
        setImagePreview(base64);
        await analyzeImage(base64);
      }
    };
    reader.readAsDataURL(file);
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const analyzeImage = async (imageBase64: string) => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await invokeWithAuth<AnalysisResult>('analyze-food', {
        body: { imageBase64 },
      });

      if (error) throw error;

      setAnalysisResult(data);
      if (data.mealType) {
        setSelectedMealType(data.mealType);
      }

      toast({
        title: 'Analysis complete!',
        description: `${data.foods.length} food(s) identified`,
      });
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast({
        title: 'Analysis error',
        description: 'Could not analyze the image. Please try again.',
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
      const { data, error } = await invokeWithAuth<AnalysisResult>('analyze-food', {
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
        title: 'Analysis error',
        description: 'Could not analyze the description.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addFoodFromDatabase = (food: FoodDatabaseItem) => {
    setSelectedFoods(prev => [...prev, food]);
    toast({
      title: `${food.name} added`,
      description: `${food.calories} kcal`,
    });
  };

  const removeFoodFromSelection = (foodId: string) => {
    setSelectedFoods(prev => prev.filter(f => f.id !== foodId));
  };

  const handleSaveFromDatabase = () => {
    if (selectedFoods.length === 0) return;

    const foods: FoodItem[] = selectedFoods.map(food => ({
      name: food.name,
      portion: food.portion,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fiber: food.fiber,
    }));

    const total = selectedFoods.reduce((acc, food) => ({
      calories: acc.calories + food.calories,
      protein: acc.protein + food.protein,
      carbs: acc.carbs + food.carbs,
      fat: acc.fat + food.fat,
      fiber: acc.fiber + food.fiber,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

    const meal: Omit<Meal, 'id'> = {
      type: selectedMealType,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      foods,
      total,
    };

    onMealAdded(meal);
    setIsOpen(false);
    resetState();

    toast({
      title: 'Meal added!',
      description: `${total.calories} kcal logged`,
    });
  };

  const handleSaveMeal = () => {
    if (!analysisResult) return;

    const meal: Omit<Meal, 'id'> = {
      type: selectedMealType,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      foods: analysisResult.foods,
      total: analysisResult.total,
      tips: analysisResult.tips,
      imageUrl: imagePreview || undefined,
    };

    onMealAdded(meal);
    setIsOpen(false);
    resetState();

    toast({
      title: 'Meal added!',
      description: `${analysisResult.total.calories} kcal logged`,
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
      {workoutContext.phase !== 'none' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-xl border flex items-start gap-3 ${
            workoutContext.phase === 'post_workout'
              ? 'bg-green-500/10 border-green-500/20'
              : workoutContext.phase === 'pre_workout'
              ? 'bg-amber-500/10 border-amber-500/20'
              : 'bg-blue-500/10 border-blue-500/20'
          }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            workoutContext.phase === 'post_workout'
              ? 'bg-green-500/20'
              : workoutContext.phase === 'pre_workout'
              ? 'bg-amber-500/20'
              : 'bg-blue-500/20'
          }`}>
            {workoutContext.phase === 'post_workout' ? (
              <Zap className="w-4 h-4 text-green-500" />
            ) : workoutContext.phase === 'pre_workout' ? (
              <Dumbbell className="w-4 h-4 text-amber-500" />
            ) : (
              <Clock className="w-4 h-4 text-blue-500" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              {workoutContext.phase === 'post_workout' && 'Post-Workout Window'}
              {workoutContext.phase === 'pre_workout' && 'Pre-Workout Preparation'}
              {workoutContext.phase === 'recovery' && 'Active Recovery'}
            </p>
            <p className="text-xs text-gray-400">{workoutContext.nutritionTip}</p>
          </div>
        </motion.div>
      )}

      <Drawer open={isOpen} onOpenChange={handleOpen}>
        <DrawerTrigger asChild>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-primary to-purple-500 text-white font-medium shadow-lg shadow-primary/25"
          >
            <Camera className="w-5 h-5" />
            <span>Add Meal</span>
            <Sparkles className="w-4 h-4" />
          </motion.button>
        </DrawerTrigger>

        <DrawerContent className="max-h-[90vh] bg-zinc-900 border-white/10 flex flex-col">
          <DrawerHeader className="shrink-0">
            <DrawerTitle className="flex items-center gap-2 text-white">
              <Utensils className="w-5 h-5" />
              Add Meal
            </DrawerTitle>
          </DrawerHeader>

          {/* Tab Switcher */}
          <div className="px-4 mb-4">
            <div className="flex bg-white/5 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'ai'
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-gray-400'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                IA Scanner
              </button>
              <button
                onClick={() => setActiveTab('search')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'search'
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-gray-400'
                }`}
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </div>
          </div>

          <ScrollAreaWithIndicators className="flex-1 min-h-0 overflow-hidden" showTopIndicator={false}>
            <div className="px-4 pb-6 space-y-4 pr-2">
              {/* AI Tab */}
              {activeTab === 'ai' && (
                <AnimatePresence mode="wait">
                  {!imagePreview && !analysisResult && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => cameraInputRef.current?.click()}
                            className="aspect-video rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center gap-2 hover:bg-primary/10 transition-colors"
                          >
                            <Camera className="w-8 h-8 text-primary" />
                            <span className="text-xs text-gray-400">Take Photo</span>
                          </button>
                          <button
                            onClick={() => galleryInputRef.current?.click()}
                            className="aspect-video rounded-xl border-2 border-dashed border-pink-500/30 bg-pink-500/5 flex flex-col items-center justify-center gap-2 hover:bg-pink-500/10 transition-colors"
                          >
                            <Upload className="w-8 h-8 text-pink-400" />
                            <span className="text-xs text-gray-400">Gallery</span>
                          </button>
                        </div>
                        {/* Camera input - forces camera on mobile */}
                        <input
                          ref={cameraInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        {/* Gallery input - opens file picker */}
                        <input
                          ref={galleryInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />

                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-px bg-white/10" />
                          <span className="text-xs text-gray-400">or describe</span>
                          <div className="flex-1 h-px bg-white/10" />
                      </div>

                      <div className="flex gap-2">
                        <Input
                          value={manualInput}
                          onChange={(e) => setManualInput(e.target.value)}
                          placeholder="E.g: 200g grilled chicken, brown rice..."
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
                          <span className="text-white text-sm">Analyzing with AI...</span>
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
                      {imagePreview && (
                        <img
                          src={imagePreview}
                          alt="Food"
                          className="w-full h-24 object-cover rounded-xl"
                        />
                      )}

                      {/* Meal type selector - horizontal scroll */}
                      <ScrollArea className="w-full" type="scroll">
                        <div className="flex gap-2 pb-2 pr-4">
                          {mealTypes.map((type) => (
                            <button
                              key={type}
                              onClick={() => setSelectedMealType(type)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                                selectedMealType === type
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
                              }`}
                            >
                              {mealTypeLabels[type]}
                            </button>
                          ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>

                        {/* Foods list */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-white">Alimentos identificados</h4>
                          {analysisResult.foods.map((food, i) => (
                            <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-sm text-white">{food.name}</p>
                                  <p className="text-xs text-gray-400">{food.portion}</p>
                                </div>
                                <span className="text-sm font-semibold text-primary">
                                  {food.calories} kcal
                                </span>
                              </div>
                              <div className="flex gap-3 mt-2 text-xs text-gray-400">
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
                            <span className="font-semibold text-white">Total</span>
                            <span className="text-xl font-bold text-primary">
                              {analysisResult.total.calories} kcal
                            </span>
                        </div>
                          <div className="grid grid-cols-4 gap-2 text-center text-xs">
                            <div>
                              <p className="font-semibold text-white">{analysisResult.total.protein}g</p>
                              <p className="text-gray-400">Proteína</p>
                            </div>
                            <div>
                              <p className="font-semibold text-white">{analysisResult.total.carbs}g</p>
                              <p className="text-gray-400">Carbs</p>
                            </div>
                            <div>
                              <p className="font-semibold text-white">{analysisResult.total.fat}g</p>
                              <p className="text-gray-400">Gordura</p>
                            </div>
                            <div>
                              <p className="font-semibold text-white">{analysisResult.total.fiber}g</p>
                              <p className="text-gray-400">Fibra</p>
                            </div>
                          </div>
                      </div>

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
              )}

              {/* Search Tab */}
              {activeTab === 'search' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {/* Meal type selector - horizontal scroll */}
                  <ScrollArea className="w-full" type="scroll">
                    <div className="flex gap-2 pb-2 pr-4">
                      {mealTypes.map((type) => (
                        <button
                          key={type}
                          onClick={() => setSelectedMealType(type)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                            selectedMealType === type
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {mealTypeLabels[type]}
                        </button>
                      ))}
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
                      className="pl-10"
                    />
                  </div>

                  {/* Suggested foods based on workout */}
                  {suggestedFoods.length > 0 && !searchQuery && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        Sugestões {workoutContext.phase === 'post_workout' ? 'Pós-Treino' : 'Pré-Treino'}
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {suggestedFoods.map((food) => (
                          <button
                            key={food.id}
                            onClick={() => addFoodFromDatabase(food)}
                            className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-left hover:from-amber-500/20 hover:to-orange-500/20 transition-all"
                          >
                            <p className="font-medium text-sm truncate">{food.name}</p>
                            <p className="text-xs text-muted-foreground">{food.calories} kcal</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search results */}
                  {searchQuery && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Resultados</h4>
                      {searchResults.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhum alimento encontrado
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {searchResults.map((food) => (
                            <button
                              key={food.id}
                              onClick={() => addFoodFromDatabase(food)}
                              className="w-full p-3 rounded-xl bg-card/50 border border-border/50 text-left hover:bg-card transition-all"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-sm">{food.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {food.portion} • {categoryLabels[food.category]}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-primary">{food.calories} kcal</p>
                                  <p className="text-xs text-muted-foreground">P: {food.protein}g</p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selected foods */}
                  {selectedFoods.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center justify-between">
                        <span>Selecionados</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                          {selectedFoods.length} itens
                        </span>
                      </h4>
                      <div className="space-y-2">
                        {selectedFoods.map((food, index) => (
                          <div
                            key={`${food.id}-${index}`}
                            className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20"
                          >
                            <div>
                              <p className="font-medium text-sm">{food.name}</p>
                              <p className="text-xs text-muted-foreground">{food.portion}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">{food.calories} kcal</span>
                              <button
                                onClick={() => removeFoodFromSelection(food.id)}
                                className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive/20"
                              >
                                <X className="w-3 h-3 text-destructive" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Totals for selected foods */}
                      <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold">Total</span>
                          <span className="text-xl font-bold text-primary">
                            {selectedFoods.reduce((sum, f) => sum + f.calories, 0)} kcal
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center text-xs">
                          <div>
                            <p className="font-semibold">{selectedFoods.reduce((sum, f) => sum + f.protein, 0)}g</p>
                            <p className="text-muted-foreground">Proteína</p>
                          </div>
                          <div>
                            <p className="font-semibold">{selectedFoods.reduce((sum, f) => sum + f.carbs, 0)}g</p>
                            <p className="text-muted-foreground">Carbs</p>
                          </div>
                          <div>
                            <p className="font-semibold">{selectedFoods.reduce((sum, f) => sum + f.fat, 0)}g</p>
                            <p className="text-muted-foreground">Gordura</p>
                          </div>
                          <div>
                            <p className="font-semibold">{selectedFoods.reduce((sum, f) => sum + f.fiber, 0)}g</p>
                            <p className="text-muted-foreground">Fibra</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </ScrollAreaWithIndicators>

          {/* Footer buttons - fixed at bottom */}
          {((activeTab === 'ai' && analysisResult) || (activeTab === 'search' && selectedFoods.length > 0)) && (
            <DrawerFooter className="shrink-0 border-t border-white/10 bg-zinc-900">
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetState} className="flex-1">
                  {activeTab === 'ai' ? 'Nova Análise' : 'Limpar'}
                </Button>
                <Button 
                  onClick={activeTab === 'ai' ? handleSaveMeal : handleSaveFromDatabase} 
                  className="flex-1"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};