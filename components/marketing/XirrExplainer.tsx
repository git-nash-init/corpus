"use client";

import { useMemo, useState } from "react";
import { addMonths } from "@/lib/engine/dates";
import { formatINR, formatPercent } from "@/lib/engine/format";
import { xirr, type CashFlow } from "@/lib/engine/xirr";

const BASE = "2025-01-10";

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

/** Same SIP, same gain, two different numbers. Runs the app's own XIRR. */
export function XirrExplainer() {
  const [sip, setSip] = useState(10_000);
  const [months, setMonths] = useState(18);
  const [gain, setGain] = useState(0.12);

  const res = useMemo(() => {
    const invested = sip * months;
    const value = invested * (1 + gain);
    const flows: CashFlow[] = Array.from({ length: months }, (_, i) => ({ date: addMonths(BASE, i), amount: -sip }));
    flows.push({ date: addMonths(BASE, months), amount: value });
    return { invested, value, rate: xirr(flows) };
  }, [sip, months, gain]);

  const young = months < 12;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-16">
      <div className="space-y-7">
        <Slider label="Monthly SIP" value={sip} min={1_000} max={100_000} step={1_000} format={(n) => formatINR(n, { decimals: 0 })} onChange={setSip} />
        <Slider label="Months invested" value={months} min={2} max={60} step={1} format={(n) => `${n} months`} onChange={setMonths} />
        <Slider label="Total gain so far" value={gain} min={-0.2} max={0.6} step={0.01} format={(n) => formatPercent(n, { sign: true, decimals: 0 })} onChange={setGain} />
      </div>
      <div>
        <dl className="grid gap-8 sm:grid-cols-3">
          <div>
            <dt className="eyebrow">You put in</dt>
            <dd className="font-display mt-2 text-[clamp(26px,3vw,36px)] leading-none">{formatINR(res.invested, { decimals: 0 })}</dd>
            <dd className="num mt-2 text-sm text-ink-2">Now worth {formatINR(res.value, { decimals: 0 })}</dd>
          </div>
          <div>
            <dt className="eyebrow">Absolute return</dt>
            <dd className={`font-display mt-2 text-[clamp(26px,3vw,36px)] leading-none ${gain >= 0 ? "gain" : "loss"}`}>{formatPercent(gain, { sign: true, decimals: 1 })}</dd>
            <dd className="mt-2 text-sm text-ink-2">Gain divided by invested</dd>
          </div>
          <div>
            <dt className="eyebrow">XIRR a year</dt>
            <dd className={`font-display mt-2 text-[clamp(26px,3vw,36px)] leading-none ${res.rate !== null && res.rate < 0 ? "loss" : "gain"}`}>{res.rate === null ? "n/a" : formatPercent(res.rate, { sign: true, decimals: 1 })}</dd>
            <dd className="mt-2 text-sm text-ink-2">Weighs each rupee by how long it was invested</dd>
          </div>
        </dl>
        <p className="mt-8 max-w-[62ch] text-[16px] leading-relaxed text-ink-2">
          Money that went in last month has had little time to grow, so a SIP that shows {formatPercent(gain, { sign: true, decimals: 0 })} overall is earning about{" "}
          <span className="num text-ink">{res.rate === null ? "n/a" : formatPercent(res.rate, { sign: true, decimals: 1 })}</span> a year on the average rupee. XIRR is the yearly rate that makes every dated
          payment and today&rsquo;s value balance out.
        </p>
        <p className="mt-4 max-w-[62ch] rounded-[4px] border border-line p-4 text-sm text-ink-2" style={{ background: "var(--glass-fill)" }}>
          {young ? (
            <>
              This holding is under a year old, so Crorpus shows the absolute return, <span className="num text-ink">{formatPercent(gain, { sign: true, decimals: 1 })}</span>, instead of an annualised figure that would look far
              more dramatic than it is.
            </>
          ) : (
            <>This holding is over a year old, so Crorpus shows XIRR as its headline return, and keeps the absolute return alongside it.</>
          )}
        </p>
      </div>
    </div>
  );
}
