// Database of exercises organized by muscle group

export interface Exercise {
  name: string;
  focus: string; // What to focus on during the exercise
}

export interface MuscleGroupData {
  exercises: Exercise[];
  recoveryTips: string[];
}

export const exerciseDatabase: Record<string, MuscleGroupData> = {
  Chest: {
    exercises: [
      { name: "Flat bench press", focus: "Peak contraction" },
      { name: "Incline bench press", focus: "Upper chest" },
      { name: "Decline bench press", focus: "Lower chest" },
      { name: "Dumbbell flyes", focus: "Stretch" },
      { name: "Incline dumbbell flyes", focus: "Upper fibers" },
      { name: "Cable crossover", focus: "Squeeze in the center" },
      { name: "Low cable crossover", focus: "Upper chest" },
      { name: "Push-ups", focus: "Movement control" },
      { name: "Incline push-ups", focus: "Lower chest" },
      { name: "Decline push-ups", focus: "Upper chest" },
      { name: "Pec deck", focus: "Isolation" },
      { name: "Pullover", focus: "Chest expansion" },
      { name: "Dumbbell press", focus: "Full range of motion" },
      { name: "Machine chest press", focus: "Guided movement" },
    ],
    recoveryTips: ["90s rest", "2min between sets", "Stretch chest"],
  },
  Back: {
    exercises: [
      { name: "Bent over row", focus: "Squeeze shoulder blades" },
      { name: "Seated cable row", focus: "Elbows back" },
      { name: "Single arm row", focus: "Minimal rotation" },
      { name: "T-bar row", focus: "Mid back" },
      { name: "T-bar row machine", focus: "Back thickness" },
      { name: "Lat pulldown", focus: "Contract lats" },
      { name: "Wide grip pulldown", focus: "Back width" },
      { name: "Close grip pulldown", focus: "Lower lats" },
      { name: "Pull-ups", focus: "Controlled ascent" },
      { name: "Chin-ups", focus: "Biceps assist" },
      { name: "Straight arm pulldown", focus: "Lats engaged" },
      { name: "Rope pulldown", focus: "Contraction at end" },
      { name: "Pullover", focus: "Lat stretch" },
      { name: "Deadlift", focus: "Neutral spine" },
      { name: "Good morning", focus: "Spinal erectors" },
      { name: "Back extension", focus: "Strong lower back" },
    ],
    recoveryTips: ["60-90s rest", "Stretch back", "Foam roller"],
  },
  Legs: {
    exercises: [
      { name: "Barbell squat", focus: "Depth" },
      { name: "Front squat", focus: "Quadriceps" },
      { name: "Hack squat", focus: "Protected knees" },
      { name: "Bulgarian split squat", focus: "Unilateral" },
      { name: "Leg press 45°", focus: "Knees aligned" },
      { name: "Horizontal leg press", focus: "Full range" },
      { name: "Leg extension", focus: "Top contraction" },
      { name: "Lying leg curl", focus: "Hamstring squeeze" },
      { name: "Seated leg curl", focus: "Hamstrings" },
      { name: "Standing leg curl", focus: "Unilateral" },
      { name: "Stiff leg deadlift", focus: "Active stretch" },
      { name: "Romanian deadlift", focus: "Hamstrings" },
      { name: "Walking lunges", focus: "Balance" },
      { name: "Reverse lunges", focus: "Coordination" },
      { name: "Adductor machine", focus: "Adductors" },
      { name: "Abductor machine", focus: "Abductors" },
      { name: "Step-ups", focus: "Glutes and quads" },
    ],
    recoveryTips: ["2-3min rest", "Hydration", "Stretch well"],
  },
  Shoulders: {
    exercises: [
      { name: "Overhead press", focus: "Stable core" },
      { name: "Dumbbell shoulder press", focus: "Don't lock elbows" },
      { name: "Arnold press", focus: "Smooth rotation" },
      { name: "Machine shoulder press", focus: "Guided movement" },
      { name: "Lateral raises", focus: "Elbow above hand" },
      { name: "Cable lateral raises", focus: "Constant tension" },
      { name: "Front raises", focus: "Controlled descent" },
      { name: "Barbell front raise", focus: "Front deltoid" },
      { name: "Reverse flyes", focus: "Rear deltoid" },
      { name: "Machine reverse flyes", focus: "Rear isolation" },
      { name: "Face pulls", focus: "External rotation" },
      { name: "Upright row", focus: "Careful with shoulders" },
      { name: "Dumbbell shrugs", focus: "Upper trapezius" },
    ],
    recoveryTips: ["60s rest", "Shoulder mobility", "Be careful with weight"],
  },
  Biceps: {
    exercises: [
      { name: "Barbell curl", focus: "Fixed elbows" },
      { name: "Dumbbell curl", focus: "Supination" },
      { name: "Hammer curl", focus: "Brachialis" },
      { name: "Concentration curl", focus: "Total isolation" },
      { name: "Preacher curl", focus: "Bicep peak" },
      { name: "Cable curl", focus: "Constant tension" },
      { name: "Incline dumbbell curl", focus: "Maximum stretch" },
      { name: "21s", focus: "Maximum pump" },
    ],
    recoveryTips: ["45-60s rest", "Supersets", "Maximum pump"],
  },
  Triceps: {
    exercises: [
      { name: "Rope pushdown", focus: "Full extension" },
      { name: "Bar pushdown", focus: "Heavy load" },
      { name: "Skull crushers", focus: "Fixed elbows" },
      { name: "Overhead tricep extension", focus: "Long head" },
      { name: "Tricep kickback", focus: "Top contraction" },
      { name: "Bench dips", focus: "Triceps engaged" },
      { name: "Parallel bar dips", focus: "Chest + triceps" },
      { name: "Close grip bench press", focus: "Tricep focus" },
    ],
    recoveryTips: ["45-60s rest", "Supersets", "Maximum pump"],
  },
  Core: {
    exercises: [
      { name: "Plank", focus: "Core engaged" },
      { name: "Side plank", focus: "Obliques" },
      { name: "Crunch", focus: "Contract abs" },
      { name: "Reverse crunch", focus: "Lower abs" },
      { name: "Bicycle crunch", focus: "Alternating obliques" },
      { name: "Leg raises", focus: "No momentum" },
      { name: "Hanging leg raises", focus: "Total core" },
      { name: "Russian twist", focus: "Obliques" },
      { name: "Ab wheel rollout", focus: "Total control" },
      { name: "Dead bug", focus: "Stability" },
      { name: "Mountain climbers", focus: "Cardio + core" },
      { name: "Ab machine crunch", focus: "Progressive load" },
      { name: "Cable crunch", focus: "Constant resistance" },
      { name: "Hollow hold", focus: "Isometric" },
    ],
    recoveryTips: ["30s rest", "Breathing", "Quality > quantity"],
  },
  Glutes: {
    exercises: [
      { name: "Barbell hip thrust", focus: "Squeeze at top" },
      { name: "Machine hip thrust", focus: "Guided movement" },
      { name: "Glute bridge", focus: "Isometric contraction" },
      { name: "Single leg glute bridge", focus: "Balance" },
      { name: "Cable kickback", focus: "Glute max" },
      { name: "Machine kickback", focus: "Isolation" },
      { name: "Hip abduction machine", focus: "Glute medius" },
      { name: "Cable hip abduction", focus: "Constant tension" },
      { name: "Sumo squat", focus: "Depth" },
      { name: "Step-ups", focus: "Unilateral strength" },
      { name: "Reverse lunge", focus: "Stretched glutes" },
      { name: "Frog pumps", focus: "Quick activation" },
    ],
    recoveryTips: ["60-90s rest", "Pre-workout activation", "Mind-muscle connection"],
  },
  Cardio: {
    exercises: [
      { name: "HIIT", focus: "Maximum intensity" },
      { name: "Light jogging", focus: "Heart rate zone" },
      { name: "Interval running", focus: "Sprints" },
      { name: "Stationary bike", focus: "Constant cadence" },
      { name: "Bike HIIT", focus: "Intense intervals" },
      { name: "Rowing machine", focus: "Full body" },
      { name: "Elliptical", focus: "Low impact" },
      { name: "Jump rope", focus: "Coordination" },
      { name: "Stair climber", focus: "Endurance" },
      { name: "Battle ropes", focus: "Upper body cardio" },
      { name: "Box jumps", focus: "Explosiveness" },
      { name: "Burpees", focus: "Full body HIIT" },
    ],
    recoveryTips: ["Active recovery", "Hydration", "Stretching"],
  },
  Traps: {
    exercises: [
      { name: "Barbell shrugs", focus: "Squeeze at top" },
      { name: "Dumbbell shrugs", focus: "Full range" },
      { name: "Incline shrugs", focus: "Mid traps" },
      { name: "Upright row", focus: "Elbows above" },
      { name: "Face pulls", focus: "External rotation" },
      { name: "Farmer's walk", focus: "Strong grip" },
      { name: "Y raises", focus: "Lower traps" },
      { name: "Prone Y raises", focus: "Stabilizers" },
    ],
    recoveryTips: ["60s rest", "Stretch neck", "Avoid excessive weight"],
  },
  Forearms: {
    exercises: [
      { name: "Wrist curl", focus: "Total control" },
      { name: "Reverse wrist curl", focus: "Extensors" },
      { name: "Reverse barbell curl", focus: "Brachioradialis" },
      { name: "Farmer's walk", focus: "Isometric grip" },
      { name: "Dead hang", focus: "Grip endurance" },
      { name: "Wrist roller", focus: "Slow movement" },
      { name: "Pinch grip", focus: "Strong fingers" },
      { name: "Plate pinch", focus: "Pinch grip" },
      { name: "Towel pull-ups", focus: "Extreme grip" },
    ],
    recoveryTips: ["30-45s rest", "Stretch wrists", "Massage"],
  },
  Calves: {
    exercises: [
      { name: "Standing calf raise machine", focus: "Top contraction" },
      { name: "Standing calf raise Smith", focus: "Stability" },
      { name: "Seated calf raise", focus: "Soleus" },
      { name: "Single leg calf raise", focus: "Balance" },
      { name: "Donkey calf raise", focus: "Maximum stretch" },
      { name: "Leg press calf raise", focus: "Heavy load" },
      { name: "Jump rope", focus: "Explosiveness" },
      { name: "Box jumps", focus: "Power" },
    ],
    recoveryTips: ["45-60s rest", "Stretch well", "High volume"],
  },
  "Full Body": {
    exercises: [
      { name: "Deadlift", focus: "Neutral spine" },
      { name: "Sumo deadlift", focus: "Open hips" },
      { name: "Clean and press", focus: "Explosiveness" },
      { name: "Clean and jerk", focus: "Total power" },
      { name: "Snatch", focus: "Perfect technique" },
      { name: "Burpees", focus: "Constant rhythm" },
      { name: "Turkish get-up", focus: "Total control" },
      { name: "Thrusters", focus: "Fluidity" },
      { name: "Kettlebell swing", focus: "Hip drive" },
      { name: "Man makers", focus: "Total complex" },
      { name: "Devil press", focus: "Cardio + strength" },
      { name: "Bear crawl", focus: "Coordination" },
    ],
    recoveryTips: ["2-3min rest", "Hydration", "Post-workout nutrition"],
  },
  Rest: {
    exercises: [
      { name: "Stretching", focus: "Relax muscles" },
      { name: "Light yoga", focus: "Flexibility" },
      { name: "Walking", focus: "Active recovery" },
      { name: "Foam rolling", focus: "Myofascial release" },
      { name: "Meditation", focus: "Mental recovery" },
      { name: "Light swimming", focus: "Zero impact" },
    ],
    recoveryTips: ["Total rest", "Quality sleep", "Nutrition"],
  },
};

// Get a random exercise for a muscle group
export const getRandomExercise = (muscleGroup: string): Exercise | null => {
  const data = exerciseDatabase[muscleGroup];
  if (!data || data.exercises.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * data.exercises.length);
  return data.exercises[randomIndex];
};

// Get a random recovery tip for a muscle group
export const getRandomRecoveryTip = (muscleGroup: string): string => {
  const data = exerciseDatabase[muscleGroup];
  if (!data || data.recoveryTips.length === 0) return "90s rest";
  const randomIndex = Math.floor(Math.random() * data.recoveryTips.length);
  return data.recoveryTips[randomIndex];
};

// Get exercises for multiple muscle groups (when user selected multiple)
export const getExercisesForGroups = (groups: string[]): Exercise[] => {
  const exercises: Exercise[] = [];
  groups.forEach(group => {
    const data = exerciseDatabase[group];
    if (data) {
      exercises.push(...data.exercises);
    }
  });
  return exercises;
};

// Get a suggested exercise for the day based on muscle groups
export const getSuggestedExercise = (groups: string[] | null): { exercise: Exercise | null; focus: string } => {
  if (!groups || groups.length === 0 || groups[0] === "Rest") {
    return { 
      exercise: { name: "Stretching", focus: "Relax" }, 
      focus: "Recovery" 
    };
  }
  
  // Pick a random group from the selected groups
  const randomGroup = groups[Math.floor(Math.random() * groups.length)];
  const exercise = getRandomExercise(randomGroup);
  
  return {
    exercise,
    focus: exercise?.focus || "Perfect form",
  };
};

// Get recovery suggestion based on muscle groups
export const getRecoverySuggestion = (groups: string[] | null): string => {
  if (!groups || groups.length === 0 || groups[0] === "Rest") {
    return "Total rest";
  }
  
  const randomGroup = groups[Math.floor(Math.random() * groups.length)];
  return getRandomRecoveryTip(randomGroup);
};
