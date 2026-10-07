import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import type { Database } from "@/lib/supabase/database.types";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";
import * as repo from "@/lib/data/supabaseRepository";
import { parseInvestmentTracker } from "@/lib/import/spreadsheet";
import { buildRecords, type SchemeMatch } from "@/lib/import/build";
import { derive } from "@/lib/state/derive";
import { isoFromMfDate } from "@/lib/market/nav";

// Opt-in: runs the real import against the real database as a test user.
//   CRORPUS_E2E=1 E2E_EMAIL=... E2E_PASSWORD=... npm run test -- tests/e2e
const enabled = process.env.CRORPUS_E2E === "1" && !!process.env.E2E_EMAIL && !!process.env.E2E_PASSWORD;
const FILE = path.resolve(__dirname, "../../../Investment Tracker.xlsx");

async function schemeFor(name: string): Promise<SchemeMatch | null> {
  const hits = (await (await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(name)}`)).json()) as { schemeCode: number; schemeName: string }[];
  const pick = hits.find((h) => /direct/i.test(h.schemeName) && /growth/i.test(h.schemeName) && !/idcw|dividend/i.test(h.schemeName));
  if (!pick) return null;
  const body = (await (await fetch(`https://api.mfapi.in/mf/${pick.schemeCode}`)).json()) as { data: { date: string; nav: string }[] };
  const history = body.data.map((d) => ({ date: isoFromMfDate(d.date), nav: Number(d.nav) })).sort((a, b) => a.date.localeCompare(b.date));
  return { code: String(pick.schemeCode), name: pick.schemeName, latest: history[history.length - 1], history };
}

describe.skipIf(!enabled || !existsSync(FILE))("import into the real database", () => {
  it("imports the original workbook and the figures reconcile with the sheet", async () => {
    const sb = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    const login = await sb.auth.signInWithPassword({ email: process.env.E2E_EMAIL!, password: process.env.E2E_PASSWORD! });
    expect(login.error).toBeNull();
    const userId = login.data.user!.id;

    await repo.wipeData(sb);

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(readFileSync(FILE) as unknown as ArrayBuffer);
    const plan = parseInvestmentTracker(wb);

    const matches = new Map<string, SchemeMatch | null>();
    for (const f of plan.funds) matches.set(f.name, await schemeFor(f.name));
    const today = new Date().toISOString().slice(0, 10);
    const built = buildRecords(plan, matches, userId, today, () => crypto.randomUUID());
    await repo.insertImported(sb, userId, built);

    const { data } = await repo.loadAll(sb);
    expect(data.funds.length).toBe(plan.funds.length);
    expect(data.fundTxns.length).toBe(5);
    expect(data.stockTxns.length).toBe(3);
    expect(data.fixedAssets.length).toBe(2);

    const d = derive(data, today);
    // The sheet's own principal figures: funds 6,000, stocks 38,080, deposits and gold 80,000.
    expect(d.mf.invested).toBeCloseTo(6000, 2);
    expect(d.stockSum.invested).toBeCloseTo(38080, 2);
    expect(d.fixed.invested).toBeCloseTo(80000, 2);
    expect(d.netWorth.totalLiabilities).toBeCloseTo(59000, 2);
    console.log("imported:", { funds: data.funds.map((f) => `${f.name} (${f.amfiCode ?? "manual"})`), mfValue: d.mf.currentValue, notes: built.notes });

    if (!process.env.CRORPUS_KEEP) await repo.wipeData(sb);
  }, 120000);
});
