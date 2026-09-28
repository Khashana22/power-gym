/**
 * Timezone utilities for Egypt (Africa/Cairo) calendar-date logic.
 * Ensures consistent handling of EET/EEST (UTC+2 in winter, UTC+3 in summer).
 */

export function getEgyptCalendarDateParts(d: Date): { y: number; m: number; day: number } {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [y, m, day] = formatter.format(d).split('-').map(Number);
  return { y, m, day };
}

export function getEgyptOffsetHours(y: number, m: number, d: number): number {
  const tzOffsetFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Cairo',
    timeZoneName: 'shortOffset',
  });
  const refDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const offsetStr = tzOffsetFormatter.formatToParts(refDate).find((p) => p.type === 'timeZoneName')?.value;
  const match = offsetStr ? offsetStr.match(/([+-]\d+)/) : null;
  return match ? parseInt(match[1], 10) : 3;
}

/**
 * Returns a UTC Date representing 00:00:00.000 in Egypt time for the calendar day of `d`.
 */
export function getEgyptStartOfDay(d: Date = new Date()): Date {
  const { y, m, day } = getEgyptCalendarDateParts(d);
  const offsetHours = getEgyptOffsetHours(y, m, day);
  return new Date(Date.UTC(y, m - 1, day, -offsetHours, 0, 0, 0));
}

/**
 * Calculates the expiration date based on Egypt calendar days.
 * For example:
 * - A 1-day subscription started on 29 Sep 16:00 expires on 30 Sep 00:00 Cairo time.
 * - An N-day subscription expires at midnight (00:00:00) of (startDate_Cairo_Day + N).
 */
export function getEgyptCalendarEndDate(startDate: Date, durationDays: number): Date {
  const { y, m, day } = getEgyptCalendarDateParts(startDate);
  // Add durationDays to the calendar day
  const targetDate = new Date(Date.UTC(y, m - 1, day + durationDays, 12, 0, 0));
  const { y: ty, m: tm, day: td } = getEgyptCalendarDateParts(targetDate);
  const offsetHours = getEgyptOffsetHours(ty, tm, td);
  return new Date(Date.UTC(ty, tm - 1, td, -offsetHours, 0, 0, 0));
}

/**
 * Calculates remaining calendar days in Egypt timezone.
 * Returns 0 if already expired (now >= endDate).
 */
export function calculateDaysRemaining(endDate: Date, now: Date = new Date()): number {
  if (now >= endDate) return 0;
  const nowParts = getEgyptCalendarDateParts(now);
  const endParts = getEgyptCalendarDateParts(endDate);
  const nowDateUtc = Date.UTC(nowParts.y, nowParts.m - 1, nowParts.day);
  const endDateUtc = Date.UTC(endParts.y, endParts.m - 1, endParts.day);
  const diffDays = Math.round((endDateUtc - nowDateUtc) / 86400000);
  return Math.max(0, diffDays);
}
