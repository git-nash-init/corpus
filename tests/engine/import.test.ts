import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import { parseInvestmentTracker } from "@/lib/import/spreadsheet";
import { categoryFromScheme, isoFromMfDate, navOnOrBefore } from "@/lib/market/nav";

/** A small workbook with the original sheet's layout, so the parser is tested without the personal file. */
function syntheticWorkbook() {
  const wb = new ExcelJS.Workbook();
  const mf = wb.addWorksheet("Mutual Funds + SIP");
  mf.getCell("B9").value = "Nippon Large cap";
  mf.getCell("D9").value = "Equity";
  mf.getCell("F9").value = 1000;
  mf.getCell("H9").value = 1010;
  mf.getCell("N9").value = { formula: "IF(F9>0,\"Active\",\"Paused\")", result: "Active" };
  mf.getCell("B36").value = new Date(Date.UTC(2026, 7, 11));
  mf.getCell("C36").value = "Nippon Large cap";
  mf.getCell("G36").value = "SIP";
  mf.getCell("H36").value = 1000;
  mf.getCell("B37").value = new Date(Date.UTC(2026, 8, 1));
  mf.getCell("C37").value = "Unlisted Fund";
  mf.getCell("G37").value = "Lumpsum";
  mf.getCell("H37").value = 5000;
  mf.getCell("B38").value = new Date(Date.UTC(2026, 8, 2));
  mf.getCell("C38").value = "Nippon Large cap"; // missing amount
  const st = wb.addWorksheet("Stocks");
  st.getCell("A8").value = "HDFCBANK";
  st.getCell("G8").value = { formula: "GOOGLEFINANCE()", result: 715.4 };
  st.getCell("A23").value = new Date(Date.UTC(2026, 7, 8));
  st.getCell("B23").value = "HDFCBANK";
  st.getCell("D23").value = "Buy";
  st.getCell("E23").value = 30;
  st.getCell("F23").value = 745;
  st.getCell("A24").value = new Date(Date.UTC(2026, 7, 9));
  st.getCell("B24").value = "INFY";
  st.getCell("D24").value = "Buy";
  st.getCell("E24").value = 10;
  st.getCell("F24").value = 349;
  const oa = wb.addWorksheet("Other Assets");
  oa.getCell("A11").value = "Bank Fixed Deposit (FD)";
  oa.getCell("B11").value = "HDFC Bank";
  oa.getCell("C11").value = 50000;
  oa.getCell("D11").value = 50000;
  oa.getCell("H11").value = "Semi-Liquid";
  oa.getCell("A8").value = "Public Provident Fund (PPF)"; // empty placeholder row
  const nw = wb.addWorksheet("Net Worth");
  nw.getCell("A7").value = "Bank Savings & Liquid Cash";
  nw.getCell("C7").value = 25000;
  nw.getCell("A16").value = "Residential Property (Flat)";
  nw.getCell("C16").value = 7500000;
  nw.getCell("E8").value = "Personal Loan";
  nw.getCell("F8").value = "IOB";
  nw.getCell("G8").value = 52000;
  const gl = wb.addWorksheet("Goals");
  gl.getCell("B10").value = 10000000;
  gl.getCell("D10").value = new Date(Date.UTC(2030, 11, 31));
  gl.getCell("G10").value = { formula: "x", result: 3500 };
  return wb;
}

describe("parseInvestmentTracker (synthetic workbook)", () => {
  const plan = parseInvestmentTracker(syntheticWorkbook());

  it("reads funds, including funds that appear only in the log", () => {
    expect(plan.funds.map((f) => f.name)).toEqual(["Nippon Large cap", "Unlisted Fund"]);
    expect(plan.funds[0]).toMatchObject({ category: "Equity", sipAmount: 1000, sipStatus: "Active", sheetValue: 1010 });
  });
  it("reads fund transactions and skips incomplete rows with a warning", () => {
    expect(plan.fundTxns).toEqual([
      { fundName: "Nippon Large cap", date: "2026-08-11", type: "SIP", amount: 1000 },
      { fundName: "Unlisted Fund", date: "2026-09-01", type: "Lumpsum", amount: 5000 },
    ]);
    expect(plan.warnings.some((w) => w.includes("row 38"))).toBe(true);
  });
  it("reads stock trades and the cached price of a formula cell", () => {
    expect(plan.stockTxns).toHaveLength(2);
    expect(plan.stockTxns[0]).toEqual({ ticker: "HDFCBANK", date: "2026-08-08", type: "Buy", quantity: 30, price: 745 });
    expect(plan.quotes.find((q) => q.ticker === "HDFCBANK")).toMatchObject({ cmp: 715.4, sector: "Banking & Finance" });
  });
  it("flags traded tickers that have no price", () => {
    expect(plan.quotes.find((q) => q.ticker === "INFY")?.cmp).toBe(0);
    expect(plan.warnings.some((w) => w.includes("INFY"))).toBe(true);
  });
  it("skips empty template rows in other assets", () => {
    expect(plan.fixedAssets).toHaveLength(1);
    expect(plan.fixedAssets[0]).toMatchObject({ kind: "FD", invested: 50000, liquidity: "Semi-Liquid" });
  });
  it("reads balance sheet, liabilities and the goal", () => {
    expect(plan.balanceAssets).toEqual([
      { name: "Bank Savings & Liquid Cash", kind: "Cash", value: 25000 },
      { name: "Residential Property (Flat)", kind: "RealEstate", value: 7500000 },
    ]);
    expect(plan.liabilities).toEqual([{ name: "Personal Loan", lender: "IOB", outstanding: 52000 }]);
    expect(plan.goal).toMatchObject({ target: 10000000, targetDate: "2030-12-31", monthlySip: 3500 });
  });
  it("warns when the file is not the tracker", () => {
    const empty = parseInvestmentTracker(new ExcelJS.Workbook());
    expect(empty.warnings.some((w) => w.includes("Nothing recognisable"))).toBe(true);
  });
});

// The personal workbook is not in the repository, so this only runs on the author's machine.
const REAL = path.resolve(__dirname, "../../../Investment Tracker.xlsx");
describe.skipIf(!existsSync(REAL))("parseInvestmentTracker (the original workbook)", () => {
  it("imports what the sheet's own cached figures show", async () => {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(readFileSync(REAL) as unknown as ArrayBuffer);
    const plan = parseInvestmentTracker(wb);
    expect(plan.funds.map((f) => f.name)).toEqual(expect.arrayContaining(["HDFC Mid Cap Fund Growth", "Invesco India Small Cap Fund Growth"]));
    expect(plan.fundTxns).toHaveLength(5);
    expect(plan.fundTxns.reduce((s, t) => s + t.amount, 0)).toBe(6000);
    expect(plan.stockTxns).toHaveLength(3);
    expect(plan.stockTxns.reduce((s, t) => s + t.quantity * t.price, 0)).toBe(38080);
    expect(plan.fixedAssets.map((a) => a.kind).sort()).toEqual(["FD", "Gold"]);
    expect(plan.balanceAssets.some((a) => a.kind === "RealEstate" && a.value === 7500000)).toBe(true);
    expect(plan.liabilities.reduce((s, l) => s + l.outstanding, 0)).toBe(59000);
    expect(plan.goal?.target).toBe(10000000);
  });
});

describe("NAV lookup", () => {
  const hist = [
    { date: "2026-08-07", nav: 100 },
    { date: "2026-08-08", nav: 101 },
    { date: "2026-08-11", nav: 103 },
  ];
  it("uses the NAV on the date, or the most recent one before it", () => {
    expect(navOnOrBefore(hist, "2026-08-11")?.nav).toBe(103);
    expect(navOnOrBefore(hist, "2026-08-09")?.nav).toBe(101); // Sunday uses Friday
    expect(navOnOrBefore(hist, "2027-01-01")?.nav).toBe(103);
  });
  it("is null before the fund existed and for empty history", () => {
    expect(navOnOrBefore(hist, "2026-08-01")).toBeNull();
    expect(navOnOrBefore([], "2026-08-01")).toBeNull();
  });
  it("converts mfapi dates", () => {
    expect(isoFromMfDate("06-10-2026")).toBe("2026-10-06");
  });
  it("maps AMFI categories", () => {
    expect(categoryFromScheme("Equity Scheme - Mid Cap Fund")).toBe("Equity");
    expect(categoryFromScheme("Other Scheme - Index Funds")).toBe("Index");
    expect(categoryFromScheme("Debt Scheme - Liquid Fund")).toBe("Debt");
    expect(categoryFromScheme("Hybrid Scheme - Aggressive Hybrid Fund")).toBe("Hybrid");
    expect(categoryFromScheme("Solution Oriented Scheme - Retirement Fund")).toBe("Other");
  });
});

import { buildRecords, PLACEHOLDER_NAV, type SchemeMatch } from "@/lib/import/build";

describe("buildRecords", () => {
  const plan = parseInvestmentTracker(syntheticWorkbook());
  let n = 0;
  const newId = () => `id-${++n}`;
  const match: SchemeMatch = {
    code: "100001",
    name: "Nippon India Large Cap Fund - Direct Plan - Growth",
    latest: { date: "2026-10-06", nav: 110 },
    history: [
      { date: "2026-08-10", nav: 100 },
      { date: "2026-08-11", nav: 102 },
    ],
  };
  const built = buildRecords(plan, new Map([["Nippon Large cap", match], ["Unlisted Fund", null]]), "u1", "2026-10-07", newId);

  it("uses the NAV in force on each transaction date and the scheme's own name and code", () => {
    const f = built.funds.find((x) => x.amfiCode === "100001")!;
    expect(f.name).toBe(match.name);
    expect(f.latestNav).toBe(110);
    const t = built.fundTxns.find((x) => x.fundId === f.id)!;
    expect(t.nav).toBe(102); // 11 Aug
  });
  it("keeps unmatched funds on the sheet's value with a placeholder NAV, and says so", () => {
    const f = built.funds.find((x) => x.name === "Unlisted Fund")!;
    expect(f.latestNav).toBe(PLACEHOLDER_NAV);
    expect(built.fundTxns.find((x) => x.fundId === f.id)!.nav).toBe(PLACEHOLDER_NAV);
    expect(built.notes.some((x) => x.includes("Unlisted Fund"))).toBe(true);
  });
  it("moves a goal date that is already past", () => {
    expect(built.goals[0].targetDate).toBe("2030-12-31");
    const past = buildRecords({ ...plan, goal: { ...plan.goal!, targetDate: "2020-01-01" } }, new Map(), "u1", "2026-10-07", newId);
    expect(past.goals[0].targetDate).toBe("2036-12-31");
    expect(past.notes.some((x) => x.includes("target date"))).toBe(true);
  });
  it("assigns every record to the user", () => {
    expect(built.stockTxns.every((t) => t.userId === "u1")).toBe(true);
    expect(built.fixedAssets.every((t) => t.userId === "u1")).toBe(true);
  });
});
