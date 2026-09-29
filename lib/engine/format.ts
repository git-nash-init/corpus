const RUPEE = "₹";

const grouped = (decimals: number) =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export interface FormatOptions {
  decimals?: number;
}

/** 7584394.25 -> "₹75,84,394.25" (lakh/crore grouping). */
export function formatINR(value: number, { decimals = 2 }: FormatOptions = {}): string {
  const abs = grouped(decimals).format(Math.abs(value));
  return `${value < 0 ? "-" : ""}${RUPEE}${abs}`;
}

/** 143394.25 -> "₹1.43 L", 10000000 -> "₹1.00 Cr", 9500 -> "₹9,500". */
export function formatINRShort(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1e7) return `${sign}${RUPEE}${(abs / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `${sign}${RUPEE}${(abs / 1e5).toFixed(2)} L`;
  return `${sign}${RUPEE}${grouped(0).format(abs)}`;
}

export function formatPercent(fraction: number, { sign = false, decimals = 2 }: { sign?: boolean; decimals?: number } = {}): string {
  const pct = (fraction * 100).toFixed(decimals);
  return `${sign && fraction > 0 ? "+" : ""}${pct}%`;
}

export function formatNumber(value: number, decimals = 2): string {
  return grouped(decimals).format(value);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-09-29" -> "29 Sep 2026". */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function formatMonth(iso: string): string {
  const [y, m] = iso.slice(0, 10).split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}
