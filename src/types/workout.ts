export type ExerciseType = 'strength' | 'run';

export type WeightUnit = 'kg' | 'lbs';
export type DistanceUnit = 'km' | 'mi';

export interface CategoryItem {
  id: string;
  name: string; // e.g. "Bench Press", "Incline Press", "Run"
  type: ExerciseType; // 'strength' | 'run'
  createdAt: number;
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
  previousHint?: string;
}

export interface LoggedStrengthExercise {
  id: string;
  categoryId: string;
  categoryName: string;
  type: 'strength';
  weightUnit: WeightUnit;
  sets: WorkoutSet[];
}

export interface LoggedRun {
  id: string;
  categoryId: string;
  categoryName: string;
  type: 'run';
  distance: number;
  distanceUnit: DistanceUnit;
  durationMinutes: number;
  durationSeconds: number;
  pace?: string;
}

export interface DailyWorkout {
  id: string; // "workout_YYYY-MM-DD"
  date: string; // "YYYY-MM-DD"
  title?: string;
  exercises: LoggedStrengthExercise[];
  runs: LoggedRun[];
  updatedAt: number;
}

export type TimeFilter =
  | 'thisWeek'
  | 'lastWeek'
  | '3days'
  | 'thisMonth'
  | 'lastMonth'
  | 'all'
  | '1week'
  | '1month';

export interface BackupData {
  version: number;
  exportedAt: string;
  workouts: DailyWorkout[];
  categories: CategoryItem[];
  preferredUnit: WeightUnit;
}

export interface WorkoutFilterStats {
  totalWorkouts: number;
  totalSets: number;
  totalReps: number;
  totalVolumeKg: number;
  totalRunDistanceKm: number;
  totalRunDurationMinutes: number;
  avgRunPace?: string;
  categoryCounts: Record<string, number>;
}
