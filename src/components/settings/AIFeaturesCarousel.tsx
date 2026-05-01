import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Brain, Target } from "lucide-react";
import { AICoaching } from "./AICoaching";
import { PhysiqueEvaluation } from "./PhysiqueEvaluation";

const features = [
{ id: 'coaching', title: 'Coaching IA', icon: Brain },
{ id: 'physique', title: 'Avaliação Física', icon: Target }];


export const AIFeaturesCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePrev = () => {
    setCurrentIndex((prev) => prev > 0 ? prev - 1 : features.length - 1);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => prev < features.length - 1 ? prev + 1 : 0);
  };

  useEffect(() => {
    if (containerRef.current) {
      const scrollAmount = currentIndex * containerRef.current.offsetWidth;
      containerRef.current.scrollTo({ left: scrollAmount, behavior: 'smooth' });
    }
  }, [currentIndex]);

  return (
    <div className="space-y-3">
      {/* Header with navigation */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Funcionalidades IA</h2>
            <p className="text-xs text-muted-foreground">Coaching & Avaliação</p>
          </div>
        </div>
        
        <div className="flex items-center gap-[4px]">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handlePrev}
            className="w-8 h-8 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors bg-black">

            <ChevronLeft className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleNext}
            className="w-8 h-8 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors bg-black">

            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Dots indicator - Minimal */}
      <div className="flex justify-center gap-1.5">
        {features.map((_, idx) =>
        <button
          key={idx}
          onClick={() => setCurrentIndex(idx)}
          className={`w-1.5 h-1.5 rounded-full transition-opacity ${
          idx === currentIndex ?
          'bg-white/70' :
          'bg-white/20'}`
          } />

        )}
      </div>

      {/* Carousel container */}
      <div
        ref={containerRef}
        className="flex overflow-hidden scroll-smooth"
        style={{ scrollSnapType: 'x mandatory' }}>

        <div
          className="flex-shrink-0 w-full"
          style={{ scrollSnapAlign: 'start' }}>

          <AICoaching />
        </div>
        <div
          className="flex-shrink-0 w-full"
          style={{ scrollSnapAlign: 'start' }}>

          <PhysiqueEvaluation />
        </div>
      </div>

      {/* Feature labels */}
      <div className="flex justify-center">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border/50">
          {currentIndex === 0 ?
          <Brain className="w-3.5 h-3.5 text-primary" /> :

          <Target className="w-3.5 h-3.5 text-primary" />
          }
          <span className="text-xs font-medium text-foreground">
            {features[currentIndex].title}
          </span>
        </div>
      </div>
    </div>);

};