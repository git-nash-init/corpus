"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { uploadDocument } from "@/lib/data/documents";
import * as repo from "@/lib/data/supabaseRepository";
import { todayISO } from "@/lib/engine/dates";
import { formatINR } from "@/lib/engine/format";
import { buildRecords, type SchemeMatch } from "@/lib/import/build";
import { parseWorkbookFile, type ImportPlan } from "@/lib/import/spreadsheet";
import { fundHistory, fundLatest, searchFunds, type FundHit } from "@/lib/market/api";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useStore } from "@/lib/state/store";

type Phase = "idle" | "reading" | "matching" | "preview" | "importing" | "done";

interface Row {
  sheetName: string;
  options: FundHit[];
  /** scheme code, or "" to keep the sheet's value */
  choice: string;
}

const KEEP = "";

function bestGuess(sheetName: string, hits: FundHit[]): string {
  const plain = !/regular/i.test(sheetName);
  const pick = hits.find((h) => /direct/i.test(h.name) && /growth/i.test(h.name) && !/idcw|dividend|bonus/i.test(h.name) === plain) ?? hits.find((h) => /growth/i.test(h.name));
  return pick ? pick.code : KEEP;
}

/** Reads the original Investment Tracker spreadsheet, matches its funds to live AMFI schemes, then imports it. */
export function SpreadsheetImport({ hasData, onDone }: { hasData: boolean; onDone?: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const data = useStore((s) => s.data);
  const reload = useStore((s) => s.reload);
  const setDocuments = useStore((s) => s.setDocuments);

  const [phase, setPhase] = useState<Phase>("idle");
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [replace, setReplace] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);

  const choose = async (f: File) => {
    setError(null);
    if (!/\.xlsx$/i.test(f.name)) return setError("Choose the .xlsx file. Download it from Google Sheets with File, Download, Microsoft Excel.");
    if (f.size > 20 * 1024 * 1024) return setError("That file is larger than 20 MB.");
    setFile(f);
    setPhase("reading");
    try {
      const parsed = await parseWorkbookFile(await f.arrayBuffer());
      setPlan(parsed);
      setPhase("matching");
      const found = await Promise.all(
        parsed.funds.map(async (fund): Promise<Row> => {
          let hits: FundHit[] = [];
          try {
            hits = await searchFunds(fund.name);
            if (!hits.length) hits = await searchFunds(fund.name.split(/\s+/).slice(0, 3).join(" "));
          } catch {
            // Search being down is not fatal; the fund is kept with the sheet's value.
          }
          return { sheetName: fund.name, options: hits.slice(0, 15), choice: bestGuess(fund.name, hits) };
        }),
      );
      setRows(found);
      setPhase("preview");
    } catch {
      setPhase("idle");
      setError("That file could not be read. Make sure it is the Investment Tracker workbook saved as .xlsx.");
    }
  };

  const run = async () => {
    if (!plan || !data || !file) return;
    setPhase("importing");
    setError(null);
    try {
      const sb = supabaseBrowser();
      const matches = new Map<string, SchemeMatch | null>();
      await Promise.all(
        rows.map(async (r) => {
          if (!r.choice) return matches.set(r.sheetName, null);
          try {
            const [info, history] = await Promise.all([fundLatest(r.choice), fundHistory(r.choice)]);
            matches.set(r.sheetName, { code: r.choice, name: info.name, latest: info.latest, history });
          } catch {
            matches.set(r.sheetName, null);
          }
        }),
      );
      const built = buildRecords(plan, matches, data.userId, todayISO(), () => crypto.randomUUID());
      if (replace) await repo.wipeData(sb);
      await repo.insertImported(sb, data.userId, built);
      try {
        const rec = await uploadDocument(sb, data.userId, file, { kind: "Import" });
        setDocuments((d) => [rec, ...d]);
      } catch {
        // Keeping a copy of the file is a convenience. The data has already been imported.
      }
      await reload();
      setNotes(built.notes);
      setPhase("done");
      onDone?.();
    } catch (e) {
      setPhase("preview");
      setError(e instanceof Error ? e.message : "The import failed. Nothing was changed if this message mentions a failure before saving.");
      await reload();
    }
  };

  if (phase === "done" && plan) {
    return (
      <div className="space-y-4" role="status">
        <h3 className="font-display text-[24px]">Import complete</h3>
        <p className="text-ink-2">
          Imported {plan.funds.length} funds, {plan.fundTxns.length} fund transactions, {plan.stockTxns.length} stock trades, {plan.fixedAssets.length} fixed assets
          {plan.goal ? " and your goal" : ""}.
        </p>
        {notes.length ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink-2">
            {notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        ) : null}
        <Button onClick={() => { setPhase("idle"); setPlan(null); setFile(null); }}>Import another file</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => input.current?.click()} disabled={phase === "reading" || phase === "matching" || phase === "importing"}>
          Choose your .xlsx file
        </Button>
        {file ? <span className="text-sm text-ink-2">{file.name}</span> : null}
        <input ref={input} type="file" accept=".xlsx" className="sr-only" tabIndex={-1} aria-label="Choose the Investment Tracker spreadsheet" onChange={(e) => { const f = e.target.files?.[0]; if (f) void choose(f); e.target.value = ""; }} />
      </div>
      <p className="text-[13px] text-ink-3">In Google Sheets: File, Download, Microsoft Excel (.xlsx). The file is read in your browser and a copy is kept in your documents.</p>

      {error ? (
        <p role="alert" className="text-sm" style={{ color: "var(--loss)" }}>
          {error}
        </p>
      ) : null}

      {phase === "reading" || phase === "matching" ? (
        <div role="status" aria-label="Reading the spreadsheet" className="space-y-3">
          <p className="text-sm text-ink-2">{phase === "reading" ? "Reading the spreadsheet..." : "Matching your funds to live scheme data..."}</p>
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-2/3" />
        </div>
      ) : null}

      {plan && (phase === "preview" || phase === "importing") ? (
        <div className="space-y-6">
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            {[
              ["Funds", plan.funds.length],
              ["Fund transactions", plan.fundTxns.length],
              ["Stock trades", plan.stockTxns.length],
              ["Fixed assets", plan.fixedAssets.length],
              ["Cash, property", plan.balanceAssets.length],
              ["Liabilities", plan.liabilities.length],
              ["Goal", plan.goal ? 1 : 0],
              ["Prices", plan.quotes.length],
            ].map(([k, v]) => (
              <div key={k as string}>
                <dt className="text-ink-3">{k}</dt>
                <dd className="num mt-1 text-[20px] text-ink">{v}</dd>
              </div>
            ))}
          </dl>

          {rows.length ? (
            <div>
              <h4 className="font-display text-[20px]">Match your funds</h4>
              <p className="mt-1 text-sm text-ink-2">Pick the live scheme for each fund so units and NAVs are exact. Choose the sheet&rsquo;s value if you cannot find it.</p>
              <div className="mt-4 space-y-4">
                {rows.map((r, i) => (
                  <label key={r.sheetName} className="field">
                    <span className="label">{r.sheetName}</span>
                    <select className="input" value={r.choice} onChange={(e) => setRows((cur) => cur.map((x, j) => (j === i ? { ...x, choice: e.target.value } : x)))}>
                      <option value={KEEP}>Keep the value from my sheet (no live NAV)</option>
                      {r.options.map((o) => (
                        <option key={o.code} value={o.code}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {plan.balanceAssets.length || plan.liabilities.length ? (
            <p className="text-sm text-ink-2">
              Balance sheet: {plan.balanceAssets.map((b) => `${b.name} ${formatINR(b.value, { decimals: 0 })}`).join(", ") || "no assets"}; {plan.liabilities.length} liabilities.
            </p>
          ) : null}

          {plan.warnings.length ? (
            <div>
              <p className="eyebrow">Heads up</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-2">
                {plan.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {hasData ? (
            <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-2">
              <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} className="mt-[3px] h-5 w-5 shrink-0 accent-[var(--brass)]" />
              <span>Replace what is already in my account. If unticked, the spreadsheet is added to it, which can duplicate entries.</span>
            </label>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => void run()} disabled={phase === "importing"}>
              {phase === "importing" ? "Importing" : "Import into my account"}
            </Button>
            <Button variant="ghost" onClick={() => { setPlan(null); setFile(null); setPhase("idle"); }} disabled={phase === "importing"}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
