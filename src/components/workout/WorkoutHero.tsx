import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";

interface WorkoutHeroProps {
  muscleGroups: string[];
  dayOfWeek: string;
  isRestDay: boolean;
  exerciseCount: number;
  estimatedDuration?: number;
  difficulty?: string;
}

const muscleGradients: Record<string, string> = {
  peito: "from-[hsl(198,80%,20%)] via-[hsl(210,60%,12%)]",
  costas: "from-[hsl(160,60%,18%)] via-[hsl(170,40%,10%)]",
  pernas: "from-[hsl(270,50%,20%)] via-[hsl(260,40%,12%)]",
  ombros: "from-[hsl(30,70%,20%)] via-[hsl(25,50%,12%)]",
  braços: "from-[hsl(340,50%,20%)] via-[hsl(330,40%,12%)]",
  bíceps: "from-[hsl(340,50%,20%)] via-[hsl(330,40%,12%)]",
  tríceps: "from-[hsl(220,60%,20%)] via-[hsl(215,50%,12%)]",
};

function getGradient(groups: string[]): string {
  const key = groups[0]?.toLowerCase() || "";
  for (const [muscle, grad] of Object.entries(muscleGradients)) {
    if (key.includes(muscle)) return grad;
  }
  return "from-[hsl(198,80%,20%)] via-[hsl(210,60%,12%)]";
}

export const WorkoutHero = ({
  muscleGroups,
  dayOfWeek,
  isRestDay,
  exerciseCount,
  estimatedDuration = 45,
  difficulty = "Intermédio",
}: WorkoutHeroProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const gradient = getGradient(muscleGroups);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative bg-gradient-to-b ${gradient} to-background px-6 pt-14 pb-10`}
    >
      {/* History button */}
      <button
        type="button"
        onClick={() => navigate("/history")}
        className="absolute top-14 right-6 flex h-10 w-10 items-center justify-center rounded-2xl border border-border/30 bg-background/20 backdrop-blur-sm text-muted-foreground transition-colors hover:bg-accent/30"
        aria-label="Histórico"
      >
        <Clock className="h-4 w-4" />
      </button>

      {/* Day label */}
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-2"
      >
        {dayOfWeek}
      </motion.p>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-3xl font-bold text-foreground leading-tight"
      >
        {isRestDay ? (
          t("workout.restDay")
        ) : (
          <>
            {muscleGroups.map((g, i) => (
              <span key={g}>
                {i > 0 && <span className="text-muted-foreground"> + </span>}
                {i === 0 ? (
                  <span className="text-foreground">{g}</span>
                ) : (
                  <span className="text-primary">{g}</span>
                )}
              </span>
            ))}
          </>
        )}
      </motion.h1>

      {/* Badges */}
      {!isRestDay && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex gap-2 mt-5"
        >
          <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary/15 text-primary border border-primary/20">
            {estimatedDuration} min
          </span>
          <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-accent/50 text-accent-foreground border border-border/20">
            {difficulty}
          </span>
          <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted/50 text-muted-foreground border border-border/20">
            {exerciseCount} exercícios
          </span>
        </motion.div>
      )}
    </motion.div>
  );
};
