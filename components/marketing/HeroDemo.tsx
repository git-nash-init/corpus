"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { AllocationBar } from "@/components/charts/AllocationBar";
import { LineChart } from "@/components/charts/LineChart";
import { Meter } from "@/components/charts/Meter";
import { CountUp } from "@/components/motion/CountUp";
import { Skeleton } from "@/components/ui/Skeleton";
import { buildDemoData } from "@/lib/data/demo-seed";
import { todayISO } from "@/lib/engine/dates";
import { formatDate, formatINR, formatINRShort, formatMonth, formatPercent } from "@/lib/engine/format";
import { derive } from "@/lib/state/derive";

const TABS = ["Overview", "Allocation", "Goal"] as const;
type Tab = (typeof TABS)[number];

export function HeroDemo() {
  // null on the server and during hydration, the real date afterwards, so the demo never mismatches.
  const today = useSyncExternalStore(
    () => () => {},
    () => todayISO(),
    () => null,
  );
  const [tab, setTab] = useState<Tab>("Overview");

  const d = useMemo(() => (today ? derive(buildDemoData(today), today) : null), [today]);

  return (
    <div className="glass overflow-hidden rounded-[6px]" style={{ background: "color-mix(in srgb, var(--bg-raised) 72%, transparent)" }}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="eyebrow">Live demo</span>
          <span className="hidden text-[13px] text-ink-3 sm:inline">{today ? formatDate(today) : ""}</span>
        </div>
        <div role="tablist" aria-label="Demo views" className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`btn btn-sm ${tab === t ? "btn-primary" : ""}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[430px] p-4 sm:p-8" role="tabpanel" aria-label={tab}>
        {!d ? (
          <div role="status" aria-label="Loading demo" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-9 w-40" />
                </div>
              ))}
            </div>
            <Skeleton className="h-[260px] w-full" />
          </div>
        ) : tab === "Overview" ? (
          <div className="space-y-8">
            <dl className="grid gap-6 sm:grid-cols-3">
              <div>
                <dt className="eyebrow">Net worth</dt>
                <dd className="font-display mt-2 text-[34px] leading-none">
                  <CountUp value={d.netWorth.netWorth} format={(n) => formatINR(n, { decimals: 0 })} />
                </dd>
              </div>
              <div>
                <dt className="eyebrow">Invested</dt>
                <dd className="font-display mt-2 text-[34px] leading-none">
                  <CountUp value={d.summary.invested} format={(n) => formatINR(n, { decimals: 0 })} />
                </dd>
              </div>
              <div>
                <dt className="eyebrow">Total gain</dt>
                <dd className="font-display gain mt-2 text-[34px] leading-none">
                  <CountUp value={d.summary.gain} format={(n) => `+${formatINR(n, { decimals: 0 })}`} />
                </dd>
                <p className="num gain mt-1 text-sm">{formatPercent(d.summary.gainPct, { sign: true })}</p>
              </div>
            </dl>
            <LineChart
              labels={[...d.snapshots.map((s) => formatMonth(s.month)), "Today"]}
              series={[
                { name: "Net worth", color: "var(--brass)", values: [...d.snapshots.map((s) => s.netWorth), d.netWorth.netWorth] },
                { name: "Investments", color: "var(--slate)", values: [...d.snapshots.map((s) => s.investmentValue), d.summary.currentValue] },
              ]}
              yFormat={formatINRShort}
              tooltipFormat={(n) => formatINR(n, { decimals: 0 })}
              ariaLabel="Net worth and investments over the last months"
              height={240}
            />
          </div>
        ) : tab === "Allocation" ? (
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div>
              <p className="eyebrow">Investments</p>
              <p className="font-display mt-2 text-[34px] leading-none">{formatINR(d.summary.currentValue, { decimals: 0 })}</p>
              <p className="mt-2 text-sm text-ink-2">Spread across {d.allocation.filter((a) => a.value > 0).length} asset classes.</p>
            </div>
            <AllocationBar rows={d.allocation} />
          </div>
        ) : (
          <div className="space-y-6">
            {d.goals[0] ? (
              <>
                <div className="grid gap-6 sm:grid-cols-3">
                  <div>
                    <p className="eyebrow">{d.goals[0].goal.name}</p>
                    <p className="font-display mt-2 text-[34px] leading-none">{formatPercent(d.goals[0].summary.progress, { decimals: 1 })}</p>
                  </div>
                  <div>
                    <p className="eyebrow">SIP needed a month</p>
                    <p className="font-display mt-2 text-[34px] leading-none">{formatINR(d.goals[0].summary.sipNeeded, { decimals: 0 })}</p>
                  </div>
                  <div>
                    <p className="eyebrow">Status</p>
                    <p className={`font-display mt-2 text-[34px] leading-none ${d.goals[0].summary.onTrack ? "gain" : "loss"}`}>{d.goals[0].summary.status}</p>
                  </div>
                </div>
                <Meter value={d.goals[0].summary.progress} label="Goal progress" />
                <LineChart
                  labels={d.goals[0].series.map((r) => String(r.year))}
                  series={[
                    { name: "Projected corpus", color: "var(--brass)", values: d.goals[0].series.map((r) => r.value) },
                    { name: "Target", color: "var(--stone)", dashed: true, values: d.goals[0].series.map((r) => r.target) },
                  ]}
                  yFormat={formatINRShort}
                  tooltipFormat={(n) => formatINR(n, { decimals: 0 })}
                  ariaLabel="Projected corpus by year against the target"
                  height={200}
                />
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
