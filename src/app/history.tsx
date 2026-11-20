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
import { filterWorkouts, computeStats } from '@/utils/report-generator';
import { formatDisplayDate, getDateFilterRangeLabel } from '@/utils/date-helpers';

const FILTERS: { key: TimeFilter; label: string }[] = [
  { key: '3days', label: 'Last 3 Days' },
  { key: '1week', label: 'Last Week' },
  { key: '1month', label: 'Last Month' },
  { key: 'all', label: 'All Time' },
];

export default function HistoryScreen() {
  const { workouts, setActiveDate, preferredUnit } = useWorkout();
  const [filter, setFilter] = useState<TimeFilter>('1month');
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  const filteredWorkouts = useMemo(() => {
    return filterWorkouts(workouts, filter);
  }, [workouts, filter]);

  const stats = useMemo(() => computeStats(filteredWorkouts), [filteredWorkouts]);

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
          <Text style={styles.headerTitle}>Past Workouts</Text>
          <Text style={styles.headerSubtitle}>
            {getDateFilterRangeLabel(filter)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.shareReportBtn}
          onPress={() => router.navigate('/report')}
        >
          <Ionicons name="share-outline" size={16} color="#ffffff" />
          <Text style={styles.shareReportText}>View / Share Report</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs: Last 3 Days, Last Week, Last Month, All Time */}
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{stats.totalWorkouts}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statVal}>
              {stats.totalVolumeKg.toLocaleString()} {preferredUnit}
            </Text>
            <Text style={styles.statLabel}>Volume</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statVal}>{stats.totalSets}</Text>
            <Text style={styles.statLabel}>Total Sets</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statVal}>{stats.totalRunDistanceKm} km</Text>
            <Text style={styles.statLabel}>Running</Text>
          </View>
        </View>

        {/* Workout Cards */}
        {filteredWorkouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={40} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No workouts in {getDateFilterRangeLabel(filter)}</Text>
          </View>
        ) : (
          filteredWorkouts.map((workout) => {
            const isExpanded = !!expandedDates[workout.date];
            const exCount = workout.exercises?.length || 0;
            const runCount = workout.runs?.length || 0;

            return (
              <View key={workout.id} style={styles.workoutCard}>
                <TouchableOpacity
                  style={styles.cardHeader}
                  onPress={() => toggleExpand(workout.date)}
                >
                  <View style={styles.cardHeaderLeft}>
                    <Text style={styles.cardDate}>
                      {formatDisplayDate(workout.date)}
                    </Text>
                    {workout.title ? (
                      <Text style={styles.cardTitle}>{workout.title}</Text>
                    ) : null}

                    <View style={styles.summaryRow}>
                      {exCount > 0 && (
                        <Text style={styles.summaryBadge}>
                          {exCount} {exCount === 1 ? 'exercise' : 'exercises'}
                        </Text>
                      )}
                      {runCount > 0 && (
                        <Text style={[styles.summaryBadge, styles.summaryRun]}>
                          {runCount} {runCount === 1 ? 'run' : 'runs'}
                        </Text>
                      )}
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
                    {workout.exercises?.map((ex) => (
                      <View key={ex.id} style={styles.detailEx}>
                        <Text style={styles.detailExName}>{ex.categoryName}</Text>
                        <View style={styles.setsList}>
                          {ex.sets.map((s) => (
                            <View key={s.id} style={styles.setChip}>
                              <Text style={styles.setChipText}>
                                #{s.setNumber}: {s.weight}{ex.weightUnit} × {s.reps}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ))}

                    {workout.runs?.map((r) => (
                      <View key={r.id} style={styles.detailRun}>
                        <Text style={styles.detailRunTitle}>🏃 {r.categoryName}</Text>
                        <Text style={styles.detailRunStats}>
                          {r.distance} {r.distanceUnit} in {r.durationMinutes}m{' '}
                          {r.durationSeconds}s ({r.pace})
                        </Text>
                      </View>
                    ))}

                    <TouchableOpacity
                      style={styles.openBtn}
                      onPress={() => jumpToWorkout(workout)}
                    >
                      <Ionicons name="create-outline" size={14} color="#0284c7" />
                      <Text style={styles.openBtnText}>Open & Edit in Daily Log</Text>
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
  shareReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  shareReportText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  filtersContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 8,
    padding: 3,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 6,
  },
  filterTabActive: {
    backgroundColor: '#ffffff',
    elevation: 1,
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  filterTabTextActive: {
    color: '#0284c7',
    fontWeight: '700',
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
    gap: 8,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  workoutCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284c7',
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  summaryBadge: {
    fontSize: 11,
    color: '#0284c7',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  summaryRun: {
    color: '#059669',
    backgroundColor: '#ecfdf5',
  },
  expandedDetails: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  detailEx: {
    marginBottom: 8,
  },
  detailExName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  setsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  setChip: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  setChipText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  detailRun: {
    backgroundColor: '#f0fdf4',
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  detailRunTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065f46',
  },
  detailRunStats: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 6,
    paddingVertical: 6,
    backgroundColor: '#f0f9ff',
    borderRadius: 6,
  },
  openBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284c7',
  },
});
