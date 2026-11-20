import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Linking, Platform, Share } from 'react-native';
import {
  DailyWorkout,
  TimeFilter,
  WorkoutFilterStats,
} from '@/types/workout';
import {
  calculatePace,
  formatDisplayDate,
  getDateFilterRangeLabel,
  isDateInFilter,
} from '@/utils/date-helpers';

export function filterWorkouts(
  workouts: DailyWorkout[],
  filter: TimeFilter
): DailyWorkout[] {
  return workouts.filter((w) => isDateInFilter(w.date, filter));
}

export function computeStats(workouts: DailyWorkout[]): WorkoutFilterStats {
  let totalSets = 0;
  let totalReps = 0;
  let totalVolumeKg = 0;
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
            totalReps += Number(s.reps) || 0;
            const mult = ex.weightUnit === 'lbs' ? 0.453592 : 1;
            const setVol = (Number(s.weight) || 0) * (Number(s.reps) || 0) * mult;
            totalVolumeKg += setVol;
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
    totalVolumeKg: Math.round(totalVolumeKg),
    totalRunDistanceKm: Number(totalRunDistanceKm.toFixed(2)),
    totalRunDurationMinutes: totalRunMinutes,
    avgRunPace: avgPace,
    categoryCounts,
  };
}

/**
 * Builds the AI Coach Prompt Report.
 */
export function buildAIPromptReport(
  workouts: DailyWorkout[],
  filter: TimeFilter
): string {
  const stats = computeStats(workouts);
  const filterLabel = getDateFilterRangeLabel(filter);

  let text = `WORKOUT & RUNNING LOG REPORT\n`;
  text += `===============================================\n`;
  text += `Period: ${filterLabel}\n`;
  text += `Workouts: ${stats.totalWorkouts} sessions | Volume: ${stats.totalVolumeKg.toLocaleString()} kg | Sets: ${stats.totalSets}\n`;
  if (stats.totalRunDistanceKm > 0) {
    text += `Runs: ${stats.totalRunDistanceKm} km in ${stats.totalRunDurationMinutes} mins (Avg Pace: ${stats.avgRunPace})\n`;
  }
  text += `===============================================\n\n`;

  text += `INSTRUCTIONS FOR AI AGENT / COACH:\n`;
  text += `Please evaluate my workouts and runs from ${filterLabel}. Analyze my progressive overload, volume distribution, and judge/suggest what I should do next.\n\n`;

  text += `CATEGORIES LOGGED:\n`;
  Object.entries(stats.categoryCounts).forEach(([cat, count]) => {
    text += `  - ${cat}: ${count}\n`;
  });
  text += `\n`;

  text += `DAILY LOGS:\n`;
  text += `-----------------------------------------------\n`;

  if (workouts.length === 0) {
    text += `No workouts logged during this timeframe.\n`;
  } else {
    const sorted = [...workouts].sort((a, b) => a.date.localeCompare(b.date));

    sorted.forEach((w) => {
      text += `\nDate: ${w.date} (${formatDisplayDate(w.date)})\n`;
      if (w.title) text += `Title: ${w.title}\n`;

      if (w.exercises && w.exercises.length > 0) {
        w.exercises.forEach((ex) => {
          text += `  ${ex.categoryName}:\n`;
          ex.sets.forEach((s) => {
            text += `    Set ${s.setNumber}: ${s.weight} ${ex.weightUnit} x ${s.reps} reps\n`;
          });
        });
      }

      if (w.runs && w.runs.length > 0) {
        w.runs.forEach((r) => {
          const pace =
            r.pace || calculatePace(r.distance, r.durationMinutes, r.durationSeconds);
          text += `  ${r.categoryName}: ${r.distance} ${r.distanceUnit} in ${r.durationMinutes}m ${r.durationSeconds}s (${pace})\n`;
        });
      }
      text += `-----------------------------------------------\n`;
    });
  }

  return text;
}

/**
 * Builds a clean WhatsApp-optimized message.
 */
export function buildWhatsAppReport(
  workouts: DailyWorkout[],
  filter: TimeFilter
): string {
  const stats = computeStats(workouts);
  const filterLabel = getDateFilterRangeLabel(filter);

  let text = `*WORKOUT & RUNNING REPORT*\n`;
  text += `*Period:* ${filterLabel}\n`;
  text += `*Stats:* ${stats.totalWorkouts} workouts | ${stats.totalVolumeKg.toLocaleString()} kg volume | ${stats.totalSets} sets\n`;
  if (stats.totalRunDistanceKm > 0) {
    text += `*Runs:* ${stats.totalRunDistanceKm} km (${stats.totalRunDurationMinutes} min, avg pace ${stats.avgRunPace})\n`;
  }
  text += `\n*Prompt for AI Coach:* Please review my logs below, judge my progress, and suggest what to do next!\n\n`;

  const sorted = [...workouts].sort((a, b) => a.date.localeCompare(b.date));

  sorted.forEach((w) => {
    text += `*${w.date}*`;
    if (w.title) text += ` - _${w.title}_`;
    text += `\n`;

    if (w.exercises) {
      w.exercises.forEach((ex) => {
        const setStrings = ex.sets
          .map((s) => `${s.weight}${ex.weightUnit}x${s.reps}`)
          .join(', ');
        text += `- *${ex.categoryName}:* ${setStrings}\n`;
      });
    }

    if (w.runs) {
      w.runs.forEach((r) => {
        const pace =
          r.pace || calculatePace(r.distance, r.durationMinutes, r.durationSeconds);
        text += `- *${r.categoryName}:* ${r.distance}${r.distanceUnit} in ${r.durationMinutes}m${r.durationSeconds}s (${pace})\n`;
      });
    }
    text += `\n`;
  });

  return text;
}

/**
 * Generates an HTML report suitable for PDF rendering with expo-print.
 */
export function generateHtmlReport(
  workouts: DailyWorkout[],
  filter: TimeFilter
): string {
  const stats = computeStats(workouts);
  const filterLabel = getDateFilterRangeLabel(filter);

  const workoutCardsHtml = workouts
    .map((w) => {
      const exercisesHtml = (w.exercises || [])
        .map(
          (ex) => `
        <div style="margin-bottom: 12px; background: #f8fafc; padding: 10px; border-radius: 8px;">
          <div style="font-weight: 700; font-size: 14px; color: #0f172a; margin-bottom: 6px;">
            ${ex.categoryName}
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr style="color: #64748b; text-align: left; border-bottom: 1px solid #e2e8f0;">
              <th style="padding: 4px 6px;">Set</th>
              <th style="padding: 4px 6px;">Weight</th>
              <th style="padding: 4px 6px;">Reps</th>
            </tr>
            ${ex.sets
              .map(
                (s) => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 4px 6px; font-weight: 600;">#${s.setNumber}</td>
                <td style="padding: 4px 6px; font-weight: 600; color: #0284c7;">${s.weight} ${ex.weightUnit}</td>
                <td style="padding: 4px 6px;">${s.reps}</td>
              </tr>
            `
              )
              .join('')}
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
          <div style="margin-bottom: 12px; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 10px; border-radius: 8px;">
            <div style="font-weight: 700; font-size: 14px; color: #065f46;">
              ${r.categoryName}: ${r.distance} ${r.distanceUnit}
            </div>
            <div style="margin-top: 4px; font-size: 13px; color: #047857;">
              Time: ${r.durationMinutes}m ${r.durationSeconds}s &bull; Pace: ${pace}
            </div>
          </div>
        `;
        })
        .join('');

      return `
      <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 16px; background: #ffffff;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
          <span style="font-size: 15px; font-weight: 700; color: #0f172a;">${w.date} (${formatDisplayDate(w.date)})</span>
          ${w.title ? `<span style="font-size: 13px; font-weight: 600; color: #2563eb;">${w.title}</span>` : ''}
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
          border-bottom: 2px solid #0284c7;
          padding-bottom: 12px;
          margin-bottom: 20px;
        }
        .title {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }
        .subtitle {
          font-size: 14px;
          color: #64748b;
          margin-top: 4px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }
        .stat-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px;
          text-align: center;
        }
        .stat-val {
          font-size: 18px;
          font-weight: 800;
          color: #0284c7;
        }
        .stat-label {
          font-size: 11px;
          text-transform: uppercase;
          color: #64748b;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">Workout & Run Log Report</h1>
        <div class="subtitle">Filtered: ${filterLabel}</div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-val">${stats.totalWorkouts}</div>
          <div class="stat-label">Workouts</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">${stats.totalVolumeKg.toLocaleString()} kg</div>
          <div class="stat-label">Volume</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">${stats.totalSets}</div>
          <div class="stat-label">Total Sets</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">${stats.totalRunDistanceKm} km</div>
          <div class="stat-label">Run Distance</div>
        </div>
      </div>

      <div>
        ${workoutCardsHtml}
      </div>
    </body>
  </html>
  `;
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
  filter: TimeFilter
): Promise<string | null> {
  try {
    const html = generateHtmlReport(workouts, filter);
    const { uri } = await Print.printToFileAsync({ html });
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: 'Share Workout PDF',
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
  filter: TimeFilter
): Promise<string | null> {
  try {
    const text = buildAIPromptReport(workouts, filter);
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
