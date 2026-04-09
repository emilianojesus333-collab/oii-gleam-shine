import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Download, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MuscleMapSVG } from "./MuscleMapSVG";
import html2canvas from "html2canvas";
import { toast } from "sonner";

interface WorkoutShareData {
  muscleGroups: string[];
  durationMin: number;
  totalVolume: number;
  totalSets: number;
  date: string;
  dayOfWeek: string;
}

interface WorkoutShareCardProps {
  open: boolean;
  onClose: () => void;
  data: WorkoutShareData;
}

export const WorkoutShareCard = ({ open, onClose, data }: WorkoutShareCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  if (!open) return null;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 3,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `treino-${data.date}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Imagem guardada!");
    } catch {
      toast.error("Erro ao gerar imagem");
    } finally {
      setExporting(false);
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 3,
        useCORS: true,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `treino-${data.date}.png`, { type: "image/png" });
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "Meu Treino - LiftMate" });
        } else {
          // Fallback to download
          handleDownload();
        }
        setExporting(false);
      }, "image/png");
    } catch {
      toast.error("Erro ao partilhar");
      setExporting(false);
    }
  };

  const muscleLabels: Record<string, string> = {
    chest: "Peito", back: "Costas", shoulders: "Ombros",
    biceps: "Bíceps", triceps: "Tríceps", forearms: "Antebraços",
    quadriceps: "Quadríceps", hamstrings: "Posteriores", glutes: "Glúteos",
    calves: "Gémeos", abs: "Abdominais", traps: "Trapézio",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm flex flex-col items-center gap-4"
      >
        {/* Close */}
        <button onClick={onClose} className="self-end p-2 text-white/50 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        {/* The card to export */}
        <div
          ref={cardRef}
          className="w-full rounded-none overflow-hidden"
          style={{
            padding: "32px 24px",
            background: "#1A1A1A",
            borderRadius: 0,
            border: "none",
            borderBottom: "1px solid #2A2A2A",
            width: "100%",
          }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <p className="text-white/40 text-xs font-medium tracking-widest uppercase mb-1">
              {data.dayOfWeek}
            </p>
            <h2 className="text-white text-lg font-bold">Treino Concluído 💪</h2>
          </div>

          {/* Muscle Map */}
          <div className="flex justify-center gap-2 mb-6" style={{ height: "180px" }}>
            <MuscleMapSVG activeMuscles={data.muscleGroups} view="front" />
            <MuscleMapSVG activeMuscles={data.muscleGroups} view="back" />
          </div>

          {/* Muscle tags */}
          <div className="flex flex-wrap justify-center gap-1.5 mb-6">
            {data.muscleGroups.map((mg) => (
              <span
                key={mg}
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: "rgba(56,189,248,0.15)", color: "#38bdf8" }}
              >
                {muscleLabels[mg.toLowerCase()] || mg}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-white/40 text-xs mb-1">Duração</p>
              <p className="text-white text-2xl font-black">{data.durationMin}<span className="text-base font-semibold">min</span></p>
            </div>
            <div>
              <p className="text-white/40 text-xs mb-1">Volume</p>
              <p className="text-white text-2xl font-black">{data.totalVolume.toLocaleString("pt-PT")}<span className="text-base font-semibold"> kg</span></p>
            </div>
            <div>
              <p className="text-white/40 text-xs mb-1">Séries</p>
              <p className="text-white text-2xl font-black">{data.totalSets}</p>
            </div>
          </div>

          {/* Branding */}
          <div className="mt-6 pt-4 border-t border-white/5 text-center">
            <p className="text-white/20 text-[10px] tracking-widest uppercase font-semibold">
              LiftMate
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 w-full">
          <Button
            onClick={handleDownload}
            disabled={exporting}
            variant="outline"
            className="flex-1 gap-2 border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            <Download className="w-4 h-4" />
            Guardar
          </Button>
          <Button
            onClick={handleShare}
            disabled={exporting}
            className="flex-1 gap-2 bg-primary text-primary-foreground"
          >
            <Share2 className="w-4 h-4" />
            Partilhar
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};
