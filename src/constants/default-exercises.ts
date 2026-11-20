import { ExerciseDefinition, MuscleCategory } from '@/types/workout';

export const CATEGORIES: MuscleCategory[] = [
  'Chest',
  'Back',
  'Legs',
  'Shoulders',
  'Arms',
  'Core',
  'Cardio',
  'Full Body',
  'Other',
];

export const DEFAULT_EXERCISES: ExerciseDefinition[] = [
  // Chest
  {
    id: 'bench-press',
    name: 'Bench Press (Barbell)',
    category: 'Chest',
    type: 'strength',
    defaultWeightUnit: 'kg',
  },
  {
    id: 'incline-bench-press',
    name: 'Incline Bench Press',
    category: 'Chest',
    type: 'strength',
    defaultWeightUnit: 'kg',
  },
  {
    id: 'incline-dumbbell-press',
    name: 'Incline Dumbbell Press',
    category: 'Chest',
    type: 'strength',
    defaultWeightUnit: 'kg',
  },
  {
    id: 'dumbbell-flyes',
    name: 'Dumbbell Flyes',
    category: 'Chest',
    type: 'strength',
    defaultWeightUnit: 'kg',
  },
  {
    id: 'dips-chest',
    name: 'Chest Dips',
    category: 'Chest',
    type: 'strength',
    defaultWeightUnit: 'kg',
  },
  {
    id: 'cable-crossover',
    name: 'Cable Crossover',
    category: 'Chest',
    type: 'strength',
    defaultWeightUnit: 'kg',
  },

  // Back
  {
    id: 'deadlift',
    name: 'Deadlift (Barbell)',
    category: 'Back',
    type: 'strength',
    defaultWeightUnit: 'kg',
  },
  {
    id: 'barbell-row',
    name: 'Bent Over Barbell Row',
    category: 'Back',
    type: 'strength',
    defaultWeightUnit: 'kg',
  },
  {
    id: 'pull-ups',
    name: 'Pull-ups / Chin-ups',
    category: 'Back',
    type: 'strength',
    defaultWeightUnit: 'kg',
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    category: 'Back',
    type: 'strength',
    defaultWeightUnit: 'kg',
  },
  {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    category: 'Back',
    type: 'strength',
    defaultWeightUnit: 'kg',
  },

  // Legs
  {
    id: 'barbell-squat',
    name: 'Barbell Back Squat',
    category: 'Legs',
    type: 'strength',
    defaultWeightUnit: 'kg',
  },
  {
    id: 'front-squat',
    name: 'Front Squat',
    category: 'Legs',
    type: 'strength',
    defaultWeightUnit: 'kg',
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    category: 'Legs',
    type: 'strength',
    defaultWeightUnit: 'kg',
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift (RDL)',
    category: 'Legs',
    type: 'strength',
    defaultWeightUnit: 'kg',
  },
  {
    id: 'leg-extension',
    name: 'Leg Extension',
    category: 'Legs',
    type: 'strength',
    defaultWeightUnit: 'kg',
  },
  {
    id: 'hamstring-curl',
    name: 'Lying Hamstring Curl',
    category: 'Legs',
    type: 'strength',
    defaultWeightUnit: 'kg',
  },
  {
    id: 'calf-raise',
    name: 'Standing Calf Raise',
    category: 'Legs',
    type: 'strength',
    defaultWeightUnit: 'kg',
  },

  // Shoulders
  {
    id: 'overhead-press',
    name: 'Overhead Press (OHP)',
    category: 'Shoulders',
    type: 'strength',
    defaultWeightUnit: 'kg',
  },
  {
    id: 'dumbbell-shoulder-press',
    name: 'Dumbbell Shoulder Press',
    category: 'Shoulders',
    type: 'strength',
    defaultWeightUnit: 'kg',
  },
  {
    id: 'lateral-raise',
    name: 'Lateral Raise (Dumbbell/Cable)',
    category: 'Shoulders',
    type: 'strength',
    defaultWeightUnit: 'kg',
  },
  {
    id: 'rear-delt-fly',
    name: 'Rear Delt Fly / Face Pull',
    category: 'Shoulders',
    type: 'strength',
    defaultWeightUnit: 'kg',
  },

  // Arms
  {
    id: 'barbell-curl',
    name: 'Barbell Bicep Curl',
    category: 'Arms',
    type: 'strength',
    defaultWeightUnit: 'kg',
  },
  {
    id: 'hammer-curl',
    name: 'Dumbbell Hammer Curl',
    category: 'Arms',
    type: 'strength',
    defaultWeightUnit: 'kg',
  },
  {
    id: 'tricep-pushdown',
    name: 'Tricep Rope Pushdown',
    category: 'Arms',
    type: 'strength',
    defaultWeightUnit: 'kg',
  },
  {
    id: 'skullcrushers',
    name: 'Skullcrushers (EZ Bar)',
    category: 'Arms',
    type: 'strength',
    defaultWeightUnit: 'kg',
  },

  // Core
  {
    id: 'hanging-leg-raise',
    name: 'Hanging Leg Raise',
    category: 'Core',
    type: 'strength',
    defaultWeightUnit: 'kg',
  },
  {
    id: 'plank',
    name: 'Weighted Plank',
    category: 'Core',
    type: 'strength',
    defaultWeightUnit: 'kg',
  },

  // Cardio / Runs
  {
    id: 'outdoor-run',
    name: 'Outdoor Run',
    category: 'Cardio',
    type: 'cardio',
    defaultDistanceUnit: 'km',
  },
  {
    id: 'treadmill-run',
    name: 'Treadmill Run',
    category: 'Cardio',
    type: 'cardio',
    defaultDistanceUnit: 'km',
  },
  {
    id: 'interval-run',
    name: 'Interval Sprints',
    category: 'Cardio',
    type: 'cardio',
    defaultDistanceUnit: 'km',
  },
  {
    id: 'cycling',
    name: 'Cycling / Bike',
    category: 'Cardio',
    type: 'cardio',
    defaultDistanceUnit: 'km',
  },
  {
    id: 'rowing',
    name: 'Rowing Machine',
    category: 'Cardio',
    type: 'cardio',
    defaultDistanceUnit: 'km',
  },
];
