import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_EXERCISES } from '@/constants/default-exercises';
import {
  DailyWorkout,
  ExerciseDefinition,
  WeightUnit,
} from '@/types/workout';
import { getTodayDateString, addDays } from '@/utils/date-helpers';

const STORAGE_KEYS = {
  WORKOUTS: '@workout_app_workouts_v2',
  EXERCISES: '@workout_app_exercises_v2',
  UNIT_PREF: '@workout_app_unit_v2',
  SEEDED: '@workout_app_seeded_v2',
};

export async function getStoredWorkouts(): Promise<DailyWorkout[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUTS);
    if (!json) return [];
    const list: DailyWorkout[] = JSON.parse(json);
    return list.sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    console.error('Failed to load workouts from storage:', error);
    return [];
  }
}

export async function getWorkoutByDate(date: string): Promise<DailyWorkout | null> {
  const workouts = await getStoredWorkouts();
  return workouts.find((w) => w.date === date) || null;
}

export async function saveWorkout(workout: DailyWorkout): Promise<void> {
  try {
    const workouts = await getStoredWorkouts();
    const existingIndex = workouts.findIndex((w) => w.date === workout.date);
    
    let updated: DailyWorkout[];
    const workoutToSave: DailyWorkout = {
      ...workout,
      updatedAt: Date.now(),
    };

    if (existingIndex >= 0) {
      updated = [...workouts];
      updated[existingIndex] = workoutToSave;
    } else {
      updated = [workoutToSave, ...workouts];
    }

    // Filter out completely empty workouts (no exercises, no runs, no notes)
    updated = updated.filter(
      (w) =>
        (w.exercises && w.exercises.length > 0) ||
        (w.runs && w.runs.length > 0) ||
        (w.generalNotes && w.generalNotes.trim().length > 0)
    );

    await AsyncStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save workout:', error);
    throw error;
  }
}

export async function deleteWorkout(date: string): Promise<void> {
  try {
    const workouts = await getStoredWorkouts();
    const filtered = workouts.filter((w) => w.date !== date);
    await AsyncStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete workout:', error);
    throw error;
  }
}

export async function getStoredExercises(): Promise<ExerciseDefinition[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.EXERCISES);
    if (!json) {
      // Return defaults and persist
      await AsyncStorage.setItem(
        STORAGE_KEYS.EXERCISES,
        JSON.stringify(DEFAULT_EXERCISES)
      );
      return DEFAULT_EXERCISES;
    }
    const parsed: ExerciseDefinition[] = JSON.parse(json);
    return parsed;
  } catch (error) {
    console.error('Failed to load exercises:', error);
    return DEFAULT_EXERCISES;
  }
}

export async function saveExercise(exercise: ExerciseDefinition): Promise<ExerciseDefinition[]> {
  try {
    const list = await getStoredExercises();
    const index = list.findIndex((e) => e.id === exercise.id);
    let updated: ExerciseDefinition[];
    if (index >= 0) {
      updated = [...list];
      updated[index] = exercise;
    } else {
      updated = [...list, exercise];
    }
    await AsyncStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Failed to save exercise:', error);
    throw error;
  }
}

export async function deleteExercise(id: string): Promise<ExerciseDefinition[]> {
  try {
    const list = await getStoredExercises();
    const filtered = list.filter((e) => e.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(filtered));
    return filtered;
  } catch (error) {
    console.error('Failed to delete exercise:', error);
    throw error;
  }
}

export async function getPreferredWeightUnit(): Promise<WeightUnit> {
  try {
    const unit = await AsyncStorage.getItem(STORAGE_KEYS.UNIT_PREF);
    return unit === 'lbs' ? 'lbs' : 'kg';
  } catch {
    return 'kg';
  }
}

export async function setPreferredWeightUnit(unit: WeightUnit): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.UNIT_PREF, unit);
}

/**
 * Finds the latest performance (weight, reps, sets) for a given exercise before a specific date.
 * Useful to show "Previous: 80 kg × 10" in the set table!
 */
export async function getLastExercisePerformance(
  exerciseId: string,
  beforeDate?: string
): Promise<string | null> {
  const workouts = await getStoredWorkouts();
  for (const w of workouts) {
    if (beforeDate && w.date >= beforeDate) continue;
    const foundEx = w.exercises?.find((e) => e.exerciseId === exerciseId);
    if (foundEx && foundEx.sets && foundEx.sets.length > 0) {
      const bestSet = foundEx.sets.reduce((max, s) => (s.weight > max.weight ? s : max), foundEx.sets[0]);
      return `${bestSet.weight} ${foundEx.weightUnit || 'kg'} × ${bestSet.reps}`;
    }
  }
  return null;
}

/**
 * Seeds sample workouts if storage is empty, so user can see immediate history,
 * filter them (1 day, 1 week, 1 month, all), and test the AI report generator immediately!
 */
export async function seedDemoDataIfEmpty(): Promise<void> {
  try {
    const seeded = await AsyncStorage.getItem(STORAGE_KEYS.SEEDED);
    if (seeded) return;

    const existingWorkouts = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUTS);
    if (existingWorkouts && JSON.parse(existingWorkouts).length > 0) {
      await AsyncStorage.setItem(STORAGE_KEYS.SEEDED, 'true');
      return;
    }

    const today = getTodayDateString();
    const twoDaysAgo = addDays(today, -2);
    const fiveDaysAgo = addDays(today, -5);
    const twoWeeksAgo = addDays(today, -14);

    const demoWorkouts: DailyWorkout[] = [
      {
        id: `workout_${today}`,
        date: today,
        title: 'Chest & Triceps Power',
        generalNotes: 'Felt strong on bench press! Hit 85kg for 8 reps cleanly.',
        energyRating: 5,
        durationMinutes: 55,
        updatedAt: Date.now(),
        exercises: [
          {
            id: 'ex-1',
            exerciseId: 'bench-press',
            exerciseName: 'Bench Press (Barbell)',
            category: 'Chest',
            type: 'strength',
            weightUnit: 'kg',
            sets: [
              { id: 's1', setNumber: 1, type: 'warmup', weight: 60, reps: 12, completed: true },
              { id: 's2', setNumber: 2, type: 'normal', weight: 80, reps: 10, completed: true, rpe: 8 },
              { id: 's3', setNumber: 3, type: 'normal', weight: 85, reps: 8, completed: true, rpe: 9 },
              { id: 's4', setNumber: 4, type: 'drop', weight: 70, reps: 12, completed: true, rpe: 9 },
            ],
          },
          {
            id: 'ex-2',
            exerciseId: 'incline-dumbbell-press',
            exerciseName: 'Incline Dumbbell Press',
            category: 'Chest',
            type: 'strength',
            weightUnit: 'kg',
            sets: [
              { id: 's5', setNumber: 1, type: 'normal', weight: 28, reps: 10, completed: true, rpe: 8 },
              { id: 's6', setNumber: 2, type: 'normal', weight: 30, reps: 8, completed: true, rpe: 8.5 },
              { id: 's7', setNumber: 3, type: 'normal', weight: 30, reps: 8, completed: true, rpe: 9 },
            ],
          },
          {
            id: 'ex-3',
            exerciseId: 'tricep-pushdown',
            exerciseName: 'Tricep Rope Pushdown',
            category: 'Arms',
            type: 'strength',
            weightUnit: 'kg',
            sets: [
              { id: 's8', setNumber: 1, type: 'normal', weight: 25, reps: 15, completed: true },
              { id: 's9', setNumber: 2, type: 'normal', weight: 30, reps: 12, completed: true },
              { id: 's10', setNumber: 3, type: 'failure', weight: 32.5, reps: 10, completed: true },
            ],
          },
        ],
        runs: [
          {
            id: 'run-1',
            exerciseId: 'outdoor-run',
            exerciseName: 'Outdoor Run',
            category: 'Cardio',
            type: 'cardio',
            distance: 4.5,
            distanceUnit: 'km',
            durationMinutes: 24,
            durationSeconds: 15,
            pace: "5'23\" /km",
            calories: 320,
            avgHeartRate: 152,
            notes: 'Post-workout cooldown run around the park. Easy aerobic pace.',
          },
        ],
      },
      {
        id: `workout_${twoDaysAgo}`,
        date: twoDaysAgo,
        title: 'Back, Biceps & Fast 5K',
        generalNotes: 'Deadlifts felt solid. Kept form tight.',
        energyRating: 4,
        durationMinutes: 65,
        updatedAt: Date.now() - 2 * 86400000,
        exercises: [
          {
            id: 'ex-4',
            exerciseId: 'deadlift',
            exerciseName: 'Deadlift (Barbell)',
            category: 'Back',
            type: 'strength',
            weightUnit: 'kg',
            sets: [
              { id: 's11', setNumber: 1, type: 'warmup', weight: 100, reps: 8, completed: true },
              { id: 's12', setNumber: 2, type: 'normal', weight: 130, reps: 6, completed: true, rpe: 8 },
              { id: 's13', setNumber: 3, type: 'normal', weight: 140, reps: 5, completed: true, rpe: 8.5 },
            ],
          },
          {
            id: 'ex-5',
            exerciseId: 'barbell-row',
            exerciseName: 'Bent Over Barbell Row',
            category: 'Back',
            type: 'strength',
            weightUnit: 'kg',
            sets: [
              { id: 's14', setNumber: 1, type: 'normal', weight: 70, reps: 10, completed: true },
              { id: 's15', setNumber: 2, type: 'normal', weight: 75, reps: 8, completed: true },
              { id: 's16', setNumber: 3, type: 'normal', weight: 75, reps: 8, completed: true },
            ],
          },
          {
            id: 'ex-6',
            exerciseId: 'barbell-curl',
            exerciseName: 'Barbell Bicep Curl',
            category: 'Arms',
            type: 'strength',
            weightUnit: 'kg',
            sets: [
              { id: 's17', setNumber: 1, type: 'normal', weight: 32.5, reps: 10, completed: true },
              { id: 's18', setNumber: 2, type: 'normal', weight: 35, reps: 8, completed: true },
            ],
          },
        ],
        runs: [
          {
            id: 'run-2',
            exerciseId: 'outdoor-run',
            exerciseName: 'Outdoor Run',
            category: 'Cardio',
            type: 'cardio',
            distance: 5.0,
            distanceUnit: 'km',
            durationMinutes: 25,
            durationSeconds: 30,
            pace: "5'06\" /km",
            calories: 360,
            avgHeartRate: 158,
            notes: 'Tempo 5k run, pushed the last 1 km hard.',
          },
        ],
      },
      {
        id: `workout_${fiveDaysAgo}`,
        date: fiveDaysAgo,
        title: 'Leg Day & Squat Focus',
        generalNotes: 'Deep squats, felt great quad burn.',
        energyRating: 4,
        durationMinutes: 50,
        updatedAt: Date.now() - 5 * 86400000,
        exercises: [
          {
            id: 'ex-7',
            exerciseId: 'barbell-squat',
            exerciseName: 'Barbell Back Squat',
            category: 'Legs',
            type: 'strength',
            weightUnit: 'kg',
            sets: [
              { id: 's19', setNumber: 1, type: 'warmup', weight: 70, reps: 10, completed: true },
              { id: 's20', setNumber: 2, type: 'normal', weight: 100, reps: 8, completed: true, rpe: 7.5 },
              { id: 's21', setNumber: 3, type: 'normal', weight: 110, reps: 6, completed: true, rpe: 8.5 },
              { id: 's22', setNumber: 4, type: 'normal', weight: 115, reps: 5, completed: true, rpe: 9 },
            ],
          },
          {
            id: 'ex-8',
            exerciseId: 'leg-press',
            exerciseName: 'Leg Press',
            category: 'Legs',
            type: 'strength',
            weightUnit: 'kg',
            sets: [
              { id: 's23', setNumber: 1, type: 'normal', weight: 180, reps: 12, completed: true },
              { id: 's24', setNumber: 2, type: 'normal', weight: 200, reps: 10, completed: true },
            ],
          },
        ],
        runs: [],
      },
      {
        id: `workout_${twoWeeksAgo}`,
        date: twoWeeksAgo,
        title: 'Shoulders & Long Distance Run',
        generalNotes: 'Shoulders burned out with lateral raises.',
        energyRating: 5,
        durationMinutes: 70,
        updatedAt: Date.now() - 14 * 86400000,
        exercises: [
          {
            id: 'ex-9',
            exerciseId: 'overhead-press',
            exerciseName: 'Overhead Press (OHP)',
            category: 'Shoulders',
            type: 'strength',
            weightUnit: 'kg',
            sets: [
              { id: 's25', setNumber: 1, type: 'warmup', weight: 40, reps: 10, completed: true },
              { id: 's26', setNumber: 2, type: 'normal', weight: 52.5, reps: 6, completed: true, rpe: 8 },
              { id: 's27', setNumber: 3, type: 'normal', weight: 55, reps: 5, completed: true, rpe: 8.5 },
            ],
          },
        ],
        runs: [
          {
            id: 'run-3',
            exerciseId: 'outdoor-run',
            exerciseName: 'Outdoor Run',
            category: 'Cardio',
            type: 'cardio',
            distance: 8.2,
            distanceUnit: 'km',
            durationMinutes: 44,
            durationSeconds: 10,
            pace: "5'23\" /km",
            calories: 590,
            avgHeartRate: 154,
            notes: 'Long steady distance run on weekend.',
          },
        ],
      },
    ];

    await AsyncStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(demoWorkouts));
    await AsyncStorage.setItem(STORAGE_KEYS.SEEDED, 'true');
  } catch (error) {
    console.error('Failed to seed demo data:', error);
  }
}
