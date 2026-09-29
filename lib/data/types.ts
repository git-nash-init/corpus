// Domain types. Every record carries userId so the shape maps 1:1 to Supabase tables with RLS in phase 2.
export type ISODate = string; // YYYY-MM-DD

export type FundCategory = "Equity" | "Debt" | "Hybrid" | "Index" | "Other";
export type SipStatus = "Active" | "Paused" | "Stopped";
export type FundTxnType = "SIP" | "Lumpsum" | "Redemption";

export interface Fund {
  id: string;
  userId: string;
  name: string;
  category: FundCategory;
  sipAmount: number; // monthly, rupees
  sipDay: number; // day of month for debit
  sipStatus: SipStatus;
  latestNav: number;
  navDate: ISODate;
  /** When set, replaces units x NAV for current value. */
  manualValue?: number;
}

export interface FundTxn {
  id: string;
  userId: string;
  fundId: string;
  date: ISODate;
  type: FundTxnType;
  amount: number;
  nav: number; // NAV on the transaction date; units = amount / nav
}

export const SECTORS = [
  "Banking & Finance",
  "IT Services",
  "Energy & Retail",
  "Infrastructure",
  "FMCG",
  "Healthcare",
  "Auto",
  "Metals",
  "Capital Goods",
  "Telecom",
  "Chemicals",
  "Consumer Tech",
] as const;
export type Sector = (typeof SECTORS)[number];

export interface StockTxn {
  id: string;
  userId: string;
  ticker: string;
  date: ISODate;
  type: "Buy" | "Sell";
  quantity: number;
  price: number;
}

export interface StockQuote {
  ticker: string;
  name: string;
  sector: Sector;
  cmp: number;
}

export type LiquidityTag = "Locked" | "Semi-Liquid" | "Highly Liquid";
export type FixedAssetKind = "PPF" | "EPF" | "NPS" | "FD" | "SGB" | "Gold" | "Silver";

export interface FixedAsset {
  id: string;
  userId: string;
  kind: FixedAssetKind;
  name: string;
  provider: string;
  invested: number;
  currentValue: number;
  annualContribution: number;
  maturity: string; // ISO date or free text such as "Age 60"
  liquidity: LiquidityTag;
}

export type BalanceAssetKind = "Cash" | "RealEstate" | "Vehicle" | "Other";
export interface BalanceAsset {
  id: string;
  userId: string;
  name: string;
  kind: BalanceAssetKind;
  value: number;
}

export interface Liability {
  id: string;
  userId: string;
  name: string;
  lender: string;
  outstanding: number;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  target: number;
  targetDate: ISODate;
  expectedReturn: number; // annual, e.g. 0.12
  monthlySip: number;
}

export interface Snapshot {
  id: string;
  userId: string;
  month: ISODate; // first of month
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  investmentValue: number;
}
