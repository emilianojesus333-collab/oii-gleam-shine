import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";
import type { PlannedExercise } from "@/hooks/useActiveSession";

interface ExerciseExecutionCarouselProps {
  exercises: PlannedExercise[];
  completedCount: number;
  totalCount: number;
  isFinishing?: boolean;
  onCompleteExercise: (exercise: PlannedExercise) => Promise<void> | void;
}

type MuscleZone = "chest" | "back" | "legs" | "shoulders" | "arms" | "core" | "full";

const token = (name: string) => `hsl(var(${name}))`;

const inferMuscleZone = (exerciseName: string): MuscleZone => {
  const normalized = exerciseName.toLowerCase();

  if (/supino|crucifixo|crossover|peck|chest|flex(ão|ao)|press/.test(normalized)) return "chest";
  if (/remada|puxada|barra fixa|pull|pulldown|terra|deadlift/.test(normalized)) return "back";
  if (/agach|leg press|extensora|flexora|afundo|stiff|panturr|lunge|bulgar/.test(normalized)) return "legs";
  if (/desenvolvimento|elevação lateral|elevacao lateral|arnold|face pull|ombro|shrug/.test(normalized)) return "shoulders";
  if (/rosca|tríceps|triceps|martelo|francês|frances|kickback|bíceps|biceps|paralelas/.test(normalized)) return "arms";
  if (/prancha|crunch|abdominal|russian twist|leg raise|core/.test(normalized)) return "core";

  return "full";
};

function ExerciseLoopIllustration({ zone }: { zone: MuscleZone }) {
  const highlightFill = token("--destructive");
  const baseStroke = token("--foreground");
  const baseFill = token("--foreground");

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-border/60 bg-muted/40 px-6 py-4">
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent"
        animate={{ opacity: [0.35, 0.65, 0.35] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.svg
        viewBox="0 0 200 240"
        className="relative mx-auto h-56 w-full max-w-[220px]"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <circle cx="100" cy="34" r="18" stroke={baseStroke} strokeWidth="4" fill="transparent" />
        <rect x="78" y="56" width="44" height="72" rx="22" stroke={baseStroke} strokeWidth="4" fill="transparent" />
        <rect x="84" y="128" width="32" height="24" rx="14" stroke={baseStroke} strokeWidth="4" fill="transparent" />
        <path d="M78 72 L54 116 L58 170" stroke={baseStroke} strokeWidth="14" strokeLinecap="round" fill="none" opacity="0.9" />
        <path d="M122 72 L146 116 L142 170" stroke={baseStroke} strokeWidth="14" strokeLinecap="round" fill="none" opacity="0.9" />
        <path d="M92 152 L82 214" stroke={baseStroke} strokeWidth="18" strokeLinecap="round" fill="none" opacity="0.9" />
        <path d="M108 152 L118 214" stroke={baseStroke} strokeWidth="18" strokeLinecap="round" fill="none" opacity="0.9" />

        {(zone === "chest" || zone === "full") && (
          <motion.rect
            x="80"
            y="72"
            width="40"
            height="22"
            rx="11"
            fill={highlightFill}
            animate={{ opacity: [0.45, 1, 0.45], scale: [0.98, 1.02, 0.98] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "100px 83px" }}
          />
        )}

        {(zone === "back" || zone === "full") && (
          <motion.rect
            x="82"
            y="82"
            width="36"
            height="38"
            rx="14"
            fill={highlightFill}
            animate={{ opacity: [0.4, 0.95, 0.4] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {(zone === "shoulders" || zone === "full") && (
          <>
            <motion.circle
              cx="76"
              cy="76"
              r="12"
              fill={highlightFill}
              animate={{ opacity: [0.45, 1, 0.45] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.circle
              cx="124"
              cy="76"
              r="12"
              fill={highlightFill}
              animate={{ opacity: [0.45, 1, 0.45] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.12 }}
            />
          </>
        )}

        {(zone === "arms" || zone === "full") && (
          <>
            <motion.path
              d="M78 72 L54 116 L58 170"
              stroke={highlightFill}
              strokeWidth="14"
              strokeLinecap="round"
              fill="none"
              animate={{ opacity: [0.45, 1, 0.45] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.path
              d="M122 72 L146 116 L142 170"
              stroke={highlightFill}
              strokeWidth="14"
              strokeLinecap="round"
              fill="none"
              animate={{ opacity: [0.45, 1, 0.45] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.12 }}
            />
          </>
        )}

        {(zone === "legs" || zone === "full") && (
          <>
            <motion.path
              d="M92 152 L82 214"
              stroke={highlightFill}
              strokeWidth="18"
              strokeLinecap="round"
              fill="none"
              animate={{ opacity: [0.45, 1, 0.45] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.path
              d="M108 152 L118 214"
              stroke={highlightFill}
              strokeWidth="18"
              strokeLinecap="round"
              fill="none"
              animate={{ opacity: [0.45, 1, 0.45] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 0.12 }}
            />
          </>
        )}

        {zone === "core" && (
          <motion.rect
            x="86"
            y="84"
            width="28"
            height="44"
            rx="12"
            fill={highlightFill}
            animate={{ opacity: [0.45, 1, 0.45], scale: [0.98, 1.02, 0.98] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "100px 106px" }}
          />
        )}

        <motion.rect
          x="68"
          y="218"
          width="64"
          height="6"
          rx="3"
          fill={baseFill}
          animate={{ opacity: [0.12, 0.28, 0.12] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.svg>
    </div>
  );
}

export function ExerciseExecutionCarousel({
  exercises,
  completedCount,
  totalCount,
  isFinishing = false,
  onCompleteExercise,
}: ExerciseExecutionCarouselProps) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const completedIds = useMemo(
    () => new Set(exercises.filter((exercise) => exercise.completed).map((exercise) => exercise.id)),
    [exercises]
  );

  const remainingExercises = useMemo(
    () => exercises.filter((exercise) => !exercise.completed && !dismissedIds.includes(exercise.id)),
    [dismissedIds, exercises]
  );

  const optimisticCompleted = dismissedIds.filter((id) => !completedIds.has(id)).length;
  const uiCompletedCount = Math.min(totalCount, completedCount + optimisticCompleted);

  useEffect(() => {
    if (remainingExercises.length === 0) return;
    const firstId = remainingExercises[0].id;
    cardRefs.current[firstId]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [remainingExercises.length]);

  const handleComplete = async (exercise: PlannedExercise) => {
    if (processingId || isFinishing) return;

    setProcessingId(exercise.id);
    setDismissedIds((prev) => [...prev, exercise.id]);

    window.setTimeout(async () => {
      try {
        await onCompleteExercise(exercise);
      } finally {
        setProcessingId(null);
      }
    }, 280);
  };

  if (totalCount === 0) {
    return null;
  }

  if (remainingExercises.length === 0) {
    return (
      <div className="px-5 py-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">Todos os exercícios concluídos</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {isFinishing ? "A fechar o treino e sincronizar a sessão..." : "Treino pronto para finalizar."}
        </p>
      </div>
    );
  }

  return (
    <div className="py-5">
      <div className="flex items-start justify-between gap-3 px-5 pb-4">
        <div>
          <p className="text-sm font-medium text-foreground">Execução livre do treino</p>
          <p className="text-xs text-muted-foreground">Desliza e conclui os exercícios na ordem que quiseres.</p>
        </div>
        <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {uiCompletedCount} / {totalCount}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-5 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {remainingExercises.map((exercise, index) => (
          <button
            key={exercise.id}
            type="button"
            onClick={() => cardRefs.current[exercise.id]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              index === 0
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-muted/40 text-muted-foreground"
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <div className="flex gap-4 overflow-x-auto px-5 pb-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <AnimatePresence initial={false}>
          {remainingExercises.map((exercise, index) => {
            const zone = inferMuscleZone(exercise.exercise_name);

            return (
              <motion.div
                key={exercise.id}
                ref={(element) => {
                  cardRefs.current[exercise.id] = element;
                }}
                layout
                initial={{ opacity: 0, x: 36, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -72, scale: 0.92 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="w-[84%] shrink-0 snap-center rounded-[28px] border border-border bg-card p-4 text-card-foreground shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Exercício</p>
                    <h3 className="mt-1 text-xl font-semibold leading-tight text-card-foreground">
                      {exercise.exercise_name}
                    </h3>
                  </div>

                  {index === 0 && (
                    <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                      <Sparkles className="h-3 w-3" />
                      Recomendado
                    </div>
                  )}
                </div>

                <ExerciseLoopIllustration zone={zone} />

                <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-muted/40 p-3 text-center">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Séries</p>
                    <p className="mt-1 text-base font-semibold text-card-foreground">{exercise.sets}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Reps</p>
                    <p className="mt-1 text-base font-semibold text-card-foreground">{exercise.reps}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Descanso</p>
                    <p className="mt-1 text-base font-semibold text-card-foreground">{exercise.rest}s</p>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => handleComplete(exercise)}
                  disabled={isFinishing || processingId === exercise.id}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4 text-sm font-semibold text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {processingId === exercise.id ? "A concluir..." : "Concluir"}
                </motion.button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
