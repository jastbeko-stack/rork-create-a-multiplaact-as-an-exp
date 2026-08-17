/** Formats a number of Iraqi Dinars, e.g. 8500 -> "8,500 د.ع". */
export function formatIQD(amount: number): string {
  return `${Math.round(amount).toLocaleString("en-US")} د.ع`;
}

/** Formats a plain number with thousand separators and western digits. */
export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

/** Returns an ISO date string (YYYY-MM-DD) for a Date. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Adds whole months to an ISO date string. */
export function addMonths(isoDate: string, months: number): string {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setMonth(date.getMonth() + months);
  return toISODate(date);
}

/** Whole days between today and an ISO date (negative when in the past). */
export function daysUntil(isoDate: string): number {
  const target = new Date(`${isoDate}T00:00:00`).getTime();
  const today = new Date(toISODate(new Date()) + "T00:00:00").getTime();
  return Math.round((target - today) / 86_400_000);
}
