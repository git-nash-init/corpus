"use client";

import { motion, useReducedMotion } from "motion/react";

/** Horizontal meter with an optional threshold tick, e.g. the 30% debt-to-asset line. */
export function Meter({
  value,
  max = 1,
  threshold,
  tone = "brass",
  label,
}: {
  value: number;
  max?: number;
  threshold?: number;
  tone?: "brass" | "gain" | "loss";
  label: string;
}) {
  const reduce = useReducedMotion();
  const pct = Math.max(0, Math.min(1, value / max));
  const color = tone === "gain" ? "var(--gain)" : tone === "loss" ? "var(--loss)" : "var(--brass)";
  return (
    <div
      className="relative h-3 w-full rounded-[2px] bg-[var(--glass-fill-hover)]"
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
    >
      <motion.div
        className="absolute inset-y-0 left-0 rounded-[2px]"
        style={{ background: color }}
        initial={reduce ? { width: `${pct * 100}%` } : { width: 0 }}
        whileInView={{ width: `${pct * 100}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
      {threshold !== undefined && (
        <div
          className="absolute -top-1 -bottom-1 w-px bg-ink"
          style={{ left: `${(threshold / max) * 100}%` }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
