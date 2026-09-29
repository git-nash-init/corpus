"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const ROWS = [
  { name: "Nippon India Large Cap", invested: "1,000", value: "1,010", sheet: "7.69%", crorpus: "+1.00%", tag: "Absolute" },
  { name: "HDFC Mid Cap Fund Growth", invested: "4,000", value: "4,223", sheet: "35.24%", crorpus: "+5.58%", tag: "Absolute" },
  { name: "Infosys", invested: "6,980", value: "19,758", sheet: "198,866.14%", crorpus: "+183.07%", tag: "Absolute" },
  { name: "HDFC Bank", invested: "22,350", value: "21,462", sheet: "-24.77%", crorpus: "-3.97%", tag: "Absolute" },
];

const FORMULA = `=IFERROR(__xludf.DUMMYFUNCTION("IF(OR(ISBLANK(B9), G9<=0, H9<=0), """", IFERROR(XIRR(VSTACK(FILTER(-$H$36:$H1001, $C$36:$C1001=B9, ISNUMBER($H$36:$H1001), $H$36:$H1001>0), H9), VSTACK(FILTER($B$36:$B1001, ...`;

export function Scrubber() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const reduce = useReducedMotion();
  const [pos, setPos] = useState(reduce ? 50 : 96);
  const touched = useRef(false);

  useEffect(() => {
    if (!inView || reduce) return;
    const c = animate(96, 50, { duration: 1.3, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => !touched.current && setPos(v) });
    return () => c.stop();
  }, [inView, reduce]);

  return (
    <div ref={ref}>
      <div className="relative overflow-hidden rounded-[6px] border border-line-strong select-none" style={{ minHeight: 400 }}>
        {/* Layer 1: the spreadsheet */}
        <div className="absolute inset-0 p-4 sm:p-6" style={{ background: "#e9e4d3", color: "#2b2a25", fontFamily: "Arial, Helvetica, sans-serif" }} aria-hidden={pos > 90 ? undefined : true}>
          <p className="mb-2 text-[12px] font-bold uppercase tracking-wider" style={{ color: "#6b6858" }}>
            The spreadsheet
          </p>
          <div className="mb-3 flex items-center gap-2 overflow-hidden border px-2 py-1.5 text-[12px]" style={{ borderColor: "#b9b39c", background: "#f4f0e2" }}>
            <span className="font-bold italic" style={{ color: "#6b6858" }}>
              fx
            </span>
            <span className="truncate" style={{ fontFamily: "Consolas, Menlo, monospace" }}>
              {FORMULA}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-[13px]" style={{ background: "#f4f0e2" }}>
              <thead>
                <tr style={{ background: "#dcd6c1" }}>
                  {["", "A", "B", "C", "D"].map((h, i) => (
                    <th key={i} className="border px-2 py-1 text-center text-[11px] font-normal" style={{ borderColor: "#b9b39c", color: "#6b6858" }}>
                      {h}
                    </th>
                  ))}
                </tr>
                <tr>
                  {["1", "Holding", "Invested", "Value", "XIRR %"].map((h, i) => (
                    <th key={i} className="border px-2 py-1.5 text-left font-bold" style={{ borderColor: "#b9b39c", background: i === 0 ? "#dcd6c1" : undefined }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r, i) => (
                  <tr key={r.name}>
                    <td className="border px-2 py-1.5 text-center text-[11px]" style={{ borderColor: "#b9b39c", background: "#dcd6c1", color: "#6b6858" }}>
                      {i + 2}
                    </td>
                    <td className="border px-2 py-1.5" style={{ borderColor: "#b9b39c" }}>
                      {r.name}
                    </td>
                    <td className="border px-2 py-1.5 text-right" style={{ borderColor: "#b9b39c" }}>
                      {r.invested}
                    </td>
                    <td className="border px-2 py-1.5 text-right" style={{ borderColor: "#b9b39c" }}>
                      {r.value}
                    </td>
                    <td className="border px-2 py-1.5 text-right font-bold" style={{ borderColor: "#b9b39c", color: r.sheet.startsWith("198") ? "#a4432a" : undefined }}>
                      {r.sheet}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[12px]" style={{ color: "#6b6858" }}>
            Infosys was bought seven weeks ago. The sheet annualises that into a 198,866% return.
          </p>
        </div>

        {/* Layer 2: Crorpus, revealed from the right */}
        <div
          className="absolute inset-0 p-4 sm:p-6"
          style={{ clipPath: `inset(0 0 0 ${pos}%)`, background: "var(--bg)", borderLeft: "1px solid var(--brass)" }}
          aria-hidden={pos < 10 ? undefined : true}
        >
          <div>
            <p className="eyebrow mb-2" style={{ color: "var(--brass-strong)" }}>
              Crorpus
            </p>
            <div className="mb-3 flex items-center gap-2 rounded-[4px] border border-line px-3 py-2 text-[13px] text-ink-2">
              Return shown as absolute until a holding is one year old, then XIRR.
            </div>
            <div className="overflow-x-auto">
              <table className="data-table min-w-[520px]">
                <thead>
                  <tr>
                    <th>Holding</th>
                    <th className="r">Invested</th>
                    <th className="r">Value</th>
                    <th className="r">Return</th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((r) => (
                    <tr key={r.name}>
                      <td>{r.name}</td>
                      <td className="r num">{r.invested}</td>
                      <td className="r num">{r.value}</td>
                      <td className="r num">
                        <span className={r.crorpus.startsWith("-") ? "loss" : "gain"}>{r.crorpus}</span>
                        <span className="ml-2 text-[11px] uppercase tracking-wider text-ink-3">{r.tag}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[13px] text-ink-3">Same four holdings. Nothing to type, no formula to break.</p>
          </div>
        </div>

        <input
          type="range"
          min={4}
          max={96}
          step={1}
          value={pos}
          onChange={(e) => {
            touched.current = true;
            setPos(Number(e.target.value));
          }}
          aria-label="Drag to compare the spreadsheet with Crorpus"
          aria-valuetext={`${Math.round(100 - pos)} percent Crorpus`}
          className="peer absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0"
        />
        {/* Handle */}
        <div className="pointer-events-none absolute inset-y-0 z-10 w-0" style={{ left: `${pos}%` }}>
          <div className="glass absolute top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[4px] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-[var(--brass-strong)]">
            <span className="block h-4 w-px bg-ink" />
            <span className="mx-[3px] block h-6 w-px bg-ink" />
            <span className="block h-4 w-px bg-ink" />
          </div>
        </div>
      </div>
      <p className="mt-3 text-[13px] text-ink-3">Drag the divider, or focus it and use the arrow keys.</p>
    </div>
  );
}
