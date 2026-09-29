// Time value of money with Excel's sign conventions (cash out negative, cash in positive), payments at period end.

/** Excel FV(rate, nper, pmt, pv). */
export function fv(rate: number, nper: number, pmt: number, pv: number): number {
  if (rate === 0) return -(pv + pmt * nper);
  const g = Math.pow(1 + rate, nper);
  return -(pv * g + (pmt * (g - 1)) / rate);
}

/** Excel PMT(rate, nper, pv, fv). */
export function pmt(rate: number, nper: number, pv: number, fvTarget = 0): number {
  if (rate === 0) return -(pv + fvTarget) / nper;
  const g = Math.pow(1 + rate, nper);
  return -((pv * g + fvTarget) * rate) / (g - 1);
}

/** Excel NPER(rate, pmt, pv, fv). Null when the target can never be reached. */
export function nper(rate: number, pmtAmt: number, pv: number, fvTarget = 0): number | null {
  if (rate === 0) {
    if (pmtAmt === 0) return null;
    const n = -(pv + fvTarget) / pmtAmt;
    return Number.isFinite(n) && n >= 0 ? n : null;
  }
  const num = pmtAmt - fvTarget * rate;
  const den = pmtAmt + pv * rate;
  if (den === 0) return null;
  const ratio = num / den;
  if (!(ratio > 0)) return null;
  const n = Math.log(ratio) / Math.log(1 + rate);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
