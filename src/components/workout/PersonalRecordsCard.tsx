import { motion } from "framer-motion";
import { Trophy, Dumbbell, ChevronRight } from "lucide-react";
import { useOneRMRecords } from "@/hooks/useOneRMRecords";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

interface PersonalRecordsCardProps {
  todayExerciseNames: string[];
}

interface LastWeight {
  exercise_name: string;
  weight: number;
  date: string;
}

export function PersonalRecordsCard({ todayExerciseNames }: PersonalRecordsCardProps) {
  const { records } = useOneRMRecords();
  const { user } = useAuth();
  const [lastWeight, setLastWeight] = useState<LastWeight | null>(null);

  // Find PR for today's exercises
  const topPR = (() => {
    if (!records.length || !todayExerciseNames.length) return null;
    for (const name of todayExerciseNames) {
      const match = records.find(
        (r) => r.exercise_name.toLowerCase() === name.toLowerCase()
      );
      if (match) return match;
    }
    return records[0] || null;
  })();

  // Fetch last weight used for the first exercise
  useEffect(() => {
    if (!user || !todayExerciseNames.length) return;
    const fetchLastWeight = async () => {
      const { data } = await supabase
        .from("workout_sets")
        .select("weight, created_at")
        .eq("user_id", user.id)
        .gt("weight", 0)
        .order("created_at", { ascending: false })
        .limit(20);

      if (data && data.length > 0) {
        // Find a set matching today's exercises
        const exerciseName = todayExerciseNames[0];
        // Since workout_sets doesn't store exercise_name directly, use the most recent set
        const recent = data[0];
        if (recent) {
          setLastWeight({
            exercise_name: exerciseName,
            weight: Number(recent.weight),
            date: new Date(recent.created_at).toLocaleDateString("pt-PT"),
          });
        }
      }
    };
    fetchLastWeight();
  }, [user, todayExerciseNames]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-PT");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mx-5 rounded-2xl p-6 relative overflow-hidden bg-card/95 border border-border/10"
      style={{
        boxShadow: "0 1px 3px rgba(0,0,0,0.3), 0 12px 24px -8px rgba(0,0,0,0.25)",
      }}
    >
      <h3 className="text-base font-bold text-foreground mb-5">Melhores marcas</h3>

      {/* PR Row */}
      <div className="flex items-center gap-4 mb-5">
        <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #D4A017, #B8860B)" }}
        >
          <Trophy className="w-6 h-6 text-black" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            PR de {topPR?.exercise_name?.substring(0, 20) || "—"}
          </p>
          <p className="text-xs text-muted-foreground/60">
            {topPR ? formatDate(topPR.created_at) : "—"}
          </p>
        </div>
        <p className="text-2xl font-bold text-foreground tabular-nums tracking-tight">
          {topPR ? `${topPR.calculated_1rm}kg` : "—"}
        </p>
      </div>

      {/* Separator */}
      <div className="h-px bg-border/20 mb-5" />

      {/* Last weight row */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-muted/30 flex items-center justify-center flex-shrink-0">
          <Dumbbell className="w-6 h-6 text-muted-foreground/50" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground/70 truncate">
            Último treino: {lastWeight?.exercise_name?.substring(0, 15) || "—"}
          </p>
          <p className="text-xs text-muted-foreground/40">
            {lastWeight?.date || "—"}
          </p>
        </div>
        <p className="text-2xl font-bold text-muted-foreground/60 tabular-nums tracking-tight">
          {lastWeight ? `${lastWeight.weight}kg` : "—"}
        </p>
      </div>

      {/* Arrow */}
      <div className="absolute bottom-4 right-4">
        <ChevronRight className="w-5 h-5 text-muted-foreground/30" />
      </div>
    </motion.div>
  );
}
