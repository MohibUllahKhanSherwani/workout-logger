import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWorkout } from '@/context/WorkoutContext';
import { DatePickerBar } from '@/components/DatePickerBar';
import { ExercisePickerModal } from '@/components/ExercisePickerModal';
import { ExerciseCard } from '@/components/ExerciseCard';
import { RunCard } from '@/components/RunCard';
import { CategoryItem } from '@/types/workout';

export default function DailyWorkoutScreen() {
  const {
    currentWorkout,
    activeDate,
    preferredUnit,
    setPreferredUnit,
    addCategoryToWorkout,
    updateTitle,
    deleteWorkoutForDate,
  } = useWorkout();

  const [pickerVisible, setPickerVisible] = useState(false);

  const handleSelectCategory = (category: CategoryItem) => {
    addCategoryToWorkout(category);
  };

  const handleToggleUnit = () => {
    const nextUnit = preferredUnit === 'kg' ? 'lbs' : 'kg';
    setPreferredUnit(nextUnit);
  };

  const confirmDeleteWorkout = () => {
    Alert.alert(
      'Clear Workout',
      `Clear all exercises logged for ${activeDate}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => deleteWorkoutForDate(activeDate),
        },
      ]
    );
  };

  const exercises = currentWorkout.exercises || [];
  const runs = currentWorkout.runs || [];
  const hasContent = exercises.length > 0 || runs.length > 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.appTitle}>Workout Logger</Text>
          <Text style={styles.appSubtitle}>Daily Log</Text>
        </View>

        <TouchableOpacity onPress={handleToggleUnit} style={styles.unitBtn}>
          <Text style={styles.unitBtnText}>{preferredUnit.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      {/* Date Navigation Bar */}
      <DatePickerBar />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Optional Title */}
        <TextInput
          style={styles.titleInput}
          placeholder="Workout Title (optional, e.g. Chest Day, Morning Run)..."
          placeholderTextColor="#94a3b8"
          value={currentWorkout.title || ''}
          onChangeText={updateTitle}
        />

        {/* Strength Exercises */}
        {exercises.map((ex) => (
          <ExerciseCard key={ex.id} exercise={ex} />
        ))}

        {/* Runs */}
        {runs.map((r) => (
          <RunCard key={r.id} run={r} />
        ))}

        {/* Add Category / Exercise Button */}
        <TouchableOpacity
          style={styles.addCategoryBtn}
          onPress={() => setPickerVisible(true)}
        >
          <Ionicons name="add-circle" size={20} color="#ffffff" />
          <Text style={styles.addCategoryBtnText}>+ Add Category / Exercise</Text>
        </TouchableOpacity>

        {/* Clear Log Button */}
        {hasContent && (
          <TouchableOpacity
            style={styles.deleteWorkoutBtn}
            onPress={confirmDeleteWorkout}
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text style={styles.deleteWorkoutText}>Clear This Day&apos;s Log</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Select Category Modal */}
      <ExercisePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelectCategory={handleSelectCategory}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  appSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  unitBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  unitBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  titleInput: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
    }),
  },
  addCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 6,
  },
  addCategoryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  deleteWorkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
    paddingVertical: 8,
  },
  deleteWorkoutText: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '600',
  },
});
