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
      { name: "Supino declinado", focus: "Peito inferior" },
      { name: "Crucifixo", focus: "Alongamento" },
      { name: "Crucifixo inclinado", focus: "Fibras superiores" },
      { name: "Crossover", focus: "Squeeze no centro" },
      { name: "Crossover baixo", focus: "Peito superior" },
      { name: "Flexões", focus: "Controle do movimento" },
      { name: "Flexões inclinadas", focus: "Peito inferior" },
      { name: "Flexões declinadas", focus: "Peito superior" },
      { name: "Peck deck", focus: "Isolamento" },
      { name: "Pullover", focus: "Expansão torácica" },
      { name: "Supino com halteres", focus: "Amplitude máxima" },
      { name: "Chest press máquina", focus: "Movimento guiado" },
    ],
    recoveryTips: ["90s descanso", "2min entre séries", "Alongar peitoral"],
  },
  Costas: {
    exercises: [
      { name: "Remada curvada", focus: "Squeeze nas escápulas" },
      { name: "Remada baixa", focus: "Cotovelos para trás" },
      { name: "Remada unilateral", focus: "Rotação mínima" },
      { name: "Remada cavalinho", focus: "Dorsais médios" },
      { name: "Remada T", focus: "Espessura das costas" },
      { name: "Puxada frontal", focus: "Contrair dorsais" },
      { name: "Puxada aberta", focus: "Largura das costas" },
      { name: "Puxada fechada", focus: "Dorsais inferiores" },
      { name: "Barra fixa", focus: "Subida controlada" },
      { name: "Barra fixa supinada", focus: "Bíceps auxiliar" },
      { name: "Pulldown", focus: "Dorsais ativados" },
      { name: "Pulldown corda", focus: "Contração no final" },
      { name: "Pullover", focus: "Alongamento dorsal" },
      { name: "Levantamento terra", focus: "Costas neutras" },
      { name: "Good morning", focus: "Eretores da espinha" },
      { name: "Hiperextensão", focus: "Lombar forte" },
    ],
    recoveryTips: ["60-90s descanso", "Alongar costas", "Foam roller"],
  },
  Pernas: {
    exercises: [
      { name: "Agachamento livre", focus: "Profundidade" },
      { name: "Agachamento frontal", focus: "Quadríceps" },
      { name: "Agachamento hack", focus: "Joelhos protegidos" },
      { name: "Agachamento búlgaro", focus: "Unilateral" },
      { name: "Leg press 45°", focus: "Joelhos alinhados" },
      { name: "Leg press horizontal", focus: "Amplitude total" },
      { name: "Extensora", focus: "Contração no topo" },
      { name: "Flexora deitado", focus: "Squeeze nos isquiotibiais" },
      { name: "Flexora sentado", focus: "Isquiotibiais" },
      { name: "Flexora em pé", focus: "Unilateral" },
      { name: "Stiff", focus: "Alongamento ativo" },
      { name: "Stiff romeno", focus: "Isquiotibiais" },
      { name: "Afundo", focus: "Equilíbrio" },
      { name: "Afundo caminhando", focus: "Coordenação" },
      { name: "Cadeira adutora", focus: "Adutores" },
      { name: "Cadeira abdutora", focus: "Abdutores" },
      { name: "Passada", focus: "Glúteos e quadríceps" },
    ],
    recoveryTips: ["2-3min descanso", "Hidratação", "Alongar bem"],
  },
  Ombros: {
    exercises: [
      { name: "Desenvolvimento militar", focus: "Core estável" },
      { name: "Desenvolvimento halteres", focus: "Não bloquear cotovelos" },
      { name: "Desenvolvimento Arnold", focus: "Rotação suave" },
      { name: "Desenvolvimento máquina", focus: "Movimento guiado" },
      { name: "Elevação lateral", focus: "Cotovelo acima da mão" },
      { name: "Elevação lateral cabo", focus: "Tensão constante" },
      { name: "Elevação frontal", focus: "Controle na descida" },
      { name: "Elevação frontal barra", focus: "Deltóide anterior" },
      { name: "Crucifixo inverso", focus: "Deltóide posterior" },
      { name: "Crucifixo inverso máquina", focus: "Isolamento posterior" },
      { name: "Face pull", focus: "Rotação externa" },
      { name: "Remada alta", focus: "Cuidado com ombros" },
      { name: "Shrug halteres", focus: "Trapézio superior" },
    ],
    recoveryTips: ["60s descanso", "Mobilidade de ombro", "Cuidado com peso"],
  },
  Braços: {
    exercises: [
      { name: "Rosca direta barra", focus: "Cotovelo fixo" },
      { name: "Rosca direta halteres", focus: "Supinação" },
      { name: "Rosca martelo", focus: "Braquial" },
      { name: "Rosca concentrada", focus: "Isolamento total" },
      { name: "Rosca Scott", focus: "Pico do bíceps" },
      { name: "Rosca cabo", focus: "Tensão constante" },
      { name: "Rosca inclinada", focus: "Alongamento máximo" },
      { name: "Tríceps corda", focus: "Extensão completa" },
      { name: "Tríceps barra", focus: "Carga pesada" },
      { name: "Tríceps testa", focus: "Cotovelos fixos" },
      { name: "Tríceps francês", focus: "Cabeça longa" },
      { name: "Tríceps kickback", focus: "Contração no topo" },
      { name: "Mergulho banco", focus: "Tríceps ativados" },
      { name: "Mergulho paralelas", focus: "Peito + tríceps" },
      { name: "Rosca 21", focus: "Pump máximo" },
    ],
    recoveryTips: ["45-60s descanso", "Supersets", "Pump máximo"],
  },
  Abdominais: {
    exercises: [
      { name: "Prancha frontal", focus: "Core contraído" },
      { name: "Prancha lateral", focus: "Oblíquos" },
      { name: "Crunch", focus: "Contrair abdominais" },
      { name: "Crunch inverso", focus: "Abdominais inferiores" },
      { name: "Crunch bicicleta", focus: "Oblíquos alternados" },
      { name: "Elevação de pernas", focus: "Sem momentum" },
      { name: "Elevação de pernas suspenso", focus: "Core total" },
      { name: "Russian twist", focus: "Oblíquos" },
      { name: "Ab wheel", focus: "Controle total" },
      { name: "Dead bug", focus: "Estabilidade" },
      { name: "Mountain climbers", focus: "Cardio + core" },
      { name: "Abdominal máquina", focus: "Carga progressiva" },
      { name: "Abdominal cabo", focus: "Resistência constante" },
      { name: "Hollow hold", focus: "Isométrico" },
    ],
    recoveryTips: ["30s descanso", "Respiração", "Qualidade > quantidade"],
  },
  Glúteos: {
    exercises: [
      { name: "Hip thrust barra", focus: "Squeeze no topo" },
      { name: "Hip thrust máquina", focus: "Movimento guiado" },
      { name: "Ponte de glúteos", focus: "Contração isométrica" },
      { name: "Ponte unilateral", focus: "Equilíbrio" },
      { name: "Kickback cabo", focus: "Glúteo máximo" },
      { name: "Kickback máquina", focus: "Isolamento" },
      { name: "Abdução máquina", focus: "Glúteo médio" },
      { name: "Abdução cabo", focus: "Tensão constante" },
      { name: "Sumo squat", focus: "Profundidade" },
      { name: "Step up", focus: "Força unilateral" },
      { name: "Reverse lunge", focus: "Glúteos alongados" },
      { name: "Frog pumps", focus: "Ativação rápida" },
    ],
    recoveryTips: ["60-90s descanso", "Ativação pré-treino", "Mind-muscle"],
  },
  Cardio: {
    exercises: [
      { name: "HIIT", focus: "Intensidade máxima" },
      { name: "Corrida leve", focus: "Zona cardíaca" },
      { name: "Corrida intervalada", focus: "Sprints" },
      { name: "Bike", focus: "Cadência constante" },
      { name: "Bike HIIT", focus: "Intervalos intensos" },
      { name: "Remo", focus: "Full body" },
      { name: "Elíptico", focus: "Baixo impacto" },
      { name: "Jump rope", focus: "Coordenação" },
      { name: "Escadas", focus: "Resistência" },
      { name: "Battle ropes", focus: "Upper body cardio" },
      { name: "Box jumps", focus: "Explosividade" },
      { name: "Burpees", focus: "Full body HIIT" },
    ],
    recoveryTips: ["Recuperação ativa", "Hidratação", "Alongamentos"],
  },
  Trapézio: {
    exercises: [
      { name: "Encolhimento barra", focus: "Squeeze no topo" },
      { name: "Encolhimento halteres", focus: "Amplitude total" },
      { name: "Encolhimento inclinado", focus: "Trapézio médio" },
      { name: "Remada alta", focus: "Cotovelos acima" },
      { name: "Face pull", focus: "Rotação externa" },
      { name: "Farmer walk", focus: "Grip forte" },
      { name: "Y raises", focus: "Trapézio inferior" },
      { name: "Prone Y raises", focus: "Estabilizadores" },
    ],
    recoveryTips: ["60s descanso", "Alongar pescoço", "Evitar peso excessivo"],
  },
  Antebraços: {
    exercises: [
      { name: "Rosca de punho", focus: "Controle total" },
      { name: "Rosca de punho inversa", focus: "Extensores" },
      { name: "Rosca inversa barra", focus: "Braquiorradial" },
      { name: "Farmer walk", focus: "Grip isométrico" },
      { name: "Dead hang", focus: "Resistência de grip" },
      { name: "Wrist roller", focus: "Movimento lento" },
      { name: "Pinch grip", focus: "Dedos fortes" },
      { name: "Plate pinch", focus: "Grip de pinça" },
      { name: "Towel pull-ups", focus: "Grip extremo" },
    ],
    recoveryTips: ["30-45s descanso", "Alongar punhos", "Massagem"],
  },
  Panturrilhas: {
    exercises: [
      { name: "Elevação em pé máquina", focus: "Contração no topo" },
      { name: "Elevação em pé Smith", focus: "Estabilidade" },
      { name: "Elevação sentado", focus: "Sóleo" },
      { name: "Elevação unilateral", focus: "Equilíbrio" },
      { name: "Donkey calf raise", focus: "Alongamento máximo" },
      { name: "Elevação no leg press", focus: "Carga pesada" },
      { name: "Jump rope", focus: "Explosividade" },
      { name: "Box jumps", focus: "Potência" },
    ],
    recoveryTips: ["45-60s descanso", "Alongar bem", "Volume alto"],
  },
  "Full Body": {
    exercises: [
      { name: "Deadlift", focus: "Costas neutras" },
      { name: "Deadlift sumo", focus: "Quadris abertos" },
      { name: "Clean and press", focus: "Explosividade" },
      { name: "Clean and jerk", focus: "Potência total" },
      { name: "Snatch", focus: "Técnica perfeita" },
      { name: "Burpees", focus: "Ritmo constante" },
      { name: "Turkish get-up", focus: "Controle total" },
      { name: "Thrusters", focus: "Fluidez" },
      { name: "Kettlebell swing", focus: "Quadril" },
      { name: "Man makers", focus: "Complexo total" },
      { name: "Devil press", focus: "Cardio + força" },
      { name: "Bear crawl", focus: "Coordenação" },
    ],
    recoveryTips: ["2-3min descanso", "Hidratação", "Nutrição pós-treino"],
  },
  Descanso: {
    exercises: [
      { name: "Alongamentos", focus: "Relaxar músculos" },
      { name: "Yoga leve", focus: "Flexibilidade" },
      { name: "Caminhada", focus: "Recuperação ativa" },
      { name: "Foam roller", focus: "Liberação miofascial" },
      { name: "Meditação", focus: "Recuperação mental" },
      { name: "Natação leve", focus: "Zero impacto" },
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
