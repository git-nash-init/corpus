import type { BalanceAsset, FixedAsset, Liability } from "@/lib/data/types";
import { roundMoney, sumMoney } from "./money";

export interface NetWorthLine {
  label: string;
  group: string;
  value: number;
}

export function buildNetWorth(input: {
  mfValue: number;
  stocksValue: number;
  fixed: readonly FixedAsset[];
  balanceAssets: readonly BalanceAsset[];
  liabilities: readonly Liability[];
}) {
  const lines: NetWorthLine[] = [
    { label: "Mutual funds", group: "Investments", value: input.mfValue },
    { label: "Direct stocks", group: "Investments", value: input.stocksValue },
    ...input.fixed.map((a) => ({ label: a.name, group: a.kind === "Gold" || a.kind === "SGB" || a.kind === "Silver" ? "Commodities" : "Fixed income and retirement", value: a.currentValue })),
    ...input.balanceAssets.map((a) => ({ label: a.name, group: a.kind === "Cash" ? "Cash" : a.kind === "RealEstate" ? "Real estate" : "Personal assets", value: a.value })),
  ];
  const totalAssets = sumMoney(lines.map((l) => l.value));
  const totalLiabilities = sumMoney(input.liabilities.map((l) => l.outstanding));
  const debtToAsset = totalAssets > 0 ? totalLiabilities / totalAssets : 0;
  return {
    lines,
    totalAssets,
    totalLiabilities,
    netWorth: roundMoney(totalAssets - totalLiabilities),
    debtToAsset,
    /** The sheet's guidance: keep debt under 30% of assets. */
    healthy: debtToAsset < 0.3,
  };
}
