import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ExercisePR {
  name: string;
  maxWeight: number;
  previousMax: number | null;
  lastDate: string | null;
}

interface WorkoutStatStripProps {
  todayMuscleGroups: string[];
  todayExerciseNames?: string[];
}

const normalizeExerciseName = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const namesMatch = (left: string, right: string) => {
  const a = normalizeExerciseName(left);
  const b = normalizeExerciseName(right);

  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;

  const aTokens = a.split(" ").filter((token) => token.length > 2);
  const bTokens = b.split(" ").filter((token) => token.length > 2);
  const sharedTokens = aTokens.filter((token) => bTokens.includes(token));

  return sharedTokens.length >= Math.min(2, aTokens.length, bTokens.length);
};

export const WorkoutStatStrip = ({ todayMuscleGroups, todayExerciseNames = [] }: WorkoutStatStripProps) => {
  const { user } = useAuth();
  const [exercisePRs, setExercisePRs] = useState<ExercisePR[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !todayExerciseNames.length) return;

    const fetchPRs = async () => {
      try {
        const { data: sets, error } = await supabase
          .from("workout_sets")
          .select("weight, created_at, exercise_id, exercises(name)")
          .eq("user_id", user.id)
          .eq("set_type", "working")
          .gt("weight", 0)
          .order("weight", { ascending: false });

        if (error) throw error;

        const { data: ormRecords } = await supabase
          .from("one_rm_records")
          .select("*")
          .order("weight_used", { ascending: false });

        const prs: ExercisePR[] = todayExerciseNames.map((exerciseName) => {
          const exerciseSets = (sets || []).filter(
            (set: any) => set.exercises?.name && namesMatch(set.exercises.name, exerciseName)
          );

          if (exerciseSets.length > 0) {
            const uniqueWeightsDesc = [...new Set(exerciseSets.map((set: any) => Number(set.weight)))]
              .sort((a, b) => b - a);

            const maxWeight = uniqueWeightsDesc[0] ?? 0;
            const previousMax = uniqueWeightsDesc[1] ?? null;
            const latestTopSet = exerciseSets.find((set: any) => Number(set.weight) === maxWeight);

            return {
              name: exerciseName,
              maxWeight,
              previousMax,
              lastDate: latestTopSet?.created_at ?? null,
            };
          }

          const ormMatch = (ormRecords || []).find((record) =>
            namesMatch(record.exercise_name, exerciseName)
          );

          if (ormMatch) {
            return {
              name: exerciseName,
              maxWeight: Number(ormMatch.weight_used),
              previousMax: null,
              lastDate: ormMatch.created_at,
            };
          }

          return { name: exerciseName, maxWeight: 0, previousMax: null, lastDate: null };
        });

        setExercisePRs(prs);
      } catch (e) {
        console.error("Error fetching exercise PRs:", e);
      }
    };

    fetchPRs();
  }, [user, todayExerciseNames.join(",")]);

  if (!todayExerciseNames.length) return null;

  const displayPRs = exercisePRs.length > 0
    ? exercisePRs
    : todayExerciseNames.map((name) => ({ name, maxWeight: 0, previousMax: null, lastDate: null }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="pl-6"
    >
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Recordes Pessoais
      </p>

      <div
        ref={scrollRef}
        className="scrollbar-hide flex gap-3 overflow-x-auto pb-2 pr-6"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {displayPRs.map((pr, i) => {
          const diff = pr.previousMax != null ? pr.maxWeight - pr.previousMax : null;
          const hasPR = pr.maxWeight > 0;
          const formattedDate = pr.lastDate
            ? new Date(pr.lastDate).toLocaleDateString("pt-PT", { day: "numeric", month: "short" })
            : null;

          return (
            <motion.div
              key={`${pr.name}-${i}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.08 }}
              className="w-[160px] flex-shrink-0 space-y-3 rounded-2xl border border-border/30 bg-card p-4"
              style={{ scrollSnapAlign: "start" }}
            >
              <p className="truncate text-[11px] font-medium leading-tight text-muted-foreground">
                {pr.name}
              </p>

              <div className="flex items-baseline gap-1.5">
                <Trophy className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                <span className="text-2xl font-black leading-none text-foreground font-mono">
                  {hasPR ? pr.maxWeight : "—"}
                </span>
                {hasPR && <span className="text-xs font-medium text-muted-foreground">kg</span>}
              </div>

              <div className="flex items-center justify-between gap-2">
                {diff != null && diff !== 0 ? (
                  <div className={`flex items-center gap-1 ${diff > 0 ? "text-primary" : "text-destructive"}`}>
                    {diff > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    <span className="text-[10px] font-bold">
                      {diff > 0 ? "+" : ""}{diff}kg
                    </span>
                  </div>
                ) : hasPR ? (
                  <div className="flex items-center gap-1 text-muted-foreground/60">
                    <Minus className="h-3 w-3" />
                    <span className="text-[10px]">1º registo</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-muted-foreground/40">Sem dados</span>
                )}

                {formattedDate && (
                  <span className="text-[9px] text-muted-foreground/40">{formattedDate}</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
