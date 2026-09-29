"use client";

import { motion, useReducedMotion } from "motion/react";
import { colorAt } from "./palette";
import { formatINR, formatPercent } from "@/lib/engine/format";

export interface AllocationRow {
  label: string;
  value: number;
  share: number;
}

/**
 * One stacked bar with a direct-labelled list beneath it. Chosen over a donut because the sheet has eight classes,
 * and every row carries its own value and share so colour is never the only signal.
 */
export function AllocationBar({ rows, hideEmpty = true }: { rows: AllocationRow[]; hideEmpty?: boolean }) {
  const reduce = useReducedMotion();
  const visible = hideEmpty ? rows.filter((r) => r.value > 0) : rows;
  const total = rows.reduce((s, r) => s + r.value, 0);

  if (total <= 0) {
    return <p className="text-sm text-ink-3">Nothing to allocate yet. Add a holding to see how your money is spread.</p>;
  }

  return (
    <div>
      <div
        className="flex h-3 w-full gap-[2px] overflow-hidden rounded-[2px]"
        role="img"
        aria-label={`Allocation: ${visible.map((r) => `${r.label} ${formatPercent(r.share, { decimals: 1 })}`).join(", ")}`}
      >
        {visible.map((r, i) => {
          const idx = rows.indexOf(r);
          return (
            <motion.div
              key={r.label}
              style={{ background: colorAt(idx), flexBasis: `${r.share * 100}%` }}
              className="h-full origin-left"
              initial={reduce ? false : { scaleX: 0, opacity: 0 }}
              whileInView={{ scaleX: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            />
          );
        })}
      </div>
      <ul className="mt-6 divide-y divide-[var(--line)]">
        {rows.map((r, i) => (
          <li key={r.label} className="flex items-center gap-3 py-3 text-sm" style={{ opacity: r.value > 0 ? 1 : 0.45 }}>
            <span className="h-3 w-3 shrink-0 rounded-[2px]" style={{ background: colorAt(i) }} aria-hidden="true" />
            <span className="flex-1 text-ink">{r.label}</span>
            <span className="num text-ink-2">{formatINR(r.value, { decimals: 0 })}</span>
            <span className="num w-16 text-right text-ink">{formatPercent(r.share, { decimals: 1 })}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
