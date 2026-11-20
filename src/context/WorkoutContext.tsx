import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import {
  DailyWorkout,
  ExerciseDefinition,
  ExerciseType,
  LoggedRun,
  LoggedStrengthExercise,
  MuscleCategory,
  WeightUnit,
} from '@/types/workout';
import {
  deleteExercise,
  deleteWorkout,
  getLastExercisePerformance,
  getPreferredWeightUnit,
  getStoredExercises,
  getStoredWorkouts,
  saveExercise,
  saveWorkout,
  seedDemoDataIfEmpty,
  setPreferredWeightUnit,
} from '@/storage/workout-storage';
import { getTodayDateString } from '@/utils/date-helpers';

interface WorkoutContextType {
  workouts: DailyWorkout[];
  exercises: ExerciseDefinition[];
  activeDate: string;
  setActiveDate: (date: string) => void;
  currentWorkout: DailyWorkout;
  preferredUnit: WeightUnit;
  setPreferredUnit: (unit: WeightUnit) => Promise<void>;
  loading: boolean;
  refreshWorkouts: () => Promise<void>;
  refreshExercises: () => Promise<void>;
  addExerciseToCurrentWorkout: (exerciseDef: ExerciseDefinition) => void;
  removeExerciseFromCurrentWorkout: (instanceId: string) => void;
  updateStrengthExercise: (exercise: LoggedStrengthExercise) => void;
  addRunToCurrentWorkout: (name?: string) => void;
  removeRunFromCurrentWorkout: (instanceId: string) => void;
  updateRun: (run: LoggedRun) => void;
  updateGeneralNotes: (notes: string) => void;
  updateTitle: (title: string) => void;
  updateEnergyRating: (rating: number) => void;
  addNewCustomExercise: (
    name: string,
    category: MuscleCategory,
    type: ExerciseType
  ) => Promise<ExerciseDefinition>;
  deleteCustomExercise: (id: string) => Promise<void>;
  deleteWorkoutForDate: (date: string) => Promise<void>;
  getLastPerformance: (exerciseId: string) => Promise<string | null>;
}

const WorkoutContext = createContext<WorkoutContextType | null>(null);

function createEmptyWorkout(date: string): DailyWorkout {
  return {
    id: `workout_${date}`,
    date,
    exercises: [],
    runs: [],
    generalNotes: '',
    updatedAt: Date.now(),
  };
}

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workouts, setWorkouts] = useState<DailyWorkout[]>([]);
  const [exercises, setExercises] = useState<ExerciseDefinition[]>([]);
  const [activeDate, setActiveDate] = useState<string>(getTodayDateString());
  const [preferredUnit, setPreferredUnitState] = useState<WeightUnit>('kg');
  const [loading, setLoading] = useState<boolean>(true);

  // Derived current workout based on activeDate and workouts list
  const currentWorkout = useMemo(() => {
    const existing = workouts.find((w) => w.date === activeDate);
    return existing ? { ...existing } : createEmptyWorkout(activeDate);
  }, [workouts, activeDate]);

  // Initialize and seed demo data if empty
  useEffect(() => {
    let mounted = true;
    const loadInitialData = async () => {
      try {
        await seedDemoDataIfEmpty();
        const [storedWorkouts, storedExercises, unit] = await Promise.all([
          getStoredWorkouts(),
          getStoredExercises(),
          getPreferredWeightUnit(),
        ]);
        if (mounted) {
          setWorkouts(storedWorkouts);
          setExercises(storedExercises);
          setPreferredUnitState(unit);
          setLoading(false);
        }
      } catch (e) {
        console.error('Initialization error:', e);
        if (mounted) setLoading(false);
      }
    };

    loadInitialData();
    return () => {
      mounted = false;
    };
  }, []);

  const refreshWorkouts = useCallback(async () => {
    const list = await getStoredWorkouts();
    setWorkouts(list);
  }, []);

  const refreshExercises = useCallback(async () => {
    const list = await getStoredExercises();
    setExercises(list);
  }, []);

  const setPreferredUnit = useCallback(async (unit: WeightUnit) => {
    await setPreferredWeightUnit(unit);
    setPreferredUnitState(unit);
  }, []);

  // Internal helper to persist workout changes safely
  const persistWorkoutChange = useCallback(
    async (updated: DailyWorkout) => {
      setWorkouts((prev) => {
        const idx = prev.findIndex((w) => w.date === updated.date);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [updated, ...prev];
      });
      try {
        await saveWorkout(updated);
      } catch (err) {
        console.error('Failed to auto-save workout:', err);
      }
    },
    []
  );

  const addExerciseToCurrentWorkout = useCallback(
    async (exerciseDef: ExerciseDefinition) => {
      // Fetch last performance to hint initial weight
      const lastPerf = await getLastExercisePerformance(exerciseDef.id, activeDate);

      const newExercise: LoggedStrengthExercise = {
        id: `log_ex_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        exerciseId: exerciseDef.id,
        exerciseName: exerciseDef.name,
        category: exerciseDef.category,
        type: 'strength',
        weightUnit: preferredUnit,
        notes: '',
        sets: [
          {
            id: `set_${Date.now()}_1`,
            setNumber: 1,
            type: 'normal',
            weight: 0,
            reps: 10,
            completed: false,
            previousHint: lastPerf || undefined,
          },
        ],
      };

      const updated: DailyWorkout = {
        ...currentWorkout,
        exercises: [...(currentWorkout.exercises || []), newExercise],
      };
      await persistWorkoutChange(updated);
    },
    [activeDate, currentWorkout, persistWorkoutChange, preferredUnit]
  );

  const removeExerciseFromCurrentWorkout = useCallback(
    async (instanceId: string) => {
      const updated: DailyWorkout = {
        ...currentWorkout,
        exercises: (currentWorkout.exercises || []).filter((e) => e.id !== instanceId),
      };
      await persistWorkoutChange(updated);
    },
    [currentWorkout, persistWorkoutChange]
  );

  const updateStrengthExercise = useCallback(
    async (exercise: LoggedStrengthExercise) => {
      const existing = currentWorkout.exercises || [];
      const updatedList = existing.map((e) => (e.id === exercise.id ? exercise : e));
      const updated: DailyWorkout = {
        ...currentWorkout,
        exercises: updatedList,
      };
      await persistWorkoutChange(updated);
    },
    [currentWorkout, persistWorkoutChange]
  );

  const addRunToCurrentWorkout = useCallback(
    async (name: string = 'Outdoor Run') => {
      const newRun: LoggedRun = {
        id: `run_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        exerciseId: 'outdoor-run',
        exerciseName: name,
        category: 'Cardio',
        type: 'cardio',
        distance: 0,
        distanceUnit: 'km',
        durationMinutes: 0,
        durationSeconds: 0,
        pace: '--:--',
        notes: '',
      };

      const updated: DailyWorkout = {
        ...currentWorkout,
        runs: [...(currentWorkout.runs || []), newRun],
      };
      await persistWorkoutChange(updated);
    },
    [currentWorkout, persistWorkoutChange]
  );

  const removeRunFromCurrentWorkout = useCallback(
    async (instanceId: string) => {
      const updated: DailyWorkout = {
        ...currentWorkout,
        runs: (currentWorkout.runs || []).filter((r) => r.id !== instanceId),
      };
      await persistWorkoutChange(updated);
    },
    [currentWorkout, persistWorkoutChange]
  );

  const updateRun = useCallback(
    async (run: LoggedRun) => {
      const existing = currentWorkout.runs || [];
      const updatedList = existing.map((r) => (r.id === run.id ? run : r));
      const updated: DailyWorkout = {
        ...currentWorkout,
        runs: updatedList,
      };
      await persistWorkoutChange(updated);
    },
    [currentWorkout, persistWorkoutChange]
  );

  const updateGeneralNotes = useCallback(
    async (notes: string) => {
      const updated: DailyWorkout = {
        ...currentWorkout,
        generalNotes: notes,
      };
      await persistWorkoutChange(updated);
    },
    [currentWorkout, persistWorkoutChange]
  );

  const updateTitle = useCallback(
    async (title: string) => {
      const updated: DailyWorkout = {
        ...currentWorkout,
        title,
      };
      await persistWorkoutChange(updated);
    },
    [currentWorkout, persistWorkoutChange]
  );

  const updateEnergyRating = useCallback(
    async (rating: number) => {
      const updated: DailyWorkout = {
        ...currentWorkout,
        energyRating: rating,
      };
      await persistWorkoutChange(updated);
    },
    [currentWorkout, persistWorkoutChange]
  );

  const addNewCustomExercise = useCallback(
    async (
      name: string,
      category: MuscleCategory,
      type: ExerciseType
    ): Promise<ExerciseDefinition> => {
      const newDef: ExerciseDefinition = {
        id: `custom_${Date.now()}_${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: name.trim(),
        category,
        type,
        isCustom: true,
        createdAt: new Date().toISOString(),
      };
      const updatedList = await saveExercise(newDef);
      setExercises(updatedList);
      return newDef;
    },
    []
  );

  const deleteCustomExerciseHandler = useCallback(
    async (id: string) => {
      const updatedList = await deleteExercise(id);
      setExercises(updatedList);
    },
    []
  );

  const deleteWorkoutForDateHandler = useCallback(
    async (date: string) => {
      await deleteWorkout(date);
      const list = await getStoredWorkouts();
      setWorkouts(list);
    },
    []
  );

  const getLastPerformance = useCallback(
    async (exerciseId: string) => {
      return getLastExercisePerformance(exerciseId, activeDate);
    },
    [activeDate]
  );

  const value = useMemo(
    () => ({
      workouts,
      exercises,
      activeDate,
      setActiveDate,
      currentWorkout,
      preferredUnit,
      setPreferredUnit,
      loading,
      refreshWorkouts,
      refreshExercises,
      addExerciseToCurrentWorkout,
      removeExerciseFromCurrentWorkout,
      updateStrengthExercise,
      addRunToCurrentWorkout,
      removeRunFromCurrentWorkout,
      updateRun,
      updateGeneralNotes,
      updateTitle,
      updateEnergyRating,
      addNewCustomExercise,
      deleteCustomExercise: deleteCustomExerciseHandler,
      deleteWorkoutForDate: deleteWorkoutForDateHandler,
      getLastPerformance,
    }),
    [
      workouts,
      exercises,
      activeDate,
      currentWorkout,
      preferredUnit,
      setPreferredUnit,
      loading,
      refreshWorkouts,
      refreshExercises,
      addExerciseToCurrentWorkout,
      removeExerciseFromCurrentWorkout,
      updateStrengthExercise,
      addRunToCurrentWorkout,
      removeRunFromCurrentWorkout,
      updateRun,
      updateGeneralNotes,
      updateTitle,
      updateEnergyRating,
      addNewCustomExercise,
      deleteCustomExerciseHandler,
      deleteWorkoutForDateHandler,
      getLastPerformance,
    ]
  );

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
};

export function useWorkout() {
  const ctx = useContext(WorkoutContext);
  if (!ctx) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return ctx;
}
