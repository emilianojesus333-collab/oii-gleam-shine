import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Lightbulb } from "lucide-react";
import type { PlannedExercise } from "@/hooks/useActiveSession";

interface ExerciseCarouselProps {
  exercises: PlannedExercise[];
  currentIndex: number;
  onSelect: (exercise: PlannedExercise, index: number) => void;
}

export const ExerciseCarousel = ({ exercises, currentIndex, onSelect }: ExerciseCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeCard, setActiveCard] = useState(currentIndex);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const cardWidth = el.scrollWidth / exercises.length;
    const idx = Math.round(el.scrollLeft / cardWidth);
    setActiveCard(idx);
  }, [exercises.length]);

  if (exercises.length === 0) return null;

  return (
    <div style={{ background: "#1A1A1A", borderRadius: 0, border: "none", borderBottom: "1px solid #2A2A2A", width: "100%", margin: 0, paddingTop: 20, paddingBottom: 8 }}>
      {/* Section label */}
      <div style={{ paddingLeft: 16, paddingRight: 16, marginBottom: 12 }}>
        <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
          Exercícios
        </p>
      </div>

      {/* Horizontal scroll */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth px-6 pb-2 no-scrollbar"
        style={{ scrollbarWidth: "none" }}
      >
        {exercises.map((ex, i) => {
          const isActive = i === activeCard;
          const isCompleted = ex.completed;
          const isCurrent = i === currentIndex;

          return (
            <motion.div
              key={ex.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelect(ex, i)}
              className={`
                flex-shrink-0 snap-center rounded-2xl p-5 cursor-pointer transition-all duration-300
                ${isActive ? "w-[280px]" : "w-[180px]"}
                ${isCompleted
                  ? "bg-[hsl(142,40%,15%)] border border-[hsl(142,50%,25%)]"
                  : isCurrent
                    ? "bg-card border-2 border-primary/40"
                    : "bg-muted/30 border border-border/30"
                }
              `}
            >
              {/* Number */}
              <span className={`text-2xl font-mono font-bold ${
                isCompleted ? "text-[hsl(142,60%,40%)]" : isCurrent ? "text-primary/60" : "text-muted-foreground/30"
              }`}>
                {String(i + 1).padStart(2, "0")}
              </span>

              {/* Name */}
              <p className={`mt-2 font-semibold text-base leading-tight ${
                isCompleted ? "text-[hsl(142,50%,70%)] line-through" : "text-foreground"
              }`}>
                {ex.exercise_name}
              </p>

              {/* Details - only on active card */}
              {isActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 space-y-2"
                >
                  <p className="text-sm font-mono text-primary">
                    {ex.sets}×{ex.reps}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ex.rest}s descanso
                  </p>

                  {/* AI tip placeholder */}
                  {ex.source === "ai" && (
                    <div className="mt-2 flex items-start gap-2 rounded-xl bg-primary/10 p-2.5">
                      <Lightbulb className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-[11px] text-primary/80 leading-relaxed">
                        Controla a fase excêntrica em 3s
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Arrow for non-active */}
              {!isActive && !isCompleted && (
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 mt-3" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5">
        {exercises.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === activeCard
                ? "w-6 bg-primary"
                : exercises[i].completed
                  ? "w-1.5 bg-[hsl(142,60%,40%)]"
                  : "w-1.5 bg-muted-foreground/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
