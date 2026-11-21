import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
  BackupData,
  CategoryItem,
  DailyWorkout,
  WeightUnit,
} from '@/types/workout';

const STORAGE_KEYS = {
  WORKOUTS: '@workout_app_workouts_v3',
  CATEGORIES: '@workout_app_categories_v3',
  UNIT_PREF: '@workout_app_unit_v3',
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

export async function saveWorkout(workout: DailyWorkout): Promise<void> {
  try {
    const workouts = await getStoredWorkouts();
    const existingIndex = workouts.findIndex((w) => w.date === workout.date);

    const workoutToSave: DailyWorkout = {
      ...workout,
      updatedAt: Date.now(),
    };

    let updated: DailyWorkout[];
    if (existingIndex >= 0) {
      updated = [...workouts];
      updated[existingIndex] = workoutToSave;
    } else {
      updated = [workoutToSave, ...workouts];
    }

    // Filter out workouts with no exercises and no runs
    updated = updated.filter(
      (w) =>
        (w.exercises && w.exercises.length > 0) ||
        (w.runs && w.runs.length > 0)
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

export async function getStoredCategories(): Promise<CategoryItem[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!json) return [];
    const parsed: CategoryItem[] = JSON.parse(json);
    return parsed;
  } catch (error) {
    console.error('Failed to load categories:', error);
    return [];
  }
}

export async function saveCategory(category: CategoryItem): Promise<CategoryItem[]> {
  try {
    const list = await getStoredCategories();
    const index = list.findIndex((c) => c.id === category.id);
    let updated: CategoryItem[];
    if (index >= 0) {
      updated = [...list];
      updated[index] = category;
    } else {
      updated = [...list, category];
    }
    await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Failed to save category:', error);
    throw error;
  }
}

export async function deleteCategory(id: string): Promise<CategoryItem[]> {
  try {
    const list = await getStoredCategories();
    const filtered = list.filter((c) => c.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(filtered));
    return filtered;
  } catch (error) {
    console.error('Failed to delete category:', error);
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
 * Finds the latest performance (weight, reps) for a given category before a specific date.
 */
export async function getLastExercisePerformance(
  categoryId: string,
  beforeDate?: string
): Promise<string | null> {
  const workouts = await getStoredWorkouts();
  for (const w of workouts) {
    if (beforeDate && w.date >= beforeDate) continue;
    const foundEx = w.exercises?.find((e) => e.categoryId === categoryId);
    if (foundEx && foundEx.sets && foundEx.sets.length > 0) {
      const bestSet = foundEx.sets.reduce(
        (max, s) => (s.weight > max.weight ? s : max),
        foundEx.sets[0]
      );
      return `${bestSet.weight} ${foundEx.weightUnit || 'kg'} × ${bestSet.reps}`;
    }
  }
  return null;
}

/**
 * Creates a full portable JSON backup payload of all workouts, categories, and settings.
 */
export async function createBackupPayload(): Promise<BackupData> {
  const workouts = await getStoredWorkouts();
  const categories = await getStoredCategories();
  const preferredUnit = await getPreferredWeightUnit();
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    workouts,
    categories,
    preferredUnit,
  };
}

/**
 * Exports all data to a .json file and opens the native share dialog (to save in Files, Google Drive, WhatsApp, etc.).
 */
export async function exportBackupFile(): Promise<string | null> {
  try {
    const backup = await createBackupPayload();
    const jsonStr = JSON.stringify(backup, null, 2);
    const dateTag = new Date().toISOString().slice(0, 10);
    const fileUri = `${FileSystem.cacheDirectory || ''}workout-logger-backup-${dateTag}.json`;

    if (FileSystem.cacheDirectory) {
      await FileSystem.writeAsStringAsync(fileUri, jsonStr, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          UTI: 'public.json',
          mimeType: 'application/json',
          dialogTitle: 'Export Workout Logger Backup',
        });
      }
      return fileUri;
    }
    return null;
  } catch (error) {
    console.error('Failed to export backup file:', error);
    throw error;
  }
}

/**
 * Restores workouts and categories from a BackupData object.
 */
export async function restoreFromBackup(
  backup: BackupData
): Promise<{ workoutCount: number; categoryCount: number }> {
  if (!backup || !Array.isArray(backup.workouts)) {
    throw new Error('Invalid backup format: missing workouts list');
  }

  // Merge workouts by date
  const currentWorkouts = await getStoredWorkouts();
  const workoutMap = new Map<string, DailyWorkout>();
  for (const w of currentWorkouts) {
    workoutMap.set(w.date, w);
  }
  for (const w of backup.workouts) {
    workoutMap.set(w.date, w);
  }
  const mergedWorkouts = Array.from(workoutMap.values()).sort((a, b) =>
    b.date.localeCompare(a.date)
  );
  await AsyncStorage.setItem(
    STORAGE_KEYS.WORKOUTS,
    JSON.stringify(mergedWorkouts)
  );

  // Merge categories
  if (Array.isArray(backup.categories)) {
    const currentCats = await getStoredCategories();
    const catMap = new Map<string, CategoryItem>();
    for (const c of currentCats) {
      catMap.set(c.id, c);
    }
    for (const c of backup.categories) {
      catMap.set(c.id, c);
    }
    await AsyncStorage.setItem(
      STORAGE_KEYS.CATEGORIES,
      JSON.stringify(Array.from(catMap.values()))
    );
  }

  if (backup.preferredUnit) {
    await setPreferredWeightUnit(backup.preferredUnit);
  }

  return {
    workoutCount: mergedWorkouts.length,
    categoryCount: (backup.categories || []).length,
  };
}
