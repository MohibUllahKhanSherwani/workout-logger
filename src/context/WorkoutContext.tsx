import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import {
  BackupData,
  CategoryItem,
  DailyWorkout,
  ExerciseType,
  LoggedRun,
  LoggedStrengthExercise,
  WeightUnit,
} from '@/types/workout';
import {
  deleteCategory,
  deleteWorkout,
  exportBackupFile,
  getLastExercisePerformance,
  getPreferredWeightUnit,
  getStoredCategories,
  getStoredWorkouts,
  restoreFromBackup,
  saveCategory,
  saveWorkout,
  setPreferredWeightUnit,
} from '@/storage/workout-storage';
import { getTodayDateString } from '@/utils/date-helpers';

interface WorkoutContextType {
  workouts: DailyWorkout[];
  categories: CategoryItem[];
  activeDate: string;
  setActiveDate: (date: string) => void;
  currentWorkout: DailyWorkout;
  preferredUnit: WeightUnit;
  setPreferredUnit: (unit: WeightUnit) => Promise<void>;
  loading: boolean;
  refreshWorkouts: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  addCategoryToWorkout: (cat: CategoryItem) => void;
  removeExerciseFromWorkout: (instanceId: string) => void;
  updateStrengthExercise: (exercise: LoggedStrengthExercise) => void;
  removeRunFromWorkout: (instanceId: string) => void;
  updateRun: (run: LoggedRun) => void;
  updateTitle: (title: string) => void;
  createCategory: (name: string, type: ExerciseType) => Promise<CategoryItem>;
  deleteCategoryById: (id: string) => Promise<void>;
  deleteWorkoutForDate: (date: string) => Promise<void>;
  getLastPerformance: (categoryId: string) => Promise<string | null>;
  exportBackup: () => Promise<string | null>;
  restoreBackup: (backup: BackupData) => Promise<{ workoutCount: number; categoryCount: number }>;
}

const WorkoutContext = createContext<WorkoutContextType | null>(null);

function createEmptyWorkout(date: string): DailyWorkout {
  return {
    id: `workout_${date}`,
    date,
    exercises: [],
    runs: [],
    updatedAt: Date.now(),
  };
}

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workouts, setWorkouts] = useState<DailyWorkout[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [activeDate, setActiveDate] = useState<string>(getTodayDateString());
  const [preferredUnit, setPreferredUnitState] = useState<WeightUnit>('kg');
  const [loading, setLoading] = useState<boolean>(true);

  // Derived current workout
  const currentWorkout = useMemo(() => {
    const existing = workouts.find((w) => w.date === activeDate);
    return existing ? { ...existing } : createEmptyWorkout(activeDate);
  }, [workouts, activeDate]);

  useEffect(() => {
    let mounted = true;
    const loadInitialData = async () => {
      try {
        const [storedWorkouts, storedCategories, unit] = await Promise.all([
          getStoredWorkouts(),
          getStoredCategories(),
          getPreferredWeightUnit(),
        ]);
        if (mounted) {
          setWorkouts(storedWorkouts);
          setCategories(storedCategories);
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

  const refreshCategories = useCallback(async () => {
    const list = await getStoredCategories();
    setCategories(list);
  }, []);

  const setPreferredUnit = useCallback(async (unit: WeightUnit) => {
    await setPreferredWeightUnit(unit);
    setPreferredUnitState(unit);
  }, []);

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
        console.error('Failed to save workout:', err);
      }
    },
    []
  );

  const addCategoryToWorkout = useCallback(
    async (category: CategoryItem) => {
      if (category.type === 'run') {
        const newRun: LoggedRun = {
          id: `run_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          categoryId: category.id,
          categoryName: category.name,
          type: 'run',
          distance: 0,
          distanceUnit: 'km',
          durationMinutes: 0,
          durationSeconds: 0,
          pace: '--:--',
        };
        const updated: DailyWorkout = {
          ...currentWorkout,
          runs: [...(currentWorkout.runs || []), newRun],
        };
        await persistWorkoutChange(updated);
      } else {
        const lastPerf = await getLastExercisePerformance(category.id, activeDate);
        const newExercise: LoggedStrengthExercise = {
          id: `log_ex_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          categoryId: category.id,
          categoryName: category.name,
          type: 'strength',
          weightUnit: preferredUnit,
          sets: [
            {
              id: `set_${Date.now()}_1`,
              setNumber: 1,
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
      }
    },
    [activeDate, currentWorkout, persistWorkoutChange, preferredUnit]
  );

  const removeExerciseFromWorkout = useCallback(
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

  const removeRunFromWorkout = useCallback(
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

  const createCategory = useCallback(
    async (name: string, type: ExerciseType): Promise<CategoryItem> => {
      const newCat: CategoryItem = {
        id: `cat_${Date.now()}_${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: name.trim(),
        type,
        createdAt: Date.now(),
      };
      const updated = await saveCategory(newCat);
      setCategories(updated);
      return newCat;
    },
    []
  );

  const deleteCategoryById = useCallback(
    async (id: string) => {
      const updated = await deleteCategory(id);
      setCategories(updated);
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
    async (categoryId: string) => {
      return getLastExercisePerformance(categoryId, activeDate);
    },
    [activeDate]
  );

  const exportBackup = useCallback(async () => {
    return exportBackupFile();
  }, []);

  const restoreBackup = useCallback(
    async (backup: BackupData) => {
      const result = await restoreFromBackup(backup);
      await refreshWorkouts();
      await refreshCategories();
      const unit = await getPreferredWeightUnit();
      setPreferredUnitState(unit);
      return result;
    },
    [refreshWorkouts, refreshCategories]
  );

  const value = useMemo(
    () => ({
      workouts,
      categories,
      activeDate,
      setActiveDate,
      currentWorkout,
      preferredUnit,
      setPreferredUnit,
      loading,
      refreshWorkouts,
      refreshCategories,
      addCategoryToWorkout,
      removeExerciseFromWorkout,
      updateStrengthExercise,
      removeRunFromWorkout,
      updateRun,
      updateTitle,
      createCategory,
      deleteCategoryById,
      deleteWorkoutForDate: deleteWorkoutForDateHandler,
      getLastPerformance,
      exportBackup,
      restoreBackup,
    }),
    [
      workouts,
      categories,
      activeDate,
      currentWorkout,
      preferredUnit,
      setPreferredUnit,
      loading,
      refreshWorkouts,
      refreshCategories,
      addCategoryToWorkout,
      removeExerciseFromWorkout,
      updateStrengthExercise,
      removeRunFromWorkout,
      updateRun,
      updateTitle,
      createCategory,
      deleteCategoryById,
      deleteWorkoutForDateHandler,
      getLastPerformance,
      exportBackup,
      restoreBackup,
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
