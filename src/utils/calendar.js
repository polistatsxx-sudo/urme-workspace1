/**
 * Everything that reads a date off an event: the Google Calendar link, the
 * upcoming/archived split and every date the UI prints.
 *
 * `events.date` is a timestamptz that the Event form writes as a plain date, and
 * `events.time` is free text — people type "6:00 PM", "18:00" or "6 - 8pm". Both have to
 * be read back out of those shapes to land on the right slot.
 *
 * A date-only value reaches the database as midnight UTC, so `new Date(event.date)` is the
 * *previous* day for anyone west of UTC — the day gets read textually instead, and every
 * caller goes through the helpers here so the two readings cannot drift apart.
 *
 * The times handed to Google carry no timezone (`20260817T180000`, not `...Z`), so it
 * reads them in the viewer's own calendar timezone. That matches how the values were
 * entered: URME stores an event's wall-clock time, not an instant.
 */

import { format } from 'date-fns';

const GOOGLE_CALENDAR_BASE = 'https://www.google.com/calendar/render?action=TEMPLATE';

/** Default length of an event whose time has no end. */
const DEFAULT_DURATION_MINUTES = 60;

/**
 * A time-of-day worth trusting has either a colon or an am/pm marker. Requiring one of
 * the two keeps bare numbers — a year, a room number, "6" on its own — from being read
 * as a start time.
 */
const TIME_TOKEN = /(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m\.?|(\d{1,2}):(\d{2})/i;

/**
 * A range — "6:00 PM - 8:30 PM", "18:00-20:00", "6 to 8pm". Inside a range the separator
 * is enough to tell a bare hour from any other number, so the halves may omit both the
 * minutes and the am/pm marker.
 */
const TIME_RANGE = /(\d{1,2})(?::(\d{2}))?\s*(?:([ap])\.?m\.?)?\s*(?:-|–|—|to|until|till)\s*(\d{1,2})(?::(\d{2}))?\s*(?:([ap])\.?m\.?)?/i;

/**
 * @typedef {{ hours: number, minutes: number }} Clock
 */

/**
 * @param {number} hours
 * @param {number} minutes
 * @param {string | undefined} meridiem
 * @returns {Clock | null}
 */
function toClock(hours, minutes, meridiem) {
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (minutes < 0 || minutes > 59) return null;
  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    const base = hours === 12 ? 0 : hours;
    return { hours: meridiem === 'p' ? base + 12 : base, minutes };
  }
  if (hours < 0 || hours > 23) return null;
  return { hours, minutes };
}

/**
 * Read the start — and, when the text names a range, the end — out of an event's free-text
 * time. Returns null when there is nothing time-like in it.
 *
 * @param {string | null | undefined} value
 * @returns {{ start: Clock, end: Clock | null } | null}
 */
export function parseEventTime(value) {
  const text = String(value || '').trim();
  if (!text) return null;

  const range = text.match(TIME_RANGE);
  if (range) {
    const [, fromHour, fromMinute, fromMeridiem, toHour, toMinute, toMeridiem] = range;
    const endMeridiem = toMeridiem?.toLowerCase();
    // "6 - 8pm" and "6:00 to 7:30 PM" only mark the second half; the first shares it.
    const startMeridiem = fromMeridiem?.toLowerCase() || (Number(fromHour) <= 12 ? endMeridiem : undefined);
    const start = toClock(Number(fromHour), Number(fromMinute || 0), startMeridiem);
    const end = toClock(Number(toHour), Number(toMinute || 0), endMeridiem);
    if (start && end) return { start, end };
  }

  const single = text.match(TIME_TOKEN);
  if (!single) return null;
  const [, meridiemHour, meridiemMinute, meridiem, plainHour, plainMinute] = single;
  const start = meridiem
    ? toClock(Number(meridiemHour), Number(meridiemMinute || 0), meridiem.toLowerCase())
    : toClock(Number(plainHour), Number(plainMinute), undefined);
  return start ? { start, end: null } : null;
}

/**
 * Pull the calendar day out of `events.date`. The column is a timestamptz, so it comes
 * back as an ISO string whose leading date is the day that was typed; that is read
 * textually rather than through `new Date()`, which would shift the day for anyone west
 * of UTC.
 *
 * @param {string | null | undefined} value
 * @returns {{ year: number, month: number, day: number } | null}
 */
export function parseEventDate(value) {
  const text = String(value || '').trim();
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return { year: Number(iso[1]), month: Number(iso[2]), day: Number(iso[3]) };
  }
  if (!text) return null;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return { year: parsed.getFullYear(), month: parsed.getMonth() + 1, day: parsed.getDate() };
}

/**
 * A time already sitting in `events.date` — only interesting when `events.time` is empty
 * or unreadable, and only when it is not the midnight a date-only value produces.
 *
 * @param {string | null | undefined} value
 * @returns {Clock | null}
 */
function timeWithinDateValue(value) {
  const match = String(value || '').match(/^\d{4}-\d{2}-\d{2}[T ](\d{2}):(\d{2})/);
  if (!match) return null;
  const clock = toClock(Number(match[1]), Number(match[2]), undefined);
  if (!clock || (clock.hours === 0 && clock.minutes === 0)) return null;
  return clock;
}

const pad = (n) => String(n).padStart(2, '0');

/**
 * @param {{ year: number, month: number, day: number }} date
 * @param {Clock} [clock]
 */
function toUtcInstant(date, clock) {
  return Date.UTC(date.year, date.month - 1, date.day, clock?.hours || 0, clock?.minutes || 0);
}

/** @param {number} instant */
function splitInstant(instant) {
  const d = new Date(instant);
  return {
    date: { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() },
    clock: { hours: d.getUTCHours(), minutes: d.getUTCMinutes() },
  };
}

/** @param {{ year: number, month: number, day: number }} date */
const formatDay = (date) => `${date.year}${pad(date.month)}${pad(date.day)}`;

/**
 * @param {{ year: number, month: number, day: number }} date
 * @param {Clock} clock
 */
const formatDateTime = (date, clock) => `${formatDay(date)}T${pad(clock.hours)}${pad(clock.minutes)}00`;

/**
 * The `dates` parameter for an event: a timed range when the time can be read, otherwise
 * the all-day form (Google treats the end day as exclusive), and nothing at all when the
 * event has no date yet.
 *
 * @param {{ date?: string | null, time?: string | null }} event
 * @returns {string | null}
 */
export function getGoogleCalendarDates(event) {
  const date = parseEventDate(event?.date);
  if (!date) return null;

  const parsed = parseEventTime(event?.time);
  const start = parsed?.start || timeWithinDateValue(event?.date);
  if (!start) {
    const nextDay = splitInstant(toUtcInstant(date) + 24 * 60 * 60 * 1000).date;
    return `${formatDay(date)}/${formatDay(nextDay)}`;
  }

  const startInstant = toUtcInstant(date, start);
  let endInstant = parsed?.end
    ? toUtcInstant(date, parsed.end)
    : startInstant + DEFAULT_DURATION_MINUTES * 60 * 1000;
  // An end before the start means the event runs past midnight, as in "10 PM - 1 AM".
  if (endInstant <= startInstant) endInstant += 24 * 60 * 60 * 1000;
  const end = splitInstant(endInstant);

  return `${formatDateTime(date, start)}/${formatDateTime(end.date, end.clock)}`;
}

/**
 * The event's own wall clock: `events.time` when it can be read, else a time carried by
 * the date column, else nothing at all — a date-only event.
 *
 * @param {{ date?: string | null, time?: string | null } | null | undefined} event
 * @returns {{ start: Clock | null, end: Clock | null }}
 */
function readClocks(event) {
  const parsed = parseEventTime(event?.time);
  return { start: parsed?.start || timeWithinDateValue(event?.date), end: parsed?.end || null };
}

/**
 * Midnight on the event's calendar day, in the viewer's timezone — the value to format for
 * display. Null when the row has no readable date.
 *
 * @param {{ date?: string | null } | null | undefined} event
 * @returns {Date | null}
 */
export function getEventDay(event) {
  const date = parseEventDate(event?.date);
  return date ? new Date(date.year, date.month - 1, date.day) : null;
}

/**
 * When the event starts, in the viewer's timezone. A date-only event starts at local
 * midnight, which is what an undated-within-the-day sort falls back to.
 *
 * @param {{ date?: string | null, time?: string | null } | null | undefined} event
 * @returns {Date | null}
 */
export function getEventStart(event) {
  const date = parseEventDate(event?.date);
  if (!date) return null;
  const { start } = readClocks(event);
  return new Date(date.year, date.month - 1, date.day, start?.hours || 0, start?.minutes || 0);
}

/**
 * The instant an event stops being upcoming.
 *
 * A date-only event holds its whole day — nothing in the row says when during the day it
 * happens — so it expires at local midnight on the following day. A timed event holds
 * until the end it names, or until `DEFAULT_DURATION_MINUTES` past its start when it names
 * only one time, which is the length the Google Calendar link assumes as well.
 *
 * @param {{ date?: string | null, time?: string | null } | null | undefined} event
 * @returns {Date | null}
 */
function getEventExpiry(event) {
  const date = parseEventDate(event?.date);
  if (!date) return null;

  const { start, end } = readClocks(event);
  if (!start) return new Date(date.year, date.month - 1, date.day + 1);

  const startAt = new Date(date.year, date.month - 1, date.day, start.hours, start.minutes);
  if (!end) return new Date(startAt.getTime() + DEFAULT_DURATION_MINUTES * 60 * 1000);

  const endAt = new Date(date.year, date.month - 1, date.day, end.hours, end.minutes);
  // An end before the start means the event runs past midnight, as in "10 PM - 1 AM".
  if (endAt <= startAt) return new Date(date.year, date.month - 1, date.day + 1, end.hours, end.minutes);
  return endAt;
}

/**
 * Which bucket an event belongs in. `'undated'` is its own answer rather than a flavour of
 * past, so an event with a missing or unreadable date can be shown instead of vanishing
 * out of both tabs.
 *
 * @param {{ date?: string | null, time?: string | null } | null | undefined} event
 * @param {Date} [now]
 * @returns {'upcoming' | 'past' | 'undated'}
 */
export function classifyEvent(event, now = new Date()) {
  const expiry = getEventExpiry(event);
  if (!expiry) return 'undated';
  return expiry.getTime() > now.getTime() ? 'upcoming' : 'past';
}

/**
 * @param {{ date?: string | null, time?: string | null } | null | undefined} event
 * @param {Date} [now]
 * @returns {boolean}
 */
export function isEventPast(event, now) {
  return classifyEvent(event, now) === 'past';
}

/**
 * Anything that has not finished yet, undated events included — they are not in the past,
 * and a count that dropped them would hide them.
 *
 * @param {{ date?: string | null, time?: string | null } | null | undefined} event
 * @param {Date} [now]
 * @returns {boolean}
 */
export function isEventUpcoming(event, now) {
  return classifyEvent(event, now) !== 'past';
}

/**
 * Soonest first, with undated events last.
 *
 * @param {{ date?: string | null, time?: string | null }} a
 * @param {{ date?: string | null, time?: string | null }} b
 * @returns {number}
 */
export function compareEventsByStart(a, b) {
  const startA = getEventStart(a);
  const startB = getEventStart(b);
  if (!startA) return startB ? 1 : 0;
  if (!startB) return -1;
  return startA.getTime() - startB.getTime();
}

/**
 * The event's date as the day the user picked. Empty string when there is no readable
 * date, so a caller can fall back to its own placeholder — and so an unreadable value
 * cannot throw the way `format(new Date('nonsense'))` does.
 *
 * @param {{ date?: string | null } | null | undefined} event
 * @param {string} [pattern] any date-fns format pattern
 * @returns {string}
 */
export function formatEventDate(event, pattern = 'MMM d, yyyy') {
  const day = getEventDay(event);
  return day ? format(day, pattern) : '';
}

/**
 * "Add to Google Calendar" link for an event.
 *
 * @param {{ name?: string | null, description?: string | null, location?: string | null, date?: string | null, time?: string | null }} event
 * @returns {string}
 */
export function getGoogleCalendarUrl(event) {
  const params = [
    `text=${encodeURIComponent(event?.name || '')}`,
    `details=${encodeURIComponent(event?.description || '')}`,
    `location=${encodeURIComponent(event?.location || '')}`,
  ];
  const dates = getGoogleCalendarDates(event || {});
  if (dates) params.push(`dates=${dates}`);
  return `${GOOGLE_CALENDAR_BASE}&${params.join('&')}`;
}
