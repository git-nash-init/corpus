"use client";

import { useMemo, useState } from "react";
import { LineChart } from "@/components/charts/LineChart";
import { Meter } from "@/components/charts/Meter";
import { Badge, PageHeader, Section, Segmented, Stat } from "@/components/app/kit";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Reveal } from "@/components/motion/Reveal";
import { goalSummary, projectionSeries } from "@/lib/engine/goals";
import { formatDate, formatINR, formatINRShort, formatPercent } from "@/lib/engine/format";
import type { Goal } from "@/lib/data/types";
import { useApp } from "@/lib/state/useApp";
import { useStore } from "@/lib/state/store";

const num = (s: string) => (s.trim() === "" ? NaN : Number(s));

export default function GoalsPage() {
  const { data, d, today } = useApp();
  const upsertGoal = useStore((s) => s.upsertGoal);
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<Goal | "new" | null>(null);

  if (!data || !d) return null;
  const current = data.goals.find((g) => g.id === selected) ?? data.goals[0];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Planning"
        title="Goals"
        subtitle="Projections use the return you expect, compounded monthly. Change a value in the what-if panel to see the effect straight away."
        actions={
          <>
            {current ? <Button onClick={() => setEditing(current)}>Edit goal</Button> : null}
            <Button variant="primary" onClick={() => setEditing("new")}>
              New goal
            </Button>
          </>
        }
      />

      {data.goals.length > 1 ? (
        <Segmented label="Choose a goal" value={current.name} options={data.goals.map((g) => g.name)} onChange={(name) => setSelected(data.goals.find((g) => g.name === name)?.id ?? null)} />
      ) : null}

      {current ? (
        <GoalView key={current.id} goal={current} currentValue={d.summary.currentValue} today={today} portfolioXirr={d.stockSum.xirr} onSave={upsertGoal} />
      ) : (
        <div className="panel p-8">
          <h2 className="text-[24px]">No goals yet</h2>
          <p className="mt-2 max-w-[52ch] text-ink-2">Set a target, a date and the return you expect. Crorpus shows the monthly SIP you need and whether you are on track.</p>
          <Button className="mt-6" variant="primary" onClick={() => setEditing("new")}>
            Set your first goal
          </Button>
        </div>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} variant="drawer" title={editing === "new" ? "New goal" : "Edit goal"}>
        {editing !== null ? (
          <GoalForm
            key={editing === "new" ? "new" : editing.id}
            goal={editing === "new" ? null : editing}
            userId={data.userId}
            today={today}
            onCancel={() => setEditing(null)}
            onSave={(g) => {
              upsertGoal(g);
              setSelected(g.id);
              setEditing(null);
            }}
          />
        ) : null}
      </Modal>
    </div>
  );
}

function GoalView({ goal, currentValue, today, onSave, portfolioXirr }: { goal: Goal; currentValue: number; today: string; onSave: (g: Goal) => void; portfolioXirr: number | null }) {
  const [sip, setSip] = useState(goal.monthlySip);
  const [ret, setRet] = useState(goal.expectedReturn);
  const [target, setTarget] = useState(goal.target);
  const dirty = sip !== goal.monthlySip || ret !== goal.expectedReturn || target !== goal.target;

  const what: Goal = useMemo(() => ({ ...goal, monthlySip: sip, expectedReturn: ret, target }), [goal, sip, ret, target]);
  const s = useMemo(() => goalSummary(what, currentValue, today), [what, currentValue, today]);
  const startYear = Number(today.slice(0, 4));
  const years = Math.max(1, Number(goal.targetDate.slice(0, 4)) - startYear + 1);
  const series = useMemo(() => projectionSeries(what, currentValue, startYear, years), [what, currentValue, startYear, years]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat label="Current corpus" value={currentValue} note={`${formatPercent(s.progress, { decimals: 2 })} of ${formatINRShort(target)}`} />
        <Stat label="Still to build" value={s.remaining} note={`By ${formatDate(goal.targetDate)}`} delay={0.06} />
        <Stat label="SIP needed a month" value={s.sipNeeded} note={s.sipNeeded === 0 ? "Your corpus alone gets there" : `You invest ${formatINR(sip, { decimals: 0 })} today`} delay={0.12} />
        <Stat label="Projected at target date" value={s.projectedAtTarget} tone={s.onTrack ? "gain" : "loss"} note={s.onTrack ? `Surplus ${formatINR(s.surplus, { decimals: 0 })}` : `Short by ${formatINR(Math.max(0, target - s.projectedAtTarget), { decimals: 0 })}`} delay={0.18} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Reveal>
          <Section eyebrow="Projection" title="Path to the target" actions={<Badge tone={s.onTrack ? "gain" : "loss"}>{s.status}</Badge>}>
            <LineChart
              labels={series.map((r) => String(r.year))}
              series={[
                { name: "Projected corpus", color: "var(--brass)", values: series.map((r) => r.value) },
                { name: "Target", color: "var(--stone)", dashed: true, values: series.map((r) => r.target) },
              ]}
              yFormat={formatINRShort}
              tooltipFormat={(n) => formatINR(n, { decimals: 0 })}
              ariaLabel="Projected corpus by year against the target"
              height={320}
            />
            <div className="mt-6">
              <Meter value={s.progress} label="Progress toward the target" tone={s.onTrack ? "gain" : "brass"} />
              <p className="mt-2 text-sm text-ink-2">
                {s.expectedCompletion ? (
                  <>
                    At this pace you reach the target around <span className="text-ink">{formatDate(s.expectedCompletion)}</span>.
                  </>
                ) : (
                  "With no SIP and no growth the target is not reachable. Add a SIP or raise the expected return."
                )}
              </p>
            </div>
          </Section>
        </Reveal>

        <Reveal delay={0.08}>
          <Section eyebrow="What if" title="Try different numbers">
            <div className="space-y-6">
              <Slider label="Monthly SIP" value={sip} min={0} max={Math.max(200000, goal.monthlySip * 2)} step={500} format={(n) => formatINR(n, { decimals: 0 })} onChange={setSip} />
              <Slider label="Expected annual return" value={ret} min={0.02} max={0.2} step={0.005} format={(n) => formatPercent(n, { decimals: 1 })} onChange={setRet} />
              <Slider label="Target amount" value={target} min={1_000_000} max={100_000_000} step={500_000} format={formatINRShort} onChange={setTarget} />
              <p className="text-sm text-ink-3">
                Your portfolio&rsquo;s own return so far is not a forecast. Most planners use 10 to 12 percent for a diversified equity mix.
                {portfolioXirr !== null ? ` Your stock XIRR is ${formatPercent(portfolioXirr, { decimals: 1 })}.` : ""}
              </p>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  disabled={!dirty}
                  onClick={() => {
                    setSip(goal.monthlySip);
                    setRet(goal.expectedReturn);
                    setTarget(goal.target);
                  }}
                >
                  Reset
                </Button>
                <Button variant="primary" disabled={!dirty} onClick={() => onSave({ ...goal, monthlySip: sip, expectedReturn: ret, target })}>
                  Save to goal
                </Button>
              </div>
            </div>
          </Section>
        </Reveal>
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, format, onChange }: { label: string; value: number; min: number; max: number; step: number; format: (n: number) => string; onChange: (n: number) => void }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-sm">
        <span className="text-ink-2">{label}</span>
        <span className="num text-ink">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 h-11 w-full cursor-pointer accent-[var(--brass)]"
        aria-valuetext={format(value)}
      />
    </label>
  );
}

function GoalForm({ goal, userId, today, onSave, onCancel }: { goal: Goal | null; userId: string; today: string; onSave: (g: Goal) => void; onCancel: () => void }) {
  const [name, setName] = useState(goal?.name ?? "");
  const [target, setTarget] = useState(String(goal?.target ?? 10_000_000));
  const [date, setDate] = useState(goal?.targetDate ?? "");
  const [ret, setRet] = useState(String((goal?.expectedReturn ?? 0.12) * 100));
  const [sip, setSip] = useState(String(goal?.monthlySip ?? ""));
  const [err, setErr] = useState<Record<string, string>>({});

  const submit = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name your goal.";
    if (!(num(target) > 0)) e.target = "Enter a target above zero.";
    if (!date || date <= today) e.date = "Choose a date in the future.";
    if (!(num(ret) >= 0 && num(ret) <= 40)) e.ret = "Enter a yearly return between 0 and 40.";
    if (sip.trim() !== "" && !(num(sip) >= 0)) e.sip = "SIP cannot be negative.";
    setErr(e);
    if (Object.keys(e).length) return;
    onSave({ id: goal?.id ?? crypto.randomUUID(), userId, name: name.trim(), target: num(target), targetDate: date, expectedReturn: num(ret) / 100, monthlySip: sip.trim() === "" ? 0 : num(sip) });
  };

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <TextField label="Goal name" required value={name} onChange={(e) => setName(e.target.value)} error={err.name} placeholder="1 Crore investment corpus" />
      <TextField label="Target amount (Rs)" type="number" inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value)} error={err.target} />
      <TextField label="Target date" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} error={err.date} />
      <div className="grid grid-cols-2 gap-4">
        <TextField label="Expected return (% a year)" type="number" inputMode="decimal" step="0.5" value={ret} onChange={(e) => setRet(e.target.value)} error={err.ret} />
        <TextField label="Monthly SIP (Rs)" type="number" inputMode="numeric" value={sip} onChange={(e) => setSip(e.target.value)} error={err.sip} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" type="submit">
          Save goal
        </Button>
      </div>
    </form>
  );
}
