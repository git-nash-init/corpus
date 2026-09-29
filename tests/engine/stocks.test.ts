import { describe, it, expect } from "vitest";
import { stockPositions, stockTotals, sectorAllocation, tradeSummary } from "@/lib/engine/stocks";
import { SECTORS, type StockTxn, type StockQuote } from "@/lib/data/types";

const TODAY = "2026-09-29";
const t = (id: string, ticker: string, date: string, type: "Buy" | "Sell", quantity: number, price: number): StockTxn => ({
  id, userId: "u", ticker, date, type, quantity, price,
});
const quotes: StockQuote[] = [
  { ticker: "HDFCBANK", name: "HDFC Bank", sector: "Banking & Finance", cmp: 715.4 },
  { ticker: "TATAPOWER", name: "Tata Power", sector: "Energy & Retail", cmp: 357.25 },
  { ticker: "INFY", name: "Infosys", sector: "IT Services", cmp: 987.9 },
  { ticker: "TCS", name: "Tata Consultancy Services", sector: "IT Services", cmp: 2046.8 },
];
const sheetTxns = [
  t("1", "HDFCBANK", "2026-08-08", "Buy", 30, 745),
  t("2", "TATAPOWER", "2026-09-09", "Buy", 25, 350),
  t("3", "INFY", "2026-08-10", "Buy", 20, 349),
];

describe("stockPositions (sheet fixtures)", () => {
  const pos = stockPositions(sheetTxns, quotes, TODAY);
  const totals = stockTotals(pos);
  it("HDFCBANK", () => {
    const p = pos.find((x) => x.ticker === "HDFCBANK")!;
    expect(p.quantity).toBe(30);
    expect(p.avgCost).toBe(745);
    expect(p.invested).toBe(22350);
    expect(p.currentValue).toBeCloseTo(21462, 6);
    expect(p.gain).toBeCloseTo(-888, 6);
    expect(p.absReturn).toBeCloseTo(-0.03973154, 6);
    expect(p.xirr! * 100).toBeCloseTo(-24.77, 2);
    expect(p.weight).toBeCloseTo(0.427945, 5);
  });
  it("portfolio totals: invested 38,080, value 50,151.25, gain 12,071.25", () => {
    expect(totals.invested).toBe(38080);
    expect(totals.currentValue).toBeCloseTo(50151.25, 6);
    expect(totals.gain).toBeCloseTo(12071.25, 6);
    expect(totals.absReturn).toBeCloseTo(0.316997, 5);
    expect(totals.holdings).toBe(3);
  });
  it("weights sum to 1", () => {
    expect(pos.reduce((s, p) => s + p.weight, 0)).toBeCloseTo(1, 9);
  });
});

describe("moving average cost and realised P&L (fix: sells)", () => {
  it("buy 10@100, buy 10@200, sell 5@300", () => {
    const pos = stockPositions(
      [t("1", "INFY", "2026-01-01", "Buy", 10, 100), t("2", "INFY", "2026-02-01", "Buy", 10, 200), t("3", "INFY", "2026-03-01", "Sell", 5, 300)],
      quotes,
      TODAY,
    );
    const p = pos[0];
    expect(p.quantity).toBe(15);
    expect(p.avgCost).toBe(150);
    expect(p.invested).toBe(2250);
    expect(p.realisedGain).toBe(750);
  });
  it("selling everything closes the position and drops it from holdings", () => {
    const flat = [t("1", "TCS", "2026-01-01", "Buy", 5, 100), t("2", "TCS", "2026-02-01", "Sell", 5, 150)];
    expect(stockPositions(flat, quotes, TODAY).length).toBe(0);
    const closed = stockPositions(flat, quotes, TODAY, { includeClosed: true });
    expect(closed[0].quantity).toBe(0);
    expect(closed[0].realisedGain).toBe(250);
  });
  it("rejects a sell larger than the holding", () => {
    const bad = [t("1", "TCS", "2026-01-01", "Buy", 5, 100), t("2", "TCS", "2026-02-01", "Sell", 6, 150)];
    expect(() => stockPositions(bad, quotes, TODAY)).toThrow(/exceeds/);
  });
});

describe("sectorAllocation (fix: every sector present)", () => {
  it("lists every sector and totals to portfolio value", () => {
    const pos = stockPositions(sheetTxns, quotes, TODAY);
    const rows = sectorAllocation(pos);
    expect(rows.map((r) => r.sector)).toEqual([...SECTORS]);
    expect(rows.find((r) => r.sector === "IT Services")!.value).toBeCloseTo(19758, 6);
    expect(rows.find((r) => r.sector === "Healthcare")!.value).toBe(0);
    expect(rows.reduce((s, r) => s + r.value, 0)).toBeCloseTo(50151.25, 6);
  });
});

describe("tradeSummary", () => {
  it("purchases, sales, net cash and trade count", () => {
    const s = tradeSummary([...sheetTxns, t("4", "INFY", "2026-09-01", "Sell", 5, 900)]);
    expect(s.purchases).toBe(38080);
    expect(s.sales).toBe(4500);
    expect(s.netDeployed).toBe(33580);
    expect(s.trades).toBe(4);
  });
});
