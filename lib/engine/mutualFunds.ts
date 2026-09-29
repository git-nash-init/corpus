import type { Fund, FundCategory, FundTxn, ISODate } from "@/lib/data/types";
import { daysBetween, isSameMonth } from "./dates";
import { roundMoney, sumMoney } from "./money";
import { xirr, type CashFlow } from "./xirr";

export interface FundPosition {
  fundId: string;
  units: number;
  invested: number; // cost basis of units still held
  currentValue: number;
  gain: number;
  absReturn: number | null;
  realisedGain: number;
  firstDate: ISODate | null;
  xirr: number | null;
  daysHeld: number;
}

/**
 * Units x NAV position. Buys add units at amount / nav. Redemptions remove units at their NAV and reduce cost
 * basis proportionally (average cost), booking the difference as realised gain.
 * A manual value on the fund overrides units x latest NAV, mirroring the sheet's hand-typed current value.
 */
export function fundPosition(fund: Fund, allTxns: readonly FundTxn[], asOf: ISODate): FundPosition {
  const txns = allTxns.filter((t) => t.fundId === fund.id && t.date <= asOf).sort((a, b) => a.date.localeCompare(b.date));

  let units = 0;
  let cost = 0;
  let realised = 0;
  const flows: CashFlow[] = [];

  for (const t of txns) {
    const u = t.nav > 0 ? t.amount / t.nav : 0;
    if (t.type === "Redemption") {
      const sold = Math.min(u, units);
      const costOut = units > 0 ? cost * (sold / units) : 0;
      realised += t.amount - costOut;
      cost -= costOut;
      units -= sold;
      flows.push({ date: t.date, amount: t.amount });
    } else {
      units += u;
      cost += t.amount;
      flows.push({ date: t.date, amount: -t.amount });
    }
  }

  const invested = roundMoney(cost);
  const currentValue = roundMoney(fund.manualValue ?? units * fund.latestNav);
  const firstDate = txns.length ? txns[0].date : null;
  const hasHolding = invested > 0 && currentValue > 0;

  const rate = hasHolding ? xirr([...flows, { date: asOf, amount: currentValue }]) : null;

  return {
    fundId: fund.id,
    units,
    invested,
    currentValue,
    gain: roundMoney(currentValue - invested),
    absReturn: invested > 0 ? (currentValue - invested) / invested : null,
    realisedGain: roundMoney(realised),
    firstDate,
    xirr: rate,
    daysHeld: firstDate ? daysBetween(firstDate, asOf) : 0,
  };
}

export type ReturnDisplay = { kind: "absolute" | "xirr"; value: number | null };

/** XIRR on a holding younger than a year is meaningless (the sheet showed 198,866%), so show absolute return instead. */
export function displayReturn(daysHeld: number, absReturn: number | null, xirrValue: number | null): ReturnDisplay {
  if (daysHeld >= 365 && xirrValue !== null && Number.isFinite(xirrValue)) return { kind: "xirr", value: xirrValue };
  return { kind: "absolute", value: absReturn };
}

export interface SipCheck {
  planned: number;
  completed: number;
  remaining: number;
  share: number;
  status: "Completed" | "In progress" | "No SIP planned";
  activeCount: number;
}

/** This month's planned SIP (active funds) against SIP-type transactions logged in the current month. */
export function sipCheck(funds: readonly Fund[], txns: readonly FundTxn[], asOf: ISODate): SipCheck {
  const active = funds.filter((f) => f.sipStatus === "Active" && f.sipAmount > 0);
  const planned = sumMoney(active.map((f) => f.sipAmount));
  const activeIds = new Set(active.map((f) => f.id));
  const completed = sumMoney(
    txns.filter((t) => t.type === "SIP" && activeIds.has(t.fundId) && isSameMonth(t.date, asOf)).map((t) => t.amount),
  );
  const remaining = Math.max(0, roundMoney(planned - completed));
  return {
    planned,
    completed,
    remaining,
    share: planned > 0 ? Math.min(1, completed / planned) : 0,
    status: planned <= 0 ? "No SIP planned" : completed >= planned ? "Completed" : "In progress",
    activeCount: active.length,
  };
}

export const FUND_CATEGORIES: readonly FundCategory[] = ["Equity", "Debt", "Hybrid", "Index", "Other"];

export function categoryAllocation(rows: readonly { category: FundCategory; currentValue: number }[]) {
  const total = sumMoney(rows.map((r) => r.currentValue));
  return FUND_CATEGORIES.map((category) => {
    const value = sumMoney(rows.filter((r) => r.category === category).map((r) => r.currentValue));
    return { category, value, share: total > 0 ? value / total : 0 };
  });
}
