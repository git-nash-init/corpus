import { describe, it, expect } from "vitest";
import { xirr } from "@/lib/engine/xirr";
import { fv, pmt, nper } from "@/lib/engine/tvm";
import { daysBetween, monthsBetween, addMonths } from "@/lib/engine/dates";
import { formatINR, formatINRShort, formatPercent } from "@/lib/engine/format";
import { sumMoney, roundMoney } from "@/lib/engine/money";

describe("xirr", () => {
  it("matches a simple one-year case", () => {
    const r = xirr([
      { date: "2026-01-01", amount: -1000 },
      { date: "2027-01-01", amount: 1100 },
    ]);
    expect(r).toBeCloseTo(0.1, 6);
  });
  it("reproduces the sheet: Nippon Large Cap 7.69%", () => {
    const r = xirr([
      { date: "2026-08-11", amount: -1000 },
      { date: "2026-09-29", amount: 1010 },
    ]);
    expect(r! * 100).toBeCloseTo(7.69, 2);
  });
  it("reproduces the sheet: HDFC Mid Cap 35.24%", () => {
    const r = xirr([
      { date: "2026-07-10", amount: -2000 },
      { date: "2026-08-10", amount: -2000 },
      { date: "2026-09-29", amount: 4223 },
    ]);
    expect(r! * 100).toBeCloseTo(35.24, 2);
  });
  it("reproduces the sheet: Invesco Small Cap 11.81%", () => {
    const r = xirr([
      { date: "2026-08-12", amount: -500 },
      { date: "2026-09-12", amount: -500 },
      { date: "2026-09-29", amount: 1010 },
    ]);
    expect(r! * 100).toBeCloseTo(11.81, 2);
  });
  it("reproduces the sheet: HDFCBANK -24.77%", () => {
    const r = xirr([
      { date: "2026-08-08", amount: -22350 },
      { date: "2026-09-29", amount: 21462 },
    ]);
    expect(r! * 100).toBeCloseTo(-24.77, 2);
  });
  it("returns null without a sign change", () => {
    expect(xirr([{ date: "2026-01-01", amount: -100 }, { date: "2026-06-01", amount: -50 }])).toBeNull();
    expect(xirr([{ date: "2026-01-01", amount: -100 }])).toBeNull();
  });
});

describe("tvm (Excel sign conventions)", () => {
  const r = 0.2793613884 / 12; // the sheet's rate, used only to reproduce its cached results
  it("FV reproduces sheet projected value 7,99,562.07", () => {
    expect(fv(r, 51, -3500, -143394.25)).toBeCloseTo(799562.07, 1);
  });
  it("PMT reproduces sheet SIP needed 99,382.11", () => {
    expect(-pmt(r, 51, -143394.25, 10000000)).toBeCloseTo(99382.11, 1);
  });
  it("NPER reproduces sheet completion horizon of 154 months", () => {
    expect(Math.ceil(nper(r, -3500, -143394.25, 10000000)!)).toBe(154);
  });
  it("handles a zero rate", () => {
    expect(fv(0, 12, -100, -1000)).toBeCloseTo(2200, 6);
    expect(nper(0, -100, -1000, 2200)).toBeCloseTo(12, 6);
  });
  it("nper is null when the target can never be reached", () => {
    expect(nper(0, 0, -100, 200)).toBeNull();
  });
});

describe("dates", () => {
  it("daysBetween and monthsBetween", () => {
    expect(daysBetween("2026-08-11", "2026-09-29")).toBe(49);
    expect(monthsBetween("2026-09-29", "2030-12-31")).toBe(51);
  });
  it("addMonths clamps to month end like EDATE", () => {
    expect(addMonths("2026-09-29", 154)).toBe("2039-07-29");
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
  });
});

describe("format (en-IN)", () => {
  it("groups in lakh and crore", () => {
    expect(formatINR(7584394.25)).toBe("₹75,84,394.25");
    expect(formatINR(143394, { decimals: 0 })).toBe("₹1,43,394");
    expect(formatINR(-888, { decimals: 0 })).toBe("-₹888");
  });
  it("short forms", () => {
    expect(formatINRShort(143394.25)).toBe("₹1.43 L");
    expect(formatINRShort(10000000)).toBe("₹1.00 Cr");
    expect(formatINRShort(7584394.25)).toBe("₹75.84 L");
    expect(formatINRShort(9500)).toBe("₹9,500");
  });
  it("percent", () => {
    expect(formatPercent(0.0405)).toBe("4.05%");
    expect(formatPercent(0.0405, { sign: true })).toBe("+4.05%");
    expect(formatPercent(-0.2477)).toBe("-24.77%");
  });
});

describe("money", () => {
  it("sums without float drift", () => {
    expect(sumMoney([0.1, 0.2, 0.3])).toBe(0.6);
    expect(roundMoney(1.005)).toBe(1.01);
  });
});
