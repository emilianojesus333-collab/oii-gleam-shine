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
const MAX_VISIBLE = 6;

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
  const rotate = useTransform(x, [-200, 0, 200], [-12, 0, 12]);
  const rightOpacity = useTransform(x, [0, 80], [0, 1]);
  const leftOpacity = useTransform(x, [-80, 0], [1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      onSwipeRight();
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onSwipeLeft();
    }
  };

  return (
    <motion.div
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        zIndex: total - index,
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={isTop ? handleDragEnd : undefined}
      initial={{ scale: 1 - index * 0.04, y: index * 14, opacity: index > MAX_VISIBLE ? 0 : 1 }}
      animate={{
        scale: 1 - index * 0.04,
        y: index * 14,
        opacity: index > MAX_VISIBLE ? 0 : 1,
      }}
      exit={{
        x: 300,
        opacity: 0,
        rotate: 15,
        transition: { type: "spring", stiffness: 200, damping: 20 },
      }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
    >
      {/* Card body */}
      <div className="relative h-full rounded-3xl overflow-hidden bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(var(--primary)/0.85)] to-[hsl(270,60%,35%)] border border-white/10 shadow-[0_20px_60px_-10px_hsl(var(--primary)/0.5)]">
        {/* Glass overlay pattern */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl pointer-events-none" />

        {/* Swipe indicators (only on top card) */}
        {isTop && (
          <>
            <motion.div
              style={{ opacity: rightOpacity }}
              className="absolute top-6 right-6 z-10 flex items-center gap-1.5 bg-[hsl(142,60%,40%)]/90 rounded-xl px-3 py-1.5"
            >
              <Check className="w-4 h-4 text-white" />
              <span className="text-xs font-bold text-white">FEITO</span>
            </motion.div>
            <motion.div
              style={{ opacity: leftOpacity }}
              className="absolute top-6 left-6 z-10 flex items-center gap-1.5 bg-destructive/90 rounded-xl px-3 py-1.5"
            >
              <RotateCcw className="w-4 h-4 text-white" />
              <span className="text-xs font-bold text-white">DESFAZER</span>
            </motion.div>
          </>
        )}

        {/* Content */}
        <div className="relative z-[1] h-full flex flex-col justify-between p-6">
          {/* Top meta */}
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/50 font-medium">Séries</p>
                <p className="text-xl font-bold text-white">{exercise.sets}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/50 font-medium">Reps</p>
                <p className="text-xl font-bold text-white">{exercise.reps}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/50 font-medium">Descanso</p>
                <p className="text-xl font-bold text-white">{exercise.rest}s</p>
              </div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
              <Dumbbell className="w-7 h-7 text-white/80" />
            </div>
          </div>

          {/* Exercise name */}
          <div>
            <h2 className="text-3xl font-black text-white leading-tight tracking-tight">
              {exercise.exercise_name}
            </h2>
            <p className="text-sm text-white/60 mt-2 line-clamp-2">
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
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className="absolute inset-0"
  >
    <div className="relative h-full rounded-3xl overflow-hidden bg-gradient-to-br from-[hsl(142,50%,25%)] to-[hsl(142,40%,18%)] border border-[hsl(142,50%,30%)]/30 shadow-[0_20px_60px_-10px_hsl(142,60%,30%,0.4)] flex flex-col items-center justify-center p-8 text-center gap-5">
      <div className="w-20 h-20 rounded-full bg-[hsl(142,60%,40%)]/20 flex items-center justify-center">
        <Trophy className="w-10 h-10 text-[hsl(142,60%,50%)]" />
      </div>
      <div>
        <h2 className="text-2xl font-black text-white mb-1">Treino Completo!</h2>
        <p className="text-sm text-white/60">{completedCount} exercícios concluídos</p>
      </div>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onFinish}
        disabled={isCompleting}
        className="w-full py-4 rounded-2xl bg-[hsl(142,60%,40%)] text-white font-bold text-base shadow-lg shadow-[hsl(142,60%,40%)]/30 disabled:opacity-50 flex items-center justify-center gap-2"
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
            remaining.slice(0, MAX_VISIBLE + 1).map((ex, stackIdx) => (
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
                ? "w-1.5 bg-[hsl(142,60%,40%)]"
                : i === currentIndex
                  ? "w-6 bg-primary"
                  : "w-1.5 bg-muted-foreground/20"
            }`}
          />
        ))}
      </div>

      {/* Subtle list link */}
      {!allDone && (
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex items-center gap-1.5 mx-auto text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              <List className="w-3.5 h-3.5" />
              Mostrar exercícios ({exercises.length})
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-card border-border rounded-t-3xl max-h-[60vh]">
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
                    ex.completed ? "text-[hsl(142,60%,40%)]" : i === currentIndex ? "text-primary" : "text-muted-foreground/40"
                  }`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${ex.completed ? "text-[hsl(142,50%,70%)] line-through" : "text-foreground"}`}>
                      {ex.exercise_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ex.sets}×{ex.reps} · {ex.rest}s
                    </p>
                  </div>
                  {ex.completed && <Check className="w-4 h-4 text-[hsl(142,60%,40%)]" />}
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};
