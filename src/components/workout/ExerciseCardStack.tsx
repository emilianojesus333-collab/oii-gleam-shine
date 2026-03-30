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

  const handleDragEnd = (_: unknown, info: PanInfo) => {
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
      <div
        className="relative h-full rounded-2xl overflow-hidden border border-white/[0.05]"
        style={{
          backgroundColor: '#1A1A2E',
          boxShadow: isTop
            ? '0 10px 28px -6px rgba(0,0,0,0.4), 0 0 20px -4px rgba(124,58,237,0.08)'
            : '0 6px 18px -6px rgba(0,0,0,0.3)',
        }}
      >
        {/* Very subtle top-left lighting — barely visible */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />

        {/* Swipe indicators */}
        {isTop && (
          <>
            <motion.div
              style={{ opacity: rightOpacity }}
              className="absolute top-5 right-5 z-10 flex items-center gap-1.5 bg-[#22C55E]/90 rounded-lg px-3 py-1.5"
            >
              <Check className="w-4 h-4 text-white" />
              <span className="text-xs font-bold text-white tracking-wide">FEITO</span>
            </motion.div>
            <motion.div
              style={{ opacity: leftOpacity }}
              className="absolute top-5 left-5 z-10 flex items-center gap-1.5 bg-red-500/90 rounded-lg px-3 py-1.5"
            >
              <RotateCcw className="w-4 h-4 text-white" />
              <span className="text-xs font-bold text-white tracking-wide">DESFAZER</span>
            </motion.div>
          </>
        )}

        {/* Content */}
        <div className="relative z-[1] h-full flex flex-col justify-between p-5">
          {/* Top meta */}
          <div className="flex items-center justify-between">
            <div className="flex gap-5">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-medium">Séries</p>
                <p className="text-xl font-bold text-[#E5E7EB]">{exercise.sets}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-medium">Reps</p>
                <p className="text-xl font-bold text-[#E5E7EB]">{exercise.reps}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-medium">Descanso</p>
                <p className="text-xl font-bold text-[#E5E7EB]">{exercise.rest}s</p>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-[#7C3AED]" />
            </div>
          </div>

          {/* Exercise name */}
          <div>
            <h2 className="text-2xl font-black text-[#E5E7EB] leading-tight tracking-tight">
              {exercise.exercise_name}
            </h2>
            <p className="text-sm text-[#9CA3AF] mt-1.5 line-clamp-2">
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
    <div
      className="relative h-full rounded-2xl overflow-hidden border border-white/[0.05] flex flex-col items-center justify-center p-8 text-center gap-5"
      style={{
        backgroundColor: '#1A1A2E',
        boxShadow: '0 10px 28px -6px rgba(0,0,0,0.4)',
      }}
    >
      <div className="w-16 h-16 rounded-full bg-[#7C3AED]/12 flex items-center justify-center">
        <Trophy className="w-8 h-8 text-[#7C3AED]" />
      </div>
      <div>
        <h2 className="text-2xl font-black text-[#E5E7EB] mb-1">Treino Completo!</h2>
        <p className="text-sm text-[#9CA3AF]">{completedCount} exercícios concluídos</p>
      </div>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onFinish}
        disabled={isCompleting}
        className="w-full py-3.5 rounded-xl bg-[#7C3AED] text-white font-bold text-base disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ boxShadow: '0 4px 14px -3px rgba(124,58,237,0.3)' }}
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
                ? "w-1.5 bg-[#7C3AED]"
                : i === currentIndex
                  ? "w-6 bg-[#7C3AED]"
                  : "w-1.5 bg-white/10"
            }`}
          />
        ))}
      </div>

      {/* Exercise list link */}
      {!allDone && (
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex items-center gap-1.5 mx-auto text-xs text-[#9CA3AF]/50 hover:text-[#9CA3AF] transition-colors">
              <List className="w-3.5 h-3.5" />
              Mostrar exercícios ({exercises.length})
            </button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="rounded-t-2xl max-h-[60vh] border-white/[0.05]"
            style={{ backgroundColor: '#1A1A2E' }}
          >
            <SheetHeader>
              <SheetTitle className="text-[#E5E7EB]">Exercícios do Plano</SheetTitle>
            </SheetHeader>
            <div className="space-y-2 mt-4 overflow-y-auto">
              {exercises.map((ex, i) => (
                <div
                  key={ex.id}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                    ex.completed
                      ? "bg-[#22C55E]/8 border border-[#22C55E]/15"
                      : i === currentIndex
                        ? "bg-[#7C3AED]/8 border border-[#7C3AED]/15"
                        : "bg-white/[0.02]"
                  }`}
                >
                  <span className={`text-sm font-mono font-bold ${
                    ex.completed ? "text-[#22C55E]" : i === currentIndex ? "text-[#7C3AED]" : "text-[#9CA3AF]/40"
                  }`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${ex.completed ? "text-[#22C55E]/70 line-through" : "text-[#E5E7EB]"}`}>
                      {ex.exercise_name}
                    </p>
                    <p className="text-xs text-[#9CA3AF]">
                      {ex.sets}×{ex.reps} · {ex.rest}s
                    </p>
                  </div>
                  {ex.completed && <Check className="w-4 h-4 text-[#22C55E]" />}
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};
