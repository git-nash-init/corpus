"use client";

import { useState } from "react";
import { LineChart } from "@/components/charts/LineChart";
import { Meter } from "@/components/charts/Meter";
import { Badge, PageHeader, Section, Signed } from "@/components/app/kit";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import { Reveal } from "@/components/motion/Reveal";
import { firstOfMonth } from "@/lib/engine/dates";
import { compareMetric } from "@/lib/engine/review";
import { formatINR, formatINRShort, formatMonth, formatPercent } from "@/lib/engine/format";
import type { ReviewNote } from "@/lib/data/demo-seed";
import { useApp } from "@/lib/state/useApp";
import { useStore } from "@/lib/state/store";

const CATEGORIES: ReviewNote["category"][] = ["Key wins", "Improvements", "Next actions"];

export default function ReviewPage() {
  const { data, d, today } = useApp();
  const toggle = useStore((s) => s.toggleReviewItem);
  const addNote = useStore((s) => s.addReviewNote);
  const removeNote = useStore((s) => s.removeReviewNote);
  const takeSnapshot = useStore((s) => s.takeSnapshot);
  const [cat, setCat] = useState<ReviewNote["category"]>("Key wins");
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);

  if (!data || !d) return null;

  const thisMonth = firstOfMonth(today);
  const prior = [...d.snapshots].reverse().find((s) => s.month < thisMonth) ?? null;
  const nw = d.netWorth;

  const rows: { label: string; now: number; prev: number | undefined; kind: "money" | "ratio"; goodWhenUp: boolean }[] = [
    { label: "Net worth", now: nw.netWorth, prev: prior?.netWorth, kind: "money", goodWhenUp: true },
    { label: "Total assets", now: nw.totalAssets, prev: prior?.totalAssets, kind: "money", goodWhenUp: true },
    { label: "Investments", now: d.summary.currentValue, prev: prior?.investmentValue, kind: "money", goodWhenUp: true },
    { label: "Total debt", now: nw.totalLiabilities, prev: prior?.totalLiabilities, kind: "money", goodWhenUp: false },
    { label: "Debt to assets", now: nw.debtToAsset, prev: prior && prior.totalAssets > 0 ? prior.totalLiabilities / prior.totalAssets : undefined, kind: "ratio", goodWhenUp: false },
  ];

  const trendLabels = d.snapshots.map((s) => formatMonth(s.month));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={formatMonth(thisMonth)}
        title="Monthly review"
        subtitle="A short monthly ritual. Work through the checklist, compare against last month and take a snapshot so your history builds itself."
        actions={
          <Button
            variant="primary"
            onClick={() => {
              takeSnapshot();
              setSaved(true);
              window.setTimeout(() => setSaved(false), 3500);
            }}
          >
            Take month-end snapshot
          </Button>
        }
      />
      <p className="sr-only" role="status" aria-live="polite">
        {saved ? "Snapshot saved" : ""}
      </p>
      {saved ? (
        <div className="panel px-5 py-3 text-sm" role="status">
          Snapshot saved for {formatMonth(thisMonth)}.
        </div>
      ) : null}

      <Reveal>
        <Section eyebrow="Compared with last month" title="How the month moved" flush>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th className="r">This month</th>
                  <th className="r">Last month</th>
                  <th className="r">Change</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const change = r.kind === "ratio" ? (r.prev === undefined ? null : r.now - r.prev) : compareMetric(r.now, r.prev);
                  const good = change === null ? null : r.goodWhenUp ? change >= 0 : change <= 0;
                  return (
                    <tr key={r.label}>
                      <td>{r.label}</td>
                      <td className="r num">{r.kind === "ratio" ? formatPercent(r.now, { decimals: 2 }) : formatINR(r.now, { decimals: 0 })}</td>
                      <td className="r num text-ink-2">{r.prev === undefined ? "No snapshot" : r.kind === "ratio" ? formatPercent(r.prev, { decimals: 2 }) : formatINR(r.prev, { decimals: 0 })}</td>
                      <td className="r">
                        {change === null ? (
                          <span className="text-ink-3">n/a</span>
                        ) : (
                          <span className={`num ${good ? "gain" : "loss"}`}>
                            {change > 0 ? "+" : ""}
                            {r.kind === "ratio" ? `${(change * 100).toFixed(2)} pts` : formatPercent(change, { decimals: 2 })}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal>
          <Section eyebrow="Ritual" title="This month's checklist" actions={<Badge tone={d.checklist === 1 ? "gain" : "brass"}>{formatPercent(d.checklist, { decimals: 0 })} done</Badge>}>
            <Meter value={d.checklist} label="Checklist completion" tone={d.checklist === 1 ? "gain" : "brass"} />
            <ul className="mt-4 divide-y divide-[var(--line)]">
              {data.reviewItems.map((i) => (
                <li key={i.id}>
                  <label className="flex min-h-[56px] cursor-pointer items-center gap-4 py-3">
                    <input type="checkbox" checked={i.done} onChange={() => toggle(i.id)} className="h-5 w-5 shrink-0 accent-[var(--brass)]" />
                    <span className="flex-1">
                      <span className={`block text-[15px] ${i.done ? "text-ink-3 line-through" : "text-ink"}`}>{i.action}</span>
                      <span className="block text-[13px] text-ink-3">
                        {i.timeline}, {i.focus}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </Section>
        </Reveal>

        <Reveal delay={0.08}>
          <Section eyebrow="Reflection" title="Notes">
            <div className="space-y-5">
              {CATEGORIES.map((c) => {
                const notes = data.reviewNotes.filter((n) => n.category === c);
                return (
                  <div key={c}>
                    <p className="eyebrow">{c}</p>
                    {notes.length === 0 ? (
                      <p className="mt-2 text-sm text-ink-3">Nothing yet.</p>
                    ) : (
                      <ul className="mt-2 divide-y divide-[var(--line)]">
                        {notes.map((n) => (
                          <li key={n.id} className="flex items-start justify-between gap-3 py-2 text-[15px]">
                            <span>{n.text}</span>
                            <button type="button" className="btn btn-ghost btn-sm shrink-0" onClick={() => removeNote(n.id)} aria-label={`Remove note: ${n.text}`}>
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
              <form
                className="space-y-3 border-t border-line pt-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!text.trim()) return;
                  addNote({ category: cat, text: text.trim() });
                  setText("");
                }}
              >
                <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                  <SelectField label="Category" value={cat} onChange={(e) => setCat(e.target.value as ReviewNote["category"])}>
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </SelectField>
                  <TextField label="Note" value={text} onChange={(e) => setText(e.target.value)} placeholder="What happened this month?" />
                </div>
                <Button type="submit" disabled={!text.trim()}>
                  Add note
                </Button>
              </form>
            </div>
          </Section>
        </Reveal>
      </div>

      <Reveal>
        <Section eyebrow="History" title="Wealth accumulation log" flush>
          <div className="px-6 pb-4">
            <LineChart
              labels={trendLabels}
              series={[
                { name: "Net worth", color: "var(--brass)", values: d.snapshots.map((s) => s.netWorth) },
                { name: "Investments", color: "var(--slate)", values: d.snapshots.map((s) => s.investmentValue) },
              ]}
              yFormat={formatINRShort}
              tooltipFormat={(n) => formatINR(n, { decimals: 0 })}
              ariaLabel="Net worth and investments at each month end"
              height={260}
            />
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th className="r">Assets</th>
                  <th className="r">Liabilities</th>
                  <th className="r">Net worth</th>
                  <th className="r">Investments</th>
                  <th className="r">MoM growth</th>
                </tr>
              </thead>
              <tbody>
                {[...d.snapshots].reverse().map((s) => (
                  <tr key={s.id}>
                    <td>{formatMonth(s.month)}</td>
                    <td className="r num">{formatINR(s.totalAssets, { decimals: 0 })}</td>
                    <td className="r num">{formatINR(s.totalLiabilities, { decimals: 0 })}</td>
                    <td className="r num">{formatINR(s.netWorth, { decimals: 0 })}</td>
                    <td className="r num">{formatINR(s.investmentValue, { decimals: 0 })}</td>
                    <td className="r">
                      <Signed value={s.growth} kind="percent" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </Reveal>
    </div>
  );
}
