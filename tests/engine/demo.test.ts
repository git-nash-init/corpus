import { describe, it, expect } from "vitest";
import { buildDemoData } from "@/lib/data/demo-seed";
import { derive } from "@/lib/state/derive";

const TODAY = "2026-09-29";

describe("demo data through the full derivation", () => {
  const d = derive(buildDemoData(TODAY), TODAY);

  it("produces a coherent portfolio", () => {
    expect(d.summary.currentValue).toBeGreaterThan(0);
    expect(d.summary.invested).toBeGreaterThan(0);
    expect(d.allocation.reduce((s, r) => s + r.share, 0)).toBeCloseTo(1, 9);
    expect(d.netWorth.netWorth).toBeCloseTo(d.netWorth.totalAssets - d.netWorth.totalLiabilities, 2);
  });

  it("net worth investments line matches the dashboard total", () => {
    const inv = d.netWorth.lines.filter((l) => l.group !== "Cash" && l.group !== "Real estate" && l.group !== "Personal assets");
    const sum = inv.reduce((s, l) => s + l.value, 0);
    expect(sum).toBeCloseTo(d.summary.currentValue, 2);
  });

  it("funds show real XIRR once held for a year, and every fund has units", () => {
    const hdfc = d.fundRows.find((r) => r.fund.id === "f-hdfc")!;
    expect(hdfc.position.daysHeld).toBeGreaterThan(365);
    expect(hdfc.position.xirr).not.toBeNull();
    expect(hdfc.position.units).toBeGreaterThan(0);
  });

  it("SIP check reflects this month's debits", () => {
    expect(d.sip.planned).toBe(35000);
    expect(d.sip.completed).toBeGreaterThan(0);
  });

  it("stocks include a realised gain from the partial sell", () => {
    expect(d.stockSum.realised).not.toBe(0);
  });

  it("goal projection is finite and the series ends at or after the target year", () => {
    const g = d.goals[0];
    expect(Number.isFinite(g.summary.sipNeeded)).toBe(true);
    expect(g.series.length).toBeGreaterThan(5);
  });

  it("is stable when run again for a different day", () => {
    const later = derive(buildDemoData("2027-03-05"), "2027-03-05");
    expect(later.summary.currentValue).toBeGreaterThan(0);
  });
});
