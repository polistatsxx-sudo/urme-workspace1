import { describe, expect, it } from 'vitest';
import { getGoogleCalendarDates, getGoogleCalendarUrl, parseEventDate, parseEventTime } from '@/utils/calendar';

describe('parseEventTime', () => {
  it('reads the shapes people actually type', () => {
    expect(parseEventTime('6:00 PM')).toEqual({ start: { hours: 18, minutes: 0 }, end: null });
    expect(parseEventTime('6pm')).toEqual({ start: { hours: 18, minutes: 0 }, end: null });
    expect(parseEventTime('9:30 a.m.')).toEqual({ start: { hours: 9, minutes: 30 }, end: null });
    expect(parseEventTime('18:45')).toEqual({ start: { hours: 18, minutes: 45 }, end: null });
    expect(parseEventTime('12:00 AM')).toEqual({ start: { hours: 0, minutes: 0 }, end: null });
    expect(parseEventTime('12:00 PM')).toEqual({ start: { hours: 12, minutes: 0 }, end: null });
  });

  it('reads a range, and lets the start borrow the am/pm of the end', () => {
    expect(parseEventTime('6:00 PM - 8:30 PM')).toEqual({
      start: { hours: 18, minutes: 0 },
      end: { hours: 20, minutes: 30 },
    });
    expect(parseEventTime('6 - 8pm')).toEqual({
      start: { hours: 18, minutes: 0 },
      end: { hours: 20, minutes: 0 },
    });
  });

  it('gives up on text with no time in it', () => {
    expect(parseEventTime('')).toBeNull();
    expect(parseEventTime(null)).toBeNull();
    expect(parseEventTime('TBD')).toBeNull();
    expect(parseEventTime('doors open early')).toBeNull();
    // Bare numbers are not times: no colon, no am/pm.
    expect(parseEventTime('6')).toBeNull();
    expect(parseEventTime('25:00')).toBeNull();
  });
});

describe('parseEventDate', () => {
  it('takes the day the user typed, whatever the timestamptz looks like', () => {
    expect(parseEventDate('2026-08-17')).toEqual({ year: 2026, month: 8, day: 17 });
    expect(parseEventDate('2026-08-17T00:00:00+00:00')).toEqual({ year: 2026, month: 8, day: 17 });
  });

  it('has nothing to offer for a missing or unreadable date', () => {
    expect(parseEventDate('')).toBeNull();
    expect(parseEventDate(null)).toBeNull();
    expect(parseEventDate('not a date')).toBeNull();
  });
});

describe('getGoogleCalendarDates', () => {
  it('uses the event time, not a hardcoded morning slot', () => {
    expect(getGoogleCalendarDates({ date: '2026-08-17', time: '6:00 PM' }))
      .toBe('20260817T180000/20260817T190000');
  });

  it('honours an end time when the event names one', () => {
    expect(getGoogleCalendarDates({ date: '2026-08-17', time: '6:00 PM - 8:30 PM' }))
      .toBe('20260817T180000/20260817T203000');
  });

  it('rolls an event that runs past midnight onto the next day', () => {
    expect(getGoogleCalendarDates({ date: '2026-08-17', time: '10 PM - 1 AM' }))
      .toBe('20260817T220000/20260818T010000');
  });

  it('falls back to an all-day event when the time is missing or unreadable', () => {
    expect(getGoogleCalendarDates({ date: '2026-08-17', time: '' })).toBe('20260817/20260818');
    expect(getGoogleCalendarDates({ date: '2026-08-17', time: 'TBD' })).toBe('20260817/20260818');
    expect(getGoogleCalendarDates({ date: '2026-08-31' })).toBe('20260831/20260901');
    expect(getGoogleCalendarDates({ date: '2026-12-31' })).toBe('20261231/20270101');
  });

  it('uses a time carried by the date column when the time field says nothing', () => {
    expect(getGoogleCalendarDates({ date: '2026-08-17T19:30:00+00:00', time: '' }))
      .toBe('20260817T193000/20260817T203000');
  });

  it('has no dates at all for an event with no date', () => {
    expect(getGoogleCalendarDates({ time: '6:00 PM' })).toBeNull();
  });
});

describe('getGoogleCalendarUrl', () => {
  it('carries the name, description, place and the slot the event actually names', () => {
    const url = getGoogleCalendarUrl({
      name: 'Fall Mixer',
      description: 'Drinks & intros',
      location: 'Detroit, MI',
      date: '2026-08-17',
      time: '6:00 PM',
    });

    expect(url).toContain('text=Fall%20Mixer');
    expect(url).toContain('details=Drinks%20%26%20intros');
    expect(url).toContain('location=Detroit%2C%20MI');
    expect(url).toContain('dates=20260817T180000/20260817T190000');
    // No trailing Z: Google reads a floating time in the viewer's own timezone.
    expect(url).not.toContain('T090000Z');
  });

  it('leaves the dates parameter off an undated event', () => {
    expect(getGoogleCalendarUrl({ name: 'Someday' })).not.toContain('dates=');
  });
});
