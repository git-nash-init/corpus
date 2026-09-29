"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

/** Counts from the previous value to the new one. Shows the final value immediately under reduced motion. */
export function CountUp({
  value,
  format,
  duration = 1.1,
  className,
}: {
  value: number;
  format: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(0);
  const started = useRef(false);

  useEffect(() => {
    if (reduce) return;
    if (!inView && !started.current) return; // keep showing the real value until it scrolls into view
    started.current = true;
    const controls = animate(from.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setShown(v),
      onComplete: () => {
        from.current = value;
      },
    });
    return () => controls.stop();
  }, [value, inView, reduce, duration]);

  return (
    <span ref={ref} className={className} aria-label={format(value)}>
      <span aria-hidden="true">{format(reduce ? value : shown)}</span>
    </span>
  );
}
