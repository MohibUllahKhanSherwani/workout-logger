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
  { key: '1day', label: '1 Day' },
  { key: '1week', label: '1 Week' },
  { key: '1month', label: '1 Month' },
  { key: 'all', label: 'All Time' },
];

export default function ReportScreen() {
  const { workouts, preferredUnit } = useWorkout();
  const [filter, setFilter] = useState<TimeFilter>('1month');
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

  // Action: Share to WhatsApp
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

  // Action: Copy for AI Agent (ChatGPT, Claude, etc.)
  const handleCopyForAI = async () => {
    try {
      await Clipboard.setStringAsync(aiReportText);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 3000);
    } catch {
      Alert.alert('Copy Error', 'Failed to copy to clipboard.');
    }
  };

  // Action: Export PDF Report
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

  // Action: Export Text File (.txt)
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
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>AI Coach Report</Text>
          <Text style={styles.headerSubtitle}>
            Share with your AI agent on WhatsApp
          </Text>
        </View>
        <View style={styles.aiBadge}>
          <Ionicons name="sparkles" size={14} color="#7c3aed" />
          <Text style={styles.aiBadgeText}>AI Ready</Text>
        </View>
      </View>

      {/* Time Filter Pills */}
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

      {/* Copy Notification Toast */}
      {copiedNotification && (
        <View style={styles.toast}>
          <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
          <Text style={styles.toastText}>
            Copied to clipboard! Ready to paste into WhatsApp / AI Agent.
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Summary Metric Badges */}
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statChipVal}>{stats.totalWorkouts}</Text>
            <Text style={styles.statChipLabel}>Sessions</Text>
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

        {/* AI Agent Instructions Banner */}
        <View style={styles.instructionBanner}>
          <View style={styles.bannerIcon}>
            <Ionicons name="bulb-outline" size={20} color="#2563eb" />
          </View>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>
              How this helps your AI Agent:
            </Text>
            <Text style={styles.bannerBody}>
              This report structures your progressive overload, running volume,
              reps, and sets with a pre-tuned prompt so ChatGPT, Claude, or your
              WhatsApp AI bot can critique form, recommend exact weights, and plan
              your next sessions.
            </Text>
          </View>
        </View>

        {/* Primary Action Buttons */}
        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Share & Export Options</Text>

          {/* Button 1: Share to WhatsApp */}
          <TouchableOpacity
            style={styles.whatsAppBtn}
            onPress={handleShareWhatsApp}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="logo-whatsapp" size={22} color="#ffffff" />
                <Text style={styles.whatsAppBtnText}>Share to WhatsApp</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Button 2: Copy Prompt for AI Agent */}
          <TouchableOpacity
            style={styles.copyBtn}
            onPress={handleCopyForAI}
            disabled={isExporting}
          >
            <Ionicons name="copy-outline" size={20} color="#0284c7" />
            <Text style={styles.copyBtnText}>Copy Prompt for AI Agent</Text>
          </TouchableOpacity>

          {/* Secondary File Exports: PDF & TXT */}
          <View style={styles.secondaryExportRow}>
            <TouchableOpacity
              style={styles.fileExportBtn}
              onPress={handleExportPdf}
              disabled={isExporting}
            >
              <Ionicons name="document-text-outline" size={18} color="#475569" />
              <Text style={styles.fileExportBtnText}>Export PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.fileExportBtn}
              onPress={handleExportTextFile}
              disabled={isExporting}
            >
              <Ionicons name="document-outline" size={18} color="#475569" />
              <Text style={styles.fileExportBtnText}>Export .txt File</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Preview Box */}
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>Live Report Preview</Text>
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
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  aiBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7c3aed',
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
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
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
    marginBottom: 14,
  },
  statChip: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
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
  instructionBanner: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  bannerIcon: {
    marginTop: 2,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 2,
  },
  bannerBody: {
    fontSize: 12,
    color: '#3b82f6',
    lineHeight: 17,
  },
  actionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  actionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  whatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#25D366',
    paddingVertical: 14,
    borderRadius: 12,
    ...Platform.select({
      ios: { shadowColor: '#25D366', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  whatsAppBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1.5,
    borderColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 12,
  },
  copyBtnText: {
    color: '#0284c7',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryExportRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  fileExportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    borderRadius: 10,
  },
  fileExportBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  previewContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
  },
  previewBadge: {
    fontSize: 11,
    color: '#0284c7',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    fontWeight: '600',
  },
  codeBox: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    maxHeight: 280,
  },
  previewScroll: {
    maxHeight: 250,
  },
  codeText: {
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
    fontSize: 11,
    color: '#e2e8f0',
    lineHeight: 16,
  },
});
