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
import { LoggedRun } from '@/types/workout';
import { useWorkout } from '@/context/WorkoutContext';
import { calculatePace } from '@/utils/date-helpers';

interface Props {
  run: LoggedRun;
}

export const RunCard: React.FC<Props> = ({ run }) => {
  const { updateRun, removeRunFromWorkout } = useWorkout();

  const handleUpdate = (updates: Partial<LoggedRun>) => {
    const next = { ...run, ...updates };
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
      `Remove "${run.categoryName}" from this workout?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeRunFromWorkout(run.id),
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
          <Ionicons name="walk" size={18} color="#059669" />
          <Text style={styles.runTitle}>{run.categoryName}</Text>
          <Text style={styles.paceBadge}>Pace: {run.pace || '--:--'}</Text>
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
              style={styles.statInputInside}
              keyboardType="numeric"
              selectTextOnFocus
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
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

        {/* Minutes */}
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Minutes</Text>
          <TextInput
            style={styles.statInputStandalone}
            keyboardType="numeric"
            selectTextOnFocus
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
            placeholder="0"
            placeholderTextColor="#94a3b8"
            defaultValue={run.durationMinutes ? String(run.durationMinutes) : ''}
            onChangeText={(val) => {
              const mins = parseInt(val, 10);
              handleUpdate({ durationMinutes: isNaN(mins) ? 0 : mins });
            }}
          />
        </View>

        {/* Seconds */}
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Seconds</Text>
          <TextInput
            style={styles.statInputStandalone}
            keyboardType="numeric"
            selectTextOnFocus
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
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
    borderColor: '#a7f3d0',
  },
  header: {
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
    padding: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
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
    borderColor: '#cbd5e1',
    borderRadius: 8,
    minHeight: 40,
    paddingRight: 4,
    paddingLeft: 4,
  },
  statInputInside: {
    flex: 1,
    minHeight: 38,
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    paddingVertical: 2,
    paddingHorizontal: 2,
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
    }),
  },
  statInputStandalone: {
    minHeight: 40,
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 2,
    paddingHorizontal: 4,
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
    }),
  },
  unitToggle: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
  },
  unitText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
});
