"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

export interface Series {
  name: string;
  color: string;
  dashed?: boolean;
  values: (number | null)[];
}

interface Props {
  labels: string[];
  series: Series[];
  yFormat: (n: number) => string;
  tooltipFormat?: (n: number) => string;
  height?: number;
  ariaLabel: string;
  /** Force the y axis to start at zero. Defaults to true for money charts. */
  zeroBased?: boolean;
}

const M = { top: 16, right: 12, bottom: 30, left: 56 };

function niceTicks(min: number, max: number, count = 4) {
  if (max === min) return [min];
  const raw = (max - min) / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const start = Math.floor(min / step) * step;
  const out: number[] = [];
  for (let v = start; v <= max + step * 0.999; v += step) out.push(v);
  return out;
}

export function LineChart({ labels, series, yFormat, tooltipFormat, height = 280, ariaLabel, zeroBased = true }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(300);
  const [active, setActive] = useState<number | null>(null);
  const reduce = useReducedMotion();
  const uid = useId();

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(220, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const geometry = useMemo(() => {
    const all = series.flatMap((s) => s.values.filter((v): v is number => v !== null));
    if (all.length === 0) return null;
    const min = zeroBased ? Math.min(0, ...all) : Math.min(...all);
    const max = Math.max(...all);
    const ticks = niceTicks(min, max);
    const lo = ticks[0];
    const hi = ticks[ticks.length - 1];
    const iw = width - M.left - M.right;
    const ih = height - M.top - M.bottom;
    const n = labels.length;
    const x = (i: number) => M.left + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
    const y = (v: number) => M.top + ih - ((v - lo) / (hi - lo || 1)) * ih;
    return { ticks, x, y, iw, ih, n };
  }, [series, labels, width, height, zeroBased]);

  if (!geometry) {
    return <p className="text-sm text-ink-3">No data yet.</p>;
  }
  const { ticks, x, y, iw, n } = geometry;
  const fmt = tooltipFormat ?? yFormat;

  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 72))));

  const onMove = (clientX: number) => {
    const r = wrap.current!.getBoundingClientRect();
    const rel = clientX - r.left - M.left;
    const i = Math.round((rel / iw) * (n - 1));
    setActive(Math.min(n - 1, Math.max(0, i)));
  };

  return (
    <div
      ref={wrap}
      className="relative w-full min-w-0 max-w-full"
      tabIndex={0}
      role="group"
      aria-label={`${ariaLabel}. Use left and right arrow keys to read values.`}
      onPointerMove={(e) => onMove(e.clientX)}
      onPointerLeave={() => setActive(null)}
      onBlur={() => setActive(null)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") setActive((a) => Math.min(n - 1, (a ?? -1) + 1));
        if (e.key === "ArrowLeft") setActive((a) => Math.max(0, (a ?? n) - 1));
        if (e.key === "Escape") setActive(null);
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="block max-w-full overflow-visible">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth={1} />
            <text x={M.left - 10} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize={12} fill="var(--text-3)" className="num">
              {yFormat(t)}
            </text>
          </g>
        ))}
        {labels.map((l, i) =>
          i % labelEvery === 0 || i === n - 1 ? (
            <text key={`${l}-${i}`} x={x(i)} y={height - 8} textAnchor="middle" fontSize={12} fill="var(--text-3)">
              {l}
            </text>
          ) : null,
        )}

        {series.map((s, si) => {
          let path = "";
          let pen = false;
          s.values.forEach((v, i) => {
            if (v === null) {
              pen = false;
              return;
            }
            path += `${pen ? "L" : "M"}${x(i)},${y(v)}`;
            pen = true;
          });
          return (
            <motion.path
              key={s.name}
              d={path}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={s.dashed ? "6 6" : undefined}
              initial={reduce || s.dashed ? false : { pathLength: 0 }}
              whileInView={s.dashed ? undefined : { pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, delay: si * 0.15, ease: [0.22, 1, 0.36, 1] }}
            />
          );
        })}

        {active !== null && (
          <g>
            <line x1={x(active)} x2={x(active)} y1={M.top} y2={height - M.bottom} stroke="var(--line-strong)" strokeWidth={1} />
            {series.map((s) =>
              s.values[active] !== null ? (
                <circle key={s.name} cx={x(active)} cy={y(s.values[active] as number)} r={4.5} fill="var(--bg)" stroke={s.color} strokeWidth={2} />
              ) : null,
            )}
          </g>
        )}
      </svg>

      {active !== null && (
        <div
          className="glass pointer-events-none absolute z-10 min-w-[150px] rounded-[4px] px-3 py-2 text-sm"
          style={{
            top: M.top,
            left: Math.min(width - 170, Math.max(4, x(active) + 12)),
            background: "color-mix(in srgb, var(--bg-raised) 82%, transparent)",
          }}
        >
          <div className="eyebrow mb-1">{labels[active]}</div>
          {series.map((s) =>
            s.values[active] !== null ? (
              <div key={s.name} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 text-ink-2">
                  <span className="h-[3px] w-3" style={{ background: s.color }} aria-hidden="true" />
                  {s.name}
                </span>
                <span className="num text-ink">{fmt(s.values[active] as number)}</span>
              </div>
            ) : null,
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink-2">
        {series.map((s) => (
          <span key={s.name} className="flex items-center gap-2">
            <span
              className="inline-block h-[3px] w-5"
              style={{ background: s.dashed ? "transparent" : s.color, borderTop: s.dashed ? `3px dashed ${s.color}` : undefined }}
              aria-hidden="true"
            />
            {s.name}
          </span>
        ))}
      </div>

      <div className="sr-only" aria-live="polite">
        {active !== null ? `${labels[active]}: ${series.map((s) => `${s.name} ${s.values[active] === null ? "no data" : fmt(s.values[active] as number)}`).join(", ")}` : ""}
      </div>
      <div className="sr-only">
      <table aria-labelledby={uid}>
        <caption id={uid}>{ariaLabel}</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            {series.map((s) => (
              <th key={s.name} scope="col">
                {s.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((l, i) => (
            <tr key={`${l}-${i}`}>
              <th scope="row">{l}</th>
              {series.map((s) => (
                <td key={s.name}>{s.values[i] === null ? "" : fmt(s.values[i] as number)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
