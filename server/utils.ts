const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function parseWeekStart(value?: string): Date {
  if (!value) {
    return startOfWeek(new Date());
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid weekStart date");
  }

  return parsed;
}

export function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() + diff);
  return result;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getWeekdayLabel(dayIndex: number): string {
  return WEEKDAY_LABELS[dayIndex] ?? `Day ${dayIndex + 1}`;
}

export function minutesToTimeString(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) {
    return "";
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function timeStringToMinutes(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const [hoursText, minutesText] = value.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

export function currencyFromCents(cents: number): number {
  return Math.round((cents / 100 + Number.EPSILON) * 100) / 100;
}

export function centsFromCurrency(amount: number): number {
  return Math.round(amount * 100);
}

export function clampLunchMinutes(value: number): number {
  return Math.max(0, Math.min(240, Math.round(value)));
}
