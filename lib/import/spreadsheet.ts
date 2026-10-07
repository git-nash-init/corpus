import type { Workbook, Worksheet, CellValue } from "exceljs";
import { STOCK_DIRECTORY } from "@/lib/data/stock-directory";
import type { FixedAssetKind, FundCategory, LiquidityTag, Sector, SipStatus } from "@/lib/data/types";

// Reads the layout of the original "Investment Tracker" Google Sheet. Positions are the sheet's own.

export interface ImportedFund {
  name: string;
  category: FundCategory;
  sipAmount: number;
  sipStatus: SipStatus;
  /** The sheet's hand typed current value. Used as a manual value when no live scheme can be matched. */
  sheetValue: number | null;
}
export interface ImportedFundTxn {
  fundName: string;
  date: string;
  type: "SIP" | "Lumpsum";
  amount: number;
}
export interface ImportedStockTxn {
  ticker: string;
  date: string;
  type: "Buy" | "Sell";
  quantity: number;
  price: number;
}
export interface ImportedQuote {
  ticker: string;
  name: string;
  sector: Sector;
  cmp: number;
}
export interface ImportedFixedAsset {
  kind: FixedAssetKind;
  name: string;
  provider: string;
  invested: number;
  currentValue: number;
  annualContribution: number;
  maturity: string;
  liquidity: LiquidityTag;
}
export interface ImportedBalanceAsset {
  name: string;
  kind: "Cash" | "RealEstate" | "Vehicle" | "Other";
  value: number;
}
export interface ImportedLiability {
  name: string;
  lender: string;
  outstanding: number;
}
export interface ImportedGoal {
  name: string;
  target: number;
  targetDate: string | null;
  monthlySip: number;
}

export interface ImportPlan {
  funds: ImportedFund[];
  fundTxns: ImportedFundTxn[];
  stockTxns: ImportedStockTxn[];
  quotes: ImportedQuote[];
  fixedAssets: ImportedFixedAsset[];
  balanceAssets: ImportedBalanceAsset[];
  liabilities: ImportedLiability[];
  goal: ImportedGoal | null;
  warnings: string[];
}

const FUND_CATEGORIES: FundCategory[] = ["Equity", "Debt", "Hybrid", "Index", "Other"];

function raw(v: CellValue): unknown {
  if (v && typeof v === "object" && !(v instanceof Date)) {
    if ("result" in v) return (v as { result?: unknown }).result;
    if ("richText" in v) return (v as { richText: { text: string }[] }).richText.map((r) => r.text).join("");
    if ("text" in v) return (v as { text: string }).text;
    if ("error" in v) return null;
  }
  return v;
}

const text = (ws: Worksheet, addr: string): string => {
  const v = raw(ws.getCell(addr).value);
  return v === null || v === undefined ? "" : String(v).replace(/ /g, " ").trim();
};
const num = (ws: Worksheet, addr: string): number | null => {
  const v = raw(ws.getCell(addr).value);
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v.replace(/[,₹]/g, "")))) return Number(v.replace(/[,₹]/g, ""));
  return null;
};
const date = (ws: Worksheet, addr: string): string | null => {
  const v = raw(ws.getCell(addr).value);
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  return null;
};

/** Finds a sheet by a distinctive word in its name, ignoring the emoji prefixes the original uses. */
function sheet(wb: Workbook, ...keys: string[]): Worksheet | undefined {
  return wb.worksheets.find((w) => keys.every((k) => w.name.toLowerCase().includes(k.toLowerCase())));
}

const SECTOR_MAP: Record<string, Sector> = {
  Automobile: "Auto",
  "Capital Goods": "Capital Goods",
  "Capital Goods & Defense": "Capital Goods",
  "Capital Goods & Industrial": "Capital Goods",
  Chemicals: "Chemicals",
  "Consumer Durables": "FMCG",
  "Consumer Goods": "FMCG",
  "Energy & Oil": "Energy & Retail",
  "Energy & Power": "Energy & Retail",
  "Healthcare & Pharma": "Healthcare",
  Materials: "Metals",
  "Metals & Mining": "Metals",
  "Mining & Resources": "Metals",
  "Technology & Consumer": "Consumer Tech",
  Telecommunications: "Telecom",
};

function mapKind(name: string): FixedAssetKind | null {
  const n = name.toLowerCase();
  if (n.includes("ppf") || n.includes("public provident")) return "PPF";
  if (n.includes("epf") || n.includes("employees")) return "EPF";
  if (n.includes("nps") || n.includes("pension")) return "NPS";
  if (n.includes("fixed deposit") || /\bfd\b/.test(n)) return "FD";
  if (n.includes("sovereign") || n.includes("sgb")) return "SGB";
  if (n.includes("silver")) return "Silver";
  if (n.includes("gold")) return "Gold";
  return null;
}

function mapLiquidity(s: string): LiquidityTag {
  const n = s.toLowerCase();
  if (n.includes("highly")) return "Highly Liquid";
  if (n.includes("semi")) return "Semi-Liquid";
  return "Locked";
}

export function parseInvestmentTracker(wb: Workbook): ImportPlan {
  const plan: ImportPlan = { funds: [], fundTxns: [], stockTxns: [], quotes: [], fixedAssets: [], balanceAssets: [], liabilities: [], goal: null, warnings: [] };

  // Mutual funds: holdings B9:N14, transaction log from row 36.
  const mf = sheet(wb, "mutual");
  if (mf) {
    for (let r = 9; r <= 14; r++) {
      const name = text(mf, `B${r}`);
      if (!name) continue;
      const cat = text(mf, `D${r}`) as FundCategory;
      const sip = num(mf, `F${r}`) ?? 0;
      const status = text(mf, `N${r}`).toLowerCase();
      plan.funds.push({
        name,
        category: FUND_CATEGORIES.includes(cat) ? cat : "Other",
        sipAmount: sip,
        sipStatus: status.includes("paused") ? "Paused" : status.includes("stopped") ? "Stopped" : sip > 0 ? "Active" : "Stopped",
        sheetValue: num(mf, `H${r}`),
      });
    }
    const known = new Map(plan.funds.map((f) => [f.name.toLowerCase(), f.name]));
    for (let r = 36; r <= mf.rowCount && r < 2000; r++) {
      const d = date(mf, `B${r}`);
      const name = text(mf, `C${r}`);
      const amount = num(mf, `H${r}`);
      if (!d && !name && amount === null) continue;
      if (!d || !name || amount === null || amount <= 0) {
        plan.warnings.push(`Mutual fund log row ${r} is incomplete and was skipped.`);
        continue;
      }
      const canonical = known.get(name.toLowerCase());
      if (!canonical) {
        plan.funds.push({ name, category: (FUND_CATEGORIES.includes(text(mf, `F${r}`) as FundCategory) ? text(mf, `F${r}`) : "Other") as FundCategory, sipAmount: 0, sipStatus: "Stopped", sheetValue: null });
        known.set(name.toLowerCase(), name);
      }
      plan.fundTxns.push({ fundName: canonical ?? name, date: d, type: text(mf, `G${r}`).toLowerCase() === "lumpsum" ? "Lumpsum" : "SIP", amount });
    }
  } else {
    plan.warnings.push("No Mutual Funds sheet was found.");
  }

  // Stocks: trade log from row 23 (A date, B ticker, D type, E quantity, F price), prices in holdings G8:G14.
  const st = sheet(wb, "stocks");
  const directory = new Map(STOCK_DIRECTORY.map((e) => [e.ticker.toUpperCase(), e]));
  if (st) {
    for (let r = 23; r <= st.rowCount && r < 2000; r++) {
      const d = date(st, `A${r}`);
      const ticker = text(st, `B${r}`).toUpperCase();
      const qty = num(st, `E${r}`);
      const price = num(st, `F${r}`);
      if (!d && !ticker && qty === null) continue;
      const type = text(st, `D${r}`).toLowerCase();
      if (!d || !ticker || !qty || qty <= 0 || !price || price <= 0 || (type !== "buy" && type !== "sell")) {
        plan.warnings.push(`Stock log row ${r} is incomplete and was skipped.`);
        continue;
      }
      plan.stockTxns.push({ ticker, date: d, type: type === "buy" ? "Buy" : "Sell", quantity: qty, price });
    }
    for (let r = 8; r <= 14; r++) {
      const ticker = text(st, `A${r}`).toUpperCase();
      const cmp = num(st, `G${r}`);
      if (!ticker || !cmp || cmp <= 0) continue;
      const entry = directory.get(ticker);
      plan.quotes.push({ ticker, name: entry?.name ?? ticker, sector: (entry?.sector as Sector | undefined) ?? SECTOR_MAP[text(st, `C${r}`)] ?? "Other", cmp });
    }
    const traded = new Set(plan.stockTxns.map((t) => t.ticker));
    for (const t of traded) {
      if (!plan.quotes.some((q) => q.ticker === t)) {
        const entry = directory.get(t);
        plan.quotes.push({ ticker: t, name: entry?.name ?? t, sector: (entry?.sector as Sector | undefined) ?? "Other", cmp: 0 });
        plan.warnings.push(`${t} has no price in the sheet. It will be priced from live data after import.`);
      }
    }
  } else {
    plan.warnings.push("No Stocks sheet was found.");
  }

  // Other assets rows 8-14.
  const oa = sheet(wb, "other", "assets");
  if (oa) {
    for (let r = 8; r <= 14; r++) {
      const name = text(oa, `A${r}`);
      const kind = mapKind(name);
      const invested = num(oa, `C${r}`) ?? 0;
      const current = num(oa, `D${r}`) ?? 0;
      if (!name || !kind) continue;
      if (invested === 0 && current === 0) continue; // empty placeholder rows in the template
      plan.fixedAssets.push({
        kind,
        name,
        provider: text(oa, `B${r}`),
        invested,
        currentValue: current,
        annualContribution: num(oa, `F${r}`) ?? 0,
        maturity: text(oa, `G${r}`),
        liquidity: mapLiquidity(text(oa, `H${r}`)),
      });
    }
  }

  // Net worth: cash and property/vehicle rows are typed in; investments come from the other sheets.
  const nw = sheet(wb, "net worth");
  if (nw) {
    for (const [row, kind] of [[7, "Cash"], [16, "RealEstate"], [17, "Vehicle"]] as const) {
      const name = text(nw, `A${row}`);
      const value = num(nw, `C${row}`);
      if (name && value && value > 0) plan.balanceAssets.push({ name, kind, value });
    }
    for (let r = 7; r <= 12; r++) {
      const name = text(nw, `E${r}`);
      const amount = num(nw, `G${r}`);
      if (name && amount && amount > 0) plan.liabilities.push({ name, lender: text(nw, `F${r}`), outstanding: amount });
    }
  }

  const gl = sheet(wb, "goals");
  if (gl) {
    const target = num(gl, "B10");
    if (target && target > 0) plan.goal = { name: "1 Crore investment corpus", target, targetDate: date(gl, "D10"), monthlySip: num(gl, "G10") ?? 0 };
  }

  if (!plan.funds.length && !plan.stockTxns.length && !plan.fixedAssets.length && !plan.balanceAssets.length) {
    plan.warnings.push("Nothing recognisable was found. Is this the Investment Tracker spreadsheet?");
  }
  return plan;
}

/** Parses an uploaded .xlsx. exceljs is loaded on demand because it is large. */
export async function parseWorkbookFile(buffer: ArrayBuffer): Promise<ImportPlan> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  return parseInvestmentTracker(wb);
}
