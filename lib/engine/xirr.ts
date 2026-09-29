import type { ISODate } from "@/lib/data/types";
import { daysBetween } from "./dates";

export interface CashFlow {
  date: ISODate;
  /** Negative for money paid in, positive for money received (or the closing value). */
  amount: number;
}

const TOL = 1e-9;

function npv(rate: number, flows: CashFlow[], t0: ISODate): number {
  let total = 0;
  for (const f of flows) {
    total += f.amount / Math.pow(1 + rate, daysBetween(t0, f.date) / 365);
  }
  return total;
}

function dnpv(rate: number, flows: CashFlow[], t0: ISODate): number {
  let total = 0;
  for (const f of flows) {
    const t = daysBetween(t0, f.date) / 365;
    total += (-t * f.amount) / Math.pow(1 + rate, t + 1);
  }
  return total;
}

/**
 * Excel-compatible XIRR (actual/365). Newton-Raphson first, bisection fallback.
 * Returns null when the flows have no sign change or no root exists.
 */
export function xirr(input: readonly CashFlow[]): number | null {
  const flows = input.filter((f) => Number.isFinite(f.amount) && f.amount !== 0);
  const hasNeg = flows.some((f) => f.amount < 0);
  const hasPos = flows.some((f) => f.amount > 0);
  if (!hasNeg || !hasPos) return null;

  const t0 = flows.reduce((min, f) => (f.date < min ? f.date : min), flows[0].date);

  let rate = 0.1;
  for (let i = 0; i < 100; i++) {
    const v = npv(rate, flows, t0);
    const d = dnpv(rate, flows, t0);
    if (!Number.isFinite(v) || !Number.isFinite(d) || d === 0) break;
    const next = rate - v / d;
    if (next <= -0.999999) break;
    if (Math.abs(next - rate) < TOL) return next;
    rate = next;
  }

  // Bisection fallback over a wide bracket.
  let lo = -0.999999;
  let hi = 1e6;
  let fLo = npv(lo, flows, t0);
  const fHi = npv(hi, flows, t0);
  if (!Number.isFinite(fLo) || !Number.isFinite(fHi) || fLo * fHi > 0) return null;
  for (let i = 0; i < 300; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npv(mid, flows, t0);
    if (Math.abs(fMid) < 1e-7 || (hi - lo) / 2 < TOL) return mid;
    if (fLo * fMid < 0) {
      hi = mid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }
  return (lo + hi) / 2;
}
