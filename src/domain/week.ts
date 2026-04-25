export const WEEKDAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
] as const;

export function getWeekStartForDay(date: Date, weekStartDay: number) {
  const result = new Date(date);
  const normalizedWeekStartDay = Number.isInteger(weekStartDay) ? ((weekStartDay % 7) + 7) % 7 : 1;
  const currentDay = result.getDay();
  const diff = -((currentDay - normalizedWeekStartDay + 7) % 7);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() + diff);
  return result;
}

export function getWeekStartIso(date: Date, weekStartDay: number) {
  return getWeekStartForDay(date, weekStartDay).toISOString().slice(0, 10);
}
