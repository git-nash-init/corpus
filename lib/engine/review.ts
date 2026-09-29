import type { Snapshot } from "@/lib/data/types";

/** Percentage change vs last month. Null when there is no usable prior value. */
export function compareMetric(current: number, previous: number | undefined | null): number | null {
  if (previous === undefined || previous === null || previous === 0) return null;
  return (current - previous) / previous;
}

/** Month-on-month net worth growth, measured against the most recent earlier snapshot with a positive net worth. */
export function snapshotGrowth(snapshots: readonly Snapshot[]) {
  const sorted = [...snapshots].sort((a, b) => a.month.localeCompare(b.month));
  let prev: number | null = null;
  return sorted.map((s) => {
    let growth: number | null = null;
    if (s.netWorth > 0 && prev !== null) growth = (s.netWorth - prev) / prev;
    if (s.netWorth > 0) prev = s.netWorth;
    return { ...s, growth };
  });
}

export function checklistProgress(items: readonly { done: boolean }[]): number {
  if (items.length === 0) return 0;
  return items.filter((i) => i.done).length / items.length;
}
