import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  classifyEvent,
  compareEventsByStart,
  formatEventDate,
  getEventStart,
  getGoogleCalendarDates,
  getGoogleCalendarUrl,
  isEventPast,
  isEventUpcoming,
  parseEventDate,
  parseEventTime,
} from '@/utils/calendar';

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

// A date-only event reaches the database as midnight UTC, which is the previous evening in
// Denver. Everything below is the fallout of that one shift, so the suite has to run west
// of UTC (TZ is pinned in vitest.config.js) or none of it can fail.
describe('event day classification', () => {
  // Noon on Sunday 13 September 2026 in Denver, the middle of the day the live events sat on.
  const denverNoon = new Date('2026-09-13T18:00:00Z');
  const today = { date: '2026-09-13 00:00:00+00' };

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(denverNoon);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs west of UTC, where a midnight-UTC date reads as the day before', () => {
    expect(new Date().getTimezoneOffset()).toBe(360);
    expect(new Date('2026-09-13T00:00:00Z').getDate()).toBe(12);
  });

  it('keeps a date-only event dated today upcoming', () => {
    expect(classifyEvent(today)).toBe('upcoming');
    expect(isEventUpcoming(today)).toBe(true);
    expect(isEventPast(today)).toBe(false);
  });

  it('holds a date-only event to the end of its own day, then archives it', () => {
    vi.setSystemTime(new Date('2026-09-14T05:59:00Z')); // 11:59 PM Denver, still the 13th
    expect(classifyEvent(today)).toBe('upcoming');

    vi.setSystemTime(new Date('2026-09-14T06:00:00Z')); // midnight Denver, now the 14th
    expect(classifyEvent(today)).toBe('past');
  });

  it('reads the free-text time, so tonight is upcoming and this morning is not', () => {
    expect(classifyEvent({ ...today, time: '6:00 PM' })).toBe('upcoming');
    expect(classifyEvent({ ...today, time: '6:00 PM - 8:30 PM' })).toBe('upcoming');
    expect(classifyEvent({ ...today, time: '8:00 AM' })).toBe('past');
    expect(classifyEvent({ ...today, time: '8:00 AM - 10:00 AM' })).toBe('past');
  });

  it('falls back to the whole day when the time is unreadable', () => {
    expect(classifyEvent({ ...today, time: 'TBD' })).toBe('upcoming');
    expect(classifyEvent({ ...today, time: '' })).toBe('upcoming');
  });

  it('archives yesterday and keeps tomorrow', () => {
    expect(classifyEvent({ date: '2026-09-12 00:00:00+00' })).toBe('past');
    expect(classifyEvent({ date: '2026-09-14 00:00:00+00' })).toBe('upcoming');
  });

  it('calls an event with no readable date undated rather than past', () => {
    expect(classifyEvent({ date: null })).toBe('undated');
    expect(classifyEvent({ date: '' })).toBe('undated');
    expect(classifyEvent({ date: 'sometime in the fall' })).toBe('undated');
    expect(classifyEvent({})).toBe('undated');
    expect(isEventUpcoming({ date: null })).toBe(true);
    expect(isEventPast({ date: null })).toBe(false);
  });

  it('starts a date-only event at local midnight and a timed one at its own clock', () => {
    expect(getEventStart(today)?.toString()).toContain('Sep 13 2026 00:00:00');
    expect(getEventStart({ ...today, time: '6:00 PM' })?.toString()).toContain('Sep 13 2026 18:00:00');
    expect(getEventStart({ date: null })).toBeNull();
  });

  it('sorts soonest first and leaves undated events at the end', () => {
    const undated = { id: 'undated', date: null };
    const tonight = { id: 'tonight', date: '2026-09-13 00:00:00+00', time: '6:00 PM' };
    const morning = { id: 'morning', date: '2026-09-13 00:00:00+00', time: '8:00 AM' };
    const tomorrow = { id: 'tomorrow', date: '2026-09-14 00:00:00+00' };

    expect([undated, tomorrow, tonight, morning].sort(compareEventsByStart).map(e => e.id))
      .toEqual(['morning', 'tonight', 'tomorrow', 'undated']);
  });
});

describe('formatEventDate', () => {
  it('prints the day that was picked, not the day before', () => {
    expect(formatEventDate({ date: '2026-09-13 00:00:00+00' })).toBe('Sep 13, 2026');
    expect(formatEventDate({ date: '2026-09-13T00:00:00+00:00' })).toBe('Sep 13, 2026');
    expect(formatEventDate({ date: '2026-01-01 00:00:00+00' })).toBe('Jan 1, 2026');
    expect(formatEventDate({ date: '2026-09-13 00:00:00+00' }, 'MMM d')).toBe('Sep 13');
    expect(formatEventDate({ date: '2026-09-13 00:00:00+00' }, 'yyyy-MM-dd')).toBe('2026-09-13');
  });

  it('gives back an empty string instead of throwing on a date it cannot read', () => {
    expect(formatEventDate({ date: null })).toBe('');
    expect(formatEventDate({ date: 'nonsense' })).toBe('');
    expect(formatEventDate(null)).toBe('');
  });
});
