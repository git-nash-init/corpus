"use client";

import { useMemo, useState } from "react";
import { LineChart } from "@/components/charts/LineChart";
import { formatINR, formatINRShort, formatPercent } from "@/lib/engine/format";
import { fv, nper, pmt } from "@/lib/engine/tvm";

const TARGET = 10_000_000;

function Slider({ label, value, min, max, step, format, onChange }: { label: string; value: number; min: number; max: number; step: number; format: (n: number) => string; onChange: (n: number) => void }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-4">
        <span className="text-[15px] text-ink-2">{label}</span>
        <span className="num text-[17px] text-ink">{format(value)}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-2 h-11 w-full cursor-pointer accent-[var(--brass)]" aria-valuetext={format(value)} />
    </label>
  );
}

/** Interactive version of the sheet's goal tab, running on the same time-value functions as the app. */
export function CroreCalculator() {
  const [corpus, setCorpus] = useState(500_000);
  const [sip, setSip] = useState(25_000);
  const [ret, setRet] = useState(0.12);
  const [years, setYears] = useState(15);

  const r = ret / 12;
  const out = useMemo(() => {
    const months = years * 12;
    const projected = fv(r, months, -sip, -corpus);
    const needed = Math.max(0, -pmt(r, months, -corpus, TARGET));
    const reach = corpus >= TARGET ? 0 : nper(r, -sip, -corpus, TARGET);
    const series = Array.from({ length: years + 1 }, (_, k) => (k === 0 ? corpus : fv(r, 12 * k, -sip, -corpus)));
    return { projected, needed, reach, series };
  }, [corpus, sip, r, years]);

  const hit = out.projected >= TARGET;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-16">
      <div className="space-y-7">
        <Slider label="Invested today" value={corpus} min={0} max={10_000_000} step={50_000} format={formatINRShort} onChange={setCorpus} />
        <Slider label="Monthly SIP" value={sip} min={0} max={200_000} step={1_000} format={(n) => formatINR(n, { decimals: 0 })} onChange={setSip} />
        <Slider label="Expected return a year" value={ret} min={0.04} max={0.18} step={0.005} format={(n) => formatPercent(n, { decimals: 1 })} onChange={setRet} />
        <Slider label="Time horizon" value={years} min={1} max={30} step={1} format={(n) => `${n} years`} onChange={setYears} />
        <p className="text-[13px] leading-relaxed text-ink-3">Compounded monthly. Returns are assumptions you choose, not forecasts. Real markets move up and down.</p>
      </div>

      <div>
        <dl className="grid gap-8 sm:grid-cols-3">
          <div>
            <dt className="eyebrow">After {years} years</dt>
            <dd className="font-display mt-2 text-[clamp(28px,3.4vw,40px)] leading-none">{formatINRShort(out.projected)}</dd>
            <dd className={`mt-2 text-sm ${hit ? "gain" : "text-ink-2"}`}>{hit ? "Crosses 1 crore" : `${formatINRShort(TARGET - out.projected)} short of 1 crore`}</dd>
          </div>
          <div>
            <dt className="eyebrow">Time to 1 crore</dt>
            <dd className="font-display mt-2 text-[clamp(28px,3.4vw,40px)] leading-none">
              {corpus >= TARGET ? "Reached" : out.reach === null ? "Not reachable" : `${Math.floor(out.reach / 12)}y ${Math.ceil(out.reach % 12)}m`}
            </dd>
            <dd className="mt-2 text-sm text-ink-2">At this SIP and return</dd>
          </div>
          <div>
            <dt className="eyebrow">SIP needed</dt>
            <dd className="font-display mt-2 text-[clamp(28px,3.4vw,40px)] leading-none">{formatINR(Math.ceil(out.needed), { decimals: 0 })}</dd>
            <dd className="mt-2 text-sm text-ink-2">A month, to hit 1 crore in {years} years</dd>
          </div>
        </dl>
        <div className="mt-10">
          <LineChart
            labels={out.series.map((_, k) => (k === 0 ? "Now" : `Y${k}`))}
            series={[
              { name: "Projected corpus", color: "var(--brass)", values: out.series },
              { name: "1 crore target", color: "var(--stone)", dashed: true, values: out.series.map(() => TARGET) },
            ]}
            yFormat={formatINRShort}
            tooltipFormat={(n) => formatINR(n, { decimals: 0 })}
            ariaLabel="Projected corpus by year against the 1 crore target"
            height={280}
          />
        </div>
      </div>
    </div>
  );
}
