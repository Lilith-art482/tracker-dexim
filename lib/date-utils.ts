/**
 * Date utilities that respect the user-selected timezone
 * stored in localStorage as "user_timezone".
 *
 * All "today" / "now" calculations use that timezone so that
 * the app shows the correct calendar date even when the browser
 * locale differs from the user's chosen timezone.
 */

function getUserTz(): string {
  if (typeof window === "undefined") return "UTC";
  try {
    return (
      localStorage.getItem("user_timezone") ||
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      "UTC"
    );
  } catch {
    return "UTC";
  }
}

/** Decompose a Date into components in the given timezone. */
function partsInTz(
  d: Date,
  tz: string,
): { year: number; month: number; day: number; hour: number; minute: number } {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const map: Record<string, number> = {};
  for (const { type, value } of f.formatToParts(d)) {
    if (type !== "literal") map[type] = Number(value);
  }
  // Intl hours 00..23 but "24" can appear for midnight
  if (map.hour === 24) map.hour = 0;
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: map.hour,
    minute: map.minute,
  };
}

/**
 * Date string "YYYY-MM-DD" in the **user-selected timezone**.
 * Falls back to browser-local if no timezone is stored.
 */
export function localDateStr(d: Date = new Date()): string {
  const tz = getUserTz();
  const p = partsInTz(d, tz);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** Parse "YYYY-MM-DD" into a plain Date at midnight **local** (no timezone shift). */
export function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Add `n` days to a "YYYY-MM-DD" string (timezone-safe). */
export function addDays(dateStr: string, n: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + n);
  return localDateStr(d);
}

/** Format a Date or "YYYY-MM-DD" string for display in the user's timezone. */
export function fmtLocalDate(
  input: Date | string,
  opts: Intl.DateTimeFormatOptions = {},
): string {
  const d = typeof input === "string" ? parseLocalDate(input) : input;
  const tz = getUserTz();
  return d.toLocaleDateString("ru-RU", { timeZone: tz, ...opts });
}

/**
 * "Now" in the user's timezone, returned as a plain Date
 * whose getFullYear/getMonth/getDate reflect that timezone.
 */
export function nowInUserTz(): Date {
  const tz = getUserTz();
  const p = partsInTz(new Date(), tz);
  return new Date(p.year, p.month - 1, p.day, p.hour, p.minute);
}

/** Start of today (midnight) in the user's timezone. */
export function todayStart(): Date {
  const n = nowInUserTz();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

/** Days between two "YYYY-MM-DD" strings (inclusive). */
export function daysBetween(start: string, end: string): number {
  const s = parseLocalDate(start).getTime();
  const e = parseLocalDate(end).getTime();
  return Math.floor((e - s) / 86400000) + 1;
}

/** Days elapsed since `start` (at least 1), counting in user timezone. */
export function daysElapsed(start: string): number {
  const s = parseLocalDate(start).getTime();
  const now = todayStart();
  return Math.max(1, Math.ceil((now.getTime() - s) / 86400000));
}
