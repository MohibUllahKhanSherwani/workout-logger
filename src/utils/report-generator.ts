import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Linking, Platform, Share } from 'react-native';
import {
  DailyWorkout,
  TimeFilter,
  WeightUnit,
  WorkoutFilterStats,
} from '@/types/workout';
import {
  calculatePace,
  formatDisplayDate,
  getDateFilterRangeDetails,
  getDateFilterRangeLabel,
  isDateInFilter,
} from '@/utils/date-helpers';

export function filterWorkouts(
  workouts: DailyWorkout[],
  filter: TimeFilter
): DailyWorkout[] {
  return workouts.filter((w) => isDateInFilter(w.date, filter));
}

export function computeStats(
  workouts: DailyWorkout[],
  preferredUnit: WeightUnit = 'kg'
): WorkoutFilterStats {
  let totalSets = 0;
  let totalReps = 0;
  let totalVolume = 0;
  let totalRunDistanceKm = 0;
  let totalRunDurationSeconds = 0;

  const categoryCounts: Record<string, number> = {};

  for (const w of workouts) {
    if (w.exercises) {
      for (const ex of w.exercises) {
        categoryCounts[ex.categoryName] =
          (categoryCounts[ex.categoryName] || 0) + (ex.sets?.length || 0);

        if (ex.sets) {
          for (const s of ex.sets) {
            totalSets += 1;
            const reps = Number(s.reps) || 0;
            const weight = Number(s.weight) || 0;
            totalReps += reps;

            // Normalize volume to preferredUnit
            const exUnit = ex.weightUnit || preferredUnit;
            let setVol = weight * reps;
            if (preferredUnit === 'kg' && exUnit === 'lbs') {
              setVol *= 0.453592;
            } else if (preferredUnit === 'lbs' && exUnit === 'kg') {
              setVol *= 2.20462;
            }
            totalVolume += setVol;
          }
        }
      }
    }

    if (w.runs) {
      for (const r of w.runs) {
        const distKm =
          r.distanceUnit === 'mi'
            ? (Number(r.distance) || 0) * 1.60934
            : Number(r.distance) || 0;
        totalRunDistanceKm += distKm;
        const durSec =
          (Number(r.durationMinutes) || 0) * 60 + (Number(r.durationSeconds) || 0);
        totalRunDurationSeconds += durSec;
        categoryCounts[r.categoryName] =
          (categoryCounts[r.categoryName] || 0) + 1;
      }
    }
  }

  const totalRunMinutes = Math.round(totalRunDurationSeconds / 60);
  const avgPace = calculatePace(
    totalRunDistanceKm,
    Math.floor(totalRunDurationSeconds / 60),
    Math.round(totalRunDurationSeconds % 60)
  );

  return {
    totalWorkouts: workouts.length,
    totalSets,
    totalReps,
    totalVolumeKg: Math.round(totalVolume),
    totalRunDistanceKm: Number(totalRunDistanceKm.toFixed(2)),
    totalRunDurationMinutes: totalRunMinutes,
    avgRunPace: avgPace,
    categoryCounts,
  };
}

/**
 * Builds a structured, high-value Markdown report designed specifically
 * for ChatGPT, Claude, and AI Agent fitness analysis.
 */
export function buildAIPromptReport(
  workouts: DailyWorkout[],
  filter: TimeFilter,
  preferredUnit: WeightUnit = 'kg'
): string {
  const stats = computeStats(workouts, preferredUnit);
  const filterDetails = getDateFilterRangeDetails(filter);

  let text = `# 🏋️ WORKOUT & TRAINING PERFORMANCE REPORT\n`;
  text += `**Timeframe:** ${filterDetails.title} (${filterDetails.subtitle})\n`;
  text += `**Overview:** ${stats.totalWorkouts} sessions | Total Volume: ${stats.totalVolumeKg.toLocaleString()} ${preferredUnit} | Sets: ${stats.totalSets} | Reps: ${stats.totalReps}\n`;
  if (stats.totalRunDistanceKm > 0) {
    text += `**Cardio / Runs:** ${stats.totalRunDistanceKm} km across ${stats.totalRunDurationMinutes}m (Avg Pace: ${stats.avgRunPace})\n`;
  }
  text += `\n---\n\n`;

  text += `## 🎯 PROMPT FOR AI COACH / CHATGPT / AGENT:\n`;
  text += `> "Act as my elite strength coach and sports performance analyst. Review my training and running logs below from **${filterDetails.title}** (${filterDetails.subtitle}).\n`;
  text += `> Please give me a concise, expert critique covering:\n`;
  text += `> 1. **Progressive Overload & Intensity:** Am I challenging myself with proper weight and rep progression across sets?\n`;
  text += `> 2. **Volume & Muscle Group Balance:** Are any muscle groups overtrained or neglected?\n`;
  text += `> 3. **Fatigue & Recovery:** Based on the session frequency and density, how is my recovery?\n`;
  text += `> 4. **Concrete Next Session Targets:** Exact weights, reps, and exercise adjustments for my upcoming workouts."\n\n`;
  text += `---\n\n`;

  text += `## 📊 SUMMARY METRICS\n`;
  text += `- **Sessions Completed:** ${stats.totalWorkouts}\n`;
  text += `- **Total Volume Lifted:** ${stats.totalVolumeKg.toLocaleString()} ${preferredUnit}\n`;
  text += `- **Total Sets:** ${stats.totalSets}\n`;
  text += `- **Total Repetitions:** ${stats.totalReps}\n`;
  if (stats.totalRunDistanceKm > 0) {
    text += `- **Total Running Distance:** ${stats.totalRunDistanceKm} km (${stats.totalRunDurationMinutes} minutes, Avg Pace: ${stats.avgRunPace})\n`;
  }
  text += `\n### Category / Exercise Volume Distribution:\n`;
  if (Object.keys(stats.categoryCounts).length === 0) {
    text += `  (No exercises recorded)\n`;
  } else {
    Object.entries(stats.categoryCounts).forEach(([cat, count]) => {
      text += `- **${cat}:** ${count} sets / sessions\n`;
    });
  }
  text += `\n---\n\n`;

  text += `## 📅 DETAILED SESSION LOGS\n\n`;

  if (workouts.length === 0) {
    text += `*No workouts logged during this timeframe (${filterDetails.subtitle}).*\n`;
  } else {
    const sorted = [...workouts].sort((a, b) => a.date.localeCompare(b.date));

    sorted.forEach((w) => {
      const displayDate = formatDisplayDate(w.date);
      text += `### 🗓️ ${w.date} (${displayDate})${w.title ? ` — "${w.title}"` : ''}\n\n`;

      if (w.exercises && w.exercises.length > 0) {
        w.exercises.forEach((ex) => {
          const unit = ex.weightUnit || preferredUnit;
          text += `#### 💪 ${ex.categoryName} (${unit})\n`;
          text += `| Set | Weight | Reps | Set Volume | Status |\n`;
          text += `|:---:|:---:|:---:|:---:|:---:|\n`;

          ex.sets.forEach((s) => {
            const setVol = (Number(s.weight) || 0) * (Number(s.reps) || 0);
            const statusIcon = s.completed ? '✅ Done' : '⏳ Pending';
            text += `| #${s.setNumber} | ${s.weight} ${unit} | ${s.reps} | ${setVol.toLocaleString()} ${unit} | ${statusIcon} |\n`;
          });
          text += `\n`;
        });
      }

      if (w.runs && w.runs.length > 0) {
        text += `#### 🏃 Running / Cardio\n`;
        w.runs.forEach((r) => {
          const pace =
            r.pace || calculatePace(r.distance, r.durationMinutes, r.durationSeconds);
          text += `- **${r.categoryName}:** ${r.distance} ${r.distanceUnit} in ${r.durationMinutes}m ${r.durationSeconds}s (Pace: ${pace})\n`;
        });
        text += `\n`;
      }

      text += `---\n\n`;
    });
  }

  return text;
}

/**
 * Builds a clean WhatsApp-optimized message.
 */
export function buildWhatsAppReport(
  workouts: DailyWorkout[],
  filter: TimeFilter,
  preferredUnit: WeightUnit = 'kg'
): string {
  const stats = computeStats(workouts, preferredUnit);
  const filterDetails = getDateFilterRangeDetails(filter);

  let text = `*🏋️ WORKOUT & PERFORMANCE REPORT*\n`;
  text += `*Period:* ${filterDetails.title} (${filterDetails.subtitle})\n`;
  text += `*Stats:* ${stats.totalWorkouts} sessions | ${stats.totalVolumeKg.toLocaleString()} ${preferredUnit} volume | ${stats.totalSets} sets\n`;
  if (stats.totalRunDistanceKm > 0) {
    text += `*Runs:* ${stats.totalRunDistanceKm} km (${stats.totalRunDurationMinutes}m, avg pace ${stats.avgRunPace})\n`;
  }
  text += `\n*Prompt for AI Coach:* Review my training logs below from ${filterDetails.subtitle}, analyze my progressive overload, and suggest what to do next!\n\n`;

  const sorted = [...workouts].sort((a, b) => a.date.localeCompare(b.date));

  sorted.forEach((w) => {
    text += `*${w.date}*`;
    if (w.title) text += ` - _${w.title}_`;
    text += `\n`;

    if (w.exercises) {
      w.exercises.forEach((ex) => {
        const unit = ex.weightUnit || preferredUnit;
        const setStrings = ex.sets
          .map((s) => `${s.weight}${unit}x${s.reps}${s.completed ? '✓' : ''}`)
          .join(', ');
        text += `• *${ex.categoryName}:* ${setStrings}\n`;
      });
    }

    if (w.runs) {
      w.runs.forEach((r) => {
        const pace =
          r.pace || calculatePace(r.distance, r.durationMinutes, r.durationSeconds);
        text += `• 🏃 *${r.categoryName}:* ${r.distance}${r.distanceUnit} in ${r.durationMinutes}m${r.durationSeconds}s (${pace})\n`;
      });
    }
    text += `\n`;
  });

  return text;
}

/**
 * Generates an executive HTML report suitable for PDF rendering with expo-print.
 */
export function generateHtmlReport(
  workouts: DailyWorkout[],
  filter: TimeFilter,
  preferredUnit: WeightUnit = 'kg'
): string {
  const stats = computeStats(workouts, preferredUnit);
  const filterDetails = getDateFilterRangeDetails(filter);

  const workoutCardsHtml = workouts
    .map((w) => {
      const exercisesHtml = (w.exercises || [])
        .map(
          (ex) => `
        <div style="margin-bottom: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; page-break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="font-weight: 700; font-size: 14px; color: #0f172a;">
              ${ex.categoryName}
            </div>
            <span style="font-size: 11px; background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 600;">
              ${ex.weightUnit || preferredUnit}
            </span>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="color: #64748b; text-align: left; border-bottom: 1px solid #cbd5e1;">
                <th style="padding: 6px 8px; width: 40px;">Set</th>
                <th style="padding: 6px 8px;">Weight</th>
                <th style="padding: 6px 8px;">Reps</th>
                <th style="padding: 6px 8px;">Set Volume</th>
                <th style="padding: 6px 8px; text-align: right;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${ex.sets
                .map((s) => {
                  const setVol =
                    (Number(s.weight) || 0) * (Number(s.reps) || 0);
                  return `
                <tr style="border-bottom: 1px solid #f1f5f9; background: ${s.completed ? '#f0fdf4' : '#ffffff'};">
                  <td style="padding: 6px 8px; font-weight: 700; color: #475569;">#${s.setNumber}</td>
                  <td style="padding: 6px 8px; font-weight: 700; color: #0284c7;">${s.weight} ${ex.weightUnit || preferredUnit}</td>
                  <td style="padding: 6px 8px; font-weight: 600;">${s.reps}</td>
                  <td style="padding: 6px 8px; color: #64748b;">${setVol.toLocaleString()} ${ex.weightUnit || preferredUnit}</td>
                  <td style="padding: 6px 8px; text-align: right; color: ${s.completed ? '#16a34a' : '#94a3b8'}; font-weight: 600;">
                    ${s.completed ? '✓ Done' : 'Pending'}
                  </td>
                </tr>
              `;
                })
                .join('')}
            </tbody>
          </table>
        </div>
      `
        )
        .join('');

      const runsHtml = (w.runs || [])
        .map((r) => {
          const pace =
            r.pace || calculatePace(r.distance, r.durationMinutes, r.durationSeconds);
          return `
          <div style="margin-bottom: 12px; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 12px; border-radius: 8px; page-break-inside: avoid;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 700; font-size: 14px; color: #065f46;">
                🏃 ${r.categoryName}: ${r.distance} ${r.distanceUnit}
              </span>
              <span style="font-size: 12px; font-weight: 700; color: #047857;">
                Pace: ${pace}
              </span>
            </div>
            <div style="margin-top: 4px; font-size: 13px; color: #047857;">
              Duration: ${r.durationMinutes}m ${r.durationSeconds}s
            </div>
          </div>
        `;
        })
        .join('');

      return `
      <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 18px; background: #ffffff; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
          <span style="font-size: 16px; font-weight: 800; color: #0f172a;">${w.date} &bull; ${formatDisplayDate(w.date)}</span>
          ${w.title ? `<span style="font-size: 13px; font-weight: 700; color: #0284c7; background: #f0f9ff; padding: 2px 8px; border-radius: 6px;">${w.title}</span>` : ''}
        </div>
        ${exercisesHtml}
        ${runsHtml}
      </div>
    `;
    })
    .join('');

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Workout Report</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #1e293b;
          padding: 24px;
          background: #ffffff;
        }
        .header {
          border-bottom: 3px solid #0284c7;
          padding-bottom: 14px;
          margin-bottom: 20px;
        }
        .title {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }
        .subtitle {
          font-size: 14px;
          color: #64748b;
          margin-top: 6px;
          font-weight: 600;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .stat-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px;
          text-align: center;
        }
        .stat-val {
          font-size: 20px;
          font-weight: 800;
          color: #0284c7;
        }
        .stat-label {
          font-size: 11px;
          text-transform: uppercase;
          color: #64748b;
          font-weight: 700;
          margin-top: 4px;
        }
        @media print {
          body { padding: 0; }
          .page-break { page-break-after: always; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">🏋️ Workout & Training Report</h1>
        <div class="subtitle">Timeframe: ${filterDetails.title} &bull; ${filterDetails.subtitle}</div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-val">${stats.totalWorkouts}</div>
          <div class="stat-label">Workouts</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">${stats.totalVolumeKg.toLocaleString()} ${preferredUnit}</div>
          <div class="stat-label">Total Volume</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">${stats.totalSets}</div>
          <div class="stat-label">Total Sets</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">${stats.totalRunDistanceKm} km</div>
          <div class="stat-label">Cardio Distance</div>
        </div>
      </div>

      <div>
        ${workoutCardsHtml}
      </div>
    </body>
  </html>
  `;
}

export async function shareReportSheet(
  text: string,
  title = 'Workout Report'
): Promise<boolean> {
  try {
    await Share.share({
      title,
      message: text,
    });
    return true;
  } catch (error) {
    console.error('Share sheet error:', error);
    return false;
  }
}

export async function shareToWhatsApp(text: string): Promise<boolean> {
  const encoded = encodeURIComponent(text);
  const whatsappUrl = `whatsapp://send?text=${encoded}`;

  try {
    const canOpen = await Linking.canOpenURL(whatsappUrl);
    if (canOpen) {
      await Linking.openURL(whatsappUrl);
      return true;
    }
  } catch (err) {
    console.log('WhatsApp scheme fallback:', err);
  }

  try {
    if (Platform.OS === 'web') {
      await Linking.openURL(`https://api.whatsapp.com/send?text=${encoded}`);
      return true;
    } else {
      await Share.share({
        message: text,
        title: 'Workout Log for AI Agent',
      });
      return true;
    }
  } catch (err) {
    console.error('Share failed:', err);
    return false;
  }
}

export async function exportPdfReport(
  workouts: DailyWorkout[],
  filter: TimeFilter,
  preferredUnit: WeightUnit = 'kg'
): Promise<string | null> {
  try {
    const html = generateHtmlReport(workouts, filter, preferredUnit);
    const { uri } = await Print.printToFileAsync({ html });
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: 'Share Workout PDF Report',
      });
    }
    return uri;
  } catch (error) {
    console.error('Failed to export PDF:', error);
    throw error;
  }
}

export async function exportTextFileReport(
  workouts: DailyWorkout[],
  filter: TimeFilter,
  preferredUnit: WeightUnit = 'kg'
): Promise<string | null> {
  try {
    const text = buildAIPromptReport(workouts, filter, preferredUnit);
    const dateTag = new Date().toISOString().slice(0, 10);
    const fileUri = `${FileSystem.cacheDirectory || ''}workout-report-${dateTag}.txt`;

    if (FileSystem.cacheDirectory) {
      await FileSystem.writeAsStringAsync(fileUri, text, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          UTI: 'public.plain-text',
          mimeType: 'text/plain',
          dialogTitle: 'Share Workout Text Report',
        });
      }
      return fileUri;
    } else {
      await Share.share({
        message: text,
        title: 'Workout Report',
      });
      return null;
    }
  } catch (error) {
    console.error('Failed to export text file:', error);
    throw error;
  }
}
