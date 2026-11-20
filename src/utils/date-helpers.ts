import { TimeFilter } from '@/types/workout';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  const todayStr = getTodayDateString();
  const yesterdayStr = addDays(todayStr, -1);
  const tomorrowStr = addDays(todayStr, 1);

  let prefix = '';
  if (dateStr === todayStr) {
    prefix = 'Today, ';
  } else if (dateStr === yesterdayStr) {
    prefix = 'Yesterday, ';
  } else if (dateStr === tomorrowStr) {
    prefix = 'Tomorrow, ';
  }

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };
  return `${prefix}${date.toLocaleDateString(undefined, options)}`;
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isDateInFilter(dateStr: string, filter: TimeFilter, referenceDateStr?: string): boolean {
  if (filter === 'all') return true;

  const targetDate = new Date(dateStr + 'T00:00:00');
  const refDate = referenceDateStr ? new Date(referenceDateStr + 'T00:00:00') : new Date();
  refDate.setHours(23, 59, 59, 999);

  const diffMs = refDate.getTime() - targetDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < -0.1) {
    return false;
  }

  switch (filter) {
    case '3days':
      return diffDays <= 3;
    case '1week':
      return diffDays <= 7;
    case '1month':
      return diffDays <= 30;
    default:
      return true;
  }
}

export function getDateFilterRangeLabel(filter: TimeFilter): string {
  switch (filter) {
    case '3days':
      return 'Last 3 Days';
    case '1week':
      return 'Last Week';
    case '1month':
      return 'Last Month';
    case 'all':
      return 'All Time';
  }
}

export function calculatePace(
  distanceKm: number,
  durationMinutes: number,
  durationSeconds: number
): string {
  if (!distanceKm || distanceKm <= 0) return '--:--';
  const totalSeconds = (durationMinutes || 0) * 60 + (durationSeconds || 0);
  if (totalSeconds <= 0) return '--:--';

  const secondsPerKm = totalSeconds / distanceKm;
  const paceMin = Math.floor(secondsPerKm / 60);
  const paceSec = Math.round(secondsPerKm % 60);

  return `${paceMin}'${String(paceSec).padStart(2, '0')}" /km`;
}
