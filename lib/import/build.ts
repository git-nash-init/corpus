import type { BalanceAsset, FixedAsset, Fund, FundTxn, Goal, Liability, StockQuote, StockTxn } from "@/lib/data/types";
import { navOnOrBefore, type NavPoint } from "@/lib/market/nav";
import type { ImportPlan } from "./spreadsheet";

/** A live scheme the user matched a spreadsheet fund to. */
export interface SchemeMatch {
  code: string;
  name: string;
  latest: NavPoint;
  history: NavPoint[];
}

export interface BuiltRecords {
  funds: Fund[];
  fundTxns: FundTxn[];
  stockTxns: StockTxn[];
  quotes: StockQuote[];
  fixedAssets: FixedAsset[];
  balanceAssets: BalanceAsset[];
  liabilities: Liability[];
  goals: Goal[];
  notes: string[];
}

/** Used as the NAV for funds with no live match. Units are then meaningless, so the sheet's value is kept as a manual value. */
export const PLACEHOLDER_NAV = 10;

export function buildRecords(
  plan: ImportPlan,
  matches: ReadonlyMap<string, SchemeMatch | null>,
  userId: string,
  today: string,
  newId: () => string,
  defaultReturn = 0.12,
): BuiltRecords {
  const notes: string[] = [];
  const fundIds = new Map<string, string>();

  const funds: Fund[] = plan.funds.map((f) => {
    const id = newId();
    fundIds.set(f.name, id);
    const m = matches.get(f.name) ?? null;
    if (!m) notes.push(`${f.name} was kept without live NAVs. Its value uses the figure from your sheet.`);
    return {
      id,
      userId,
      name: m ? m.name : f.name,
      category: f.category,
      amfiCode: m?.code,
      sipAmount: f.sipAmount,
      sipDay: 10,
      sipStatus: f.sipStatus,
      latestNav: m ? m.latest.nav : PLACEHOLDER_NAV,
      navDate: m ? m.latest.date : today,
      manualValue: m ? undefined : (f.sheetValue ?? undefined),
    };
  });

  const fundTxns: FundTxn[] = [];
  for (const t of plan.fundTxns) {
    const fundId = fundIds.get(t.fundName);
    if (!fundId) continue;
    const m = matches.get(t.fundName) ?? null;
    let nav = PLACEHOLDER_NAV;
    if (m) {
      const hit = navOnOrBefore(m.history, t.date);
      if (hit) nav = hit.nav;
      else {
        // The transaction predates the first published NAV: fall back to the earliest one.
        nav = m.history[0]?.nav ?? m.latest.nav;
        notes.push(`${t.fundName}: no NAV existed on ${t.date}. The earliest NAV was used.`);
      }
    }
    fundTxns.push({ id: newId(), userId, fundId, date: t.date, type: t.type, amount: t.amount, nav });
  }

  const stockTxns: StockTxn[] = plan.stockTxns.map((t) => ({ id: newId(), userId, ...t }));
  const quotes: StockQuote[] = plan.quotes.map((q) => ({ ticker: q.ticker, name: q.name, sector: q.sector, cmp: q.cmp }));

  const fixedAssets: FixedAsset[] = plan.fixedAssets.map((a) => ({ id: newId(), userId, ...a }));
  const balanceAssets: BalanceAsset[] = plan.balanceAssets.map((a) => ({ id: newId(), userId, ...a }));
  const liabilities: Liability[] = plan.liabilities.map((l) => ({ id: newId(), userId, ...l }));

  const goals: Goal[] = [];
  if (plan.goal) {
    const yearOut = `${Number(today.slice(0, 4)) + 10}-12-31`;
    // A target date in the past would make every projection meaningless, so move it out and say so.
    const date = plan.goal.targetDate && plan.goal.targetDate > today ? plan.goal.targetDate : yearOut;
    if (date !== plan.goal.targetDate) notes.push(`Your goal's target date was not in the future, so it was set to ${date}. You can change it in Goals.`);
    goals.push({ id: newId(), userId, name: plan.goal.name, target: plan.goal.target, targetDate: date, expectedReturn: defaultReturn, monthlySip: plan.goal.monthlySip });
  }

  return { funds, fundTxns, stockTxns, quotes, fixedAssets, balanceAssets, liabilities, goals, notes };
}
