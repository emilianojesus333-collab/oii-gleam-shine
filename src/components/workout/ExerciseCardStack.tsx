import { useState, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence, PanInfo } from "framer-motion";
import { Check, Undo2, Dumbbell } from "lucide-react";
import type { PlannedExercise } from "@/hooks/useActiveSession";

interface ExerciseCardStackProps {
  exercises: PlannedExercise[];
  onSwipeRight: (exercise: PlannedExercise, index: number) => void;
  onSwipeLeft: (exercise: PlannedExercise, index: number) => void;
  onUndo: () => void;
  currentIndex: number;
  canUndo: boolean;
}

const SWIPE_THRESHOLD = 100;
const CARD_STACK_SIZE = 3;

const ExerciseCard = ({
  exercise,
  index,
  stackIndex,
  onSwipeComplete,
  isTop,
}: {
  exercise: PlannedExercise;
  index: number;
  stackIndex: number;
  onSwipeComplete: (direction: "left" | "right") => void;
  isTop: boolean;
}) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-12, 0, 12]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 0.8, 1, 0.8, 0.5]);

  // Overlays
  const rightOverlayOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const leftOverlayOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const { offset, velocity } = info;
    const swipe = Math.abs(offset.x) * velocity.x;

    if (offset.x > SWIPE_THRESHOLD || swipe > 10000) {
      onSwipeComplete("right");
    } else if (offset.x < -SWIPE_THRESHOLD || swipe < -10000) {
      onSwipeComplete("left");
    }
  };

  // Stack offset styling
  const stackScale = 1 - stackIndex * 0.05;
  const stackY = stackIndex * 12;
  const stackOpacity = 1 - stackIndex * 0.2;

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        zIndex: CARD_STACK_SIZE - stackIndex,
      }}
      initial={isTop ? { scale: 0.95, opacity: 0 } : false}
      animate={{
        scale: isTop ? 1 : stackScale,
        y: isTop ? 0 : stackY,
        opacity: isTop ? 1 : stackOpacity,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <motion.div
        className="w-full h-full cursor-grab active:cursor-grabbing"
        drag={isTop ? "x" : false}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.9}
        onDragEnd={isTop ? handleDragEnd : undefined}
        style={isTop ? { x, rotate } : {}}
        whileDrag={{ scale: 1.02 }}
      >
        <div className="w-full h-full rounded-3xl bg-gradient-to-br from-primary/90 via-primary/70 to-primary/50 border border-primary/30 p-6 flex flex-col justify-between shadow-2xl shadow-primary/20 backdrop-blur-sm overflow-hidden">
          {/* Swipe overlays */}
          {isTop && (
            <>
              <motion.div
                className="absolute inset-0 rounded-3xl bg-[hsl(142,60%,40%)]/20 border-2 border-[hsl(142,60%,40%)] flex items-center justify-center z-10 pointer-events-none"
                style={{ opacity: rightOverlayOpacity }}
              >
                <div className="bg-[hsl(142,60%,40%)] rounded-full p-3">
                  <Check className="w-8 h-8 text-white" />
                </div>
              </motion.div>
              <motion.div
                className="absolute inset-0 rounded-3xl bg-muted/20 border-2 border-muted-foreground/40 flex items-center justify-center z-10 pointer-events-none"
                style={{ opacity: leftOverlayOpacity }}
              >
                <div className="bg-muted-foreground/60 rounded-full p-3">
                  <Undo2 className="w-8 h-8 text-white" />
                </div>
              </motion.div>
            </>
          )}

          {/* Glass overlay decorations */}
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />

          {/* Top section */}
          <div className="relative z-[1]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
                Exercício {index + 1}
              </span>
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-white/80" />
              </div>
            </div>
          </div>

          {/* Exercise name */}
          <div className="relative z-[1] flex-1 flex items-center">
            <h2 className="text-3xl font-bold text-white leading-tight">
              {exercise.exercise_name}
            </h2>
          </div>

          {/* Stats grid */}
          <div className="relative z-[1] grid grid-cols-3 gap-3">
            <div className="bg-white/10 rounded-2xl p-3 text-center backdrop-blur-sm">
              <p className="text-xs text-white/60 mb-0.5">Séries</p>
              <p className="text-2xl font-bold text-white">{exercise.sets}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3 text-center backdrop-blur-sm">
              <p className="text-xs text-white/60 mb-0.5">Reps</p>
              <p className="text-2xl font-bold text-white">{exercise.reps}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3 text-center backdrop-blur-sm">
              <p className="text-xs text-white/60 mb-0.5">Descanso</p>
              <p className="text-2xl font-bold text-white">{exercise.rest}s</p>
            </div>
          </div>

          {/* Swipe hint */}
          {isTop && (
            <div className="relative z-[1] mt-4 text-center">
              <p className="text-xs text-white/40">
                ← Voltar · Desliza · Concluir →
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export const ExerciseCardStack = ({
  exercises,
  onSwipeRight,
  onSwipeLeft,
  onUndo,
  currentIndex,
  canUndo,
}: ExerciseCardStackProps) => {
  const visibleExercises = exercises.slice(currentIndex, currentIndex + CARD_STACK_SIZE);
  const allDone = currentIndex >= exercises.length;

  const handleSwipeComplete = useCallback(
    (direction: "left" | "right") => {
      const exercise = exercises[currentIndex];
      if (!exercise) return;

      if (direction === "right") {
        onSwipeRight(exercise, currentIndex);
      } else {
        onSwipeLeft(exercise, currentIndex);
      }
    },
    [exercises, currentIndex, onSwipeRight, onSwipeLeft]
  );

  if (allDone) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-6 rounded-3xl bg-gradient-to-br from-[hsl(142,60%,25%)] to-[hsl(142,40%,18%)] border border-[hsl(142,50%,30%)] p-8 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-[hsl(142,60%,40%)]/20 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-[hsl(142,60%,45%)]" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Exercícios Concluídos!</h3>
        <p className="text-sm text-white/60">
          Revê os exercícios abaixo e clica em "Finalizar Treino"
        </p>
      </motion.div>
    );
  }

  return (
    <div className="px-6 space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Progresso
        </span>
        <span className="text-xs font-bold text-primary">
          {currentIndex}/{exercises.length}
        </span>
      </div>
      <div className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          animate={{ width: `${(currentIndex / exercises.length) * 100}%` }}
          transition={{ type: "spring", stiffness: 100 }}
        />
      </div>

      {/* Card Stack */}
      <div className="relative w-full" style={{ height: 340 }}>
        <AnimatePresence>
          {visibleExercises.map((exercise, i) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              index={currentIndex + i}
              stackIndex={i}
              onSwipeComplete={handleSwipeComplete}
              isTop={i === 0}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Undo button */}
      {canUndo && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onUndo}
          className="w-full py-2.5 rounded-xl bg-muted/20 border border-border/30 text-sm text-muted-foreground flex items-center justify-center gap-2 hover:bg-muted/30 transition-all"
        >
          <Undo2 className="w-4 h-4" />
          Desfazer último
        </motion.button>
      )}

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 pt-2">
        {exercises.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i < currentIndex
                ? "w-1.5 bg-[hsl(142,60%,40%)]"
                : i === currentIndex
                ? "w-6 bg-primary"
                : "w-1.5 bg-muted-foreground/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
