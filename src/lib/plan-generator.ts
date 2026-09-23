import { loadExercises, searchExercises, type Exercise } from "@/lib/exercises";

/**
 * KOVA's local AI plan generator.
 *
 * Turns the onboarding answers into a real, structured training plan using the
 * actual exercise catalog (real names, GIFs, instructions). Deterministic: same
 * answers produce the same plan. Programming follows standard strength &
 * conditioning practice:
 * - Sessions are built around movement patterns (squat, hinge, push, pull...),
 *   compound lifts first, isolation later.
 * - Rep ranges and rest scale with the goal: strength 3–6 reps with long rest,
 *   muscle growth 6–12 on compounds / 10–15 on isolation, fat loss and
 *   endurance higher reps with short rest.
 * - Arm work matches the session type: triceps on push days, biceps on pull days.
 * - Beginners get machine/dumbbell-first picks and lower volume; advanced
 *   lifters get barbell-first picks and more sets.
 * - Only exercises matching the available equipment are used, and movements the
 *   athlete flagged (limitations/preferences) are excluded.
 */

export type PlanBlueprint = {
  name: string;
  days: Array<{
    dayOfWeek: number;
    title: string;
    durationMinutes: number;
    focus: string;
    exercises: Array<{ exercise: Exercise; sets: number; reps: string; restSeconds: number; note?: string }>;
  }>;
  summary: string[];
};

type Answers = Record<string, string>;
type Experience = "beginner" | "intermediate" | "advanced";

const WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** Muscle-group slots each workout fills, ordered by training priority. */
type Slot =
  | "push"
  | "horizontal-push"
  | "chest-fly"
  | "pull"
  | "vertical-pull"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "squat"
  | "single-leg"
  | "hinge"
  | "glutes"
  | "core"
  | "conditioning"
  | "mobility";

const SLOT_QUERIES: Record<Slot, string> = {
  push: "chest",
  "horizontal-push": "chest",
  "chest-fly": "fly",
  pull: "back",
  "vertical-pull": "lat",
  shoulders: "shoulders",
  biceps: "biceps",
  triceps: "triceps",
  squat: "quadriceps",
  "single-leg": "quadriceps",
  hinge: "hamstrings",
  glutes: "glutes",
  core: "abdominals",
  conditioning: "cardio",
  mobility: "stretching",
};

/** Slots that load the spine or move heavy load — these get the lower-rep schemes. */
const COMPOUND_SLOTS: Slot[] = ["push", "horizontal-push", "pull", "vertical-pull", "squat", "single-leg", "hinge", "shoulders"];

function hasEquipment(exercise: Exercise, location: string): boolean {
  const equipment = exercise.equipment.map((item) => item.toLowerCase());
  if (location === "Gym") return true;
  if (location === "Home") {
    return equipment.every((item) => item === "bodyweight" || item.includes("dumbbell") || item.includes("band") || item.includes("mat") || item.includes("bench"));
  }
  if (location === "Home + Gym") return true;
  // No equipment / bodyweight
  return equipment.every((item) => item === "bodyweight");
}

function pickBest(catalog: Exercise[], slot: Slot, answers: Answers, used: Set<string>, experience: Experience): Exercise | null {
  const query = SLOT_QUERIES[slot];
  let pool = searchExercises(catalog, query);
  const location = answers.location ?? "Gym";
  pool = pool.filter((exercise) => hasEquipment(exercise, location));

  // Exclude movements the athlete flagged.
  const limitations = (answers.limitations ?? "").toLowerCase();
  const dislikes = (answers.preferences ?? "").toLowerCase();
  if (limitations || dislikes) {
    pool = pool.filter((exercise) => {
      const haystack = `${exercise.name} ${exercise.targetMuscles.join(" ")} ${exercise.equipment.join(" ")}`.toLowerCase();
      for (const term of [...limitations.split(/[,\n.;]+/), ...dislikes.split(/[,.;\n]+/)]) {
        const clean = term.trim();
        if (clean.length > 2 && haystack.includes(clean)) return false;
      }
      return true;
    });
  }

  const fresh = pool.filter((exercise) => !used.has(exercise.id));
  const candidates = fresh.length ? fresh : pool;
  if (!candidates.length) return null;
  // Deterministic pick. Beginners learn on machines and dumbbells first (more
  // stable, easier to groove); experienced lifters get barbell work first.
  const weight = (exercise: Exercise) => {
    const equipment = exercise.equipment.join(" ").toLowerCase();
    let score = 0;
    if (equipment.includes("barbell")) score += experience === "beginner" ? 2 : -3;
    if (equipment.includes("dumbbell")) score -= 2;
    if (equipment.includes("machine") || equipment.includes("cable")) score -= experience === "beginner" ? 3 : 1;
    if (exercise.bodyParts.includes("waist")) score -= 1;
    return score;
  };
  return [...candidates].sort((a, b) => weight(a) - weight(b) || a.name.localeCompare(b.name))[0] ?? null;
}

function parseDuration(answers: Answers): number {
  const raw = answers.duration ?? "";
  const match = raw.match(/(\d+)/);
  if (match) return Math.min(120, Math.max(20, Number(match[1])));
  return 60;
}

function parseDays(answers: Answers): number {
  const raw = answers.availability ?? "";
  if (raw.includes("6")) return 6;
  const match = raw.match(/(\d+)/);
  if (match) return Math.min(6, Math.max(2, Number(match[1])));
  return 3;
}

function parseExperience(answers: Answers): Experience {
  const value = (answers.experience ?? "").toLowerCase();
  if (value.includes("beginner") || value.includes("don't know") || value.includes("not yet")) return "beginner";
  if (value.includes("advanced")) return "advanced";
  if (value.includes("intermediate")) return "intermediate";
  return "intermediate";
}

function chooseDayIndices(count: number, preferred: string): number[] {
  // Spread training days across the week around the preferred days the user listed.
  const named = WEEK.map((day, index) => ({ day, index })).filter(({ day }) =>
    preferred.toLowerCase().includes(day.toLowerCase().slice(0, 3)),
  );
  const indices = named.map((entry) => entry.index);
  const spreadPatterns: Record<number, number[]> = {
    2: [1, 4],
    3: [1, 3, 5],
    4: [0, 2, 4, 6],
    5: [0, 1, 3, 4, 6],
    6: [0, 1, 2, 4, 5, 6],
  };
  const base = spreadPatterns[Math.min(6, Math.max(2, count))] ?? spreadPatterns[3];
  const merged = [...new Set([...(indices.length ? indices : base)])].sort((a, b) => a - b);
  while (merged.length > count) merged.pop();
  let cursor = 0;
  while (merged.length < count) {
    if (!merged.includes(base[cursor % base.length])) merged.push(base[cursor % base.length]);
    cursor += 1;
    if (cursor > 14) break;
  }
  return merged.sort((a, b) => a - b).slice(0, count);
}

function setsAndReps(slot: Slot, experience: Experience, goal: string): { sets: number; reps: string; rest: number } {
  const value = goal.toLowerCase();
  const strengthGoal = /strength|strong/.test(value);
  const enduranceGoal = /endurance/.test(value);
  const fatLoss = /fat/.test(value);
  const isCore = slot === "core" || slot === "mobility" || slot === "conditioning";
  const isCompound = COMPOUND_SLOTS.includes(slot);

  // Core, conditioning and mobility work stays light and controlled.
  if (isCore) return { sets: 3, reps: experience === "beginner" ? "10-12" : "12-15", rest: 45 };

  // Maximal strength: low reps, full recovery between sets.
  if (strengthGoal && isCompound) {
    return experience === "beginner" ? { sets: 3, reps: "5", rest: 150 } : { sets: 4, reps: "3-5", rest: 180 };
  }

  // Fat loss and muscular endurance: denser sets, short rests, higher reps.
  if (enduranceGoal || fatLoss) {
    return isCompound ? { sets: 3, reps: "10-12", rest: 60 } : { sets: 3, reps: "12-15", rest: 45 };
  }

  // Muscle growth (default): compounds heavier, isolation lighter with short rest.
  if (isCompound) {
    if (experience === "beginner") return { sets: 3, reps: "8-10", rest: 90 };
    if (experience === "advanced") return { sets: 4, reps: "6-10", rest: 150 };
    return { sets: 4, reps: "8-12", rest: 120 };
  }
  if (experience === "beginner") return { sets: 2, reps: "10-12", rest: 60 };
  return { sets: 3, reps: "10-15", rest: 60 };
}

function slotNote(slot: Slot, experience: Experience): string {
  if (COMPOUND_SLOTS.includes(slot)) {
    return experience === "beginner"
      ? "Main lift — start light and master the form; the weight will follow."
      : "Main lift — add 2.5 kg once you complete every set with clean form.";
  }
  if (slot === "core" || slot === "conditioning" || slot === "mobility") {
    return "Move with control — quality over speed.";
  }
  return "Isolation — keep 1–2 reps in reserve on every set.";
}

/** The split template per weekly training frequency. */
function splitFor(count: number, goal: string): Array<{ title: string; slots: Slot[] }> {
  const fatLoss = goal.toLowerCase().includes("fat");
  if (count <= 2) {
    return [
      { title: "Full body A", slots: fatLoss ? ["squat", "push", "pull", "core", "conditioning"] : ["squat", "push", "pull", "core"] },
      { title: "Full body B", slots: fatLoss ? ["hinge", "shoulders", "vertical-pull", "core", "conditioning"] : ["hinge", "shoulders", "vertical-pull", "core"] },
    ];
  }
  if (count === 3) {
    return [
      { title: "Push day", slots: ["horizontal-push", "chest-fly", "shoulders", "triceps"] },
      { title: "Pull day", slots: ["pull", "vertical-pull", "pull", "biceps"] },
      { title: "Leg day", slots: ["squat", "hinge", "single-leg", "glutes", "core"] },
    ];
  }
  if (count === 4) {
    return [
      { title: "Upper body strength", slots: ["push", "pull", "shoulders", "vertical-pull"] },
      { title: "Lower body strength", slots: ["squat", "hinge", "single-leg", "core"] },
      { title: "Upper body volume", slots: ["horizontal-push", "vertical-pull", "chest-fly", "triceps", "biceps"] },
      { title: "Lower body volume", slots: ["hinge", "glutes", "squat", "core"] },
    ];
  }
  if (count === 5) {
    return [
      { title: "Push day", slots: ["horizontal-push", "chest-fly", "shoulders", "triceps"] },
      { title: "Pull day", slots: ["pull", "vertical-pull", "pull", "biceps"] },
      { title: "Leg day", slots: ["squat", "hinge", "single-leg", "core"] },
      { title: "Upper body pump", slots: ["push", "vertical-pull", "triceps", "biceps"] },
      { title: "Glutes & core", slots: ["glutes", "hinge", "core", "conditioning"] },
    ];
  }
  return [
    { title: "Push day", slots: ["horizontal-push", "chest-fly", "shoulders", "triceps"] },
    { title: "Pull day", slots: ["pull", "vertical-pull", "biceps"] },
    { title: "Leg day", slots: ["squat", "hinge", "core"] },
    { title: "Upper body volume", slots: ["horizontal-push", "vertical-pull", "triceps", "biceps"] },
    { title: "Lower body volume", slots: ["single-leg", "glutes", "core"] },
    { title: "Conditioning & core", slots: ["conditioning", "core", "mobility"] },
  ];
}

function planName(answers: Answers): string {
  const goal = answers.goal ?? "General fitness";
  const days = parseDays(answers);
  const experience = parseExperience(answers);
  const level = experience === "beginner" ? "Foundation" : experience === "advanced" ? "Performance" : "Progression";
  return `${goal} · ${level} · ${days} days`;
}

export async function generatePlanBlueprint(answers: Answers): Promise<PlanBlueprint> {
  const catalog = await loadExercises();
  const days = parseDays(answers);
  const experience = parseExperience(answers);
  const goal = answers.goal ?? "General fitness";
  const duration = parseDuration(answers);
  const split = splitFor(days, goal);

  // Core slot budget: keep total session length inside the available time.
  const minutesPerExercise = 8;
  const maxExercises = Math.max(3, Math.min(8, Math.floor(duration / minutesPerExercise)));

  const used = new Set<string>();
  const dayIndices = chooseDayIndices(days, answers.days ?? "");

  const planDays = split.map((template, position) => {
    const exercises: PlanBlueprint["days"][number]["exercises"] = [];
    for (const slot of template.slots.slice(0, maxExercises)) {
      const exercise = pickBest(catalog, slot, answers, used, experience);
      if (!exercise) continue;
      used.add(exercise.id);
      const { sets, reps, rest } = setsAndReps(slot, experience, goal);
      exercises.push({ exercise, sets, reps, restSeconds: rest, note: slotNote(slot, experience) });
    }
    // Guarantee a usable session even when the catalog filter leaves gaps.
    if (!exercises.length) {
      const fallback = searchExercises(catalog, "bodyweight").slice(0, 4);
      for (const exercise of fallback) {
        const { sets, reps, rest } = setsAndReps("push", experience, goal);
        exercises.push({ exercise, sets, reps, restSeconds: rest, note: slotNote("push", experience) });
      }
    }
    return {
      dayOfWeek: dayIndices[position] ?? position,
      title: template.title,
      durationMinutes: duration,
      focus: template.slots.join(", "),
      exercises,
    };
  });

  const summary = [
    `${days} training days per week around your schedule.`,
    `${experience === "beginner" ? "Technique-first" : experience === "advanced" ? "Performance-driven" : "Balanced"} sets and reps tuned for ${goal.toLowerCase()}.`,
    `Every workout fits inside ${duration} minutes.`,
    "Progression: when you hit the top of a rep range on all sets, add 2.5–5 kg next session.",
    locationNote(answers),
  ];

  return { name: planName(answers), days: planDays, summary };
}

function locationNote(answers: Answers): string {
  const location = answers.location ?? "Gym";
  if (location === "Gym") return "Built around full gym equipment.";
  if (location === "Home") return "Uses dumbbells, bands and bodyweight only.";
  if (location === "Home + Gym") return "Mixes home sessions and gym sessions.";
  return "Bodyweight only — no equipment needed.";
}
