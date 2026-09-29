import { describe, it, expect } from "vitest";
import { fundPosition, sipCheck, categoryAllocation, displayReturn } from "@/lib/engine/mutualFunds";
import type { Fund, FundTxn } from "@/lib/data/types";

const TODAY = "2026-09-29";
const mk = (id: string, name: string, category: Fund["category"], sip: number, manual?: number): Fund => ({
  id, userId: "u", name, category, sipAmount: sip, sipDay: 10, sipStatus: "Active", latestNav: 10, navDate: TODAY, manualValue: manual,
});
const tx = (id: string, fundId: string, date: string, amount: number, type: FundTxn["type"] = "SIP", nav = 10): FundTxn => ({
  id, userId: "u", fundId, date, type, amount, nav,
});

const nippon = mk("f1", "Nippon Large Cap", "Index", 1000, 1010);
const hdfc = mk("f2", "HDFC Mid Cap Fund Growth", "Equity", 2000, 4223);
const invesco = mk("f3", "Invesco India Small Cap Fund Growth", "Equity", 500, 1010);
const txns = [
  tx("t1", "f1", "2026-08-11", 1000),
  tx("t2", "f2", "2026-07-10", 2000),
  tx("t3", "f2", "2026-08-10", 2000),
  tx("t4", "f3", "2026-08-12", 500),
  tx("t5", "f3", "2026-09-12", 500),
];

describe("fundPosition (sheet fixtures via manual value override)", () => {
  it("Nippon", () => {
    const p = fundPosition(nippon, txns, TODAY);
    expect(p.invested).toBe(1000);
    expect(p.currentValue).toBe(1010);
    expect(p.gain).toBe(10);
    expect(p.absReturn).toBeCloseTo(0.01, 6);
    expect(p.firstDate).toBe("2026-08-11");
    expect(p.xirr! * 100).toBeCloseTo(7.69, 2);
  });
  it("HDFC Mid Cap", () => {
    const p = fundPosition(hdfc, txns, TODAY);
    expect(p.invested).toBe(4000);
    expect(p.gain).toBe(223);
    expect(p.absReturn).toBeCloseTo(0.05575, 6);
    expect(p.xirr! * 100).toBeCloseTo(35.24, 2);
  });
  it("Invesco", () => {
    const p = fundPosition(invesco, txns, TODAY);
    expect(p.invested).toBe(1000);
    expect(p.xirr! * 100).toBeCloseTo(11.81, 2);
  });
});

describe("fundPosition units x NAV", () => {
  it("derives units from amount / NAV and value from latest NAV", () => {
    const f = { ...mk("f9", "X", "Equity", 0), latestNav: 12.5 };
    const p = fundPosition(f, [tx("a", "f9", "2026-01-10", 1000, "SIP", 10), tx("b", "f9", "2026-02-10", 1000, "SIP", 20)], TODAY);
    expect(p.units).toBeCloseTo(150, 8); // 100 + 50
    expect(p.currentValue).toBeCloseTo(1875, 6);
    expect(p.invested).toBe(2000);
  });
  it("redemption reduces units and cost proportionally and books realised gain", () => {
    const f = { ...mk("f9", "X", "Equity", 0), latestNav: 30 };
    const p = fundPosition(
      f,
      [tx("a", "f9", "2026-01-10", 1000, "Lumpsum", 10), tx("b", "f9", "2026-03-10", 1500, "Redemption", 30)],
      TODAY,
    );
    expect(p.units).toBeCloseTo(50, 8); // 100 units - 50 sold
    expect(p.invested).toBeCloseTo(500, 6); // half the cost remains
    expect(p.realisedGain).toBeCloseTo(1000, 6); // 1500 proceeds - 500 cost
  });
  it("empty fund has zero position and no XIRR", () => {
    const p = fundPosition(mk("z", "Z", "Debt", 0), [], TODAY);
    expect(p.invested).toBe(0);
    expect(p.xirr).toBeNull();
    expect(p.firstDate).toBeNull();
  });
});

describe("displayReturn (fix: no XIRR under one year)", () => {
  it("uses absolute return under 365 days and XIRR after", () => {
    expect(displayReturn(100, 0.05, 1.98)).toEqual({ kind: "absolute", value: 0.05 });
    expect(displayReturn(400, 0.2, 0.17)).toEqual({ kind: "xirr", value: 0.17 });
    expect(displayReturn(400, 0.2, null)).toEqual({ kind: "absolute", value: 0.2 });
  });
});

describe("sipCheck (fix: status text no longer inverted)", () => {
  const funds = [nippon, hdfc, invesco];
  it("compares this month's SIP debits with the planned amount", () => {
    const t = [tx("t6", "f1", "2026-09-11", 1000), tx("t7", "f2", "2026-09-10", 2000), tx("t8", "f1", "2026-08-11", 1000)];
    const c = sipCheck(funds, t, TODAY);
    expect(c.planned).toBe(3500);
    expect(c.completed).toBe(3000);
    expect(c.remaining).toBe(500);
    expect(c.status).toBe("In progress");
    expect(c.share).toBeCloseTo(3000 / 3500, 6);
  });
  it("is Completed once everything is debited, ignores paused funds and lumpsums", () => {
    const paused = { ...invesco, sipStatus: "Paused" as const };
    const t = [tx("a", "f1", "2026-09-11", 1000), tx("b", "f2", "2026-09-10", 2000), tx("c", "f3", "2026-09-05", 9999, "Lumpsum")];
    const c = sipCheck([nippon, hdfc, paused], t, TODAY);
    expect(c.planned).toBe(3000);
    expect(c.completed).toBe(3000);
    expect(c.status).toBe("Completed");
  });
});

describe("categoryAllocation", () => {
  it("sums current value per fund category and shares add to 1", () => {
    const rows = categoryAllocation([
      { category: "Equity", currentValue: 5233 },
      { category: "Index", currentValue: 1010 },
    ]);
    const eq = rows.find((r) => r.category === "Equity")!;
    expect(eq.value).toBe(5233);
    expect(eq.share).toBeCloseTo(5233 / 6243, 6);
    expect(rows.reduce((s, r) => s + r.share, 0)).toBeCloseTo(1, 9);
    expect(rows.find((r) => r.category === "Debt")!.value).toBe(0);
  });
});
