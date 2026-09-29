import { SECTORS, type ISODate, type Sector, type StockQuote, type StockTxn } from "@/lib/data/types";
import { daysBetween } from "./dates";
import { roundMoney, sumMoney } from "./money";
import { xirr, type CashFlow } from "./xirr";

export interface StockPosition {
  ticker: string;
  name: string;
  sector: Sector;
  quantity: number;
  avgCost: number;
  invested: number;
  cmp: number;
  currentValue: number;
  gain: number;
  absReturn: number | null;
  weight: number;
  realisedGain: number;
  firstDate: ISODate | null;
  xirr: number | null;
  daysHeld: number;
}

/**
 * Moving weighted-average cost. A sell removes shares at the running average and books realised P&L,
 * which the sheet's "all buys / all bought quantity" average could not do.
 */
export function stockPositions(
  allTxns: readonly StockTxn[],
  quotes: readonly StockQuote[],
  asOf: ISODate,
  opts: { includeClosed?: boolean } = {},
): StockPosition[] {
  const byTicker = new Map<string, StockTxn[]>();
  for (const t of allTxns) {
    if (t.date > asOf) continue;
    const key = t.ticker.toUpperCase();
    byTicker.set(key, [...(byTicker.get(key) ?? []), t]);
  }

  const rows: Omit<StockPosition, "weight">[] = [];

  for (const [ticker, list] of byTicker) {
    const txns = [...list].sort((a, b) => a.date.localeCompare(b.date));
    const quote = quotes.find((q) => q.ticker.toUpperCase() === ticker);
    let qty = 0;
    let cost = 0;
    let realised = 0;
    const flows: CashFlow[] = [];

    for (const t of txns) {
      if (t.type === "Buy") {
        qty += t.quantity;
        cost += t.quantity * t.price;
        flows.push({ date: t.date, amount: -(t.quantity * t.price) });
      } else {
        if (t.quantity > qty + 1e-9) {
          throw new Error(`Sell of ${t.quantity} ${ticker} on ${t.date} exceeds the ${qty} held`);
        }
        const avg = qty > 0 ? cost / qty : 0;
        realised += t.quantity * (t.price - avg);
        cost -= t.quantity * avg;
        qty -= t.quantity;
        flows.push({ date: t.date, amount: t.quantity * t.price });
      }
    }

    if (qty <= 1e-9 && !opts.includeClosed) continue;
    if (qty <= 1e-9) {
      qty = 0;
      cost = 0;
    }

    const cmp = quote?.cmp ?? 0;
    const invested = roundMoney(cost);
    const currentValue = roundMoney(qty * cmp);
    const rate = qty > 0 && currentValue > 0 ? xirr([...flows, { date: asOf, amount: currentValue }]) : null;

    rows.push({
      ticker,
      name: quote?.name ?? ticker,
      sector: quote?.sector ?? "Banking & Finance",
      quantity: qty,
      avgCost: qty > 0 ? cost / qty : 0,
      invested,
      cmp,
      currentValue,
      gain: roundMoney(currentValue - invested),
      absReturn: invested > 0 ? (currentValue - invested) / invested : null,
      realisedGain: roundMoney(realised),
      firstDate: txns[0].date,
      xirr: rate,
      daysHeld: daysBetween(txns[0].date, asOf),
    });
  }

  const total = sumMoney(rows.map((r) => r.currentValue));
  return rows.map((r) => ({ ...r, weight: total > 0 ? r.currentValue / total : 0 }));
}

export function stockTotals(positions: readonly StockPosition[]) {
  const invested = sumMoney(positions.map((p) => p.invested));
  const currentValue = sumMoney(positions.map((p) => p.currentValue));
  return {
    invested,
    currentValue,
    gain: roundMoney(currentValue - invested),
    absReturn: invested > 0 ? (currentValue - invested) / invested : 0,
    realisedGain: sumMoney(positions.map((p) => p.realisedGain)),
    holdings: positions.filter((p) => p.quantity > 0).length,
  };
}

/** Every sector is listed, including empty ones (the sheet silently dropped Healthcare, Auto and Metals). */
export function sectorAllocation(positions: readonly StockPosition[]) {
  const total = sumMoney(positions.map((p) => p.currentValue));
  return SECTORS.map((sector) => {
    const value = sumMoney(positions.filter((p) => p.sector === sector).map((p) => p.currentValue));
    return { sector, value, share: total > 0 ? value / total : 0 };
  });
}

export function tradeSummary(txns: readonly StockTxn[]) {
  const purchases = sumMoney(txns.filter((t) => t.type === "Buy").map((t) => t.quantity * t.price));
  const sales = sumMoney(txns.filter((t) => t.type === "Sell").map((t) => t.quantity * t.price));
  return { purchases, sales, netDeployed: roundMoney(purchases - sales), trades: txns.length };
}

/** Whole-portfolio XIRR across every stock trade plus today's value. */
export function portfolioXirr(txns: readonly StockTxn[], currentValue: number, asOf: ISODate): number | null {
  const flows: CashFlow[] = txns
    .filter((t) => t.date <= asOf)
    .map((t) => ({ date: t.date, amount: t.type === "Buy" ? -(t.quantity * t.price) : t.quantity * t.price }));
  if (currentValue > 0) flows.push({ date: asOf, amount: currentValue });
  return xirr(flows);
}
