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

  const categoryBreakdown: Record<string, number> = {};
  const exerciseCounts: Record<string, number> = {};

  for (const w of workouts) {
    if (w.exercises) {
      for (const ex of w.exercises) {
        exerciseCounts[ex.exerciseName] = (exerciseCounts[ex.exerciseName] || 0) + 1;
        categoryBreakdown[ex.category] = (categoryBreakdown[ex.category] || 0) + (ex.sets?.length || 0);

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
        const distKm = r.distanceUnit === 'mi' ? (Number(r.distance) || 0) * 1.60934 : Number(r.distance) || 0;
        totalRunDistanceKm += distKm;
        const durSec = (Number(r.durationMinutes) || 0) * 60 + (Number(r.durationSeconds) || 0);
        totalRunDurationSeconds += durSec;
        categoryBreakdown['Cardio'] = (categoryBreakdown['Cardio'] || 0) + 1;
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
    categoryBreakdown,
    exerciseCounts,
  };
}

/**
 * Builds the AI Coach Prompt Report.
 * Specifically structured so any LLM (Claude, ChatGPT, Gemini, WhatsApp AI agent)
 * can easily parse progressive overload, fatigue, cardio balance, and recommend targets.
 */
export function buildAIPromptReport(
  workouts: DailyWorkout[],
  filter: TimeFilter
): string {
  const stats = computeStats(workouts);
  const filterLabel = getDateFilterRangeLabel(filter);

  let text = `🤖 WORKOUT LOG & PERFORMANCE REPORT FOR AI COACH\n`;
  text += `═══════════════════════════════════════════════\n`;
  text += `📅 Timeframe: ${filterLabel}\n`;
  text += `📊 Sessions: ${stats.totalWorkouts} workouts | Volume: ${stats.totalVolumeKg.toLocaleString()} kg | Total Sets: ${stats.totalSets}\n`;
  if (stats.totalRunDistanceKm > 0) {
    text += `🏃 Cardio/Runs: ${stats.totalRunDistanceKm} km in ${stats.totalRunDurationMinutes} mins (Avg Pace: ${stats.avgRunPace})\n`;
  }
  text += `═══════════════════════════════════════════════\n\n`;

  text += `🎯 INSTRUCTIONS FOR AI AGENT / COACH:\n`;
  text += `Please act as an elite strength and conditioning coach. Review my workout and running logs below and provide:\n`;
  text += `1. OVERALL CRITIQUE: Evaluate my volume, consistency, and progressive overload on compound lifts.\n`;
  text += `2. FATIGUE & CARDIO INTEGRATION: Assess how my running is impacting my recovery and strength performance.\n`;
  text += `3. NEXT STEPS & SUGGESTIONS: Recommend concrete target weights, reps, and running adjustments for my next week of training.\n\n`;

  text += `📈 MUSCLE GROUP VOLUME (Sets Logged):\n`;
  Object.entries(stats.categoryBreakdown).forEach(([cat, sets]) => {
    text += `  • ${cat}: ${sets} sets\n`;
  });
  text += `\n`;

  text += `📋 DETAILED DAILY WORKOUT LOGS:\n`;
  text += `───────────────────────────────────────────────\n`;

  if (workouts.length === 0) {
    text += `No workouts logged during this timeframe.\n`;
  } else {
    // Sort chronological for progression analysis
    const sorted = [...workouts].sort((a, b) => a.date.localeCompare(b.date));

    sorted.forEach((w, idx) => {
      text += `\n[Day ${idx + 1}] ${w.date} (${formatDisplayDate(w.date)})\n`;
      if (w.title) text += `Title: ${w.title}\n`;
      if (w.energyRating) text += `Energy/Readiness: ${'⭐'.repeat(w.energyRating)} (${w.energyRating}/5)\n`;
      if (w.durationMinutes) text += `Session Duration: ${w.durationMinutes} minutes\n`;

      // Strength exercises
      if (w.exercises && w.exercises.length > 0) {
        text += `Strength Exercises:\n`;
        w.exercises.forEach((ex) => {
          text += `  • ${ex.exerciseName} [${ex.category}]:\n`;
          ex.sets.forEach((s) => {
            const rpeStr = s.rpe ? ` @ RPE ${s.rpe}` : '';
            const typeStr = s.type !== 'normal' ? ` (${s.type.toUpperCase()})` : '';
            text += `      Set ${s.setNumber}: ${s.weight} ${ex.weightUnit} × ${s.reps} reps${rpeStr}${typeStr}\n`;
          });
          if (ex.notes) {
            text += `      Notes: ${ex.notes}\n`;
          }
        });
      }

      // Runs / Cardio
      if (w.runs && w.runs.length > 0) {
        text += `Running / Cardio:\n`;
        w.runs.forEach((r) => {
          const pace = r.pace || calculatePace(r.distance, r.durationMinutes, r.durationSeconds);
          text += `  • ${r.exerciseName}: ${r.distance} ${r.distanceUnit} in ${r.durationMinutes}m ${r.durationSeconds}s (Pace: ${pace})\n`;
          if (r.avgHeartRate) text += `      Avg HR: ${r.avgHeartRate} bpm\n`;
          if (r.calories) text += `      Calories: ${r.calories} kcal\n`;
          if (r.notes) text += `      Run Notes: ${r.notes}\n`;
        });
      }

      if (w.generalNotes) {
        text += `General Session Notes: ${w.generalNotes}\n`;
      }
      text += `───────────────────────────────────────────────\n`;
    });
  }

  return text;
}

/**
 * Builds a WhatsApp-optimized message using WhatsApp bold/italic markdown.
 */
export function buildWhatsAppReport(
  workouts: DailyWorkout[],
  filter: TimeFilter
): string {
  const stats = computeStats(workouts);
  const filterLabel = getDateFilterRangeLabel(filter);

  let text = `🏋️ *WORKOUT LOG & PERFORMANCE REPORT*\n`;
  text += `📅 *Period:* ${filterLabel}\n`;
  text += `📊 *Stats:* ${stats.totalWorkouts} sessions | ${stats.totalVolumeKg.toLocaleString()} kg volume | ${stats.totalSets} sets\n`;
  if (stats.totalRunDistanceKm > 0) {
    text += `🏃 *Running:* ${stats.totalRunDistanceKm} km (${stats.totalRunDurationMinutes} min, avg pace ${stats.avgRunPace})\n`;
  }
  text += `\n*Prompt for AI Coach:* Please review my logs below. Evaluate my progressive overload, volume balance, and advise specific weights/reps & running goals for my next workouts!\n\n`;

  const sorted = [...workouts].sort((a, b) => a.date.localeCompare(b.date));

  sorted.forEach((w) => {
    text += `📌 *${w.date}*`;
    if (w.title) text += ` - _${w.title}_`;
    text += `\n`;

    if (w.exercises) {
      w.exercises.forEach((ex) => {
        const setStrings = ex.sets.map((s) => `${s.weight}${ex.weightUnit}×${s.reps}`).join(', ');
        text += `• *${ex.exerciseName}:* ${setStrings}\n`;
      });
    }

    if (w.runs) {
      w.runs.forEach((r) => {
        const pace = r.pace || calculatePace(r.distance, r.durationMinutes, r.durationSeconds);
        text += `• 🏃 *${r.exerciseName}:* ${r.distance}${r.distanceUnit} in ${r.durationMinutes}m${r.durationSeconds}s (${pace})\n`;
      });
    }

    if (w.generalNotes) {
      text += `  _Note: ${w.generalNotes}_\n`;
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
          <div style="font-weight: 600; font-size: 14px; color: #0f172a; margin-bottom: 6px;">
            ${ex.exerciseName} <span style="font-size: 12px; font-weight: normal; color: #64748b; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${ex.category}</span>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr style="color: #64748b; text-align: left; border-bottom: 1px solid #e2e8f0;">
              <th style="padding: 4px 6px;">Set</th>
              <th style="padding: 4px 6px;">Type</th>
              <th style="padding: 4px 6px;">Weight</th>
              <th style="padding: 4px 6px;">Reps</th>
              <th style="padding: 4px 6px;">RPE</th>
            </tr>
            ${ex.sets
              .map(
                (s) => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 4px 6px; font-weight: 600;">#${s.setNumber}</td>
                <td style="padding: 4px 6px; text-transform: capitalize; color: #475569;">${s.type}</td>
                <td style="padding: 4px 6px; font-weight: 600; color: #0284c7;">${s.weight} ${ex.weightUnit}</td>
                <td style="padding: 4px 6px;">${s.reps}</td>
                <td style="padding: 4px 6px; color: #64748b;">${s.rpe ? s.rpe : '-'}</td>
              </tr>
            `
              )
              .join('')}
          </table>
          ${ex.notes ? `<div style="margin-top: 6px; font-size: 12px; color: #64748b; font-style: italic;">Note: ${ex.notes}</div>` : ''}
        </div>
      `
        )
        .join('');

      const runsHtml = (w.runs || [])
        .map((r) => {
          const pace = r.pace || calculatePace(r.distance, r.durationMinutes, r.durationSeconds);
          return `
          <div style="margin-bottom: 12px; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 10px; border-radius: 8px;">
            <div style="font-weight: 600; font-size: 14px; color: #065f46; display: flex; align-items: center; justify-content: space-between;">
              <span>🏃 ${r.exerciseName}</span>
              <span style="font-size: 13px; font-weight: 600; background: #10b981; color: white; padding: 2px 8px; border-radius: 12px;">${r.distance} ${r.distanceUnit}</span>
            </div>
            <div style="margin-top: 6px; font-size: 13px; color: #047857; display: flex; gap: 16px;">
              <span><strong>Time:</strong> ${r.durationMinutes}m ${r.durationSeconds}s</span>
              <span><strong>Pace:</strong> ${pace}</span>
              ${r.avgHeartRate ? `<span><strong>HR:</strong> ${r.avgHeartRate} bpm</span>` : ''}
              ${r.calories ? `<span><strong>Calories:</strong> ${r.calories} kcal</span>` : ''}
            </div>
            ${r.notes ? `<div style="margin-top: 6px; font-size: 12px; color: #065f46; font-style: italic;">Run Notes: ${r.notes}</div>` : ''}
          </div>
        `;
        })
        .join('');

      return `
      <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px; page-break-inside: avoid; background: #ffffff;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
          <div>
            <span style="font-size: 16px; font-weight: 700; color: #0f172a;">${w.date}</span>
            <span style="font-size: 13px; color: #64748b; margin-left: 8px;">${formatDisplayDate(w.date)}</span>
          </div>
          ${w.title ? `<span style="font-size: 14px; font-weight: 600; color: #2563eb;">${w.title}</span>` : ''}
        </div>
        ${w.generalNotes ? `<p style="font-size: 13px; color: #475569; font-style: italic; margin-bottom: 12px;">"${w.generalNotes}"</p>` : ''}
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
          line-height: 1.5;
        }
        .header {
          border-bottom: 2px solid #2563eb;
          padding-bottom: 16px;
          margin-bottom: 24px;
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
          margin-top: 4px;
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
          border-radius: 8px;
          padding: 12px;
          text-align: center;
        }
        .stat-val {
          font-size: 20px;
          font-weight: 800;
          color: #2563eb;
        }
        .stat-label {
          font-size: 11px;
          text-transform: uppercase;
          color: #64748b;
          font-weight: 600;
        }
        .ai-banner {
          background: #eff6ff;
          border-left: 4px solid #2563eb;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 24px;
          font-size: 13px;
          color: #1e40af;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">🏋️ Workout & Running Performance Log</h1>
        <div class="subtitle">Filtered: ${filterLabel} • Generated for AI Agent Analysis</div>
      </div>

      <div class="ai-banner">
        <strong>🤖 Note for AI Agent:</strong> Analyze volume distribution, progressive overload across compound lifts, and how running volume affects strength adaptation. Provide actionable target recommendations for next week.
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-val">${stats.totalWorkouts}</div>
          <div class="stat-label">Total Workouts</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">${stats.totalVolumeKg.toLocaleString()} kg</div>
          <div class="stat-label">Total Volume</div>
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

/**
 * Direct WhatsApp sharing with fallback to native Share sheet.
 */
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
    console.log('WhatsApp scheme not available, using Web or Share sheet:', err);
  }

  // Fallback to web WhatsApp URL or native share sheet
  try {
    if (Platform.OS === 'web') {
      await Linking.openURL(`https://api.whatsapp.com/send?text=${encoded}`);
      return true;
    } else {
      await Share.share({
        message: text,
        title: 'Workout Log for AI Coach',
      });
      return true;
    }
  } catch (err) {
    console.error('Share failed:', err);
    return false;
  }
}

/**
 * Export and Share PDF file via expo-print & expo-sharing
 */
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
        dialogTitle: 'Share Workout PDF to WhatsApp / AI Agent',
      });
    }
    return uri;
  } catch (error) {
    console.error('Failed to export PDF:', error);
    throw error;
  }
}

/**
 * Export plain text report file and trigger share sheet
 */
export async function exportTextFileReport(
  workouts: DailyWorkout[],
  filter: TimeFilter
): Promise<string | null> {
  try {
    const text = buildAIPromptReport(workouts, filter);
    const dateTag = new Date().toISOString().slice(0, 10);
    // Use cache directory for text file
    const fileUri = `${FileSystem.cacheDirectory || ''}workout-ai-report-${dateTag}.txt`;

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
      // Fallback share message
      await Share.share({
        message: text,
        title: 'Workout Log Report',
      });
      return null;
    }
  } catch (error) {
    console.error('Failed to export text file:', error);
    throw error;
  }
}
