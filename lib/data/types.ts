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
  /** AMFI scheme code, used to fetch live NAVs. */
  amfiCode?: string;
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
  "Other",
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
  /** ISO timestamp of the last price update. */
  asOf?: string;
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

export interface ReviewItem {
  id: string;
  position: number;
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

export const DOCUMENT_KINDS = ["Statement", "Contract note", "FD receipt", "Import", "Other"] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];
export type LinkedType = "fund" | "stock" | "fixed_asset" | "liability" | "balance_asset";

export interface DocumentRecord {
  id: string;
  storagePath: string;
  fileName: string;
  mime: string;
  size: number;
  kind: DocumentKind;
  linkedType: LinkedType | null;
  linkedId: string | null;
  createdAt: string;
}

export type ThemePref = "system" | "light" | "dark";

export interface Profile {
  id: string;
  email: string;
  displayName: string | null;
  avatar: string | null; // "preset:<key>" or a storage path in the avatars bucket
  theme: ThemePref;
  onboardedAt: string | null;
}

/** Everything one user owns. The engine derives every figure from this. */
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
  documents: DocumentRecord[];
}
