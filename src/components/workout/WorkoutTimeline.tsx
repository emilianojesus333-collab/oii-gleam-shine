import { motion } from "framer-motion";
import { useMuscleFatigue, getMuscleLabel } from "@/hooks/useMuscleFatigue";


interface WorkoutTimelineProps {
  todayMuscleGroups: string[];
}

const statusConfig = {
  recovered: { color: "hsl(142,60%,45%)", label: "Recuperado", borderColor: "hsl(142,40%,20%)" },
  almost_recovered: { color: "hsl(45,90%,50%)", label: "Quase recuperado", borderColor: "hsl(45,50%,20%)" },
  recovering: { color: "hsl(270,60%,55%)", label: "Em recuperação", borderColor: "hsl(270,30%,20%)" },
  fatigued: { color: "hsl(0,70%,55%)", label: "Fatigado", borderColor: "hsl(0,40%,20%)" },
};

export const WorkoutTimeline = ({ todayMuscleGroups }: WorkoutTimelineProps) => {
  const { muscles } = useMuscleFatigue();

  // Map today's muscle groups to fatigue data
  const muscleGroupMap: Record<string, string> = {
    "Peito": "peito", "Costas": "costas", "Pernas": "pernas",
    "Ombros": "ombros", "Braços": "braços", "Bíceps": "braços",
    "Tríceps": "braços",
  };

  const relevantMuscles = todayMuscleGroups
    .map((g) => {
      const key = muscleGroupMap[g] || g.toLowerCase();
      return muscles.find((m) => m.muscle_group === key);
    })
    .filter(Boolean);

  const mainMuscle = relevantMuscles[0];
  const config = mainMuscle ? statusConfig[mainMuscle.status] : statusConfig.recovered;

  const goalText = "Mantém a consistência esta semana";

  const hoursAgo = mainMuscle?.last_trained_at
    ? Math.round((Date.now() - new Date(mainMuscle.last_trained_at).getTime()) / (1000 * 60 * 60))
    : null;

  const fatigueSubtext = mainMuscle
    ? `Fadiga: ${mainMuscle.current_fatigue}%${hoursAgo ? ` · Última vez: há ${hoursAgo > 48 ? Math.round(hoursAgo / 24) + " dias" : hoursAgo + "h"}` : ""}`
    : "Sem dados de fadiga";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      style={{ background: "#1A1A1A", borderRadius: 0, border: "none", borderBottom: "1px solid #2A2A2A", padding: "20px 16px", width: "100%", margin: 0 }}
    >
      {/* Label */}
      <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3">
        Hoje
      </p>

      {/* Timeline container */}
      <div className="relative pl-8">
        {/* Vertical line */}
        <div className="absolute left-3 top-3 bottom-3 w-px bg-border/40" />

        {/* Node 1: Fatigue */}
        <div className="relative mb-5">
          <div
            className="absolute -left-5 top-3 w-3 h-3 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          <div
            className="rounded-2xl p-4 border"
            style={{
              backgroundColor: `${config.borderColor}33`,
              borderColor: `${config.borderColor}66`,
            }}
          >
            <p className="text-sm font-semibold" style={{ color: config.color }}>
              {mainMuscle ? `${getMuscleLabel(mainMuscle.muscle_group)} ${config.label.toLowerCase()}` : "Pronto para treinar"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{fatigueSubtext}</p>
          </div>
        </div>

        {/* Node 2: Goal */}
        <div className="relative">
          <div
            className="absolute -left-5 top-3 w-3 h-3 rounded-full"
            style={{ backgroundColor: "hsl(45,90%,50%)" }}
          />
          <div
            className="rounded-2xl p-4 border"
            style={{
              backgroundColor: "hsl(45,50%,20%,0.2)",
              borderColor: "hsl(45,50%,20%,0.4)",
            }}
          >
            <p className="text-sm font-semibold" style={{ color: "hsl(45,90%,50%)" }}>
              Meta do dia
            </p>
            <p className="text-xs text-muted-foreground mt-1">{goalText}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
