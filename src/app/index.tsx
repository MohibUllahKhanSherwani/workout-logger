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
import { RestTimerModal } from '@/components/RestTimerModal';
import { ExerciseDefinition } from '@/types/workout';

export default function DailyWorkoutScreen() {
  const {
    currentWorkout,
    activeDate,
    preferredUnit,
    setPreferredUnit,
    addExerciseToCurrentWorkout,
    addRunToCurrentWorkout,
    updateTitle,
    updateGeneralNotes,
    updateEnergyRating,
    deleteWorkoutForDate,
  } = useWorkout();

  const [pickerVisible, setPickerVisible] = useState(false);
  const [timerVisible, setTimerVisible] = useState(false);

  const handleSelectExercise = (exerciseDef: ExerciseDefinition) => {
    if (exerciseDef.type === 'cardio') {
      addRunToCurrentWorkout(exerciseDef.name);
    } else {
      addExerciseToCurrentWorkout(exerciseDef);
    }
  };

  const handleToggleUnit = () => {
    const nextUnit = preferredUnit === 'kg' ? 'lbs' : 'kg';
    setPreferredUnit(nextUnit);
  };

  const confirmDeleteWorkout = () => {
    Alert.alert(
      'Clear Workout Log',
      `Clear all exercises and runs logged for ${activeDate}?`,
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
  const hasContent = exercises.length > 0 || runs.length > 0 || !!currentWorkout.generalNotes;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* App Header */}
      <View style={styles.topHeader}>
        <View style={styles.appTitleContainer}>
          <Text style={styles.appTitle}>Workout Logger</Text>
          <Text style={styles.appSubtitle}>Daily Training & Run Log</Text>
        </View>

        <View style={styles.headerActions}>
          {/* Unit Toggle Button */}
          <TouchableOpacity onPress={handleToggleUnit} style={styles.unitBtn}>
            <Text style={styles.unitBtnText}>{preferredUnit.toUpperCase()}</Text>
          </TouchableOpacity>

          {/* Rest Timer Button */}
          <TouchableOpacity
            onPress={() => setTimerVisible(true)}
            style={styles.timerBtn}
          >
            <Ionicons name="timer-outline" size={20} color="#0284c7" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Navigation Bar */}
      <DatePickerBar />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Workout Meta Section (Title, Energy) */}
        <View style={styles.metaCard}>
          <TextInput
            style={styles.titleInput}
            placeholder="Workout Title (e.g. Chest & Triceps, Push Day)..."
            placeholderTextColor="#94a3b8"
            value={currentWorkout.title || ''}
            onChangeText={updateTitle}
          />

          {/* Energy / Readiness Rating */}
          <View style={styles.energyRow}>
            <Text style={styles.energyLabel}>Energy / Feeling:</Text>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => updateEnergyRating(star)}
                  style={styles.starBtn}
                >
                  <Ionicons
                    name={(currentWorkout.energyRating || 0) >= star ? 'star' : 'star-outline'}
                    size={20}
                    color={(currentWorkout.energyRating || 0) >= star ? '#f59e0b' : '#cbd5e1'}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Exercises Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Exercises & Sets</Text>
          <Text style={styles.sectionSubtitle}>
            {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'}
          </Text>
        </View>

        {/* Strength Exercises */}
        {exercises.map((ex) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            onOpenTimer={() => setTimerVisible(true)}
          />
        ))}

        {/* Runs Section */}
        {runs.length > 0 && (
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Running & Cardio</Text>
            <Text style={styles.sectionSubtitle}>
              {runs.length} {runs.length === 1 ? 'run' : 'runs'}
            </Text>
          </View>
        )}

        {runs.map((r) => (
          <RunCard key={r.id} run={r} />
        ))}

        {/* Add Exercise / Run Action Buttons */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.addExerciseBtn}
            onPress={() => setPickerVisible(true)}
          >
            <Ionicons name="barbell-outline" size={20} color="#ffffff" />
            <Text style={styles.addExerciseBtnText}>+ Add Exercise</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addRunBtn}
            onPress={() => addRunToCurrentWorkout('Outdoor Run')}
          >
            <Ionicons name="walk-outline" size={20} color="#059669" />
            <Text style={styles.addRunBtnText}>+ Log Run</Text>
          </TouchableOpacity>
        </View>

        {/* Session General Notes */}
        <View style={styles.notesCard}>
          <Text style={styles.notesTitle}>Session Notes</Text>
          <TextInput
            style={styles.sessionNotesInput}
            multiline
            numberOfLines={3}
            placeholder="How did today feel? Any fatigue, soreness, PRs, or details for your AI coach?"
            placeholderTextColor="#94a3b8"
            value={currentWorkout.generalNotes || ''}
            onChangeText={updateGeneralNotes}
          />
        </View>

        {/* Clear Day Log */}
        {hasContent && (
          <TouchableOpacity
            style={styles.deleteWorkoutBtn}
            onPress={confirmDeleteWorkout}
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text style={styles.deleteWorkoutText}>Clear Today&apos;s Log</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Modals */}
      <ExercisePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelectExercise={handleSelectExercise}
      />

      <RestTimerModal
        visible={timerVisible}
        onClose={() => setTimerVisible(false)}
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
  appTitleContainer: {
    flex: 1,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unitBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  unitBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  timerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  metaCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  titleInput: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 10,
  },
  energyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  energyLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 4,
  },
  starBtn: {
    padding: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 12,
  },
  addExerciseBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 12,
    ...Platform.select({
      ios: { shadowColor: '#0284c7', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  addExerciseBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  addRunBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
    paddingVertical: 14,
    borderRadius: 12,
  },
  addRunBtnText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '700',
  },
  notesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  notesTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  sessionNotesInput: {
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    textAlignVertical: 'top',
    minHeight: 60,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  deleteWorkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
    paddingVertical: 10,
  },
  deleteWorkoutText: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '600',
  },
});
