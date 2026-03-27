import { cn } from "@/lib/utils";

interface MuscleMapSVGProps {
  activeMuscles: string[];
  view: "front" | "back";
  className?: string;
}

// ── Front-view muscle paths (anatomically proportioned, 200×400 viewBox) ──
const musclePathsFront: Record<string, string[]> = {
  traps: [
    // Left trap
    "M 80,100 Q 85,92 92,96 L 92,108 Q 86,112 80,108 Z",
    // Right trap
    "M 108,96 Q 115,92 120,100 L 120,108 Q 114,112 108,108 Z",
  ],
  shoulders: [
    // Left deltoid
    "M 68,106 Q 72,96 82,100 L 82,118 Q 74,120 68,114 Z",
    // Right deltoid
    "M 118,100 Q 128,96 132,106 L 132,114 Q 126,120 118,118 Z",
  ],
  chest: [
    // Left pec
    "M 82,108 Q 88,104 100,108 L 100,130 Q 92,136 82,132 Z",
    // Right pec
    "M 100,108 Q 112,104 118,108 L 118,132 Q 108,136 100,130 Z",
  ],
  biceps: [
    // Left bicep
    "M 64,120 Q 68,116 72,120 L 74,148 Q 70,152 66,148 Z",
    // Right bicep
    "M 128,120 Q 132,116 136,120 L 134,148 Q 130,152 126,148 Z",
  ],
  forearms: [
    // Left forearm
    "M 60,152 Q 64,148 70,152 L 66,188 Q 62,192 58,186 Z",
    // Right forearm
    "M 130,152 Q 136,148 140,152 L 142,186 Q 138,192 134,188 Z",
  ],
  abs: [
    // Upper abs
    "M 90,132 Q 100,128 110,132 L 110,148 Q 100,146 90,148 Z",
    // Mid abs
    "M 90,150 Q 100,148 110,150 L 110,166 Q 100,164 90,166 Z",
    // Lower abs
    "M 92,168 Q 100,166 108,168 L 108,184 Q 100,186 92,184 Z",
  ],
  quadriceps: [
    // Left quad (vastus lateralis + rectus femoris)
    "M 82,192 Q 86,186 96,190 L 94,240 Q 88,244 82,238 Z",
    // Right quad
    "M 104,190 Q 114,186 118,192 L 118,238 Q 112,244 106,240 Z",
  ],
  calves: [
    // Left calf (front tibialis)
    "M 84,258 Q 88,252 94,256 L 92,296 Q 88,300 84,294 Z",
    // Right calf
    "M 106,256 Q 112,252 116,258 L 116,294 Q 112,300 108,296 Z",
  ],
};

// ── Back-view muscle paths ──
const musclePathsBack: Record<string, string[]> = {
  traps: [
    // Large trapezius diamond shape
    "M 88,96 Q 100,86 112,96 L 114,118 Q 100,112 86,118 Z",
  ],
  shoulders: [
    // Left rear delt
    "M 68,106 Q 72,96 82,100 L 82,118 Q 74,120 68,114 Z",
    // Right rear delt
    "M 118,100 Q 128,96 132,106 L 132,114 Q 126,120 118,118 Z",
  ],
  back: [
    // Left lat
    "M 82,118 Q 86,112 96,116 L 96,158 Q 88,164 82,156 Z",
    // Right lat
    "M 104,116 Q 114,112 118,118 L 118,156 Q 112,164 104,158 Z",
    // Spinal erectors (center)
    "M 96,116 Q 100,114 104,116 L 104,170 Q 100,172 96,170 Z",
  ],
  triceps: [
    // Left tricep
    "M 64,120 Q 68,116 72,120 L 74,150 Q 70,154 66,150 Z",
    // Right tricep
    "M 128,120 Q 132,116 136,120 L 134,150 Q 130,154 126,150 Z",
  ],
  forearms: [
    // Left forearm
    "M 60,154 Q 64,150 70,154 L 66,188 Q 62,192 58,186 Z",
    // Right forearm
    "M 130,154 Q 136,150 140,154 L 142,186 Q 138,192 134,188 Z",
  ],
  glutes: [
    // Left glute
    "M 84,172 Q 92,168 100,172 L 100,194 Q 92,198 84,192 Z",
    // Right glute
    "M 100,172 Q 108,168 116,172 L 116,192 Q 108,198 100,194 Z",
  ],
  hamstrings: [
    // Left hamstring
    "M 82,198 Q 88,192 96,196 L 94,248 Q 88,252 82,246 Z",
    // Right hamstring
    "M 104,196 Q 112,192 118,198 L 118,246 Q 112,252 106,248 Z",
  ],
  calves: [
    // Left calf (gastrocnemius)
    "M 84,258 Q 90,250 96,256 L 94,296 Q 88,302 84,294 Z",
    // Right calf
    "M 106,256 Q 112,250 118,258 L 116,294 Q 112,302 108,296 Z",
  ],
};

// ── Anatomical body outline ──
const bodyOutlineFront = `
  M 100,28
  C 92,28 86,34 86,44
  C 86,52 90,58 94,62
  Q 88,64 84,66
  Q 74,70 68,80
  Q 62,92 60,108
  L 56,140
  Q 54,152 50,168
  L 48,180
  Q 52,182 56,178
  L 60,152
  Q 62,140 66,126
  Q 68,118 72,112
  L 80,190
  Q 78,220 78,248
  L 80,296
  Q 82,310 86,316
  L 96,316
  L 96,296
  Q 98,260 100,230
  Q 102,260 104,296
  L 104,316
  L 114,316
  Q 118,310 120,296
  L 122,248
  Q 122,220 120,190
  L 128,112
  Q 132,118 134,126
  Q 138,140 140,152
  L 144,178
  Q 148,182 152,180
  L 150,168
  Q 146,152 144,140
  L 140,108
  Q 138,92 132,80
  Q 126,70 116,66
  Q 112,64 106,62
  C 110,58 114,52 114,44
  C 114,34 108,28 100,28
  Z
`;

const bodyOutlineBack = `
  M 100,28
  C 92,28 86,34 86,44
  C 86,52 90,58 94,62
  Q 88,64 84,66
  Q 74,70 68,80
  Q 62,92 60,108
  L 56,140
  Q 54,152 50,168
  L 48,180
  Q 52,182 56,178
  L 60,152
  Q 62,140 66,126
  Q 68,118 72,112
  L 80,190
  Q 78,220 78,248
  L 80,296
  Q 82,310 86,316
  L 96,316
  L 96,296
  Q 98,260 100,230
  Q 102,260 104,296
  L 104,316
  L 114,316
  Q 118,310 120,296
  L 122,248
  Q 122,220 120,190
  L 128,112
  Q 132,118 134,126
  Q 138,140 140,152
  L 144,178
  Q 148,182 152,180
  L 150,168
  Q 146,152 144,140
  L 140,108
  Q 138,92 132,80
  Q 126,70 116,66
  Q 112,64 106,62
  C 110,58 114,52 114,44
  C 114,34 108,28 100,28
  Z
`;

// ── Muscle definition lines (subtle anatomy strokes) ──
const anatomyLinesFront = [
  // Chest separation
  "M 100,108 L 100,134",
  // Ab lines horizontal
  "M 92,140 Q 100,138 108,140",
  "M 92,156 Q 100,154 108,156",
  "M 94,172 Q 100,170 106,172",
  // Ab center line
  "M 100,132 L 100,184",
  // Quad separation
  "M 90,200 L 88,240",
  "M 110,200 L 112,240",
];

const anatomyLinesBack = [
  // Spine line
  "M 100,96 L 100,172",
  // Lat separation
  "M 86,130 Q 90,134 96,132",
  "M 114,130 Q 110,134 104,132",
  // Glute separation
  "M 100,172 L 100,196",
  // Lower back dimples
  "M 92,168 Q 96,170 100,168",
  "M 100,168 Q 104,170 108,168",
];

export const MuscleMapSVG = ({ activeMuscles, view, className }: MuscleMapSVGProps) => {
  const paths = view === "front" ? musclePathsFront : musclePathsBack;
  const outline = view === "front" ? bodyOutlineFront : bodyOutlineBack;
  const lines = view === "front" ? anatomyLinesFront : anatomyLinesBack;

  const normalizedMuscles = activeMuscles.map((m) => m.toLowerCase());

  return (
    <svg
      viewBox="40 20 120 310"
      className={cn("h-full", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id={`glow-${view}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(200, 80%, 55%)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="hsl(200, 80%, 55%)" stopOpacity="0" />
        </radialGradient>
        <filter id={`muscle-glow-${view}`}>
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Body outline */}
      <path
        d={outline}
        fill="hsl(220, 20%, 18%)"
        stroke="hsl(220, 15%, 30%)"
        strokeWidth="0.6"
      />

      {/* Anatomy definition lines */}
      {lines.map((d, i) => (
        <path
          key={`line-${i}`}
          d={d}
          fill="none"
          stroke="hsl(220, 15%, 26%)"
          strokeWidth="0.4"
          strokeLinecap="round"
        />
      ))}

      {/* Muscle groups */}
      {Object.entries(paths).map(([muscle, pathList]) => {
        const isActive = normalizedMuscles.includes(muscle);
        return pathList.map((d, i) => (
          <path
            key={`${muscle}-${i}`}
            d={d}
            fill={isActive ? "hsl(200, 80%, 50%)" : "hsl(220, 18%, 22%)"}
            opacity={isActive ? 0.8 : 0.25}
            stroke={isActive ? "hsl(200, 70%, 60%)" : "hsl(220, 15%, 28%)"}
            strokeWidth={isActive ? "0.6" : "0.3"}
            filter={isActive ? `url(#muscle-glow-${view})` : undefined}
          />
        ));
      })}
    </svg>
  );
};
