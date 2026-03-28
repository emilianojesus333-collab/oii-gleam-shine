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

export const WorkoutStatStrip = ({ todayMuscleGroups, todayExerciseNames = [] }: WorkoutStatStripProps) => {
  const { user } = useAuth();
  const [exercisePRs, setExercisePRs] = useState<ExercisePR[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !todayExerciseNames.length) return;

    const fetchPRs = async () => {
      try {
        // Get all working sets for this user with exercise names
        const { data: sets, error } = await supabase
          .from("workout_sets")
          .select("weight, created_at, exercise_id, exercises(name)")
          .eq("user_id", user.id)
          .eq("set_type", "working")
          .gt("weight", 0)
          .order("weight", { ascending: false });

        if (error) throw error;

        // Also get one_rm_records as fallback
        const { data: ormRecords } = await supabase
          .from("one_rm_records")
          .select("*")
          .order("weight_used", { ascending: false });

        const prs: ExercisePR[] = todayExerciseNames.map((exerciseName) => {
          // Filter sets for this exercise
          const exerciseSets = (sets || []).filter(
            (s: any) => s.exercises?.name?.toLowerCase() === exerciseName.toLowerCase()
          );

          if (exerciseSets.length > 0) {
            const sorted = [...exerciseSets].sort((a, b) => b.weight - a.weight);
            const maxWeight = sorted[0].weight;
            // Find previous max (second highest distinct weight)
            const previousMax = sorted.length > 1
              ? sorted.find(s => s.weight < maxWeight)?.weight ?? null
              : null;
            const lastDate = sorted[0].created_at;

            return { name: exerciseName, maxWeight, previousMax, lastDate };
          }

          // Fallback to one_rm_records
          const ormMatch = (ormRecords || []).find(
            (r) => r.exercise_name.toLowerCase() === exerciseName.toLowerCase()
          );
          if (ormMatch) {
            return {
              name: exerciseName,
              maxWeight: ormMatch.weight_used,
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
    : todayExerciseNames.map((n) => ({ name: n, maxWeight: 0, previousMax: null, lastDate: null }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="pl-6"
    >
      <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-3">
        Recordes Pessoais
      </p>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 pr-6 scrollbar-hide"
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
              key={pr.name}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.08 }}
              className="flex-shrink-0 w-[160px] rounded-2xl bg-card border border-border/30 p-4 space-y-3"
              style={{ scrollSnapAlign: "start" }}
            >
              {/* Exercise name */}
              <p className="text-[11px] font-medium text-muted-foreground truncate leading-tight">
                {pr.name}
              </p>

              {/* Max weight */}
              <div className="flex items-baseline gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="text-2xl font-black font-mono text-foreground leading-none">
                  {hasPR ? pr.maxWeight : "—"}
                </span>
                {hasPR && (
                  <span className="text-xs font-medium text-muted-foreground">kg</span>
                )}
              </div>

              {/* Trend + Date */}
              <div className="flex items-center justify-between">
                {diff != null && diff !== 0 ? (
                  <div className={`flex items-center gap-1 ${diff > 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {diff > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span className="text-[10px] font-bold">
                      {diff > 0 ? "+" : ""}{diff}kg
                    </span>
                  </div>
                ) : hasPR ? (
                  <div className="flex items-center gap-1 text-muted-foreground/50">
                    <Minus className="w-3 h-3" />
                    <span className="text-[10px]">1º registo</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-muted-foreground/40">Sem dados</span>
                )}

                {formattedDate && (
                  <span className="text-[9px] text-muted-foreground/40">
                    {formattedDate}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
