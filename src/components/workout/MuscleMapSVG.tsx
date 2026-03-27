import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MuscleMapSVGProps {
  activeMuscles: string[];
  view: "front" | "back";
  className?: string;
}

// ── Highly detailed front-view muscle paths ──
const musclePathsFront: Record<string, string[]> = {
  traps: [
    "M 82,104 C 86,98 94,94 100,96 L 100,108 C 94,106 88,108 82,112 Z",
    "M 118,104 C 114,98 106,94 100,96 L 100,108 C 106,106 112,108 118,112 Z",
  ],
  shoulders: [
    // Left deltoid - 3 heads
    "M 66,108 C 68,98 74,94 82,98 L 82,104 C 78,102 72,104 68,110 Z",
    "M 66,108 C 64,114 64,120 66,126 L 74,122 C 72,118 70,114 68,110 Z",
    "M 82,104 L 82,122 C 78,122 74,122 74,122 L 66,126 C 68,118 70,110 82,104 Z",
    // Right deltoid - 3 heads
    "M 134,108 C 132,98 126,94 118,98 L 118,104 C 122,102 128,104 132,110 Z",
    "M 134,108 C 136,114 136,120 134,126 L 126,122 C 128,118 130,114 132,110 Z",
    "M 118,104 L 118,122 C 122,122 126,122 126,122 L 134,126 C 132,118 130,110 118,104 Z",
  ],
  chest: [
    // Left pectoralis major - upper + lower fibers
    "M 82,108 C 86,104 94,102 100,106 L 100,118 C 94,120 88,118 84,116 Z",
    "M 84,116 C 86,118 92,122 100,118 L 100,136 C 94,140 86,138 82,132 L 82,122 Z",
    // Right pectoralis major
    "M 118,108 C 114,104 106,102 100,106 L 100,118 C 106,120 112,118 116,116 Z",
    "M 116,116 C 114,118 108,122 100,118 L 100,136 C 106,140 114,138 118,132 L 118,122 Z",
  ],
  biceps: [
    // Left bicep - long + short head
    "M 64,126 C 66,122 70,120 74,122 L 76,148 C 74,152 70,154 66,150 L 62,136 Z",
    "M 66,150 C 68,154 72,156 76,154 L 76,148 C 72,152 68,152 66,150 Z",
    // Right bicep
    "M 136,126 C 134,122 130,120 126,122 L 124,148 C 126,152 130,154 134,150 L 138,136 Z",
    "M 134,150 C 132,154 128,156 124,154 L 124,148 C 128,152 132,152 134,150 Z",
  ],
  forearms: [
    // Left forearm - brachioradialis + flexors
    "M 60,156 C 62,152 66,150 70,152 L 68,176 C 66,178 62,178 60,174 Z",
    "M 60,174 C 58,180 56,186 56,192 L 60,194 C 62,188 64,182 68,176 Z",
    // Right forearm
    "M 140,156 C 138,152 134,150 130,152 L 132,176 C 134,178 138,178 140,174 Z",
    "M 140,174 C 142,180 144,186 144,192 L 140,194 C 138,188 136,182 132,176 Z",
  ],
  abs: [
    // Rectus abdominis - 6 pack segments
    // Upper left
    "M 92,136 C 94,134 98,134 100,136 L 100,148 C 98,148 94,148 92,148 Z",
    // Upper right
    "M 100,136 C 102,134 106,134 108,136 L 108,148 C 106,148 102,148 100,148 Z",
    // Mid left
    "M 92,150 C 94,150 98,150 100,150 L 100,162 C 98,162 94,162 92,162 Z",
    // Mid right
    "M 100,150 C 102,150 106,150 108,150 L 108,162 C 106,162 102,162 100,162 Z",
    // Lower left
    "M 93,164 C 95,164 98,164 100,164 L 100,178 C 97,180 94,180 93,178 Z",
    // Lower right
    "M 100,164 C 102,164 105,164 107,164 L 107,178 C 106,180 103,180 100,178 Z",
    // Obliques left
    "M 82,134 C 84,132 88,134 92,136 L 92,176 C 88,180 84,178 82,170 Z",
    // Obliques right
    "M 118,134 C 116,132 112,134 108,136 L 108,176 C 112,180 116,178 118,170 Z",
  ],
  quadriceps: [
    // Left vastus lateralis (outer)
    "M 80,194 C 82,190 86,188 90,190 L 88,232 C 86,236 82,238 80,234 Z",
    // Left rectus femoris (center)
    "M 90,190 C 92,188 96,188 98,190 L 96,236 C 94,238 90,238 88,232 Z",
    // Left vastus medialis (inner/teardrop)
    "M 98,190 C 100,190 100,192 100,194 L 100,226 C 98,234 96,238 96,236 Z",
    // Right vastus lateralis
    "M 120,194 C 118,190 114,188 110,190 L 112,232 C 114,236 118,238 120,234 Z",
    // Right rectus femoris
    "M 110,190 C 108,188 104,188 102,190 L 104,236 C 106,238 110,238 112,232 Z",
    // Right vastus medialis
    "M 102,190 C 100,190 100,192 100,194 L 100,226 C 102,234 104,238 104,236 Z",
  ],
  calves: [
    // Left tibialis anterior
    "M 86,260 C 88,256 92,254 94,258 L 92,298 C 90,302 86,300 86,296 Z",
    // Right tibialis anterior
    "M 114,260 C 112,256 108,254 106,258 L 108,298 C 110,302 114,300 114,296 Z",
  ],
};

// ── Highly detailed back-view muscle paths ──
const musclePathsBack: Record<string, string[]> = {
  traps: [
    // Upper traps
    "M 84,98 C 88,92 96,90 100,92 L 100,102 C 94,100 88,100 84,104 Z",
    "M 116,98 C 112,92 104,90 100,92 L 100,102 C 106,100 112,100 116,104 Z",
    // Mid traps (rhomboids visible area)
    "M 84,104 C 88,100 94,100 100,102 L 100,120 C 94,118 88,116 84,118 Z",
    "M 116,104 C 112,100 106,100 100,102 L 100,120 C 106,118 112,116 116,118 Z",
  ],
  shoulders: [
    // Left rear deltoid
    "M 66,108 C 68,98 76,94 82,100 L 82,120 C 76,120 70,118 66,114 Z",
    // Right rear deltoid
    "M 134,108 C 132,98 124,94 118,100 L 118,120 C 124,120 130,118 134,114 Z",
  ],
  back: [
    // Left latissimus dorsi (wide V-shape)
    "M 82,120 C 84,116 90,114 96,118 L 96,150 C 94,156 90,162 84,164 L 82,148 Z",
    "M 82,148 L 84,164 C 86,168 90,170 92,172 L 92,156 C 88,158 84,156 82,148 Z",
    // Right latissimus dorsi
    "M 118,120 C 116,116 110,114 104,118 L 104,150 C 106,156 110,162 116,164 L 118,148 Z",
    "M 118,148 L 116,164 C 114,168 110,170 108,172 L 108,156 C 112,158 116,156 118,148 Z",
    // Spinal erectors left
    "M 96,118 C 98,116 100,116 100,118 L 100,172 C 98,174 96,174 96,172 Z",
    // Spinal erectors right
    "M 100,118 C 100,116 102,116 104,118 L 104,172 C 102,174 100,174 100,172 Z",
    // Teres major left
    "M 82,114 C 84,110 90,112 92,116 L 88,124 C 84,122 82,120 82,114 Z",
    // Teres major right
    "M 118,114 C 116,110 110,112 108,116 L 112,124 C 116,122 118,120 118,114 Z",
    // Infraspinatus left
    "M 84,104 C 88,100 94,102 96,108 L 96,118 C 90,114 86,112 84,108 Z",
    // Infraspinatus right
    "M 116,104 C 112,100 106,102 104,108 L 104,118 C 110,114 114,112 116,108 Z",
  ],
  triceps: [
    // Left tricep - lateral + medial + long head
    "M 62,126 C 64,120 68,118 72,120 L 74,140 C 72,144 68,144 64,140 Z",
    "M 64,140 C 66,144 70,146 74,144 L 76,154 C 72,158 66,156 62,150 Z",
    // Right tricep
    "M 138,126 C 136,120 132,118 128,120 L 126,140 C 128,144 132,144 136,140 Z",
    "M 136,140 C 134,144 130,146 126,144 L 124,154 C 128,158 134,156 138,150 Z",
  ],
  forearms: [
    // Left forearm extensors
    "M 58,156 C 60,152 64,150 68,152 L 66,180 C 64,184 60,184 58,180 Z",
    "M 58,180 C 56,186 54,190 54,194 L 58,196 C 60,190 62,184 66,180 Z",
    // Right forearm extensors
    "M 142,156 C 140,152 136,150 132,152 L 134,180 C 136,184 140,184 142,180 Z",
    "M 142,180 C 144,186 146,190 146,194 L 142,196 C 140,190 138,184 134,180 Z",
  ],
  glutes: [
    // Left gluteus maximus
    "M 84,174 C 88,170 94,170 100,174 L 100,198 C 96,202 90,204 84,200 Z",
    // Right gluteus maximus
    "M 100,174 C 106,170 112,170 116,174 L 116,200 C 110,204 104,202 100,198 Z",
  ],
  hamstrings: [
    // Left biceps femoris (outer)
    "M 80,204 C 82,198 86,196 90,200 L 88,244 C 86,248 82,248 80,244 Z",
    // Left semitendinosus (inner)
    "M 90,200 C 94,196 98,198 100,202 L 98,248 C 96,250 92,250 88,244 Z",
    // Right biceps femoris
    "M 120,204 C 118,198 114,196 110,200 L 112,244 C 114,248 118,248 120,244 Z",
    // Right semitendinosus
    "M 110,200 C 106,196 102,198 100,202 L 102,248 C 104,250 108,250 112,244 Z",
  ],
  calves: [
    // Left gastrocnemius - medial head
    "M 86,258 C 88,252 94,250 96,254 L 94,290 C 92,296 88,296 86,292 Z",
    // Left gastrocnemius - lateral head
    "M 82,262 C 84,256 88,254 86,258 L 86,292 C 84,294 82,292 82,286 Z",
    // Right gastrocnemius - medial head
    "M 114,258 C 112,252 106,250 104,254 L 106,290 C 108,296 112,296 114,292 Z",
    // Right gastrocnemius - lateral head
    "M 118,262 C 116,256 112,254 114,258 L 114,292 C 116,294 118,292 118,286 Z",
  ],
};

// ── Anatomical body outline (front) - realistic proportions ──
const bodyOutlineFront = `
  M 100,30
  C 91,30 85,36 85,46
  C 85,54 89,60 94,64
  C 90,66 86,68 84,70
  C 76,74 70,82 66,92
  C 62,102 60,112 58,122
  L 54,148
  Q 52,160 48,174
  L 46,186
  Q 48,188 52,186
  L 56,170
  Q 58,158 60,148
  Q 62,136 66,126
  L 78,192
  Q 76,216 76,240
  L 76,260
  Q 78,280 80,296
  Q 82,310 86,318
  L 96,318
  Q 96,310 96,296
  Q 98,264 100,236
  Q 102,264 104,296
  Q 104,310 104,318
  L 114,318
  Q 118,310 120,296
  Q 122,280 124,260
  L 124,240
  Q 124,216 122,192
  L 134,126
  Q 138,136 140,148
  L 144,170
  Q 146,180 148,186
  Q 152,188 154,186
  L 152,174
  Q 148,160 146,148
  L 142,122
  Q 140,112 138,102
  Q 134,92 130,82
  Q 124,74 116,70
  C 114,68 110,66 106,64
  C 111,60 115,54 115,46
  C 115,36 109,30 100,30
  Z
`;

const bodyOutlineBack = `
  M 100,30
  C 91,30 85,36 85,46
  C 85,54 89,60 94,64
  C 90,66 86,68 84,70
  C 76,74 70,82 66,92
  C 62,102 60,112 58,122
  L 54,148
  Q 52,160 48,174
  L 46,186
  Q 48,188 52,186
  L 56,170
  Q 58,158 60,148
  Q 62,136 66,126
  L 78,192
  Q 76,216 76,240
  L 76,260
  Q 78,280 80,296
  Q 82,310 86,318
  L 96,318
  Q 96,310 96,296
  Q 98,264 100,236
  Q 102,264 104,296
  Q 104,310 104,318
  L 114,318
  Q 118,310 120,296
  Q 122,280 124,260
  L 124,240
  Q 124,216 122,192
  L 134,126
  Q 138,136 140,148
  L 144,170
  Q 146,180 148,186
  Q 152,188 154,186
  L 152,174
  Q 148,160 146,148
  L 142,122
  Q 140,112 138,102
  Q 134,92 130,82
  Q 124,74 116,70
  C 114,68 110,66 106,64
  C 111,60 115,54 115,46
  C 115,36 109,30 100,30
  Z
`;

// ── Anatomy definition lines (muscle fiber directions + separations) ──
const anatomyLinesFront = [
  // Chest separation center
  "M 100,106 L 100,136",
  // Chest fiber lines left
  "M 84,112 Q 90,114 96,112",
  "M 84,120 Q 90,120 96,116",
  "M 86,128 Q 92,126 98,122",
  // Chest fiber lines right
  "M 116,112 Q 110,114 104,112",
  "M 116,120 Q 110,120 104,116",
  "M 114,128 Q 108,126 102,122",
  // Ab linea alba
  "M 100,136 L 100,182",
  // Ab tendinous inscriptions
  "M 92,148 Q 100,146 108,148",
  "M 92,162 Q 100,160 108,162",
  "M 93,176 Q 100,174 107,176",
  // Quad separations
  "M 90,192 L 88,234",
  "M 98,192 L 96,234",
  "M 110,192 L 112,234",
  "M 102,192 L 104,234",
  // Knee lines
  "M 84,244 Q 90,248 96,244",
  "M 104,244 Q 110,248 116,244",
  // Serratus anterior left
  "M 82,126 L 86,130",
  "M 82,132 L 86,136",
  "M 82,138 L 86,140",
  // Serratus anterior right
  "M 118,126 L 114,130",
  "M 118,132 L 114,136",
  "M 118,138 L 114,140",
];

const anatomyLinesBack = [
  // Spine line
  "M 100,92 L 100,174",
  // Scapula lines left
  "M 84,106 Q 88,110 92,108",
  "M 84,112 Q 88,116 92,114",
  // Scapula lines right
  "M 116,106 Q 112,110 108,108",
  "M 116,112 Q 112,116 108,114",
  // Lat fiber lines left
  "M 82,130 Q 86,134 92,132",
  "M 82,140 Q 86,144 92,140",
  "M 82,150 Q 86,154 92,148",
  // Lat fiber lines right
  "M 118,130 Q 114,134 108,132",
  "M 118,140 Q 114,144 108,140",
  "M 118,150 Q 114,154 108,148",
  // Glute separation
  "M 100,174 L 100,200",
  // Lower back details
  "M 92,170 Q 96,172 100,170",
  "M 100,170 Q 104,172 108,170",
  // Hamstring separations
  "M 90,202 L 88,246",
  "M 110,202 L 112,246",
  // Calf separation
  "M 86,260 L 86,290",
  "M 114,260 L 114,290",
];

// Animated muscle path wrapper
const AnimatedMusclePath = ({
  d,
  isActive,
  view,
  delay,
}: {
  d: string;
  isActive: boolean;
  view: string;
  delay: number;
}) => {
  if (!isActive) {
    return (
      <path
        d={d}
        fill="hsl(215, 20%, 20%)"
        opacity={0.2}
        stroke="hsl(215, 15%, 26%)"
        strokeWidth="0.3"
      />
    );
  }

  return (
    <motion.path
      d={d}
      fill="hsl(200, 80%, 50%)"
      stroke="hsl(200, 70%, 62%)"
      strokeWidth="0.5"
      initial={{ opacity: 0.5 }}
      animate={{
        opacity: [0.65, 0.9, 0.65],
        fill: [
          "hsl(200, 75%, 45%)",
          "hsl(200, 85%, 55%)",
          "hsl(200, 75%, 45%)",
        ],
      }}
      transition={{
        duration: 2.5,
        repeat: Infinity,
        ease: "easeInOut",
        delay: delay * 0.15,
      }}
      filter={`url(#muscle-glow-${view})`}
    />
  );
};

export const MuscleMapSVG = ({
  activeMuscles,
  view,
  className,
}: MuscleMapSVGProps) => {
  const paths = view === "front" ? musclePathsFront : musclePathsBack;
  const outline = view === "front" ? bodyOutlineFront : bodyOutlineBack;
  const lines = view === "front" ? anatomyLinesFront : anatomyLinesBack;

  const normalizedMuscles = activeMuscles.map((m) => m.toLowerCase());

  let pathIndex = 0;

  return (
    <svg
      viewBox="38 22 124 306"
      className={cn("h-full", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Glow filter for active muscles */}
        <filter id={`muscle-glow-${view}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="0 0 0 0 0.2  0 0 0 0 0.6  0 0 0 0 0.9  0 0 0 0.6 0"
            result="coloredBlur"
          />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Body gradient for depth */}
        <linearGradient id={`body-grad-${view}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(215, 18%, 22%)" />
          <stop offset="50%" stopColor="hsl(215, 15%, 18%)" />
          <stop offset="100%" stopColor="hsl(215, 18%, 16%)" />
        </linearGradient>

        {/* Subtle body shading */}
        <radialGradient id={`body-shade-${view}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="hsl(215, 15%, 24%)" />
          <stop offset="100%" stopColor="hsl(215, 18%, 16%)" />
        </radialGradient>
      </defs>

      {/* Body outline with gradient fill */}
      <path
        d={outline}
        fill={`url(#body-shade-${view})`}
        stroke="hsl(215, 12%, 28%)"
        strokeWidth="0.5"
      />

      {/* Anatomy definition lines (subtle fiber/separation lines) */}
      {lines.map((d, i) => (
        <path
          key={`line-${i}`}
          d={d}
          fill="none"
          stroke="hsl(215, 12%, 24%)"
          strokeWidth="0.3"
          strokeLinecap="round"
          opacity={0.5}
        />
      ))}

      {/* Muscle groups with animation */}
      {Object.entries(paths).map(([muscle, pathList]) => {
        const isActive = normalizedMuscles.includes(muscle);
        return pathList.map((d, i) => {
          const idx = pathIndex++;
          return (
            <AnimatedMusclePath
              key={`${muscle}-${i}`}
              d={d}
              isActive={isActive}
              view={view}
              delay={idx}
            />
          );
        });
      })}
    </svg>
  );
};
