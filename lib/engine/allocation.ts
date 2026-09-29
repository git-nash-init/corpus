import type { FixedAsset } from "@/lib/data/types";
import { roundMoney, sumMoney } from "./money";

interface Bucket {
  invested: number;
  currentValue: number;
}

export function dashboardSummary(input: { mf: Bucket; stocks: Bucket; fixed: Bucket }) {
  const invested = sumMoney([input.mf.invested, input.stocks.invested, input.fixed.invested]);
  const currentValue = sumMoney([input.mf.currentValue, input.stocks.currentValue, input.fixed.currentValue]);
  const gain = roundMoney(currentValue - invested);
  return { invested, currentValue, gain, gainPct: invested > 0 ? gain / invested : 0 };
}

export const ALLOCATION_LABELS = ["Mutual Funds", "Stocks", "PPF", "EPF", "NPS", "FD", "Gold", "Silver"] as const;
export type AllocationLabel = (typeof ALLOCATION_LABELS)[number];

/** The sheet's eight investment classes. Sovereign gold bonds are grouped with gold, as in the sheet's net worth tab. */
export function investmentAllocation(input: { mfValue: number; stocksValue: number; fixed: readonly FixedAsset[] }) {
  const of = (...kinds: FixedAsset["kind"][]) =>
    sumMoney(input.fixed.filter((a) => kinds.includes(a.kind)).map((a) => a.currentValue));
  const values: Record<AllocationLabel, number> = {
    "Mutual Funds": input.mfValue,
    Stocks: input.stocksValue,
    PPF: of("PPF"),
    EPF: of("EPF"),
    NPS: of("NPS"),
    FD: of("FD"),
    Gold: of("Gold", "SGB"),
    Silver: of("Silver"),
  };
  const total = sumMoney(Object.values(values));
  return ALLOCATION_LABELS.map((label) => ({
    label,
    value: values[label],
    share: total > 0 ? values[label] / total : 0,
  }));
}
