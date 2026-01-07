import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, Plus, ChevronLeft, ChevronRight, 
  Calendar, Loader2, Sparkles, Image as ImageIcon
} from 'lucide-react';
import { useProgressPhotos, ProgressPhoto } from '@/hooks/useProgressPhotos';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { invokeWithAuth } from '@/lib/supabaseHelpers';
import { compressImage } from '@/lib/imageCompression';

export const ProgressPhotosCard = () => {
  const { latestPhotos, shouldTakePhotos, comparisonPairs } = useProgressPhotos();
  const [showAddSheet, setShowAddSheet] = useState(false);

  const hasPhotos = Object.keys(latestPhotos).length > 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Camera className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="font-semibold text-sm">Fotos de Progresso</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddSheet(true)}
            className="h-8 w-8 p-0 hover:bg-cyan-500/20"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {hasPhotos ? (
          <div className="space-y-3">
            {/* Latest photos preview */}
            <div className="grid grid-cols-3 gap-2">
              {(['front', 'side', 'back'] as const).map((pose) => (
                <div 
                  key={pose}
                  className="aspect-[3/4] rounded-lg overflow-hidden bg-black/30 flex items-center justify-center"
                >
                  {latestPhotos[pose] ? (
                    <img 
                      src={latestPhotos[pose]!.imageBase64} 
                      alt={`${pose} view`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-muted-foreground/30" />
                  )}
                </div>
              ))}
            </div>

            {/* Comparison info */}
            {comparisonPairs.length > 0 && (
              <div className="text-xs text-center text-muted-foreground">
                {comparisonPairs[0]?.daysBetween} dias de progresso registado
              </div>
            )}

            {shouldTakePhotos && (
              <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-amber-400">Hora de tirar novas fotos!</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <Camera className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              Regista o teu progresso visual
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddSheet(true)}
              className="border-cyan-500/30 hover:bg-cyan-500/10"
            >
              <Camera className="w-4 h-4 mr-1" />
              Tirar primeira foto
            </Button>
          </div>
        )}
      </motion.div>

      <AddPhotoSheet open={showAddSheet} onOpenChange={setShowAddSheet} />
    </>
  );
};

interface AddPhotoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddPhotoSheet = ({ open, onOpenChange }: AddPhotoSheetProps) => {
  const { addPhoto, updatePhoto } = useProgressPhotos();
  const [selectedPose, setSelectedPose] = useState<ProgressPhoto['pose']>('front');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const poseLabels: Record<ProgressPhoto['pose'], string> = {
    front: 'Frente',
    side: 'Lado',
    back: 'Costas',
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 800, 0.8);
      setImageBase64(compressed);
    } catch (error) {
      toast.error('Erro ao processar a imagem');
    }
  };

  const handleSave = async () => {
    if (!imageBase64) {
      toast.error('Seleciona uma foto primeiro');
      return;
    }

    const photoId = addPhoto({
      date: new Date().toISOString().split('T')[0],
      imageBase64,
      pose: selectedPose,
    });

    toast.success('Foto guardada com sucesso!');

    // Optionally analyze with AI
    setIsAnalyzing(true);
    try {
      const { data, error } = await invokeWithAuth<{ analysis?: { observations?: string[]; improvements?: string[] } }>('analyze-physique', {
        body: { image: imageBase64, pose: selectedPose },
      });

      if (data?.analysis) {
        updatePhoto(photoId, {
          aiAnalysis: {
            analyzedAt: new Date().toISOString(),
            observations: data.analysis.observations || [],
            improvements: data.analysis.improvements || [],
          },
        });
        toast.success('Análise IA concluída!');
      }
    } catch (error) {
      console.log('AI analysis not available');
    } finally {
      setIsAnalyzing(false);
    }

    setImageBase64(null);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] bg-zinc-900 border-white/10">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            Nova Foto de Progresso
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          {/* Pose selector */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Posição</label>
            <div className="grid grid-cols-3 gap-2">
              {(['front', 'side', 'back'] as const).map((pose) => (
                <button
                  key={pose}
                  onClick={() => setSelectedPose(pose)}
                  className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                    selectedPose === pose
                      ? 'bg-cyan-500 text-white'
                      : 'bg-black/30 text-muted-foreground hover:bg-black/50'
                  }`}
                >
                  {poseLabels[pose]}
                </button>
              ))}
            </div>
          </div>

          {/* Image preview / upload */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="aspect-[3/4] max-h-80 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer hover:border-cyan-500/50 transition-colors overflow-hidden"
          >
            {imageBase64 ? (
              <img src={imageBase64} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <Camera className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Toca para selecionar foto</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          <Button 
            onClick={handleSave} 
            className="w-full"
            disabled={!imageBase64 || isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                A analisar com IA...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Guardar e Analisar
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Photo comparison view
export const PhotoComparisonView = () => {
  const { comparisonPairs, photos, getPhotosByPose } = useProgressPhotos();
  const [selectedPose, setSelectedPose] = useState<ProgressPhoto['pose']>('front');
  const [currentIndex, setCurrentIndex] = useState(0);

  const posePhotos = getPhotosByPose(selectedPose);
  const currentPhoto = posePhotos[currentIndex];

  return (
    <div className="space-y-4">
      {/* Pose selector */}
      <div className="grid grid-cols-3 gap-2">
        {(['front', 'side', 'back'] as const).map((pose) => (
          <button
            key={pose}
            onClick={() => { setSelectedPose(pose); setCurrentIndex(0); }}
            className={`py-2 px-4 rounded-xl text-sm font-medium transition-all ${
              selectedPose === pose
                ? 'bg-cyan-500 text-white'
                : 'bg-card/50 text-muted-foreground hover:bg-card'
            }`}
          >
            {pose === 'front' ? 'Frente' : pose === 'side' ? 'Lado' : 'Costas'}
          </button>
        ))}
      </div>

      {/* Photo viewer */}
      {posePhotos.length > 0 ? (
        <div className="relative">
          <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-black/30">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentPhoto?.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                src={currentPhoto?.imageBase64}
                alt=""
                className="w-full h-full object-cover"
              />
            </AnimatePresence>
          </div>

          {/* Navigation */}
          {posePhotos.length > 1 && (
            <>
              <button
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center disabled:opacity-30"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => setCurrentIndex(Math.min(posePhotos.length - 1, currentIndex + 1))}
                disabled={currentIndex === posePhotos.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center disabled:opacity-30"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Date indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/70 text-sm">
            {currentPhoto && new Date(currentPhoto.date).toLocaleDateString('pt-PT')}
          </div>

          {/* Dots indicator - Minimal */}
          {posePhotos.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-3">
              {posePhotos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-opacity ${
                    i === currentIndex ? 'bg-white/70' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-[3/4] rounded-2xl bg-card/30 flex items-center justify-center">
          <div className="text-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Sem fotos desta posição</p>
          </div>
        </div>
      )}

      {/* AI Analysis */}
      {currentPhoto?.aiAnalysis && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium">Análise IA</span>
          </div>
          <ul className="space-y-1">
            {currentPhoto.aiAnalysis.observations.map((obs, i) => (
              <li key={i} className="text-sm text-muted-foreground">• {obs}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
