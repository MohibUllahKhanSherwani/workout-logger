import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  LoggedStrengthExercise,
  SetType,
  WorkoutSet,
} from '@/types/workout';
import { useWorkout } from '@/context/WorkoutContext';

interface Props {
  exercise: LoggedStrengthExercise;
  onOpenTimer?: () => void;
}

const SET_TYPES: { label: string; value: SetType }[] = [
  { label: 'N', value: 'normal' },
  { label: 'W', value: 'warmup' },
  { label: 'D', value: 'drop' },
  { label: 'F', value: 'failure' },
];

export const ExerciseCard: React.FC<Props> = ({ exercise, onOpenTimer }) => {
  const {
    updateStrengthExercise,
    removeExerciseFromCurrentWorkout,
    preferredUnit,
  } = useWorkout();

  const handleAddSet = () => {
    const sets = exercise.sets || [];
    const lastSet = sets[sets.length - 1];
    const newSet: WorkoutSet = {
      id: `set_${Date.now()}_${sets.length + 1}`,
      setNumber: sets.length + 1,
      type: lastSet ? lastSet.type : 'normal',
      weight: lastSet ? lastSet.weight : 0,
      reps: lastSet ? lastSet.reps : 10,
      rpe: lastSet?.rpe,
      completed: false,
      previousHint: lastSet?.previousHint,
    };

    updateStrengthExercise({
      ...exercise,
      sets: [...sets, newSet],
    });
  };

  const handleUpdateSet = (setId: string, updates: Partial<WorkoutSet>) => {
    const updatedSets = exercise.sets.map((s) =>
      s.id === setId ? { ...s, ...updates } : s
    );
    updateStrengthExercise({
      ...exercise,
      sets: updatedSets,
    });
  };

  const handleDeleteSet = (setId: string) => {
    const filtered = exercise.sets
      .filter((s) => s.id !== setId)
      .map((s, index) => ({ ...s, setNumber: index + 1 }));

    updateStrengthExercise({
      ...exercise,
      sets: filtered,
    });
  };

  const cycleSetType = (set: WorkoutSet) => {
    const currentIndex = SET_TYPES.findIndex((t) => t.value === set.type);
    const nextIndex = (currentIndex + 1) % SET_TYPES.length;
    handleUpdateSet(set.id, { type: SET_TYPES[nextIndex].value });
  };

  const confirmDeleteExercise = () => {
    Alert.alert(
      'Remove Exercise',
      `Are you sure you want to remove "${exercise.exerciseName}" from this workout?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeExerciseFromCurrentWorkout(exercise.id),
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      {/* Exercise Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.exerciseTitle}>{exercise.exerciseName}</Text>
          <View style={styles.badgeRow}>
            <Text style={styles.categoryBadge}>{exercise.category}</Text>
            <Text style={styles.unitBadge}>{exercise.weightUnit || preferredUnit}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {onOpenTimer && (
            <TouchableOpacity onPress={onOpenTimer} style={styles.headerIconBtn}>
              <Ionicons name="timer-outline" size={20} color="#0284c7" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={confirmDeleteExercise} style={styles.headerIconBtn}>
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sets Table Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.th, styles.colSet]}>SET</Text>
        <Text style={[styles.th, styles.colPrev]}>PREVIOUS</Text>
        <Text style={[styles.th, styles.colInput]}>WEIGHT</Text>
        <Text style={[styles.th, styles.colInput]}>REPS</Text>
        <Text style={[styles.th, styles.colDone]}>DONE</Text>
        <Text style={[styles.th, styles.colDel]}></Text>
      </View>

      {/* Set Rows */}
      {exercise.sets.map((set) => {
        const isWarmup = set.type === 'warmup';
        const isDrop = set.type === 'drop';
        const isFailure = set.type === 'failure';

        let badgeStyle = styles.typeNormal;
        if (isWarmup) badgeStyle = styles.typeWarmup;
        if (isDrop) badgeStyle = styles.typeDrop;
        if (isFailure) badgeStyle = styles.typeFailure;

        return (
          <View
            key={set.id}
            style={[styles.setRow, set.completed && styles.setRowCompleted]}
          >
            {/* Set number & type button */}
            <TouchableOpacity
              style={[styles.colSet, styles.setNumberBtn, badgeStyle]}
              onPress={() => cycleSetType(set)}
            >
              <Text style={styles.setNumberText}>
                {set.type === 'normal'
                  ? set.setNumber
                  : set.type.substring(0, 1).toUpperCase()}
              </Text>
            </TouchableOpacity>

            {/* Previous performance hint */}
            <View style={styles.colPrev}>
              <Text style={styles.prevText} numberOfLines={1}>
                {set.previousHint || '-'}
              </Text>
            </View>

            {/* Weight Input */}
            <View style={[styles.colInput, styles.inputContainer]}>
              <TextInput
                style={[styles.numericInput, set.completed && styles.inputCompleted]}
                keyboardType="numeric"
                defaultValue={set.weight ? String(set.weight) : ''}
                placeholder="0"
                placeholderTextColor="#94a3b8"
                onChangeText={(val) => {
                  const num = parseFloat(val);
                  handleUpdateSet(set.id, { weight: isNaN(num) ? 0 : num });
                }}
              />
            </View>

            {/* Reps Input */}
            <View style={[styles.colInput, styles.inputContainer]}>
              <TextInput
                style={[styles.numericInput, set.completed && styles.inputCompleted]}
                keyboardType="numeric"
                defaultValue={set.reps ? String(set.reps) : ''}
                placeholder="0"
                placeholderTextColor="#94a3b8"
                onChangeText={(val) => {
                  const num = parseInt(val, 10);
                  handleUpdateSet(set.id, { reps: isNaN(num) ? 0 : num });
                }}
              />
            </View>

            {/* Completed Checkbox */}
            <TouchableOpacity
              style={[styles.colDone, styles.checkBtn, set.completed && styles.checkBtnActive]}
              onPress={() => handleUpdateSet(set.id, { completed: !set.completed })}
            >
              <Ionicons
                name={set.completed ? 'checkmark' : 'checkmark-outline'}
                size={18}
                color={set.completed ? '#ffffff' : '#94a3b8'}
              />
            </TouchableOpacity>

            {/* Delete Set */}
            <TouchableOpacity
              style={[styles.colDel, styles.deleteSetBtn]}
              onPress={() => handleDeleteSet(set.id)}
            >
              <Ionicons name="close" size={16} color="#cbd5e1" />
            </TouchableOpacity>
          </View>
        );
      })}

      {/* Add Set Button */}
      <View style={styles.footerRow}>
        <TouchableOpacity style={styles.addSetBtn} onPress={handleAddSet}>
          <Ionicons name="add" size={16} color="#0284c7" />
          <Text style={styles.addSetBtnText}>Add Set</Text>
        </TouchableOpacity>

        {/* Notes input */}
        <TextInput
          style={styles.notesInput}
          placeholder="Add exercise notes or cues..."
          placeholderTextColor="#94a3b8"
          value={exercise.notes || ''}
          onChangeText={(notes) =>
            updateStrengthExercise({ ...exercise, notes })
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  categoryBadge: {
    fontSize: 11,
    color: '#0284c7',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '600',
  },
  unitBadge: {
    fontSize: 11,
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 6,
  },
  th: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 6,
  },
  setRowCompleted: {
    backgroundColor: '#f0fdf4',
  },
  colSet: {
    width: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colPrev: {
    flex: 1.2,
    paddingHorizontal: 4,
  },
  colInput: {
    width: 65,
    paddingHorizontal: 3,
  },
  colDone: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colDel: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumberBtn: {
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeNormal: {
    backgroundColor: '#f1f5f9',
  },
  typeWarmup: {
    backgroundColor: '#fef3c7',
  },
  typeDrop: {
    backgroundColor: '#fee2e2',
  },
  typeFailure: {
    backgroundColor: '#f3e8ff',
  },
  setNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  prevText: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
  },
  inputContainer: {
    justifyContent: 'center',
  },
  numericInput: {
    height: 34,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  inputCompleted: {
    backgroundColor: '#ffffff',
    borderColor: '#86efac',
    color: '#166534',
  },
  checkBtn: {
    height: 30,
    width: 30,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBtnActive: {
    backgroundColor: '#22c55e',
  },
  deleteSetBtn: {
    padding: 4,
  },
  footerRow: {
    marginTop: 10,
    gap: 8,
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 8,
    paddingVertical: 8,
  },
  addSetBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284c7',
  },
  notesInput: {
    fontSize: 12,
    color: '#475569',
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
});
