/** Ordered categorical palette: brass, slate, olive, clay, stone, sage, plus two neutrals. Never rainbow. */
export const CHART_COLORS = [
  "var(--brass)",
  "var(--slate)",
  "var(--olive)",
  "var(--clay)",
  "var(--stone)",
  "var(--gain)",
  "var(--text-2)",
  "var(--line-strong)",
] as const;

export const colorAt = (i: number) => CHART_COLORS[i % CHART_COLORS.length];
