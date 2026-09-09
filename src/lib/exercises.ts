export type Exercise = {
  id: string;
  name: string;
  gif: string;
  targetMuscles: string[];
  secondaryMuscles: string[];
  bodyParts: string[];
  equipment: string[];
  instructions: string[];
};

const DATA_URL = "https://raw.githubusercontent.com/mohamedatef90/exercise-library/main/exercises.json";
const GIF_BASE_URL = "https://raw.githubusercontent.com/mohamedatef90/exercise-library/main/gifs";
let catalogPromise: Promise<Exercise[]> | null = null;

export function exerciseGifUrl(exercise: Pick<Exercise, "gif">) {
  return `${GIF_BASE_URL}/${encodeURIComponent(exercise.gif)}`;
}

export function loadExercises() {
  if (!catalogPromise) {
    catalogPromise = fetch(DATA_URL).then(async (response) => {
      if (!response.ok) throw new Error("The exercise catalog could not be loaded.");
      return (await response.json()) as Exercise[];
    });
  }
  return catalogPromise;
}

export function searchExercises(exercises: Exercise[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return exercises;
  return exercises.filter((exercise) =>
    [exercise.name, ...exercise.targetMuscles, ...exercise.secondaryMuscles, ...exercise.bodyParts, ...exercise.equipment]
      .join(" ")
      .toLowerCase()
      .includes(normalized),
  );
}
