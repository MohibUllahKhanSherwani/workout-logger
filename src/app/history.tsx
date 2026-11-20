import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useWorkout } from '@/context/WorkoutContext';
import { TimeFilter, DailyWorkout } from '@/types/workout';
import {
  filterWorkouts,
  computeStats,
} from '@/utils/report-generator';
import { formatDisplayDate, getDateFilterRangeLabel } from '@/utils/date-helpers';

const FILTERS: { key: TimeFilter; label: string }[] = [
  { key: '1day', label: '1 Day' },
  { key: '1week', label: '1 Week' },
  { key: '1month', label: '1 Month' },
  { key: 'all', label: 'All Time' },
];

export default function HistoryScreen() {
  const { workouts, setActiveDate, preferredUnit } = useWorkout();
  const [filter, setFilter] = useState<TimeFilter>('1month');
  const [selectedExerciseFilter, setSelectedExerciseFilter] = useState<string>('All');
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  const filteredWorkouts = useMemo(() => {
    const list = filterWorkouts(workouts, filter);
    if (selectedExerciseFilter === 'All') return list;
    return list.filter((w) =>
      w.exercises?.some((e) => e.exerciseName === selectedExerciseFilter) ||
      w.runs?.some((r) => r.exerciseName === selectedExerciseFilter)
    );
  }, [workouts, filter, selectedExerciseFilter]);

  const stats = useMemo(() => computeStats(filteredWorkouts), [filteredWorkouts]);

  const allAvailableExercises = useMemo(() => {
    const set = new Set<string>();
    workouts.forEach((w) => {
      w.exercises?.forEach((e) => set.add(e.exerciseName));
      w.runs?.forEach((r) => set.add(r.exerciseName));
    });
    return ['All', ...Array.from(set).sort()];
  }, [workouts]);

  const toggleExpand = (date: string) => {
    setExpandedDates((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  const jumpToWorkout = (workout: DailyWorkout) => {
    setActiveDate(workout.date);
    router.navigate('/');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Workout History</Text>
          <Text style={styles.headerSubtitle}>
            {getDateFilterRangeLabel(filter)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.reportShortcutBtn}
          onPress={() => router.navigate('/report')}
        >
          <Ionicons name="sparkles" size={16} color="#ffffff" />
          <Text style={styles.reportShortcutText}>AI Report</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs (1 Day, 1 Week, 1 Month, All Time) */}
      <View style={styles.filtersContainer}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === f.key && styles.filterTabTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Exercise Filter Chips */}
      {allAvailableExercises.length > 2 && (
        <View style={styles.exerciseFilterWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {allAvailableExercises.map((exName) => {
              const isSelected = selectedExerciseFilter === exName;
              return (
                <TouchableOpacity
                  key={exName}
                  style={[
                    styles.exerciseFilterChip,
                    isSelected && styles.exerciseFilterChipActive,
                  ]}
                  onPress={() => setSelectedExerciseFilter(exName)}
                >
                  <Text
                    style={[
                      styles.exerciseFilterChipText,
                      isSelected && styles.exerciseFilterChipTextActive,
                    ]}
                  >
                    {exName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Analytics Summary Dashboard */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Ionicons name="calendar-outline" size={18} color="#0284c7" />
            <Text style={styles.statVal}>{stats.totalWorkouts}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons name="barbell-outline" size={18} color="#0284c7" />
            <Text style={styles.statVal}>
              {stats.totalVolumeKg.toLocaleString()} {preferredUnit}
            </Text>
            <Text style={styles.statLabel}>Total Volume</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons name="layers-outline" size={18} color="#0284c7" />
            <Text style={styles.statVal}>{stats.totalSets}</Text>
            <Text style={styles.statLabel}>Total Sets</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons name="walk-outline" size={18} color="#059669" />
            <Text style={styles.statVal}>{stats.totalRunDistanceKm} km</Text>
            <Text style={styles.statLabel}>Run Distance</Text>
          </View>
        </View>

        {/* Category Breakdown Chips */}
        {Object.keys(stats.categoryBreakdown).length > 0 && (
          <View style={styles.categoryBreakdownCard}>
            <Text style={styles.cardHeaderSmall}>Volume by Muscle Group</Text>
            <View style={styles.categoryChipsRow}>
              {Object.entries(stats.categoryBreakdown).map(([cat, count]) => (
                <View key={cat} style={styles.catMetricChip}>
                  <Text style={styles.catMetricName}>{cat}</Text>
                  <Text style={styles.catMetricCount}>{count} sets</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Workout Cards List */}
        <View style={styles.listSectionHeader}>
          <Text style={styles.listSectionTitle}>
            Logged Sessions ({filteredWorkouts.length})
          </Text>
        </View>

        {filteredWorkouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="fitness-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyStateTitle}>No workouts found</Text>
            <Text style={styles.emptyStateSub}>
              Try changing the time filter or log a workout on the Daily Log tab.
            </Text>
          </View>
        ) : (
          filteredWorkouts.map((workout) => {
            const isExpanded = !!expandedDates[workout.date];
            const exCount = workout.exercises?.length || 0;
            const runCount = workout.runs?.length || 0;

            let sessionVol = 0;
            workout.exercises?.forEach((ex) => {
              ex.sets?.forEach((s) => {
                sessionVol += (Number(s.weight) || 0) * (Number(s.reps) || 0);
              });
            });

            return (
              <View key={workout.id} style={styles.workoutCard}>
                {/* Card Header */}
                <TouchableOpacity
                  style={styles.cardTop}
                  onPress={() => toggleExpand(workout.date)}
                >
                  <View style={styles.cardHeaderDetails}>
                    <Text style={styles.cardDate}>
                      {formatDisplayDate(workout.date)}
                    </Text>
                    {workout.title ? (
                      <Text style={styles.cardWorkoutTitle}>{workout.title}</Text>
                    ) : null}

                    {/* Summary badges */}
                    <View style={styles.cardBadgesRow}>
                      {exCount > 0 && (
                        <View style={styles.badgeItem}>
                          <Ionicons name="barbell" size={12} color="#0284c7" />
                          <Text style={styles.badgeItemText}>
                            {exCount} exercises • {sessionVol.toLocaleString()}{' '}
                            {preferredUnit}
                          </Text>
                        </View>
                      )}
                      {runCount > 0 && (
                        <View style={[styles.badgeItem, styles.badgeRun]}>
                          <Ionicons name="walk" size={12} color="#059669" />
                          <Text style={[styles.badgeItemText, styles.badgeRunText]}>
                            {runCount} {runCount === 1 ? 'run' : 'runs'}
                          </Text>
                        </View>
                      )}
                      {workout.energyRating ? (
                        <View style={styles.energyBadge}>
                          <Text style={styles.energyBadgeText}>
                            {'⭐'.repeat(workout.energyRating)}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#94a3b8"
                  />
                </TouchableOpacity>

                {/* Expanded Details */}
                {isExpanded && (
                  <View style={styles.expandedDetails}>
                    {/* General Notes */}
                    {workout.generalNotes ? (
                      <View style={styles.notesBox}>
                        <Text style={styles.notesText}>
                          &quot;{workout.generalNotes}&quot;
                        </Text>
                      </View>
                    ) : null}

                    {/* Exercises */}
                    {workout.exercises?.map((ex) => (
                      <View key={ex.id} style={styles.detailExItem}>
                        <View style={styles.detailExHeader}>
                          <Text style={styles.detailExName}>{ex.exerciseName}</Text>
                          <Text style={styles.detailExCat}>{ex.category}</Text>
                        </View>
                        <View style={styles.setGrid}>
                          {ex.sets?.map((s) => (
                            <View key={s.id} style={styles.setTag}>
                              <Text style={styles.setTagNum}>#{s.setNumber}:</Text>
                              <Text style={styles.setTagVal}>
                                {s.weight}
                                {ex.weightUnit} × {s.reps}
                              </Text>
                            </View>
                          ))}
                        </View>
                        {ex.notes ? (
                          <Text style={styles.exNoteText}>Note: {ex.notes}</Text>
                        ) : null}
                      </View>
                    ))}

                    {/* Runs */}
                    {workout.runs?.map((r) => (
                      <View key={r.id} style={styles.detailRunItem}>
                        <View style={styles.detailExHeader}>
                          <Text style={styles.detailRunName}>🏃 {r.exerciseName}</Text>
                          <Text style={styles.detailRunPace}>
                            {r.pace || `${r.durationMinutes}m ${r.durationSeconds}s`}
                          </Text>
                        </View>
                        <Text style={styles.runDetailStats}>
                          {r.distance} {r.distanceUnit} in {r.durationMinutes}m{' '}
                          {r.durationSeconds}s
                          {r.avgHeartRate ? ` • ${r.avgHeartRate} bpm` : ''}
                          {r.calories ? ` • ${r.calories} kcal` : ''}
                        </Text>
                        {r.notes ? (
                          <Text style={styles.exNoteText}>Note: {r.notes}</Text>
                        ) : null}
                      </View>
                    ))}

                    {/* Jump to edit */}
                    <TouchableOpacity
                      style={styles.openInLoggerBtn}
                      onPress={() => jumpToWorkout(workout)}
                    >
                      <Ionicons name="create-outline" size={15} color="#0284c7" />
                      <Text style={styles.openInLoggerText}>
                        Open & Edit in Daily Log
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  reportShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  reportShortcutText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  filtersContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 10,
    padding: 3,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  filterTabTextActive: {
    color: '#0284c7',
    fontWeight: '700',
  },
  exerciseFilterWrapper: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  exerciseFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  exerciseFilterChipActive: {
    backgroundColor: '#0284c7',
  },
  exerciseFilterChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  exerciseFilterChipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  categoryBreakdownCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeaderSmall: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  categoryChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catMetricChip: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  catMetricName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  catMetricCount: {
    fontSize: 12,
    color: '#0284c7',
    fontWeight: '700',
  },
  listSectionHeader: {
    marginBottom: 10,
  },
  listSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  emptyStateSub: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 260,
  },
  workoutCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderDetails: {
    flex: 1,
  },
  cardDate: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardWorkoutTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284c7',
    marginTop: 2,
  },
  cardBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeItemText: {
    fontSize: 11,
    color: '#0369a1',
    fontWeight: '500',
  },
  badgeRun: {
    backgroundColor: '#ecfdf5',
  },
  badgeRunText: {
    color: '#047857',
  },
  energyBadge: {
    paddingHorizontal: 4,
  },
  energyBadgeText: {
    fontSize: 11,
  },
  expandedDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  notesBox: {
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  notesText: {
    fontSize: 12,
    color: '#475569',
    fontStyle: 'italic',
  },
  detailExItem: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  detailExHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailExName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  detailExCat: {
    fontSize: 10,
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  setGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  setTag: {
    flexDirection: 'row',
    gap: 3,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  setTagNum: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  setTagVal: {
    fontSize: 11,
    color: '#0f172a',
    fontWeight: '600',
  },
  exNoteText: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 3,
  },
  detailRunItem: {
    backgroundColor: '#f0fdf4',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  detailRunName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065f46',
  },
  detailRunPace: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  runDetailStats: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
  },
  openInLoggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginTop: 6,
    backgroundColor: '#f0f9ff',
    borderRadius: 6,
  },
  openInLoggerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284c7',
  },
});
