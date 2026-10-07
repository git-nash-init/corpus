import type { InsertRow, Row } from "@/lib/supabase/database.types";
import type {
  BalanceAsset,
  BalanceAssetKind,
  DocumentKind,
  DocumentRecord,
  FixedAsset,
  FixedAssetKind,
  Fund,
  FundCategory,
  FundTxn,
  FundTxnType,
  Goal,
  LiquidityTag,
  LinkedType,
  Liability,
  Profile,
  ReviewItem,
  ReviewNote,
  SipStatus,
  Snapshot,
  StockQuote,
  StockTxn,
  ThemePref,
  Sector,
} from "./types";

// Rows come back from PostgREST with numerics as JSON numbers and dates as YYYY-MM-DD strings.

export const fundFromRow = (r: Row<"funds">): Fund => ({
  id: r.id,
  userId: r.user_id,
  name: r.name,
  category: r.category as FundCategory,
  amfiCode: r.amfi_code ?? undefined,
  sipAmount: Number(r.sip_amount),
  sipDay: r.sip_day,
  sipStatus: r.sip_status as SipStatus,
  latestNav: Number(r.latest_nav),
  navDate: r.nav_date,
  manualValue: r.manual_value === null ? undefined : Number(r.manual_value),
});

export const fundToRow = (f: Fund): InsertRow<"funds"> => ({
  id: f.id,
  name: f.name,
  category: f.category,
  amfi_code: f.amfiCode ?? null,
  sip_amount: f.sipAmount,
  sip_day: f.sipDay,
  sip_status: f.sipStatus,
  latest_nav: f.latestNav,
  nav_date: f.navDate,
  manual_value: f.manualValue ?? null,
});

export const fundTxnFromRow = (r: Row<"fund_txns">): FundTxn => ({
  id: r.id,
  userId: r.user_id,
  fundId: r.fund_id,
  date: r.date,
  type: r.type as FundTxnType,
  amount: Number(r.amount),
  nav: Number(r.nav),
});

export const fundTxnToRow = (t: FundTxn): InsertRow<"fund_txns"> => ({
  id: t.id,
  fund_id: t.fundId,
  date: t.date,
  type: t.type,
  amount: t.amount,
  nav: t.nav,
});

export const stockTxnFromRow = (r: Row<"stock_txns">): StockTxn => ({
  id: r.id,
  userId: r.user_id,
  ticker: r.ticker,
  date: r.date,
  type: r.type as "Buy" | "Sell",
  quantity: Number(r.quantity),
  price: Number(r.price),
});

export const stockTxnToRow = (t: StockTxn): InsertRow<"stock_txns"> => ({
  id: t.id,
  ticker: t.ticker,
  date: t.date,
  type: t.type,
  quantity: t.quantity,
  price: t.price,
});

export const quoteFromRow = (r: Row<"stock_quotes">): StockQuote => ({
  ticker: r.ticker,
  name: r.name,
  sector: r.sector as Sector,
  cmp: Number(r.cmp),
  asOf: r.as_of,
});

export const quoteToRow = (q: StockQuote): InsertRow<"stock_quotes"> => ({
  ticker: q.ticker,
  name: q.name,
  sector: q.sector,
  cmp: q.cmp,
  as_of: q.asOf ?? new Date().toISOString(),
});

export const fixedAssetFromRow = (r: Row<"fixed_assets">): FixedAsset => ({
  id: r.id,
  userId: r.user_id,
  kind: r.kind as FixedAssetKind,
  name: r.name,
  provider: r.provider,
  invested: Number(r.invested),
  currentValue: Number(r.current_value),
  annualContribution: Number(r.annual_contribution),
  maturity: r.maturity,
  liquidity: r.liquidity as LiquidityTag,
});

export const fixedAssetToRow = (a: FixedAsset): InsertRow<"fixed_assets"> => ({
  id: a.id,
  kind: a.kind,
  name: a.name,
  provider: a.provider,
  invested: a.invested,
  current_value: a.currentValue,
  annual_contribution: a.annualContribution,
  maturity: a.maturity,
  liquidity: a.liquidity,
});

export const balanceAssetFromRow = (r: Row<"balance_assets">): BalanceAsset => ({
  id: r.id,
  userId: r.user_id,
  name: r.name,
  kind: r.kind as BalanceAssetKind,
  value: Number(r.value),
});

export const balanceAssetToRow = (a: BalanceAsset): InsertRow<"balance_assets"> => ({
  id: a.id,
  name: a.name,
  kind: a.kind,
  value: a.value,
});

export const liabilityFromRow = (r: Row<"liabilities">): Liability => ({
  id: r.id,
  userId: r.user_id,
  name: r.name,
  lender: r.lender,
  outstanding: Number(r.outstanding),
});

export const liabilityToRow = (l: Liability): InsertRow<"liabilities"> => ({
  id: l.id,
  name: l.name,
  lender: l.lender,
  outstanding: l.outstanding,
});

export const goalFromRow = (r: Row<"goals">): Goal => ({
  id: r.id,
  userId: r.user_id,
  name: r.name,
  target: Number(r.target),
  targetDate: r.target_date,
  expectedReturn: Number(r.expected_return),
  monthlySip: Number(r.monthly_sip),
});

export const goalToRow = (g: Goal): InsertRow<"goals"> => ({
  id: g.id,
  name: g.name,
  target: g.target,
  target_date: g.targetDate,
  expected_return: g.expectedReturn,
  monthly_sip: g.monthlySip,
});

export const snapshotFromRow = (r: Row<"snapshots">): Snapshot => ({
  id: r.id,
  userId: r.user_id,
  month: r.month,
  totalAssets: Number(r.total_assets),
  totalLiabilities: Number(r.total_liabilities),
  netWorth: Number(r.net_worth),
  investmentValue: Number(r.investment_value),
});

export const snapshotToRow = (s: Snapshot): InsertRow<"snapshots"> => ({
  month: s.month,
  total_assets: s.totalAssets,
  total_liabilities: s.totalLiabilities,
  net_worth: s.netWorth,
  investment_value: s.investmentValue,
});

export const reviewItemFromRow = (r: Row<"review_items">): ReviewItem => ({
  id: r.id,
  position: r.position,
  action: r.action,
  timeline: r.timeline,
  focus: r.focus,
  done: r.done,
});

export const reviewNoteFromRow = (r: Row<"review_notes">): ReviewNote => ({
  id: r.id,
  category: r.category as ReviewNote["category"],
  text: r.text,
});

export const reviewNoteToRow = (n: ReviewNote): InsertRow<"review_notes"> => ({
  id: n.id,
  category: n.category,
  text: n.text,
});

export const documentFromRow = (r: Row<"documents">): DocumentRecord => ({
  id: r.id,
  storagePath: r.storage_path,
  fileName: r.file_name,
  mime: r.mime,
  size: Number(r.size),
  kind: r.kind as DocumentKind,
  linkedType: (r.linked_type as LinkedType | null) ?? null,
  linkedId: r.linked_id,
  createdAt: r.created_at,
});

export const profileFromRow = (r: Row<"profiles">, email: string): Profile => ({
  id: r.id,
  email,
  displayName: r.display_name,
  avatar: r.avatar,
  theme: (r.theme as ThemePref) ?? "system",
  onboardedAt: r.onboarded_at,
});
