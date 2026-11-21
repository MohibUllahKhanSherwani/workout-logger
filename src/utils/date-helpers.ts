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

  const [year, month, day] = dateStr.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day, 12, 0, 0); // midday to avoid DST offsets

  const refDate = referenceDateStr
    ? new Date(Number(referenceDateStr.split('-')[0]), Number(referenceDateStr.split('-')[1]) - 1, Number(referenceDateStr.split('-')[2]), 12, 0, 0)
    : new Date();

  // Normalize refDate to noon
  refDate.setHours(12, 0, 0, 0);

  const refDayOfWeek = refDate.getDay(); // 0 is Sun, 1 is Mon...
  const diffToMonday = refDayOfWeek === 0 ? -6 : 1 - refDayOfWeek;

  // Monday of this week
  const thisWeekMonday = new Date(refDate);
  thisWeekMonday.setDate(refDate.getDate() + diffToMonday);
  thisWeekMonday.setHours(0, 0, 0, 0);

  // Sunday of this week
  const thisWeekSunday = new Date(thisWeekMonday);
  thisWeekSunday.setDate(thisWeekMonday.getDate() + 6);
  thisWeekSunday.setHours(23, 59, 59, 999);

  // Monday of last week
  const lastWeekMonday = new Date(thisWeekMonday);
  lastWeekMonday.setDate(thisWeekMonday.getDate() - 7);
  lastWeekMonday.setHours(0, 0, 0, 0);

  // Sunday of last week
  const lastWeekSunday = new Date(thisWeekMonday);
  lastWeekSunday.setDate(thisWeekMonday.getDate() - 1);
  lastWeekSunday.setHours(23, 59, 59, 999);

  // Last 3 days (today and prior 2 days)
  const threeDaysStart = new Date(refDate);
  threeDaysStart.setDate(refDate.getDate() - 2);
  threeDaysStart.setHours(0, 0, 0, 0);

  const refDateEnd = new Date(refDate);
  refDateEnd.setHours(23, 59, 59, 999);

  // This month
  const thisMonthStart = new Date(refDate.getFullYear(), refDate.getMonth(), 1, 0, 0, 0, 0);
  const thisMonthEnd = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0, 23, 59, 59, 999);

  // Last month
  const lastMonthStart = new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1, 0, 0, 0, 0);
  const lastMonthEnd = new Date(refDate.getFullYear(), refDate.getMonth(), 0, 23, 59, 59, 999);

  switch (filter) {
    case 'thisWeek':
      return targetDate >= thisWeekMonday && targetDate <= thisWeekSunday;
    case 'lastWeek':
    case '1week':
      return targetDate >= lastWeekMonday && targetDate <= lastWeekSunday;
    case '3days':
      return targetDate >= threeDaysStart && targetDate <= refDateEnd;
    case 'thisMonth':
    case '1month':
      return targetDate >= thisMonthStart && targetDate <= thisMonthEnd;
    case 'lastMonth':
      return targetDate >= lastMonthStart && targetDate <= lastMonthEnd;
    default:
      return true;
  }
}

export interface FilterRangeDetails {
  title: string;
  subtitle: string;
  fullLabel: string;
}

export function getDateFilterRangeDetails(filter: TimeFilter, referenceDateStr?: string): FilterRangeDetails {
  const refDate = referenceDateStr
    ? new Date(Number(referenceDateStr.split('-')[0]), Number(referenceDateStr.split('-')[1]) - 1, Number(referenceDateStr.split('-')[2]))
    : new Date();

  const refDayOfWeek = refDate.getDay();
  const diffToMonday = refDayOfWeek === 0 ? -6 : 1 - refDayOfWeek;

  const thisWeekMonday = new Date(refDate);
  thisWeekMonday.setDate(refDate.getDate() + diffToMonday);

  const thisWeekSunday = new Date(thisWeekMonday);
  thisWeekSunday.setDate(thisWeekMonday.getDate() + 6);

  const lastWeekMonday = new Date(thisWeekMonday);
  lastWeekMonday.setDate(thisWeekMonday.getDate() - 7);

  const lastWeekSunday = new Date(thisWeekMonday);
  lastWeekSunday.setDate(thisWeekMonday.getDate() - 1);

  const threeDaysStart = new Date(refDate);
  threeDaysStart.setDate(refDate.getDate() - 2);

  const formatShort = (d: Date) =>
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  const formatMonth = (d: Date) =>
    d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  switch (filter) {
    case 'thisWeek': {
      const range = `${formatShort(thisWeekMonday)} – ${formatShort(thisWeekSunday)}`;
      return { title: 'This Week', subtitle: range, fullLabel: `This Week (${range})` };
    }
    case 'lastWeek':
    case '1week': {
      const range = `${formatShort(lastWeekMonday)} – ${formatShort(lastWeekSunday)}`;
      return { title: 'Last Week', subtitle: range, fullLabel: `Last Week (${range})` };
    }
    case '3days': {
      const range = `${formatShort(threeDaysStart)} – ${formatShort(refDate)}`;
      return { title: 'Last 3 Days', subtitle: range, fullLabel: `Last 3 Days (${range})` };
    }
    case 'thisMonth':
    case '1month': {
      const range = formatMonth(refDate);
      return { title: 'This Month', subtitle: range, fullLabel: `This Month (${range})` };
    }
    case 'lastMonth': {
      const lastMonthDate = new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1);
      const range = formatMonth(lastMonthDate);
      return { title: 'Last Month', subtitle: range, fullLabel: `Last Month (${range})` };
    }
    case 'all':
    default:
      return { title: 'All Time', subtitle: 'All recorded workouts', fullLabel: 'All Time (All History)' };
  }
}

export function getDateFilterRangeLabel(filter: TimeFilter): string {
  return getDateFilterRangeDetails(filter).fullLabel;
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
