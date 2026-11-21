import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoggedStrengthExercise, WorkoutSet } from '@/types/workout';
import { useWorkout } from '@/context/WorkoutContext';

interface Props {
  exercise: LoggedStrengthExercise;
}

export const ExerciseCard: React.FC<Props> = ({ exercise }) => {
  const { updateStrengthExercise, removeExerciseFromWorkout, preferredUnit } =
    useWorkout();

  const handleAddSet = () => {
    const sets = exercise.sets || [];
    const lastSet = sets[sets.length - 1];
    const newSet: WorkoutSet = {
      id: `set_${Date.now()}_${sets.length + 1}`,
      setNumber: sets.length + 1,
      weight: lastSet ? lastSet.weight : 0,
      reps: lastSet ? lastSet.reps : 10,
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

  const confirmDeleteExercise = () => {
    Alert.alert(
      'Remove',
      `Remove "${exercise.categoryName}" from this workout?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeExerciseFromWorkout(exercise.id),
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.categoryTitle}>{exercise.categoryName}</Text>
          <Text style={styles.unitBadge}>{exercise.weightUnit || preferredUnit}</Text>
        </View>

        <TouchableOpacity onPress={confirmDeleteExercise} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
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
      {exercise.sets.map((set) => (
        <View
          key={set.id}
          style={[styles.setRow, set.completed && styles.setRowCompleted]}
        >
          {/* Set Number */}
          <View style={[styles.colSet, styles.setNumberBox]}>
            <Text style={styles.setNumberText}>{set.setNumber}</Text>
          </View>

          {/* Previous Hint */}
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
              selectTextOnFocus
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
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
              selectTextOnFocus
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
              defaultValue={set.reps ? String(set.reps) : ''}
              placeholder="0"
              placeholderTextColor="#94a3b8"
              onChangeText={(val) => {
                const num = parseInt(val, 10);
                handleUpdateSet(set.id, { reps: isNaN(num) ? 0 : num });
              }}
            />
          </View>

          {/* Done Checkbox */}
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
      ))}

      {/* Add Set Button */}
      <TouchableOpacity style={styles.addSetBtn} onPress={handleAddSet}>
        <Ionicons name="add" size={16} color="#0284c7" />
        <Text style={styles.addSetBtnText}>Add Set</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
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
  deleteBtn: {
    padding: 4,
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
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colPrev: {
    flex: 1.1,
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  colInput: {
    flex: 1.2,
    paddingHorizontal: 3,
    justifyContent: 'center',
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
  setNumberBox: {
    width: 26,
    height: 26,
    borderRadius: 4,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  setNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
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
    minHeight: 38,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    paddingHorizontal: 4,
    paddingVertical: 2,
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
    }),
  },
  inputCompleted: {
    backgroundColor: '#ffffff',
    borderColor: '#86efac',
    color: '#166534',
  },
  checkBtn: {
    height: 32,
    width: 32,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBtnActive: {
    backgroundColor: '#22c55e',
  },
  deleteSetBtn: {
    padding: 2,
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 6,
    paddingVertical: 7,
    marginTop: 8,
  },
  addSetBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284c7',
  },
});
