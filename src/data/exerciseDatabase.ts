// Database of exercises organized by muscle group

export interface Exercise {
  name: string;
  focus: string;
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
      { name: "Flexão", focus: "Controle do movimento" },
    ],
    recoveryTips: ["90s descanso", "2min entre séries", "Alongar peitoral"],
  },
  Costas: {
    exercises: [
      { name: "Puxada frontal", focus: "Contrair dorsais" },
      { name: "Remada curvada", focus: "Squeeze nas escápulas" },
      { name: "Remada unilateral", focus: "Rotação mínima" },
      { name: "Pull-up", focus: "Subida controlada" },
      { name: "Hiperextensão", focus: "Lombar forte" },
      { name: "Levantamento terra", focus: "Costas neutras" },
    ],
    recoveryTips: ["60-90s descanso", "Alongar costas", "Foam roller"],
  },
  Pernas: {
    exercises: [
      { name: "Agachamento", focus: "Profundidade" },
      { name: "Leg press", focus: "Joelhos alinhados" },
      { name: "Cadeira extensora", focus: "Contração no topo" },
      { name: "Cadeira flexora", focus: "Squeeze nos isquiotibiais" },
      { name: "Afundo", focus: "Equilíbrio" },
      { name: "Stiff", focus: "Alongamento ativo" },
      { name: "Panturrilha em pé", focus: "Contração no topo" },
      { name: "Agachamento sumô", focus: "Adutores e glúteos" },
    ],
    recoveryTips: ["2-3min descanso", "Hidratação", "Alongar bem"],
  },
  Ombros: {
    exercises: [
      { name: "Desenvolvimento", focus: "Core estável" },
      { name: "Elevação lateral", focus: "Cotovelo acima da mão" },
      { name: "Elevação frontal", focus: "Controle na descida" },
      { name: "Remada alta", focus: "Cuidado com ombros" },
      { name: "Encolhimento", focus: "Trapézio superior" },
    ],
    recoveryTips: ["60s descanso", "Mobilidade de ombro", "Cuidado com peso"],
  },
  Bíceps: {
    exercises: [
      { name: "Rosca direta", focus: "Cotovelo fixo" },
      { name: "Rosca martelo", focus: "Braquial" },
      { name: "Rosca concentrada", focus: "Isolamento total" },
      { name: "Rosca no cabo", focus: "Tensão constante" },
      { name: "Rosca Scott", focus: "Pico do bíceps" },
    ],
    recoveryTips: ["45-60s descanso", "Supersets", "Pump máximo"],
  },
  Tríceps: {
    exercises: [
      { name: "Tríceps na polia", focus: "Extensão completa" },
      { name: "Tríceps testa", focus: "Cotovelos fixos" },
      { name: "Tríceps francês", focus: "Cabeça longa" },
      { name: "Mergulho", focus: "Tríceps ativados" },
      { name: "Extensão overhead", focus: "Alongamento máximo" },
    ],
    recoveryTips: ["45-60s descanso", "Supersets", "Pump máximo"],
  },
  Core: {
    exercises: [
      { name: "Prancha", focus: "Core contraído" },
      { name: "Abdominal crunch", focus: "Contrair abdominais" },
      { name: "Abdominal oblíquo", focus: "Oblíquos alternados" },
      { name: "Elevação de pernas", focus: "Sem momentum" },
      { name: "Russian twist", focus: "Oblíquos" },
      { name: "Prancha lateral", focus: "Equilíbrio lateral" },
    ],
    recoveryTips: ["30s descanso", "Respiração", "Qualidade > quantidade"],
  },
  Cardio: {
    exercises: [
      { name: "Esteira", focus: "Zona cardíaca" },
      { name: "Bicicleta", focus: "Cadência constante" },
      { name: "Corda", focus: "Coordenação" },
      { name: "Elíptico", focus: "Baixo impacto" },
      { name: "Remo", focus: "Full body" },
      { name: "HIIT", focus: "Intensidade máxima" },
      { name: "Burpees", focus: "Full body HIIT" },
    ],
    recoveryTips: ["Recuperação ativa", "Hidratação", "Alongamentos"],
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

export const getRandomExercise = (muscleGroup: string): Exercise | null => {
  const data = exerciseDatabase[muscleGroup];
  if (!data || data.exercises.length === 0) return null;
  return data.exercises[Math.floor(Math.random() * data.exercises.length)];
};

export const getRandomRecoveryTip = (muscleGroup: string): string => {
  const data = exerciseDatabase[muscleGroup];
  if (!data || data.recoveryTips.length === 0) return "90s descanso";
  return data.recoveryTips[Math.floor(Math.random() * data.recoveryTips.length)];
};

export const getExercisesForGroups = (groups: string[]): Exercise[] => {
  const exercises: Exercise[] = [];
  groups.forEach(group => {
    const data = exerciseDatabase[group];
    if (data) exercises.push(...data.exercises);
  });
  return exercises;
};

export const getSuggestedExercise = (groups: string[] | null): { exercise: Exercise | null; focus: string } => {
  if (!groups || groups.length === 0 || groups[0] === "Descanso") {
    return { exercise: { name: "Alongamentos", focus: "Relaxar" }, focus: "Recuperação" };
  }
  const randomGroup = groups[Math.floor(Math.random() * groups.length)];
  const exercise = getRandomExercise(randomGroup);
  return { exercise, focus: exercise?.focus || "Forma perfeita" };
};

export const getRecoverySuggestion = (groups: string[] | null): string => {
  if (!groups || groups.length === 0 || groups[0] === "Descanso") return "Descanso total";
  return getRandomRecoveryTip(groups[Math.floor(Math.random() * groups.length)]);
};
