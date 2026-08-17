/**
 * Google Calendar links for events.
 *
 * `events.date` is a timestamptz that the Event form writes as a plain date, and
 * `events.time` is free text — people type "6:00 PM", "18:00" or "6 - 8pm". Both have to
 * be read back out of those shapes to build a link that lands on the right slot.
 *
 * The times handed to Google carry no timezone (`20260817T180000`, not `...Z`), so it
 * reads them in the viewer's own calendar timezone. That matches how the values were
 * entered: URME stores an event's wall-clock time, not an instant.
 */

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
