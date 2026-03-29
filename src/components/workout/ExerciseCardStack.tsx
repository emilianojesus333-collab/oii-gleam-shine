import { useState, useCallback } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence, PanInfo } from "framer-motion";
import { Dumbbell, Check, RotateCcw, ChevronRight, Trophy, List } from "lucide-react";
import type { PlannedExercise } from "@/hooks/useActiveSession";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface ExerciseCardStackProps {
  exercises: PlannedExercise[];
  currentIndex: number;
  completedCount: number;
  onSwipeRight: (exercise: PlannedExercise, index: number) => void;
  onSwipeLeft: (exercise: PlannedExercise, index: number) => void;
  onFinish: () => void;
  isCompleting: boolean;
}

const SWIPE_THRESHOLD = 100;
const MAX_VISIBLE = 4;

// Horizontal offset pattern: 0, +12, -12, +20
const getStackTransform = (index: number) => {
  const offsets = [0, 12, -12, 20];
  const scales = [1, 0.96, 0.92, 0.88];
  return {
    x: offsets[index] ?? (index % 2 === 0 ? 20 : -20),
    scale: scales[index] ?? Math.max(0.84, 1 - index * 0.04),
  };
};

const SwipeableCard = ({
  exercise,
  index,
  total,
  onSwipeRight,
  onSwipeLeft,
  isTop,
}: {
  exercise: PlannedExercise;
  index: number;
  total: number;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  isTop: boolean;
}) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-5, 0, 5]);
  const rightOpacity = useTransform(x, [0, 80], [0, 1]);
  const leftOpacity = useTransform(x, [-80, 0], [1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      onSwipeRight();
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onSwipeLeft();
    }
  };

  const { x: offsetX, scale } = getStackTransform(index);

  return (
    <motion.div
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        zIndex: total - index,
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={isTop ? handleDragEnd : undefined}
      initial={{ x: offsetX, scale, opacity: index >= MAX_VISIBLE ? 0 : 1 }}
      animate={{
        x: isTop ? 0 : offsetX,
        scale,
        opacity: index >= MAX_VISIBLE ? 0 : 1,
      }}
      exit={{
        x: 300,
        opacity: 0,
        rotate: 8,
        transition: { type: "spring", stiffness: 200, damping: 22 },
      }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
    >
      <div className="relative h-full rounded-2xl overflow-hidden bg-[#1E293B] border border-white/[0.06] shadow-[0_8px_24px_-6px_rgba(0,0,0,0.35)]">
        {/* Very subtle internal gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent pointer-events-none" />

        {/* Swipe indicators */}
        {isTop && (
          <>
            <motion.div
              style={{ opacity: rightOpacity }}
              className="absolute top-5 right-5 z-10 flex items-center gap-1.5 bg-[#22C55E]/90 rounded-lg px-3 py-1.5"
            >
              <Check className="w-4 h-4 text-primary-foreground" />
              <span className="text-xs font-bold text-primary-foreground tracking-wide">FEITO</span>
            </motion.div>
            <motion.div
              style={{ opacity: leftOpacity }}
              className="absolute top-5 left-5 z-10 flex items-center gap-1.5 bg-destructive rounded-lg px-3 py-1.5"
            >
              <RotateCcw className="w-4 h-4 text-destructive-foreground" />
              <span className="text-xs font-bold text-destructive-foreground tracking-wide">DESFAZER</span>
            </motion.div>
          </>
        )}

        {/* Content */}
        <div className="relative z-[1] h-full flex flex-col justify-between p-5">
          {/* Top meta */}
          <div className="flex items-center justify-between">
            <div className="flex gap-5">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Séries</p>
                <p className="text-xl font-bold text-foreground">{exercise.sets}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Reps</p>
                <p className="text-xl font-bold text-foreground">{exercise.reps}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Descanso</p>
                <p className="text-xl font-bold text-foreground">{exercise.rest}s</p>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-[#3B82F6]" />
            </div>
          </div>

          {/* Exercise name */}
          <div>
            <h2 className="text-2xl font-black text-foreground leading-tight tracking-tight">
              {exercise.exercise_name}
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
              {exercise.source === "ai"
                ? "Gerado pela Victoria AI · Controla a fase excêntrica"
                : "Exercício personalizado"}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const FinishCard = ({
  completedCount,
  onFinish,
  isCompleting,
}: {
  completedCount: number;
  onFinish: () => void;
  isCompleting: boolean;
}) => (
  <motion.div
    initial={{ scale: 0.95, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className="absolute inset-0"
  >
    <div className="relative h-full rounded-2xl overflow-hidden bg-[#1E293B] border border-white/[0.06] shadow-[0_8px_24px_-6px_rgba(0,0,0,0.35)] flex flex-col items-center justify-center p-8 text-center gap-5">
      <div className="w-16 h-16 rounded-full bg-[#3B82F6]/15 flex items-center justify-center">
        <Trophy className="w-8 h-8 text-[#3B82F6]" />
      </div>
      <div>
        <h2 className="text-2xl font-black text-foreground mb-1">Treino Completo!</h2>
        <p className="text-sm text-muted-foreground">{completedCount} exercícios concluídos</p>
      </div>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onFinish}
        disabled={isCompleting}
        className="w-full py-3.5 rounded-xl bg-[#3B82F6] text-white font-bold text-base shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isCompleting ? "A concluir..." : "Finalizar Treino"}
        {!isCompleting && <ChevronRight className="w-5 h-5" />}
      </motion.button>
    </div>
  </motion.div>
);

export const ExerciseCardStack = ({
  exercises,
  currentIndex,
  completedCount,
  onSwipeRight,
  onSwipeLeft,
  onFinish,
  isCompleting,
}: ExerciseCardStackProps) => {
  const remaining = exercises.filter((_, i) => i >= currentIndex);
  const allDone = currentIndex >= exercises.length;

  return (
    <div className="px-6 space-y-3">
      {/* Card stack area */}
      <div className="relative w-full" style={{ height: 280 }}>
        <AnimatePresence>
          {allDone ? (
            <FinishCard
              key="finish"
              completedCount={completedCount}
              onFinish={onFinish}
              isCompleting={isCompleting}
            />
          ) : (
            remaining.slice(0, MAX_VISIBLE).map((ex, stackIdx) => (
              <SwipeableCard
                key={ex.id}
                exercise={ex}
                index={stackIdx}
                total={remaining.length}
                isTop={stackIdx === 0}
                onSwipeRight={() => onSwipeRight(ex, currentIndex + stackIdx)}
                onSwipeLeft={() => onSwipeLeft(ex, currentIndex + stackIdx)}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 pt-2">
        {exercises.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i < currentIndex
                ? "w-1.5 bg-[#3B82F6]"
                : i === currentIndex
                  ? "w-6 bg-[#3B82F6]"
                  : "w-1.5 bg-muted-foreground/20"
            }`}
          />
        ))}
      </div>

      {/* Exercise list link */}
      {!allDone && (
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex items-center gap-1.5 mx-auto text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              <List className="w-3.5 h-3.5" />
              Mostrar exercícios ({exercises.length})
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-[#1E293B] border-white/[0.06] rounded-t-2xl max-h-[60vh]">
            <SheetHeader>
              <SheetTitle className="text-foreground">Exercícios do Plano</SheetTitle>
            </SheetHeader>
            <div className="space-y-2 mt-4 overflow-y-auto">
              {exercises.map((ex, i) => (
                <div
                  key={ex.id}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                    ex.completed
                      ? "bg-[hsl(142,40%,15%)] border border-[hsl(142,50%,25%)]"
                      : i === currentIndex
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-muted/20"
                  }`}
                >
                  <span className={`text-sm font-mono font-bold ${
                    ex.completed ? "text-[hsl(142,50%,40%)]" : i === currentIndex ? "text-primary" : "text-muted-foreground/40"
                  }`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${ex.completed ? "text-[hsl(142,50%,60%)] line-through" : "text-foreground"}`}>
                      {ex.exercise_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ex.sets}×{ex.reps} · {ex.rest}s
                    </p>
                  </div>
                  {ex.completed && <Check className="w-4 h-4 text-[hsl(142,50%,40%)]" />}
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};
