"use client";

import Link from "next/link";
import { AllocationBar } from "@/components/charts/AllocationBar";
import { LineChart } from "@/components/charts/LineChart";
import { Meter } from "@/components/charts/Meter";
import { Badge, PageHeader, Section, Signed, Stat } from "@/components/app/kit";
import { LinkButton } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { isSameMonth } from "@/lib/engine/dates";
import { formatDate, formatINR, formatINRShort, formatMonth, formatPercent } from "@/lib/engine/format";
import { useApp } from "@/lib/state/useApp";

export default function OverviewPage() {
  const { data, d, today } = useApp();
  if (!data || !d) return null;

  const goal = d.goals[0];
  const holdings = [
    ...d.fundRows.filter((r) => r.position.currentValue > 0).map((r) => ({ name: r.fund.name, type: "Mutual fund", value: r.position.currentValue, gain: r.position.gain })),
    ...d.positions.map((p) => ({ name: p.name, type: "Stock", value: p.currentValue, gain: p.gain })),
    ...data.fixedAssets.filter((a) => a.currentValue > 0).map((a) => ({ name: a.name, type: a.kind, value: a.currentValue, gain: a.currentValue - a.invested })),
  ]
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const trendLabels = [...d.snapshots.map((s) => formatMonth(s.month)), "Today"];
  const trendNet = [...d.snapshots.map((s) => s.netWorth), d.netWorth.netWorth];
  const trendInv = [...d.snapshots.map((s) => s.investmentValue), d.summary.currentValue];

  const sipRows = data.funds
    .filter((f) => f.sipStatus === "Active" && f.sipAmount > 0)
    .map((f) => ({
      fund: f,
      paid: data.fundTxns.some((t) => t.fundId === f.id && t.type === "SIP" && isSameMonth(t.date, today)),
    }))
    .sort((a, b) => a.fund.sipDay - b.fund.sipDay);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={formatDate(today)}
        title="Your wealth, as of today"
        subtitle="Every figure below is calculated from the transactions and balances you have recorded."
        actions={
          <LinkButton href="/app/review" variant="primary">
            Take month-end snapshot
          </LinkButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Net worth" value={d.netWorth.netWorth} note="Assets minus liabilities" delay={0} />
        <Stat label="Total invested" value={d.summary.invested} note="Principal put to work" delay={0.06} />
        <Stat
          label="Total gain"
          value={d.summary.gain}
          tone={d.summary.gain >= 0 ? "gain" : "loss"}
          note={<Signed value={d.summary.gainPct} kind="percent" />}
          delay={0.12}
        />
        <Stat label="Monthly SIP" value={d.mf.monthlySip} note={`${d.sip.activeCount} active SIPs`} delay={0.18} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <Reveal>
          <Section eyebrow="History" title="Net worth trend">
            <LineChart
              labels={trendLabels}
              series={[
                { name: "Net worth", color: "var(--brass)", values: trendNet },
                { name: "Investments", color: "var(--slate)", values: trendInv },
              ]}
              yFormat={formatINRShort}
              tooltipFormat={(n) => formatINR(n, { decimals: 0 })}
              ariaLabel="Net worth and investment value by month"
            />
          </Section>
        </Reveal>
        <Reveal delay={0.08}>
          <Section eyebrow={goal?.goal.name ?? "Goal"} title="Goal progress">
            {goal ? (
              <div className="space-y-5">
                <div>
                  <p className="font-display text-[44px] leading-none">{formatPercent(goal.summary.progress, { decimals: 1 })}</p>
                  <p className="mt-2 text-sm text-ink-2">
                    {formatINRShort(d.summary.currentValue)} of {formatINRShort(goal.goal.target)}
                  </p>
                </div>
                <Meter value={goal.summary.progress} label="Goal progress" tone={goal.summary.onTrack ? "gain" : "brass"} />
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-ink-3">Status</dt>
                    <dd className="mt-1">
                      <Badge tone={goal.summary.onTrack ? "gain" : "loss"}>{goal.summary.status}</Badge>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-3">SIP needed</dt>
                    <dd className="num mt-1 text-ink">{formatINR(goal.summary.sipNeeded, { decimals: 0 })} a month</dd>
                  </div>
                </dl>
                <Link href="/app/goals" className="text-sm text-brass underline underline-offset-4">
                  Open the goal planner
                </Link>
              </div>
            ) : (
              <p className="text-ink-2">No goal yet.</p>
            )}
          </Section>
        </Reveal>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal>
          <Section eyebrow="Where it sits" title="Investment allocation">
            <AllocationBar rows={d.allocation} />
          </Section>
        </Reveal>
        <Reveal delay={0.08}>
          <Section eyebrow="This month" title="SIP debits" actions={<Badge tone={d.sip.status === "Completed" ? "gain" : "brass"}>{d.sip.status}</Badge>}>
            <div className="mb-5 flex items-baseline justify-between text-sm">
              <span className="text-ink-2">
                <span className="num text-ink">{formatINR(d.sip.completed, { decimals: 0 })}</span> of{" "}
                <span className="num">{formatINR(d.sip.planned, { decimals: 0 })}</span>
              </span>
              <span className="num text-ink-3">{formatINR(d.sip.remaining, { decimals: 0 })} left</span>
            </div>
            <Meter value={d.sip.share} label="SIP debits completed this month" tone="brass" />
            <ul className="mt-5 divide-y divide-[var(--line)]">
              {sipRows.map(({ fund, paid }) => (
                <li key={fund.id} className="flex items-center gap-3 py-3 text-sm">
                  <span className="num w-14 text-ink-3">{String(fund.sipDay).padStart(2, "0")} {formatMonth(today).slice(0, 3)}</span>
                  <span className="flex-1 truncate text-ink">{fund.name}</span>
                  <span className="num text-ink-2">{formatINR(fund.sipAmount, { decimals: 0 })}</span>
                  <Badge tone={paid ? "gain" : "neutral"}>{paid ? "Debited" : "Due"}</Badge>
                </li>
              ))}
            </ul>
          </Section>
        </Reveal>
      </div>

      <Reveal>
        <Section eyebrow="Largest positions" title="Top holdings" flush>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Holding</th>
                  <th>Type</th>
                  <th className="r">Value</th>
                  <th className="r">Gain</th>
                  <th className="r">Share</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <tr key={h.name + h.type}>
                    <td>{h.name}</td>
                    <td className="text-ink-2">{h.type}</td>
                    <td className="r num">{formatINR(h.value, { decimals: 0 })}</td>
                    <td className="r">
                      <Signed value={h.gain} />
                    </td>
                    <td className="r num text-ink-2">{formatPercent(h.value / d.summary.currentValue, { decimals: 1 })}</td>
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
