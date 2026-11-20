import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useWorkout } from '@/context/WorkoutContext';
import { TimeFilter } from '@/types/workout';
import {
  filterWorkouts,
  computeStats,
  buildAIPromptReport,
  buildWhatsAppReport,
  shareToWhatsApp,
  exportPdfReport,
  exportTextFileReport,
} from '@/utils/report-generator';
import { getDateFilterRangeLabel } from '@/utils/date-helpers';

const FILTERS: { key: TimeFilter; label: string }[] = [
  { key: '3days', label: 'Last 3 Days' },
  { key: '1week', label: 'Last Week' },
  { key: '1month', label: 'Last Month' },
  { key: 'all', label: 'All Time' },
];

export default function ReportScreen() {
  const { workouts, preferredUnit } = useWorkout();
  const [filter, setFilter] = useState<TimeFilter>('1week');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  const filteredWorkouts = useMemo(() => {
    return filterWorkouts(workouts, filter);
  }, [workouts, filter]);

  const stats = useMemo(() => computeStats(filteredWorkouts), [filteredWorkouts]);

  const aiReportText = useMemo(() => {
    return buildAIPromptReport(filteredWorkouts, filter);
  }, [filteredWorkouts, filter]);

  const whatsAppText = useMemo(() => {
    return buildWhatsAppReport(filteredWorkouts, filter);
  }, [filteredWorkouts, filter]);

  const handleShareWhatsApp = async () => {
    try {
      setIsExporting(true);
      await shareToWhatsApp(whatsAppText);
    } catch {
      Alert.alert('Share Error', 'Could not open WhatsApp sharing.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyForAI = async () => {
    try {
      await Clipboard.setStringAsync(aiReportText);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2500);
    } catch {
      Alert.alert('Copy Error', 'Failed to copy to clipboard.');
    }
  };

  const handleExportPdf = async () => {
    try {
      setIsExporting(true);
      await exportPdfReport(filteredWorkouts, filter);
    } catch {
      Alert.alert('Export Error', 'Failed to create and share PDF report.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportTextFile = async () => {
    try {
      setIsExporting(true);
      await exportTextFileReport(filteredWorkouts, filter);
    } catch {
      Alert.alert('Export Error', 'Failed to export text file.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>View & Share Report</Text>
          <Text style={styles.headerSubtitle}>
            Share with your AI agent on WhatsApp
          </Text>
        </View>
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

      {/* Copied Toast */}
      {copiedNotification && (
        <View style={styles.toast}>
          <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
          <Text style={styles.toastText}>
            Copied! Ready to paste into WhatsApp / AI Agent.
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Stats Summary */}
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statChipVal}>{stats.totalWorkouts}</Text>
            <Text style={styles.statChipLabel}>Workouts</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statChipVal}>
              {stats.totalVolumeKg.toLocaleString()} {preferredUnit}
            </Text>
            <Text style={styles.statChipLabel}>Volume</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statChipVal}>{stats.totalSets}</Text>
            <Text style={styles.statChipLabel}>Sets</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statChipVal}>{stats.totalRunDistanceKm} km</Text>
            <Text style={styles.statChipLabel}>Running</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsCard}>
          {/* Share to WhatsApp */}
          <TouchableOpacity
            style={styles.whatsAppBtn}
            onPress={handleShareWhatsApp}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="logo-whatsapp" size={20} color="#ffffff" />
                <Text style={styles.whatsAppBtnText}>Share to WhatsApp</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Copy Prompt for AI Agent */}
          <TouchableOpacity
            style={styles.copyBtn}
            onPress={handleCopyForAI}
            disabled={isExporting}
          >
            <Ionicons name="copy-outline" size={18} color="#0284c7" />
            <Text style={styles.copyBtnText}>Copy Prompt for AI Agent</Text>
          </TouchableOpacity>

          {/* Secondary PDF & TXT */}
          <View style={styles.secondaryExportRow}>
            <TouchableOpacity
              style={styles.fileExportBtn}
              onPress={handleExportPdf}
              disabled={isExporting}
            >
              <Ionicons name="document-text-outline" size={16} color="#475569" />
              <Text style={styles.fileExportBtnText}>Export PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.fileExportBtn}
              onPress={handleExportTextFile}
              disabled={isExporting}
            >
              <Ionicons name="document-outline" size={16} color="#475569" />
              <Text style={styles.fileExportBtnText}>Export .txt File</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Preview */}
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>Report Preview</Text>
            <Text style={styles.previewBadge}>
              {getDateFilterRangeLabel(filter)}
            </Text>
          </View>

          <View style={styles.codeBox}>
            <ScrollView
              nestedScrollEnabled
              style={styles.previewScroll}
              showsVerticalScrollIndicator
            >
              <Text style={styles.codeText}>{aiReportText}</Text>
            </ScrollView>
          </View>
        </View>
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
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  toastText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statChip: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statChipVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  statChipLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  actionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  whatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: 8,
  },
  whatsAppBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#0284c7',
    paddingVertical: 10,
    borderRadius: 8,
  },
  copyBtnText: {
    color: '#0284c7',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryExportRow: {
    flexDirection: 'row',
    gap: 8,
  },
  fileExportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    borderRadius: 6,
  },
  fileExportBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  previewContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
  },
  previewBadge: {
    fontSize: 11,
    color: '#0284c7',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '600',
  },
  codeBox: {
    backgroundColor: '#0f172a',
    borderRadius: 6,
    padding: 10,
    maxHeight: 250,
  },
  previewScroll: {
    maxHeight: 230,
  },
  codeText: {
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
    fontSize: 11,
    color: '#e2e8f0',
    lineHeight: 16,
  },
});
