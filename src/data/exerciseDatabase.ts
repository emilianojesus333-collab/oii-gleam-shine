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
  Peito: {
    exercises: [
      { name: "Supino reto", focus: "Contração no pico" },
      { name: "Supino inclinado", focus: "Peito superior" },
      { name: "Crucifixo", focus: "Alongamento" },
      { name: "Flexões", focus: "Controle do movimento" },
      { name: "Crossover", focus: "Squeeze no centro" },
      { name: "Supino declinado", focus: "Peito inferior" },
    ],
    recoveryTips: ["90s descanso", "2min entre séries", "Alongar peitoral"],
  },
  Costas: {
    exercises: [
      { name: "Remada curvada", focus: "Squeeze nas escápulas" },
      { name: "Puxada frontal", focus: "Contrair dorsais" },
      { name: "Remada baixa", focus: "Cotovelos para trás" },
      { name: "Barra fixa", focus: "Subida controlada" },
      { name: "Pulldown", focus: "Dorsais ativados" },
      { name: "Remada unilateral", focus: "Rotação mínima" },
    ],
    recoveryTips: ["60-90s descanso", "Alongar costas", "Foam roller"],
  },
  Pernas: {
    exercises: [
      { name: "Agachamento", focus: "Profundidade" },
      { name: "Leg press", focus: "Joelhos alinhados" },
      { name: "Extensora", focus: "Contração no topo" },
      { name: "Flexora", focus: "Squeeze nos isquiotibiais" },
      { name: "Stiff", focus: "Alongamento ativo" },
      { name: "Afundo", focus: "Equilíbrio" },
    ],
    recoveryTips: ["2-3min descanso", "Hidratação", "Alongar bem"],
  },
  Ombros: {
    exercises: [
      { name: "Desenvolvimento", focus: "Não bloquear cotovelos" },
      { name: "Elevação lateral", focus: "Cotovelo acima da mão" },
      { name: "Elevação frontal", focus: "Controle na descida" },
      { name: "Crucifixo inverso", focus: "Deltóide posterior" },
      { name: "Arnold press", focus: "Rotação suave" },
      { name: "Face pull", focus: "Rotação externa" },
    ],
    recoveryTips: ["60s descanso", "Mobilidade de ombro", "Cuidado com peso"],
  },
  Braços: {
    exercises: [
      { name: "Rosca direta", focus: "Cotovelo fixo" },
      { name: "Rosca martelo", focus: "Braquial" },
      { name: "Tríceps corda", focus: "Extensão completa" },
      { name: "Tríceps testa", focus: "Cotovelos fixos" },
      { name: "Rosca concentrada", focus: "Isolamento total" },
      { name: "Mergulho", focus: "Tríceps ativados" },
    ],
    recoveryTips: ["45-60s descanso", "Supersets", "Pump máximo"],
  },
  Abdominais: {
    exercises: [
      { name: "Prancha", focus: "Core contraído" },
      { name: "Crunch", focus: "Contrair abdominais" },
      { name: "Elevação de pernas", focus: "Sem momentum" },
      { name: "Russian twist", focus: "Oblíquos" },
      { name: "Ab wheel", focus: "Controle total" },
      { name: "Dead bug", focus: "Estabilidade" },
    ],
    recoveryTips: ["30s descanso", "Respiração", "Qualidade > quantidade"],
  },
  Glúteos: {
    exercises: [
      { name: "Hip thrust", focus: "Squeeze no topo" },
      { name: "Ponte de glúteos", focus: "Contração isométrica" },
      { name: "Kickback", focus: "Glúteo máximo" },
      { name: "Abdução", focus: "Glúteo médio" },
      { name: "Sumo squat", focus: "Profundidade" },
      { name: "Step up", focus: "Força unilateral" },
    ],
    recoveryTips: ["60-90s descanso", "Ativação pré-treino", "Mind-muscle"],
  },
  Cardio: {
    exercises: [
      { name: "HIIT", focus: "Intensidade máxima" },
      { name: "Corrida leve", focus: "Zona cardíaca" },
      { name: "Bike", focus: "Cadência constante" },
      { name: "Remo", focus: "Full body" },
      { name: "Jump rope", focus: "Coordenação" },
      { name: "Escadas", focus: "Resistência" },
    ],
    recoveryTips: ["Recuperação ativa", "Hidratação", "Alongamentos"],
  },
  Trapézio: {
    exercises: [
      { name: "Encolhimento", focus: "Squeeze no topo" },
      { name: "Remada alta", focus: "Cotovelos acima" },
      { name: "Face pull", focus: "Rotação externa" },
      { name: "Farmer's walk", focus: "Grip forte" },
      { name: "Encolhimento inclinado", focus: "Trapézio médio" },
      { name: "Y raises", focus: "Trapézio inferior" },
    ],
    recoveryTips: ["60s descanso", "Alongar pescoço", "Evitar peso excessivo"],
  },
  Antebraços: {
    exercises: [
      { name: "Rosca de punho", focus: "Controle total" },
      { name: "Rosca inversa", focus: "Extensores" },
      { name: "Farmer's walk", focus: "Grip isométrico" },
      { name: "Dead hang", focus: "Resistência de grip" },
      { name: "Wrist roller", focus: "Movimento lento" },
      { name: "Pinch grip", focus: "Dedos fortes" },
    ],
    recoveryTips: ["30-45s descanso", "Alongar punhos", "Massagem"],
  },
  Panturrilhas: {
    exercises: [
      { name: "Elevação em pé", focus: "Contração no topo" },
      { name: "Elevação sentado", focus: "Sóleo" },
      { name: "Elevação unilateral", focus: "Equilíbrio" },
      { name: "Donkey calf raise", focus: "Alongamento máximo" },
      { name: "Jump rope", focus: "Explosividade" },
      { name: "Elevação no leg press", focus: "Carga pesada" },
    ],
    recoveryTips: ["45-60s descanso", "Alongar bem", "Volume alto"],
  },
  "Full Body": {
    exercises: [
      { name: "Deadlift", focus: "Costas neutras" },
      { name: "Clean and press", focus: "Explosividade" },
      { name: "Burpees", focus: "Ritmo constante" },
      { name: "Turkish get-up", focus: "Controle total" },
      { name: "Thrusters", focus: "Fluidez" },
      { name: "Kettlebell swing", focus: "Quadril" },
    ],
    recoveryTips: ["2-3min descanso", "Hidratação", "Nutrição pós-treino"],
  },
  Descanso: {
    exercises: [
      { name: "Alongamentos", focus: "Relaxar músculos" },
      { name: "Yoga leve", focus: "Flexibilidade" },
      { name: "Caminhada", focus: "Recuperação ativa" },
      { name: "Foam roller", focus: "Liberação miofascial" },
    ],
    recoveryTips: ["Descanso total", "Sono de qualidade", "Nutrição"],
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
  if (!data || data.recoveryTips.length === 0) return "90s descanso";
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
  if (!groups || groups.length === 0 || groups[0] === "Descanso") {
    return { 
      exercise: { name: "Alongamentos", focus: "Relaxar" }, 
      focus: "Recuperação" 
    };
  }
  
  // Pick a random group from the selected groups
  const randomGroup = groups[Math.floor(Math.random() * groups.length)];
  const exercise = getRandomExercise(randomGroup);
  
  return {
    exercise,
    focus: exercise?.focus || "Forma perfeita",
  };
};

// Get recovery suggestion based on muscle groups
export const getRecoverySuggestion = (groups: string[] | null): string => {
  if (!groups || groups.length === 0 || groups[0] === "Descanso") {
    return "Descanso total";
  }
  
  const randomGroup = groups[Math.floor(Math.random() * groups.length)];
  return getRandomRecoveryTip(randomGroup);
};
