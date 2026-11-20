import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addDays, formatDisplayDate, getTodayDateString } from '@/utils/date-helpers';
import { useWorkout } from '@/context/WorkoutContext';

export const DatePickerBar: React.FC = () => {
  const { activeDate, setActiveDate, currentWorkout } = useWorkout();
  const today = getTodayDateString();
  const isToday = activeDate === today;

  const totalExercises =
    (currentWorkout.exercises?.length || 0) + (currentWorkout.runs?.length || 0);

  const handlePrevDay = () => {
    setActiveDate(addDays(activeDate, -1));
  };

  const handleNextDay = () => {
    setActiveDate(addDays(activeDate, 1));
  };

  const handleJumpToday = () => {
    setActiveDate(today);
  };

  return (
    <View style={styles.container}>
      <View style={styles.navRow}>
        <TouchableOpacity onPress={handlePrevDay} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={20} color="#0284c7" />
        </TouchableOpacity>

        <View style={styles.dateInfoContainer}>
          <Text style={styles.dateTitle}>{formatDisplayDate(activeDate)}</Text>
          <View style={styles.badgeRow}>
            {isToday ? (
              <View style={styles.todayPill}>
                <Text style={styles.todayPillText}>Today</Text>
              </View>
            ) : (
              <TouchableOpacity onPress={handleJumpToday} style={styles.jumpTodayBtn}>
                <Text style={styles.jumpTodayText}>Jump to Today</Text>
              </TouchableOpacity>
            )}

            {totalExercises > 0 ? (
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>
                  {totalExercises} {totalExercises === 1 ? 'activity' : 'activities'}
                </Text>
              </View>
            ) : (
              <Text style={styles.noWorkoutText}>No activities logged yet</Text>
            )}
          </View>
        </View>

        <TouchableOpacity onPress={handleNextDay} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={20} color="#0284c7" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateInfoContainer: {
    alignItems: 'center',
    flex: 1,
  },
  dateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayPill: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  todayPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  jumpTodayBtn: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  jumpTodayText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284c7',
  },
  activePill: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
  },
  noWorkoutText: {
    fontSize: 11,
    color: '#94a3b8',
  },
});
