"use client";

import type { ReactNode } from "react";
import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";
import { formatINR, formatINRShort, formatPercent } from "@/lib/engine/format";

export function PageHeader({ eyebrow, title, subtitle, actions }: { eyebrow: string; title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-2 text-[clamp(30px,4vw,44px)]">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-[62ch] text-ink-2">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </header>
  );
}

export function Section({
  title,
  eyebrow,
  actions,
  children,
  className = "",
  flush = false,
}: {
  title?: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <section className={`panel ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-end justify-between gap-3 px-4 pt-5 sm:px-6 sm:pt-6">
          <div>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            {title ? <h2 className="mt-1 text-[24px]">{title}</h2> : null}
          </div>
          {actions}
        </div>
      )}
      <div className={flush ? "pt-4" : "p-4 sm:p-6"}>{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  format = (n: number) => formatINR(n, { decimals: 0 }),
  note,
  tone,
  delay = 0,
}: {
  label: string;
  value: number;
  format?: (n: number) => string;
  note?: ReactNode;
  tone?: "gain" | "loss";
  delay?: number;
}) {
  const toneClass = tone === "gain" ? "gain" : tone === "loss" ? "loss" : "";
  return (
    <Reveal delay={delay}>
      <div className="panel h-full p-4 sm:p-6">
        <p className="eyebrow">{label}</p>
        <p className={`font-display mt-3 text-[clamp(21px,5.4vw,36px)] leading-none ${toneClass}`}>
          <CountUp value={value} format={format} />
        </p>
        {note ? <p className="mt-3 text-[13px] leading-snug text-ink-2 sm:text-sm">{note}</p> : null}
      </div>
    </Reveal>
  );
}

/** Colours a figure by sign and always prints the sign, so colour is never the only cue. */
export function Signed({ value, kind = "money", decimals }: { value: number | null; kind?: "money" | "percent" | "short"; decimals?: number }) {
  if (value === null || !Number.isFinite(value)) return <span className="text-ink-3">n/a</span>;
  const cls = value > 0 ? "gain" : value < 0 ? "loss" : "text-ink-2";
  const text =
    kind === "percent"
      ? formatPercent(value, { sign: true, decimals })
      : kind === "short"
        ? (value > 0 ? "+" : "") + formatINRShort(value)
        : (value > 0 ? "+" : "") + formatINR(value, { decimals: decimals ?? 0 });
  return <span className={`num ${cls}`}>{text}</span>;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "gain" | "loss" | "brass" }) {
  const color = { neutral: "var(--text-2)", gain: "var(--gain)", loss: "var(--loss)", brass: "var(--brass-strong)" }[tone];
  return (
    <span
      className="inline-flex items-center rounded-[3px] border px-2 py-[3px] text-[12px] font-medium leading-none"
      style={{ color, borderColor: `color-mix(in srgb, ${color} 45%, transparent)` }}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 px-6 py-10">
      <h3 className="text-[22px]">{title}</h3>
      <p className="max-w-[52ch] text-ink-2">{body}</p>
      {action}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly T[];
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="glass inline-flex rounded-[4px] p-[3px]">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(o)}
          className="min-h-[38px] rounded-[3px] px-4 text-sm transition-colors duration-200"
          style={{
            background: value === o ? "var(--glass-brass-fill)" : "transparent",
            color: value === o ? "var(--brass-strong)" : "var(--text-2)",
            fontWeight: value === o ? 600 : 500,
          }}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
