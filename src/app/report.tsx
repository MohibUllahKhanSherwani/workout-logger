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
  shareReportSheet,
} from '@/utils/report-generator';
import { getDateFilterRangeDetails } from '@/utils/date-helpers';

interface FilterOption {
  key: TimeFilter;
  label: string;
}

const FILTERS: FilterOption[] = [
  { key: 'thisWeek', label: 'This Week' },
  { key: 'lastWeek', label: 'Last Week' },
  { key: '3days', label: 'Last 3 Days' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'lastMonth', label: 'Last Month' },
  { key: 'all', label: 'All Time' },
];

export default function ReportScreen() {
  const { workouts, preferredUnit, exportBackup } = useWorkout();
  const [filter, setFilter] = useState<TimeFilter>('thisWeek');
  const [previewTab, setPreviewTab] = useState<'ai' | 'clean'>('ai');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const filteredWorkouts = useMemo(() => {
    return filterWorkouts(workouts, filter);
  }, [workouts, filter]);

  const stats = useMemo(
    () => computeStats(filteredWorkouts, preferredUnit),
    [filteredWorkouts, preferredUnit]
  );

  const rangeDetails = useMemo(() => {
    return getDateFilterRangeDetails(filter);
  }, [filter]);

  const aiReportText = useMemo(() => {
    return buildAIPromptReport(filteredWorkouts, filter, preferredUnit);
  }, [filteredWorkouts, filter, preferredUnit]);

  const whatsAppText = useMemo(() => {
    return buildWhatsAppReport(filteredWorkouts, filter, preferredUnit);
  }, [filteredWorkouts, filter, preferredUnit]);

  const showToast = (msg: string) => {
    setCopiedNotification(msg);
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  const handleCopyForAI = async () => {
    try {
      await Clipboard.setStringAsync(aiReportText);
      showToast('Copied! Paste directly into ChatGPT, Claude, or your AI coach.');
    } catch {
      Alert.alert('Copy Error', 'Failed to copy to clipboard.');
    }
  };

  const handleCopyCleanText = async () => {
    try {
      await Clipboard.setStringAsync(whatsAppText);
      showToast('Copied text report to clipboard!');
    } catch {
      Alert.alert('Copy Error', 'Failed to copy to clipboard.');
    }
  };

  const handleExportPdf = async () => {
    try {
      setIsExporting(true);
      await exportPdfReport(filteredWorkouts, filter, preferredUnit);
    } catch {
      Alert.alert('Export Error', 'Failed to create and share PDF report.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportTextFile = async () => {
    try {
      setIsExporting(true);
      await exportTextFileReport(filteredWorkouts, filter, preferredUnit);
    } catch {
      Alert.alert('Export Error', 'Failed to export text file.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareSheet = async () => {
    try {
      setIsExporting(true);
      await shareReportSheet(aiReportText, `Workout Report - ${rangeDetails.title}`);
    } catch {
      Alert.alert('Share Error', 'Failed to open share sheet.');
    } finally {
      setIsExporting(false);
    }
  };

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

  const handleExportFullBackup = async () => {
    try {
      setIsExporting(true);
      await exportBackup();
      showToast('Workout backup exported! Save it to Google Drive or Files.');
    } catch {
      Alert.alert('Backup Error', 'Failed to export workout backup.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTitle}>Workout Reports</Text>
          <Text style={styles.headerSubtitle}>
            Generate PDF, text, & ChatGPT coaching prompts
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerBackupBtn}
          onPress={handleExportFullBackup}
          disabled={isExporting}
        >
          <Ionicons name="cloud-download-outline" size={16} color="#0284c7" />
          <Text style={styles.headerBackupText}>Backup</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs Bar (Horizontal Scrollable) */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTERS.map((f) => {
            const isActive = filter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setFilter(f.key)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Range Date Badge Banner */}
      <View style={styles.rangeBanner}>
        <Ionicons name="calendar-outline" size={14} color="#0284c7" />
        <Text style={styles.rangeText}>
          Period: <Text style={styles.rangeBold}>{rangeDetails.title}</Text> ({rangeDetails.subtitle})
        </Text>
      </View>

      {/* Copied Notification Toast */}
      {copiedNotification && (
        <View style={styles.toast}>
          <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
          <Text style={styles.toastText}>{copiedNotification}</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
      >
        {/* Quick Stats Grid */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{stats.totalWorkouts}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statVal}>
              {stats.totalVolumeKg.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Volume ({preferredUnit})</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statVal}>{stats.totalSets}</Text>
            <Text style={styles.statLabel}>Total Sets</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statVal}>
              {stats.totalRunDistanceKm > 0 ? `${stats.totalRunDistanceKm}k` : '0'}
            </Text>
            <Text style={styles.statLabel}>Run (km)</Text>
          </View>
        </View>

        {/* Primary Export Actions Card */}
        <View style={styles.actionsCard}>
          <Text style={styles.actionsCardTitle}>EXPORT & SHARE OPTIONS</Text>

          {/* Copy for ChatGPT / AI Agent (Highlighted primary button) */}
          <TouchableOpacity
            style={styles.primaryAgentBtn}
            onPress={handleCopyForAI}
            disabled={isExporting}
          >
            <View style={styles.btnIconCircle}>
              <Ionicons name="sparkles" size={18} color="#ffffff" />
            </View>
            <View style={styles.btnTextGroup}>
              <Text style={styles.primaryBtnTitle}>Copy Prompt for ChatGPT / Agent</Text>
              <Text style={styles.primaryBtnSub}>
                Formatted with coaching prompt & progressive overload tables
              </Text>
            </View>
            <Ionicons name="copy-outline" size={18} color="#ffffff" />
          </TouchableOpacity>

          {/* Export PDF Button */}
          <TouchableOpacity
            style={styles.pdfBtn}
            onPress={handleExportPdf}
            disabled={isExporting}
          >
            <View style={[styles.btnIconCircle, { backgroundColor: '#ef4444' }]}>
              <Ionicons name="document-text" size={18} color="#ffffff" />
            </View>
            <View style={styles.btnTextGroup}>
              <Text style={styles.pdfBtnTitle}>Generate & Share PDF Report</Text>
              <Text style={styles.pdfBtnSub}>
                Crisp tables, session breakdowns, & performance summary
              </Text>
            </View>
            <Ionicons name="share-outline" size={18} color="#0f172a" />
          </TouchableOpacity>

          {/* Secondary Action Grid: Share App, Export .txt, WhatsApp */}
          <View style={styles.secondaryGrid}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handleShareSheet}
              disabled={isExporting}
            >
              <Ionicons name="share-social-outline" size={16} color="#0284c7" />
              <Text style={styles.secondaryBtnText}>Share via App...</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handleExportTextFile}
              disabled={isExporting}
            >
              <Ionicons name="document-outline" size={16} color="#475569" />
              <Text style={styles.secondaryBtnText}>Save .txt File</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryBtn, styles.whatsappBtnStyle]}
              onPress={handleShareWhatsApp}
              disabled={isExporting}
            >
              <Ionicons name="logo-whatsapp" size={16} color="#16a34a" />
              <Text style={[styles.secondaryBtnText, { color: '#16a34a' }]}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Data Persistence / Backup Card */}
        <View style={styles.backupCard}>
          <View style={styles.backupHeader}>
            <Ionicons name="shield-checkmark" size={18} color="#059669" />
            <Text style={styles.backupTitle}>Reinstall & Data Protection</Text>
          </View>
          <Text style={styles.backupDesc}>
            Backups keep your workout history 100% safe if you reinstall the app or switch devices. Export a backup anytime to save on Google Drive, Files, or WhatsApp.
          </Text>
          <TouchableOpacity
            style={styles.backupActionBtn}
            onPress={handleExportFullBackup}
            disabled={isExporting}
          >
            <Ionicons name="download-outline" size={16} color="#059669" />
            <Text style={styles.backupActionText}>Export Full Workout Backup (.json)</Text>
          </TouchableOpacity>
        </View>

        {/* Live Preview Card */}
        <View style={styles.previewContainer}>
          <View style={styles.previewHeaderRow}>
            <View style={styles.previewTabs}>
              <TouchableOpacity
                style={[
                  styles.previewTabItem,
                  previewTab === 'ai' && styles.previewTabItemActive,
                ]}
                onPress={() => setPreviewTab('ai')}
              >
                <Text
                  style={[
                    styles.previewTabItemText,
                    previewTab === 'ai' && styles.previewTabItemTextActive,
                  ]}
                >
                  AI Prompt Preview
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.previewTabItem,
                  previewTab === 'clean' && styles.previewTabItemActive,
                ]}
                onPress={() => setPreviewTab('clean')}
              >
                <Text
                  style={[
                    styles.previewTabItemText,
                    previewTab === 'clean' && styles.previewTabItemTextActive,
                  ]}
                >
                  Clean Text
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.previewCopyBtn}
              onPress={previewTab === 'ai' ? handleCopyForAI : handleCopyCleanText}
            >
              <Ionicons name="copy-outline" size={14} color="#0284c7" />
              <Text style={styles.previewCopyText}>Copy</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.codeBox}>
            <ScrollView
              nestedScrollEnabled
              style={styles.previewScroll}
              showsVerticalScrollIndicator
            >
              <Text style={styles.codeText}>
                {previewTab === 'ai' ? aiReportText : whatsAppText}
              </Text>
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      {/* Loading Overlay */}
      {isExporting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0284c7" />
          <Text style={styles.loadingText}>Generating report...</Text>
        </View>
      )}
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
  headerTextGroup: {
    flex: 1,
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
    marginTop: 2,
  },
  headerBackupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  headerBackupText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
  },
  filterWrapper: {
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 8,
  },
  filterScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
    elevation: 2,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  rangeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f9ff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0f2fe',
  },
  rangeText: {
    fontSize: 12,
    color: '#0369a1',
  },
  rangeBold: {
    fontWeight: '700',
    color: '#0284c7',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 12,
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
    gap: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 2,
    textAlign: 'center',
  },
  actionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  actionsCardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  primaryAgentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  btnIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnTextGroup: {
    flex: 1,
  },
  primaryBtnTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  primaryBtnSub: {
    color: '#e0f2fe',
    fontSize: 11,
    marginTop: 2,
  },
  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  pdfBtnTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '800',
  },
  pdfBtnSub: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  secondaryGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  whatsappBtnStyle: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  secondaryBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  backupCard: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 12,
    padding: 14,
  },
  backupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  backupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065f46',
  },
  backupDesc: {
    fontSize: 11,
    color: '#047857',
    lineHeight: 16,
    marginBottom: 10,
  },
  backupActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#6ee7b7',
    paddingVertical: 8,
    borderRadius: 6,
  },
  backupActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  previewContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  previewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  previewTabs: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    padding: 2,
    gap: 4,
  },
  previewTabItem: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  previewTabItemActive: {
    backgroundColor: '#ffffff',
    elevation: 1,
  },
  previewTabItemText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  previewTabItemTextActive: {
    color: '#0284c7',
    fontWeight: '700',
  },
  previewCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f0f9ff',
    borderRadius: 6,
  },
  previewCopyText: {
    fontSize: 11,
    color: '#0284c7',
    fontWeight: '700',
  },
  codeBox: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    maxHeight: 280,
  },
  previewScroll: {
    maxHeight: 256,
  },
  codeText: {
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
    fontSize: 11,
    color: '#e2e8f0',
    lineHeight: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
});
