import type {
  BalanceAsset,
  FixedAsset,
  Fund,
  FundTxn,
  Goal,
  ISODate,
  Liability,
  Snapshot,
  StockQuote,
  StockTxn,
} from "./types";
import { addMonths, firstOfMonth } from "@/lib/engine/dates";
import { STOCK_DIRECTORY } from "./stock-directory";

export interface ReviewItem {
  id: string;
  action: string;
  timeline: string;
  focus: string;
  done: boolean;
}

export interface ReviewNote {
  id: string;
  category: "Key wins" | "Improvements" | "Next actions";
  text: string;
}

export interface AppData {
  version: 1;
  userId: string;
  funds: Fund[];
  fundTxns: FundTxn[];
  stockTxns: StockTxn[];
  quotes: StockQuote[];
  fixedAssets: FixedAsset[];
  balanceAssets: BalanceAsset[];
  liabilities: Liability[];
  goals: Goal[];
  snapshots: Snapshot[];
  reviewItems: ReviewItem[];
  reviewNotes: ReviewNote[];
}

const USER = "demo-user";

/** Round a value to two decimals. */
const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Demo portfolio modelled on the source sheet (same funds, tickers, asset types and structure) with a longer
 * history so XIRR, trends and reviews have something to show. Everything is relative to `today`.
 */
export function buildDemoData(today: ISODate): AppData {
  const monthStart = firstOfMonth(today);

  // Mutual funds: monthly SIPs going back, NAV rising along a gentle curve.
  const fundSpecs = [
    { id: "f-nippon", name: "Nippon India Large Cap Fund", category: "Equity" as const, sip: 10000, day: 11, months: 14, nav0: 82, growth: 0.011 },
    { id: "f-hdfc", name: "HDFC Mid Cap Fund Growth", category: "Equity" as const, sip: 15000, day: 10, months: 14, nav0: 168, growth: 0.014 },
    { id: "f-invesco", name: "Invesco India Small Cap Fund Growth", category: "Equity" as const, sip: 5000, day: 12, months: 11, nav0: 34, growth: 0.016 },
    { id: "f-uti", name: "UTI Nifty 50 Index Fund", category: "Index" as const, sip: 5000, day: 5, months: 8, nav0: 152, growth: 0.009 },
    { id: "f-icici", name: "ICICI Prudential Corporate Bond Fund", category: "Debt" as const, sip: 0, day: 1, months: 0, nav0: 29, growth: 0.006 },
  ];

  const funds: Fund[] = [];
  const fundTxns: FundTxn[] = [];
  for (const s of fundSpecs) {
    const nav = (k: number) => r2(s.nav0 * Math.pow(1 + s.growth, s.months - k));
    for (let k = s.months; k >= 1; k--) {
      const d = addMonths(monthStart, -k).slice(0, 8) + String(s.day).padStart(2, "0");
      fundTxns.push({ id: `${s.id}-sip-${k}`, userId: USER, fundId: s.id, date: d, type: "SIP", amount: s.sip, nav: nav(k) });
    }
    // The current month's SIP has already debited for the earlier-dated funds.
    const thisMonth = monthStart.slice(0, 8) + String(s.day).padStart(2, "0");
    if (s.months > 0 && thisMonth <= today) {
      fundTxns.push({ id: `${s.id}-sip-0`, userId: USER, fundId: s.id, date: thisMonth, type: "SIP", amount: s.sip, nav: nav(0) });
    }
    funds.push({
      id: s.id,
      userId: USER,
      name: s.name,
      category: s.category,
      sipAmount: s.sip,
      sipDay: s.day,
      sipStatus: s.sip > 0 ? "Active" : "Stopped",
      latestNav: r2(s.nav0 * Math.pow(1 + s.growth, s.months + 0.4)),
      navDate: today,
    });
  }
  fundTxns.push({
    id: "f-icici-lump",
    userId: USER,
    fundId: "f-icici",
    date: addMonths(monthStart, -9).slice(0, 8) + "18",
    type: "Lumpsum",
    amount: 100000,
    nav: 27.4,
  });

  // Stocks: the sheet's three holdings plus older positions, one partial sell.
  const q = (ticker: string, cmp: number): StockQuote => {
    const e = STOCK_DIRECTORY.find((d) => d.ticker === ticker)!;
    return { ticker, name: e.name, sector: e.sector, cmp };
  };
  const quotes: StockQuote[] = [
    q("HDFCBANK", 715.4),
    q("TATAPOWER", 357.25),
    q("INFY", 987.9),
    q("TCS", 2046.8),
    q("WIPRO", 157.79),
    q("ITC", 264.8),
    q("SUNPHARMA", 1685.5),
    q("MARUTI", 12420),
  ];
  const at = (m: number, day: string) => addMonths(monthStart, -m).slice(0, 8) + day;
  const stockTxns: StockTxn[] = [
    { id: "s1", userId: USER, ticker: "HDFCBANK", date: at(1, "08"), type: "Buy", quantity: 30, price: 745 },
    { id: "s2", userId: USER, ticker: "TATAPOWER", date: at(0, "09"), type: "Buy", quantity: 25, price: 350 },
    { id: "s3", userId: USER, ticker: "INFY", date: at(1, "10"), type: "Buy", quantity: 20, price: 349 },
    { id: "s4", userId: USER, ticker: "TCS", date: at(14, "14"), type: "Buy", quantity: 12, price: 3410 },
    { id: "s5", userId: USER, ticker: "TCS", date: at(6, "20"), type: "Sell", quantity: 4, price: 3150 },
    { id: "s6", userId: USER, ticker: "ITC", date: at(16, "03"), type: "Buy", quantity: 150, price: 421 },
    { id: "s7", userId: USER, ticker: "SUNPHARMA", date: at(9, "22"), type: "Buy", quantity: 15, price: 1512 },
    { id: "s8", userId: USER, ticker: "MARUTI", date: at(13, "07"), type: "Buy", quantity: 3, price: 11250 },
    { id: "s9", userId: USER, ticker: "WIPRO", date: at(5, "12"), type: "Buy", quantity: 60, price: 251 },
  ];

  const fx = (
    id: string,
    kind: FixedAsset["kind"],
    name: string,
    provider: string,
    invested: number,
    currentValue: number,
    annualContribution: number,
    maturity: string,
    liquidity: FixedAsset["liquidity"],
  ): FixedAsset => ({ id, userId: USER, kind, name, provider, invested, currentValue, annualContribution, maturity, liquidity });

  const fixedAssets: FixedAsset[] = [
    fx("fa-ppf", "PPF", "Public Provident Fund (PPF)", "State Bank of India", 450000, 561200, 150000, addMonths(monthStart, 88).slice(0, 4) + "-04-01", "Locked"),
    fx("fa-epf", "EPF", "Employees' Provident Fund (EPF)", "EPFO", 780000, 902400, 108000, "Retirement", "Locked"),
    fx("fa-nps", "NPS", "National Pension System (NPS Tier 1)", "HDFC Pension (NSDL)", 240000, 288900, 50000, "Age 60", "Semi-Liquid"),
    fx("fa-fd", "FD", "Bank Fixed Deposit (FD)", "HDFC Bank", 50000, 50000, 0, addMonths(monthStart, 8).slice(0, 8) + "15", "Semi-Liquid"),
    fx("fa-sgb", "SGB", "Sovereign Gold Bond (SGB)", "RBI (Zerodha)", 60000, 91200, 0, addMonths(monthStart, 50).slice(0, 8) + "01", "Semi-Liquid"),
    fx("fa-gold", "Gold", "Digital Gold (24K)", "MMTC-PAMP", 30000, 37000, 0, "Anytime", "Highly Liquid"),
    fx("fa-silver", "Silver", "Silver (ETF and Bullion)", "ICICI Prudential Silver ETF", 20000, 24600, 0, "Anytime", "Highly Liquid"),
  ];

  const balanceAssets: BalanceAsset[] = [
    { id: "b-cash", userId: USER, name: "Bank savings and liquid cash", kind: "Cash", value: 185000 },
    { id: "b-flat", userId: USER, name: "Residential property (flat)", kind: "RealEstate", value: 7500000 },
    { id: "b-car", userId: USER, name: "Personal vehicle (estimated)", kind: "Vehicle", value: 420000 },
  ];

  const liabilities: Liability[] = [
    { id: "l-card", userId: USER, name: "Credit card outstanding", lender: "HDFC Bank", outstanding: 0 },
    { id: "l-personal", userId: USER, name: "Personal loan", lender: "IOB", outstanding: 52000 },
    { id: "l-home", userId: USER, name: "Home loan (principal)", lender: "SBI Home Loan", outstanding: 2350000 },
  ];

  const goals: Goal[] = [
    {
      id: "g-crore",
      userId: USER,
      name: "1 Crore investment corpus",
      target: 10_000_000,
      targetDate: addMonths(monthStart, 111).slice(0, 4) + "-12-31",
      expectedReturn: 0.12,
      monthlySip: 35000,
    },
  ];

  // Nine months of snapshots leading up to last month, gently rising.
  const snapshots: Snapshot[] = [];
  for (let k = 9; k >= 1; k--) {
    const f = 1 - k * 0.011;
    snapshots.push({
      id: `snap-${k}`,
      userId: USER,
      month: addMonths(monthStart, -k),
      totalAssets: Math.round(10_900_000 * f),
      totalLiabilities: Math.round(2_460_000 * (1 + k * 0.004)),
      netWorth: Math.round(10_900_000 * f) - Math.round(2_460_000 * (1 + k * 0.004)),
      investmentValue: Math.round(3_180_000 * f),
    });
  }

  const reviewItems: ReviewItem[] = [
    { id: "r1", action: "Verify mutual fund SIP debits", timeline: "1st to 5th", focus: "SIP completed", done: true },
    { id: "r2", action: "Refresh stock prices and valuations", timeline: "10th to 15th", focus: "Investments updated", done: true },
    { id: "r3", action: "Log EPF, PPF and NPS balances", timeline: "15th to 20th", focus: "Other assets in sync", done: false },
    { id: "r4", action: "Review EMI and debt reduction", timeline: "20th to 25th", focus: "Debt reduced", done: false },
    { id: "r5", action: "Pay credit card statement in full", timeline: "25th", focus: "Zero penalty", done: true },
    { id: "r6", action: "Check progress on the 1 Crore goal", timeline: "28th", focus: "Goal progress checked", done: true },
    { id: "r7", action: "Take the month-end wealth snapshot", timeline: "Last day", focus: "Snapshot logged", done: true },
  ];

  const reviewNotes: ReviewNote[] = [
    { id: "n1", category: "Key wins", text: "All four SIPs debited on time for the seventh month running." },
    { id: "n2", category: "Improvements", text: "Small-cap allocation is creeping up. Rebalance before the next SIP cycle." },
    { id: "n3", category: "Next actions", text: "Increase the Nifty 50 index SIP by 2,000 after the salary revision." },
  ];

  return {
    version: 1,
    userId: USER,
    funds,
    fundTxns,
    stockTxns,
    quotes,
    fixedAssets,
    balanceAssets,
    liabilities,
    goals,
    snapshots,
    reviewItems,
    reviewNotes,
  };
}
