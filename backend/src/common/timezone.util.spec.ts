import {
  getEgyptCalendarEndDate,
  getEgyptStartOfDay,
  calculateDaysRemaining,
  getEgyptCalendarDateParts,
} from './timezone.util';

describe('Egypt Timezone Calendar Date Logic', () => {
  it('should expire 1-day subscription started at 16:00 Cairo on 29 Sep at 30 Sep 00:00 Cairo', () => {
    // 29 Sep 16:00 Cairo (UTC+3 in Sep) is 13:00 UTC
    const startDate = new Date('2026-09-29T13:00:00.000Z');
    const endDate = getEgyptCalendarEndDate(startDate, 1);

    // End date must be 30 Sep 00:00 Cairo = 29 Sep 21:00 UTC
    expect(endDate.toISOString()).toBe('2026-09-29T21:00:00.000Z');

    const endParts = getEgyptCalendarDateParts(endDate);
    expect(endParts.y).toBe(2026);
    expect(endParts.m).toBe(9);
    expect(endParts.day).toBe(30);
  });

  it('should expire 30-day subscription started on 29 Sep 16:00 at 29 Oct 00:00 Cairo', () => {
    const startDate = new Date('2026-09-29T13:00:00.000Z');
    const endDate = getEgyptCalendarEndDate(startDate, 30);

    // 29 Sep + 30 days = 29 Oct 00:00 Cairo = 28 Oct 21:00 UTC
    expect(endDate.toISOString()).toBe('2026-10-28T21:00:00.000Z');

    const endParts = getEgyptCalendarDateParts(endDate);
    expect(endParts.y).toBe(2026);
    expect(endParts.m).toBe(10);
    expect(endParts.day).toBe(29);
  });

  it('should correctly calculate startOfDay in Cairo timezone', () => {
    const timeAt1600Cairo = new Date('2026-09-29T13:00:00.000Z');
    const startOfDay = getEgyptStartOfDay(timeAt1600Cairo);

    // Start of 29 Sep in Cairo = 28 Sep 21:00 UTC
    expect(startOfDay.toISOString()).toBe('2026-09-28T21:00:00.000Z');

    const timeAt2200Cairo = new Date('2026-09-29T19:00:00.000Z');
    const startOfDayLate = getEgyptStartOfDay(timeAt2200Cairo);
    expect(startOfDayLate.toISOString()).toBe('2026-09-28T21:00:00.000Z');
  });

  it('should calculate remaining days accurately', () => {
    const now = new Date('2026-09-29T13:00:00.000Z'); // 16:00 Cairo on 29 Sep
    const end1Day = new Date('2026-09-29T21:00:00.000Z'); // 30 Sep 00:00 Cairo
    expect(calculateDaysRemaining(end1Day, now)).toBe(1);

    const end30Days = new Date('2026-10-28T21:00:00.000Z'); // 29 Oct 00:00 Cairo
    expect(calculateDaysRemaining(end30Days, now)).toBe(30);

    // After expiration (30 Sep 00:01 Cairo)
    const afterExpiration = new Date('2026-09-29T21:01:00.000Z');
    expect(calculateDaysRemaining(end1Day, afterExpiration)).toBe(0);
  });
});
