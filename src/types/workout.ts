export type MuscleCategory =
  | 'Chest'
  | 'Back'
  | 'Legs'
  | 'Shoulders'
  | 'Arms'
  | 'Core'
  | 'Cardio'
  | 'Full Body'
  | 'Other';

export type ExerciseType = 'strength' | 'cardio';

export type WeightUnit = 'kg' | 'lbs';
export type DistanceUnit = 'km' | 'mi';

export interface ExerciseDefinition {
  id: string;
  name: string;
  category: MuscleCategory;
  type: ExerciseType;
  isCustom?: boolean;
  defaultWeightUnit?: WeightUnit;
  defaultDistanceUnit?: DistanceUnit;
  notes?: string;
  createdAt?: string;
}

export type SetType = 'normal' | 'warmup' | 'drop' | 'failure';

export interface WorkoutSet {
  id: string;
  setNumber: number;
  type: SetType;
  weight: number; // e.g. 80
  reps: number; // e.g. 10
  rpe?: number; // 1-10
  completed: boolean;
  previousHint?: string; // e.g. "80 kg × 10"
}

export interface LoggedStrengthExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  category: MuscleCategory;
  type: 'strength';
  weightUnit: WeightUnit;
  sets: WorkoutSet[];
  notes?: string;
}

export interface LoggedRun {
  id: string;
  exerciseId: string;
  exerciseName: string;
  category: MuscleCategory;
  type: 'cardio';
  distance: number; // e.g. 5.25
  distanceUnit: DistanceUnit; // 'km' | 'mi'
  durationMinutes: number; // e.g. 27
  durationSeconds: number; // e.g. 30
  pace?: string; // e.g. "5:14 /km"
  calories?: number;
  avgHeartRate?: number;
  notes?: string;
}

export interface DailyWorkout {
  id: string; // "workout_YYYY-MM-DD"
  date: string; // "YYYY-MM-DD"
  title?: string;
  exercises: LoggedStrengthExercise[];
  runs: LoggedRun[];
  energyRating?: number; // 1-5
  generalNotes?: string;
  durationMinutes?: number;
  updatedAt: number;
}

export type TimeFilter = '1day' | '1week' | '1month' | 'all';

export interface WorkoutFilterStats {
  totalWorkouts: number;
  totalSets: number;
  totalReps: number;
  totalVolumeKg: number;
  totalRunDistanceKm: number;
  totalRunDurationMinutes: number;
  avgRunPace?: string;
  categoryBreakdown: Record<string, number>; // Category name -> count or volume
  exerciseCounts: Record<string, number>;
}
