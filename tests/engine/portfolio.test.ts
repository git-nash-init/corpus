import { describe, it, expect } from "vitest";
import { fixedAssetSummary, liquidityLadder } from "@/lib/engine/fixedAssets";
import { buildNetWorth } from "@/lib/engine/netWorth";
import { dashboardSummary, investmentAllocation } from "@/lib/engine/allocation";
import { goalSummary, projectionSeries } from "@/lib/engine/goals";
import { compareMetric, snapshotGrowth, checklistProgress } from "@/lib/engine/review";
import type { FixedAsset, Goal, Snapshot } from "@/lib/data/types";

const fa = (kind: FixedAsset["kind"], invested: number, value: number, liquidity: FixedAsset["liquidity"], contrib = 0): FixedAsset => ({
  id: kind, userId: "u", kind, name: kind, provider: "x", invested, currentValue: value, annualContribution: contrib, maturity: "", liquidity,
});
const assets = [
  fa("PPF", 0, 0, "Locked"),
  fa("FD", 50000, 50000, "Semi-Liquid"),
  fa("Gold", 30000, 37000, "Highly Liquid"),
];

describe("fixedAssets", () => {
  it("totals: invested 80,000, value 87,000, gain 7,000", () => {
    const s = fixedAssetSummary(assets);
    expect(s.invested).toBe(80000);
    expect(s.currentValue).toBe(87000);
    expect(s.gain).toBe(7000);
  });
  it("liquidity ladder groups value by tag", () => {
    const l = liquidityLadder(assets);
    expect(l.find((x) => x.liquidity === "Highly Liquid")!.value).toBe(37000);
    expect(l.find((x) => x.liquidity === "Locked")!.value).toBe(0);
    expect(l.reduce((s, x) => s + x.share, 0)).toBeCloseTo(1, 9);
  });
});

describe("dashboard + allocation (sheet fixtures)", () => {
  const d = dashboardSummary({
    mf: { invested: 6000, currentValue: 6243 },
    stocks: { invested: 38080, currentValue: 50151.25 },
    fixed: fixedAssetSummary(assets),
  });
  it("total invested 1,24,080; value 1,43,394.25; gain 19,314.25; 15.57%", () => {
    expect(d.invested).toBe(124080);
    expect(d.currentValue).toBeCloseTo(143394.25, 6);
    expect(d.gain).toBeCloseTo(19314.25, 6);
    expect(d.gainPct).toBeCloseTo(0.15566, 5);
  });
  it("allocation across 8 classes matches the sheet shares", () => {
    const rows = investmentAllocation({ mfValue: 6243, stocksValue: 50151.25, fixed: assets });
    expect(rows.map((r) => r.label)).toEqual(["Mutual Funds", "Stocks", "PPF", "EPF", "NPS", "FD", "Gold", "Silver"]);
    expect(rows.find((r) => r.label === "Stocks")!.share).toBeCloseTo(0.349744, 5);
    expect(rows.find((r) => r.label === "FD")!.share).toBeCloseTo(0.348689, 5);
    expect(rows.find((r) => r.label === "Gold")!.share).toBeCloseTo(0.25803, 5);
  });
});

describe("netWorth (sheet fixtures)", () => {
  const nw = buildNetWorth({
    mfValue: 6243,
    stocksValue: 50151.25,
    fixed: assets,
    balanceAssets: [{ id: "p", userId: "u", name: "Flat", kind: "RealEstate", value: 7500000 }],
    liabilities: [
      { id: "l1", userId: "u", name: "Personal Loan", lender: "IOB", outstanding: 52000 },
      { id: "l2", userId: "u", name: "Home Loan", lender: "SBI", outstanding: 7000 },
    ],
  });
  it("assets 76,43,394.25, liabilities 59,000, net worth 75,84,394.25", () => {
    expect(nw.totalAssets).toBeCloseTo(7643394.25, 6);
    expect(nw.totalLiabilities).toBe(59000);
    expect(nw.netWorth).toBeCloseTo(7584394.25, 6);
  });
  it("debt-to-asset ratio 0.77% and healthy flag", () => {
    expect(nw.debtToAsset).toBeCloseTo(0.007719, 5);
    expect(nw.healthy).toBe(true);
  });
  it("zero assets gives zero ratio, not NaN", () => {
    const z = buildNetWorth({ mfValue: 0, stocksValue: 0, fixed: [], balanceAssets: [], liabilities: [] });
    expect(z.debtToAsset).toBe(0);
  });
});

describe("goals", () => {
  const goal: Goal = { id: "g", userId: "u", name: "1 Crore", target: 10_000_000, targetDate: "2030-12-31", expectedReturn: 0.12, monthlySip: 3500 };
  const TODAY = "2026-09-29";
  it("progress and remaining (sheet: 1.43%, 98,56,605.75)", () => {
    const s = goalSummary(goal, 143394.25, TODAY);
    expect(s.progress).toBeCloseTo(0.014339, 5);
    expect(s.remaining).toBeCloseTo(9856605.75, 6);
  });
  it("uses the user's expected return, not portfolio absolute return (fix)", () => {
    const s = goalSummary(goal, 143394.25, TODAY);
    const r = 0.01; // 12% / 12 over 51 months
    const expected = 143394.25 * Math.pow(1 + r, 51) + 3500 * ((Math.pow(1 + r, 51) - 1) / r);
    expect(Math.abs(s.projectedAtTarget - expected)).toBeLessThan(0.006); // paise rounding
    expect(s.onTrack).toBe(false);
    expect(s.status).toBe("Behind target");
  });
  it("SIP needed makes the projection hit the target exactly", () => {
    const s = goalSummary(goal, 143394.25, TODAY);
    const check = goalSummary({ ...goal, monthlySip: s.sipNeeded }, 143394.25, TODAY);
    expect(Math.abs(check.projectedAtTarget - goal.target)).toBeLessThan(0.5); // SIP is rounded to paise
  });
  it("SIP needed is zero when the corpus alone will get there", () => {
    const s = goalSummary(goal, 9_000_000, TODAY);
    expect(s.sipNeeded).toBe(0);
    expect(s.onTrack).toBe(true);
  });
  it("expected completion date via NPER, and today when already achieved", () => {
    const s = goalSummary({ ...goal, expectedReturn: 0.2793613884 }, 143394.25, TODAY);
    expect(s.expectedCompletion).toBe("2039-07-29");
    const done = goalSummary(goal, 10_500_000, TODAY);
    expect(done.expectedCompletion).toBe(TODAY);
    expect(done.status).toBe("Achieved");
  });
  it("no SIP and no growth means no completion date", () => {
    const s = goalSummary({ ...goal, expectedReturn: 0, monthlySip: 0 }, 1000, TODAY);
    expect(s.expectedCompletion).toBeNull();
  });
  it("yearly projection compounds monthly (fix) and starts at current value", () => {
    const rows = projectionSeries(goal, 143394.25, 2026, 5);
    expect(rows[0]).toEqual({ year: 2026, value: 143394.25, target: 10_000_000 });
    const r = 0.01;
    const y1 = 143394.25 * Math.pow(1 + r, 12) + 3500 * ((Math.pow(1 + r, 12) - 1) / r);
    expect(Math.abs(rows[1].value - y1)).toBeLessThan(0.006);
    expect(rows.length).toBe(6);
  });
});

describe("review", () => {
  it("compareMetric: percent change, null when last month missing or zero", () => {
    expect(compareMetric(110, 100)).toBeCloseTo(0.1, 9);
    expect(compareMetric(110, 0)).toBeNull();
    expect(compareMetric(110, undefined)).toBeNull();
  });
  it("snapshotGrowth uses the previous positive snapshot", () => {
    const s = (m: string, nw: number): Snapshot => ({ id: m, userId: "u", month: m, totalAssets: nw, totalLiabilities: 0, netWorth: nw, investmentValue: 0 });
    const rows = snapshotGrowth([s("2026-01-01", 0), s("2026-02-01", 100), s("2026-03-01", 110), s("2026-04-01", 0)]);
    expect(rows.map((r) => r.growth)).toEqual([null, null, 0.1, null]);
  });
  it("checklistProgress", () => {
    expect(checklistProgress([{ done: true }, { done: false }, { done: true }, { done: true }])).toBeCloseTo(0.75, 9);
    expect(checklistProgress([])).toBe(0);
  });
});
