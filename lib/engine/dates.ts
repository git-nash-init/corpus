import type { ISODate } from "@/lib/data/types";

const MS_PER_DAY = 86_400_000;

function parts(d: ISODate): [number, number, number] {
  const [y, m, day] = d.slice(0, 10).split("-").map(Number);
  return [y, m, day];
}

function toUTC(d: ISODate): number {
  const [y, m, day] = parts(d);
  return Date.UTC(y, m - 1, day);
}

export function toISO(ms: number): ISODate {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Whole days from a to b (b later gives a positive number). */
export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((toUTC(b) - toUTC(a)) / MS_PER_DAY);
}

/** Calendar month difference, ignoring the day of month, as the sheet does (year*12 + month). */
export function monthsBetween(from: ISODate, to: ISODate): number {
  const [fy, fm] = parts(from);
  const [ty, tm] = parts(to);
  return (ty - fy) * 12 + (tm - fm);
}

/** Excel EDATE: same day of month, clamped to the end of shorter months. */
export function addMonths(d: ISODate, months: number): ISODate {
  const [y, m, day] = parts(d);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = total % 12;
  const last = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  return toISO(Date.UTC(ny, nm, Math.min(day, last)));
}

export function isSameMonth(a: ISODate, b: ISODate): boolean {
  const [ay, am] = parts(a);
  const [by, bm] = parts(b);
  return ay === by && am === bm;
}

export function firstOfMonth(d: ISODate): ISODate {
  const [y, m] = parts(d);
  return toISO(Date.UTC(y, m - 1, 1));
}

export function todayISO(now: Date = new Date()): ISODate {
  return toISO(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}
