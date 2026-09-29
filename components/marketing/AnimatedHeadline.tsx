"use client";

import { motion, useReducedMotion } from "motion/react";

/** Word by word reveal for the hero headline. Renders plain text under reduced motion. */
export function AnimatedHeadline({ text, className }: { text: string; className?: string }) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  return (
    <h1 className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom" aria-hidden="true">
          <motion.span
            className="inline-block"
            initial={reduce ? false : { y: "105%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.75, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}
