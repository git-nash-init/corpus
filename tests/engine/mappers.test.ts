import { describe, it, expect } from "vitest";
import { fundFromRow, fundToRow, fundTxnFromRow, goalFromRow, quoteToRow, snapshotToRow, stockTxnToRow, documentFromRow } from "@/lib/data/mappers";
import type { Fund, Snapshot, StockTxn } from "@/lib/data/types";

describe("row mappers", () => {
  it("round-trips a fund through its row form, including the AMFI code and manual value", () => {
    const fund: Fund = {
      id: "f1", userId: "u1", name: "HDFC Mid Cap", category: "Equity", amfiCode: "118989",
      sipAmount: 10000, sipDay: 10, sipStatus: "Active", latestNav: 222.03, navDate: "2026-10-06", manualValue: 4223,
    };
    const row = fundToRow(fund);
    expect(row.amfi_code).toBe("118989");
    const back = fundFromRow({ ...row, user_id: "u1", created_at: "", updated_at: "" } as never);
    expect(back).toEqual(fund);
  });

  it("keeps optional fund fields undefined, not null, when absent", () => {
    const row = { id: "f2", user_id: "u1", name: "X", category: "Debt", amfi_code: null, sip_amount: "0", sip_day: 5, sip_status: "Stopped", latest_nav: "10.5", nav_date: "2026-01-01", manual_value: null, created_at: "", updated_at: "" };
    const f = fundFromRow(row as never);
    expect(f.amfiCode).toBeUndefined();
    expect(f.manualValue).toBeUndefined();
    expect(f.sipAmount).toBe(0); // numerics may arrive as strings
    expect(f.latestNav).toBe(10.5);
  });

  it("converts numeric strings from the database into numbers", () => {
    const t = fundTxnFromRow({ id: "t", user_id: "u", fund_id: "f", date: "2026-08-11", type: "SIP", amount: "1000.00", nav: "231.970000", created_at: "", updated_at: "" } as never);
    expect(t.amount).toBe(1000);
    expect(t.nav).toBe(231.97);
    const g = goalFromRow({ id: "g", user_id: "u", name: "n", target: "10000000.00", target_date: "2036-12-31", expected_return: "0.1200", monthly_sip: "30000.00", created_at: "", updated_at: "" } as never);
    expect(g.expectedReturn).toBe(0.12);
  });

  it("never sends user_id from the client: the database fills it", () => {
    const trade: StockTxn = { id: "s", userId: "u1", ticker: "INFY", date: "2026-08-10", type: "Buy", quantity: 20, price: 349 };
    expect(stockTxnToRow(trade)).not.toHaveProperty("user_id");
    const snap: Snapshot = { id: "x", userId: "u1", month: "2026-09-01", totalAssets: 1, totalLiabilities: 0, netWorth: 1, investmentValue: 1 };
    expect(snapshotToRow(snap)).not.toHaveProperty("user_id");
    expect(quoteToRow({ ticker: "TCS", name: "TCS", sector: "IT Services", cmp: 2100 })).not.toHaveProperty("user_id");
  });

  it("maps documents", () => {
    const d = documentFromRow({ id: "d", user_id: "u", storage_path: "u/a.pdf", file_name: "a.pdf", mime: "application/pdf", size: 8, kind: "Statement", linked_type: null, linked_id: null, created_at: "2026-10-07T00:00:00Z", updated_at: "" } as never);
    expect(d).toMatchObject({ fileName: "a.pdf", size: 8, linkedType: null });
  });
});
