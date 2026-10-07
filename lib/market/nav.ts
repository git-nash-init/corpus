export interface NavPoint {
  /** ISO date, YYYY-MM-DD */
  date: string;
  nav: number;
}

/** mfapi.in dates are DD-MM-YYYY. */
export function isoFromMfDate(d: string): string {
  const [dd, mm, yyyy] = d.split("-");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * The NAV in force on a date: the most recent NAV on or before it. Funds do not publish on weekends and holidays,
 * so a Sunday SIP uses Friday's NAV. Expects `history` sorted ascending by date. Null if the fund did not exist yet.
 */
export function navOnOrBefore(history: readonly NavPoint[], date: string): NavPoint | null {
  let lo = 0;
  let hi = history.length - 1;
  let found: NavPoint | null = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (history[mid].date <= date) {
      found = history[mid];
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
}

/** Maps an AMFI scheme category such as "Equity Scheme - Mid Cap Fund" onto Crorpus's five categories. */
export function categoryFromScheme(schemeCategory: string, schemeName = ""): "Equity" | "Debt" | "Hybrid" | "Index" | "Other" {
  const c = `${schemeCategory} ${schemeName}`.toLowerCase();
  if (c.includes("index") || c.includes("etf") || c.includes("nifty 50") || c.includes("sensex")) return "Index";
  if (c.includes("hybrid") || c.includes("balanced") || c.includes("arbitrage")) return "Hybrid";
  if (c.includes("debt") || c.includes("liquid") || c.includes("gilt") || c.includes("bond") || c.includes("money market") || c.includes("overnight")) return "Debt";
  if (c.includes("equity") || c.includes("elss") || c.includes("cap") || c.includes("sectoral") || c.includes("thematic")) return "Equity";
  return "Other";
}
