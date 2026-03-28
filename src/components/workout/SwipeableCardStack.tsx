import { useState, useCallback, useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  PanInfo,
  AnimatePresence,
} from "framer-motion";
import { Dumbbell, Clock, Repeat, Weight, Check, Trophy, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export interface StackExercise {
  name: string;
  sets: number;
  reps: string;
  rest: number;
  weight?: number;
  equipment?: string;
  category?: "main" | "accessory";
}

interface SwipeableCardStackProps {
  exercises: StackExercise[];
  onSwipeRight: (exercise: StackExercise, index: number) => void;
  onFinish: () => void;
  isFinishing?: boolean;
}

const SWIPE_THRESHOLD = 100;
const MAX_VISIBLE = 3;

function ExerciseCard({
  exercise,
  index,
  total,
  isTop,
  onSwipeRight,
  onUndo,
}: {
  exercise: StackExercise;
  index: number;
  total: number;
  isTop: boolean;
  onSwipeRight: () => void;
  onUndo?: () => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-12, 0, 12]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 0.8, 1, 0.8, 0.5]);
  const rightIndicatorOpacity = useTransform(x, [0, 60, 120], [0, 0.5, 1]);
  const leftIndicatorOpacity = useTransform(x, [-120, -60, 0], [1, 0.5, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      animate(x, 400, { type: "spring", duration: 0.4 });
      setTimeout(onSwipeRight, 200);
    } else if (info.offset.x < -SWIPE_THRESHOLD && onUndo) {
      animate(x, -400, { type: "spring", duration: 0.4 });
      setTimeout(onUndo, 200);
    } else {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
    }
  };

  return (
    <motion.div
      style={{ x, rotate, opacity, zIndex: isTop ? 10 : 1 }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 touch-pan-y cursor-grab active:cursor-grabbing"
    >
      <div className="relative h-full rounded-2xl bg-card border border-border/30 p-6 flex flex-col justify-between overflow-hidden shadow-lg">
        {/* Swipe indicators */}
        <motion.div
          style={{ opacity: rightIndicatorOpacity }}
          className="absolute top-4 right-4 px-3 py-1 rounded-lg bg-[hsl(142,60%,45%)]/20 border border-[hsl(142,60%,45%)]/40"
        >
          <span className="text-xs font-bold text-[hsl(142,60%,45%)]">FEITO ✓</span>
        </motion.div>
        <motion.div
          style={{ opacity: leftIndicatorOpacity }}
          className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-destructive/20 border border-destructive/40"
        >
          <span className="text-xs font-bold text-destructive">VOLTAR</span>
        </motion.div>

        {/* Counter */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-muted-foreground">
            {index + 1} / {total}
          </span>
          {exercise.category === "accessory" && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground">
              Acessório
            </span>
          )}
        </div>

        {/* Exercise name */}
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-2">
            <Dumbbell className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground leading-tight">
            {exercise.name}
          </h3>
          {exercise.equipment && (
            <p className="text-xs text-muted-foreground">{exercise.equipment}</p>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-muted/20 rounded-xl p-3 text-center">
            <Repeat className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{exercise.sets}</p>
            <p className="text-[10px] text-muted-foreground">Séries</p>
          </div>
          <div className="bg-muted/20 rounded-xl p-3 text-center">
            <ChevronRight className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{exercise.reps}</p>
            <p className="text-[10px] text-muted-foreground">Reps</p>
          </div>
          <div className="bg-muted/20 rounded-xl p-3 text-center">
            <Clock className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{exercise.rest}s</p>
            <p className="text-[10px] text-muted-foreground">Descanso</p>
          </div>
        </div>

        {/* Swipe hint */}
        {isTop && (
          <p className="text-[10px] text-muted-foreground/50 text-center mt-3">
            ← voltar · desliza para concluir →
          </p>
        )}
      </div>
    </motion.div>
  );
}

export function SwipeableCardStack({
  exercises,
  onSwipeRight,
  onFinish,
  isFinishing,
}: SwipeableCardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<StackExercise[]>([]);
  const swipeQueueRef = useRef(false);

  const isComplete = currentIndex >= exercises.length;

  const handleSwipeRight = useCallback(
    (exercise: StackExercise, idx: number) => {
      if (swipeQueueRef.current) return;
      swipeQueueRef.current = true;
      setCompletedExercises((prev) => [...prev, exercise]);
      onSwipeRight(exercise, idx);
      setCurrentIndex((prev) => prev + 1);
      setTimeout(() => { swipeQueueRef.current = false; }, 300);
    },
    [onSwipeRight]
  );

  const handleUndo = useCallback(() => {
    if (currentIndex <= 0) return;
    setCurrentIndex((prev) => prev - 1);
    setCompletedExercises((prev) => prev.slice(0, -1));
  }, [currentIndex]);

  // Visible cards (up to MAX_VISIBLE)
  const visibleCards = exercises
    .slice(currentIndex, currentIndex + MAX_VISIBLE)
    .reverse(); // render back-to-front so top card is last in DOM (highest z-index)

  const totalVolume = completedExercises.reduce(
    (acc, e) => acc + (e.weight || 0) * (parseInt(e.reps) || 0) * e.sets,
    0
  );

  return (
    <div className="space-y-3">
      {/* Card Stack */}
      <div className="relative w-full" style={{ height: 320 }}>
        <AnimatePresence>
          {!isComplete ? (
            visibleCards.map((exercise, stackPos) => {
              const actualIndex = currentIndex + (visibleCards.length - 1 - stackPos);
              const depth = visibleCards.length - 1 - stackPos; // 0 = top card
              const isTop = depth === 0;

              return (
                <motion.div
                  key={`${exercise.name}-${actualIndex}`}
                  initial={{ scale: 0.9, y: 20, opacity: 0 }}
                  animate={{
                    scale: 1 - depth * 0.05,
                    y: depth * 8,
                    opacity: 1 - depth * 0.15,
                  }}
                  exit={{ x: 400, opacity: 0, rotate: 15 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="absolute inset-0"
                  style={{ zIndex: MAX_VISIBLE - depth }}
                >
                  <ExerciseCard
                    exercise={exercise}
                    index={actualIndex}
                    total={exercises.length}
                    isTop={isTop}
                    onSwipeRight={() => handleSwipeRight(exercise, actualIndex)}
                    onUndo={isTop && currentIndex > 0 ? handleUndo : undefined}
                  />
                </motion.div>
              );
            })
          ) : (
            /* ── Final Card ── */
            <motion.div
              key="final-card"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="absolute inset-0"
            >
              <div className="h-full rounded-2xl bg-gradient-to-br from-[hsl(142,60%,45%)]/20 to-card border border-[hsl(142,60%,45%)]/30 p-6 flex flex-col justify-between">
                <div className="flex-1 flex flex-col justify-center items-center text-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-[hsl(142,60%,45%)]/20 flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-[hsl(142,60%,45%)]" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Treino Completo!</h3>
                  <div className="grid grid-cols-3 gap-4 w-full mt-2">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{exercises.length}</p>
                      <p className="text-[10px] text-muted-foreground">Exercícios</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">
                        {exercises.reduce((a, e) => a + e.sets, 0)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Séries</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">
                        {totalVolume > 0 ? `${(totalVolume / 1000).toFixed(1)}k` : "—"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Volume (kg)</p>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onFinish}
                  disabled={isFinishing}
                  className="w-full py-4 rounded-xl bg-[hsl(142,60%,45%)] text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[hsl(142,60%,45%)]/30 disabled:opacity-50"
                >
                  {isFinishing ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Check className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Finalizar Treino
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5">
        {exercises.map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              i < currentIndex
                ? "bg-[hsl(142,60%,45%)]"
                : i === currentIndex
                ? "bg-primary w-3"
                : "bg-muted/40"
            }`}
          />
        ))}
      </div>

      {/* "Mostrar exercícios" sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <button className="w-full text-center text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors py-1">
            Mostrar todos os exercícios
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="bg-card border-border max-h-[70vh]">
          <SheetHeader>
            <SheetTitle className="text-foreground">Exercícios da sessão</SheetTitle>
          </SheetHeader>
          <div className="space-y-2 mt-4 overflow-y-auto max-h-[50vh]">
            {exercises.map((ex, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  i < currentIndex
                    ? "bg-[hsl(142,60%,45%)]/10 border border-[hsl(142,60%,45%)]/20"
                    : "bg-muted/20"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  i < currentIndex
                    ? "bg-[hsl(142,60%,45%)]/20 text-[hsl(142,60%,45%)]"
                    : "bg-muted/30 text-muted-foreground"
                }`}>
                  {i < currentIndex ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${i < currentIndex ? "text-foreground/60" : "text-foreground"}`}>
                    {ex.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ex.sets}x{ex.reps} · {ex.rest}s
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
