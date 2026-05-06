import {
  exerciseCatalog,
  type CatalogExercise,
  type Equipment,
} from "@/data/exerciseCatalog";

/**
 * Find catalog alternatives for a given exercise name (PT match, case-insensitive).
 * Filters by available equipment when provided.
 * Returns up to 3 alternatives that share at least one primary muscle group.
 */
export function getAlternativesForExercise(
  exerciseName: string,
  availableEquipment: Equipment[] = []
): CatalogExercise[] {
  const normalised = exerciseName.toLowerCase().trim();

  // Find the source exercise by PT name
  const source = exerciseCatalog.find(
    (e) =>
      e.name.pt.toLowerCase() === normalised ||
      e.name.en.toLowerCase() === normalised ||
      e.id === normalised
  );

  if (!source) {
    // Fallback: fuzzy match by muscle group name guess from the exercise title
    return getFallbackAlternatives(exerciseName, availableEquipment);
  }

  return filterAlternatives(source, availableEquipment);
}

/** When the exercise is not in the catalog, guess muscle group and find alternatives. */
function getFallbackAlternatives(
  name: string,
  availableEquipment: Equipment[]
): CatalogExercise[] {
  const lower = name.toLowerCase();

  let muscleGuess: string | null = null;
  if (/supino|chest|pec|crucifixo|flexões|push.up/.test(lower)) muscleGuess = "Peito";
  else if (/remada|pull|barra fixa|dorsais|costas|deadlift/.test(lower)) muscleGuess = "Costas";
  else if (/agachamento|squat|leg press|lunge|afundo|perna|quad|isquio|hamstring/.test(lower)) muscleGuess = "Pernas";
  else if (/ombro|delt|press|develop|elevação|shoulder/.test(lower)) muscleGuess = "Ombros";
  else if (/rosca|bicep|curl/.test(lower)) muscleGuess = "Bíceps";
  else if (/tríceps|tricep|extensão|skull/.test(lower)) muscleGuess = "Tríceps";
  else if (/abdom|plank|prancha|core|crunch|russian/.test(lower)) muscleGuess = "Core";
  else if (/glúteo|hip thrust|ponte|kickback|gluteo/.test(lower)) muscleGuess = "Glúteos";

  if (!muscleGuess) return [];

  const candidates = exerciseCatalog.filter(
    (e) =>
      e.muscleGroups.includes(muscleGuess!) &&
      (availableEquipment.length === 0 ||
        e.equipment.some((eq) => availableEquipment.includes(eq)))
  );

  return candidates.slice(0, 3);
}

function filterAlternatives(
  source: CatalogExercise,
  availableEquipment: Equipment[]
): CatalogExercise[] {
  // First: declared alternatives in the catalog that match equipment
  const declaredAlts = source.alternatives
    .map((id) => exerciseCatalog.find((e) => e.id === id))
    .filter((e): e is CatalogExercise => e !== undefined)
    .filter(
      (e) =>
        availableEquipment.length === 0 ||
        e.equipment.some((eq) => availableEquipment.includes(eq))
    );

  if (declaredAlts.length >= 3) return declaredAlts.slice(0, 3);

  // If not enough, add from catalog by muscle match
  const used = new Set([source.id, ...declaredAlts.map((e) => e.id)]);
  const extras = exerciseCatalog
    .filter(
      (e) =>
        !used.has(e.id) &&
        e.muscleGroups.some((m) => source.muscleGroups.includes(m)) &&
        (availableEquipment.length === 0 ||
          e.equipment.some((eq) => availableEquipment.includes(eq)))
    )
    .slice(0, 3 - declaredAlts.length);

  return [...declaredAlts, ...extras].slice(0, 3);
}

/** Parse available_equipment from alerts_config JSON */
export function parseEquipmentFromConfig(
  alertsConfig: Record<string, unknown> | null
): Equipment[] {
  if (!alertsConfig?.available_equipment) return [];
  const raw = alertsConfig.available_equipment;
  if (!Array.isArray(raw)) return [];
  return raw as Equipment[];
}

export const ALL_EQUIPMENT_OPTIONS: Array<{ value: Equipment; label: string; emoji: string }> = [
  { value: "barra", label: "Barra olímpica", emoji: "🏋️" },
  { value: "halteres", label: "Halteres", emoji: "💪" },
  { value: "máquina", label: "Máquinas", emoji: "⚙️" },
  { value: "cabo", label: "Cabos / polias", emoji: "🔗" },
  { value: "kettlebell", label: "Kettlebells", emoji: "🔔" },
  { value: "corpo livre", label: "Corpo livre", emoji: "🤸" },
  { value: "elástico", label: "Bandas elásticas", emoji: "🩱" },
  { value: "banco", label: "Banco / step", emoji: "🪑" },
  { value: "barra fixa", label: "Barra fixa", emoji: "🎯" },
  { value: "paralelas", label: "Paralelas", emoji: "🔲" },
  { value: "smith", label: "Máquina Smith", emoji: "🏗️" },
];
