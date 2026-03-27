import { cn } from "@/lib/utils";

interface MuscleMapSVGProps {
  activeMuscles: string[];
  view: "front" | "back";
  className?: string;
}

const musclePathsFront: Record<string, string> = {
  chest: "M 85,95 Q 100,90 115,95 L 118,115 Q 100,120 82,115 Z",
  shoulders: "M 70,85 Q 75,75 85,80 L 85,100 Q 75,98 70,90 Z M 115,80 Q 125,75 130,85 L 130,90 Q 125,98 115,100 Z",
  biceps: "M 65,100 Q 68,95 72,100 L 72,130 Q 68,135 65,130 Z M 128,100 Q 132,95 135,100 L 135,130 Q 132,135 128,130 Z",
  forearms: "M 62,132 Q 66,128 70,132 L 68,160 Q 64,162 60,158 Z M 130,132 Q 134,128 138,132 L 140,158 Q 136,162 132,160 Z",
  abs: "M 90,118 Q 100,116 110,118 L 110,165 Q 100,168 90,165 Z",
  quadriceps: "M 82,170 Q 88,165 95,170 L 93,215 Q 87,218 82,212 Z M 105,170 Q 112,165 118,170 L 118,212 Q 113,218 107,215 Z",
  calves: "M 84,225 Q 88,220 92,225 L 90,260 Q 86,262 84,258 Z M 108,225 Q 112,220 116,225 L 116,258 Q 114,262 110,260 Z",
  traps: "M 88,78 Q 100,72 112,78 L 112,90 Q 100,86 88,90 Z",
};

const musclePathsBack: Record<string, string> = {
  traps: "M 85,78 Q 100,70 115,78 L 115,95 Q 100,88 85,95 Z",
  back: "M 85,96 Q 100,90 115,96 L 118,140 Q 100,145 82,140 Z",
  shoulders: "M 70,85 Q 75,75 85,80 L 85,100 Q 75,98 70,90 Z M 115,80 Q 125,75 130,85 L 130,90 Q 125,98 115,100 Z",
  triceps: "M 65,100 Q 68,95 72,100 L 72,130 Q 68,135 65,130 Z M 128,100 Q 132,95 135,100 L 135,130 Q 132,135 128,130 Z",
  forearms: "M 62,132 Q 66,128 70,132 L 68,160 Q 64,162 60,158 Z M 130,132 Q 134,128 138,132 L 140,158 Q 136,162 132,160 Z",
  glutes: "M 85,148 Q 100,142 115,148 L 115,175 Q 100,180 85,175 Z",
  hamstrings: "M 82,178 Q 88,173 95,178 L 93,220 Q 87,224 82,218 Z M 105,178 Q 112,173 118,178 L 118,218 Q 113,224 107,220 Z",
  calves: "M 84,225 Q 88,220 92,225 L 90,260 Q 86,262 84,258 Z M 108,225 Q 112,220 116,225 L 116,258 Q 114,262 110,260 Z",
};

// Body outline (simplified)
const bodyOutlineFront = "M 100,20 Q 110,20 112,30 Q 115,25 118,30 Q 118,40 112,45 Q 108,48 100,48 Q 92,48 88,45 Q 82,40 82,30 Q 85,25 88,30 Q 90,20 100,20 Z M 85,50 Q 70,55 65,75 Q 60,85 58,100 L 55,140 Q 52,155 50,165 L 58,168 Q 62,155 65,140 L 72,100 Q 75,90 80,82 L 82,170 Q 80,200 78,230 L 82,265 L 94,265 L 96,230 Q 98,200 100,185 Q 102,200 104,230 L 106,265 L 118,265 L 120,230 Q 118,200 118,170 L 120,82 Q 125,90 128,100 L 135,140 Q 138,155 142,168 L 150,165 Q 148,155 145,140 L 142,100 Q 140,85 135,75 Q 130,55 115,50 Z";

const bodyOutlineBack = bodyOutlineFront;

export const MuscleMapSVG = ({ activeMuscles, view, className }: MuscleMapSVGProps) => {
  const paths = view === "front" ? musclePathsFront : musclePathsBack;
  
  const normalizedMuscles = activeMuscles.map(m => m.toLowerCase());
  
  return (
    <svg 
      viewBox="40 10 120 270" 
      className={cn("h-full", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Body outline */}
      <path
        d={view === "front" ? bodyOutlineFront : bodyOutlineBack}
        fill="hsl(220, 15%, 25%)"
        stroke="hsl(220, 15%, 35%)"
        strokeWidth="0.8"
        opacity="0.6"
      />
      
      {/* Muscle groups */}
      {Object.entries(paths).map(([muscle, path]) => {
        const isActive = normalizedMuscles.includes(muscle);
        return (
          <path
            key={muscle}
            d={path}
            fill={isActive ? "hsl(200, 80%, 55%)" : "hsl(220, 15%, 30%)"}
            opacity={isActive ? 0.85 : 0.3}
            stroke={isActive ? "hsl(200, 80%, 65%)" : "transparent"}
            strokeWidth="0.5"
          />
        );
      })}
    </svg>
  );
};
