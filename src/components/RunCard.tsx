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
import { LoggedRun } from '@/types/workout';
import { useWorkout } from '@/context/WorkoutContext';
import { calculatePace } from '@/utils/date-helpers';

interface Props {
  run: LoggedRun;
}

export const RunCard: React.FC<Props> = ({ run }) => {
  const { updateRun, removeRunFromCurrentWorkout } = useWorkout();

  const handleUpdate = (updates: Partial<LoggedRun>) => {
    const next = { ...run, ...updates };
    // recalculate pace
    const distanceKm =
      next.distanceUnit === 'mi'
        ? (next.distance || 0) * 1.60934
        : next.distance || 0;
    const pace = calculatePace(
      distanceKm,
      next.durationMinutes || 0,
      next.durationSeconds || 0
    );
    updateRun({ ...next, pace });
  };

  const confirmDelete = () => {
    Alert.alert(
      'Remove Run',
      `Are you sure you want to remove "${run.exerciseName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeRunFromCurrentWorkout(run.id),
        },
      ]
    );
  };

  const toggleUnit = () => {
    const newUnit = run.distanceUnit === 'km' ? 'mi' : 'km';
    handleUpdate({ distanceUnit: newUnit });
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <Ionicons name="walk" size={18} color="#059669" />
          </View>
          <View>
            <Text style={styles.runTitle}>{run.exerciseName}</Text>
            <Text style={styles.paceBadge}>Pace: {run.pace || '--:--'}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={confirmDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Main Stats Row */}
      <View style={styles.statsRow}>
        {/* Distance */}
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Distance</Text>
          <View style={styles.inputWithUnit}>
            <TextInput
              style={styles.statInput}
              keyboardType="numeric"
              placeholder="0.0"
              placeholderTextColor="#94a3b8"
              defaultValue={run.distance ? String(run.distance) : ''}
              onChangeText={(val) => {
                const dist = parseFloat(val);
                handleUpdate({ distance: isNaN(dist) ? 0 : dist });
              }}
            />
            <TouchableOpacity onPress={toggleUnit} style={styles.unitToggle}>
              <Text style={styles.unitText}>{run.distanceUnit}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Duration Minutes */}
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Minutes</Text>
          <TextInput
            style={styles.statInput}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#94a3b8"
            defaultValue={run.durationMinutes ? String(run.durationMinutes) : ''}
            onChangeText={(val) => {
              const mins = parseInt(val, 10);
              handleUpdate({ durationMinutes: isNaN(mins) ? 0 : mins });
            }}
          />
        </View>

        {/* Duration Seconds */}
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Seconds</Text>
          <TextInput
            style={styles.statInput}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#94a3b8"
            defaultValue={run.durationSeconds ? String(run.durationSeconds) : ''}
            onChangeText={(val) => {
              const secs = parseInt(val, 10);
              handleUpdate({ durationSeconds: isNaN(secs) ? 0 : secs });
            }}
          />
        </View>
      </View>

      {/* Secondary Row (HR & Calories) */}
      <View style={styles.secondaryRow}>
        <View style={styles.secInputBox}>
          <Ionicons name="heart-outline" size={14} color="#e11d48" />
          <TextInput
            style={styles.secInput}
            keyboardType="numeric"
            placeholder="Avg HR (bpm)"
            placeholderTextColor="#94a3b8"
            defaultValue={run.avgHeartRate ? String(run.avgHeartRate) : ''}
            onChangeText={(val) => {
              const hr = parseInt(val, 10);
              handleUpdate({ avgHeartRate: isNaN(hr) ? undefined : hr });
            }}
          />
        </View>

        <View style={styles.secInputBox}>
          <Ionicons name="flame-outline" size={14} color="#ea580c" />
          <TextInput
            style={styles.secInput}
            keyboardType="numeric"
            placeholder="Calories (kcal)"
            placeholderTextColor="#94a3b8"
            defaultValue={run.calories ? String(run.calories) : ''}
            onChangeText={(val) => {
              const cal = parseInt(val, 10);
              handleUpdate({ calories: isNaN(cal) ? undefined : cal });
            }}
          />
        </View>
      </View>

      {/* Notes / Route */}
      <TextInput
        style={styles.notesInput}
        placeholder="Run notes (e.g. morning road run, hills, felt easy/hard)..."
        placeholderTextColor="#94a3b8"
        value={run.notes || ''}
        onChangeText={(notes) => handleUpdate({ notes })}
      />
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
    borderColor: '#a7f3d0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  runTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065f46',
  },
  paceBadge: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  statBox: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  inputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingRight: 6,
  },
  statInput: {
    flex: 1,
    height: 38,
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  unitToggle: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  unitText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  secInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 34,
  },
  secInput: {
    flex: 1,
    fontSize: 12,
    color: '#0f172a',
  },
  notesInput: {
    fontSize: 12,
    color: '#334155',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
});
