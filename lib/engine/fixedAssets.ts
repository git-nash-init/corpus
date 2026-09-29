import type { FixedAsset, LiquidityTag } from "@/lib/data/types";
import { roundMoney, sumMoney } from "./money";

export function fixedAssetSummary(assets: readonly FixedAsset[]) {
  const invested = sumMoney(assets.map((a) => a.invested));
  const currentValue = sumMoney(assets.map((a) => a.currentValue));
  return {
    invested,
    currentValue,
    gain: roundMoney(currentValue - invested),
    annualContribution: sumMoney(assets.map((a) => a.annualContribution)),
  };
}

export const LIQUIDITY_ORDER: readonly LiquidityTag[] = ["Highly Liquid", "Semi-Liquid", "Locked"];

export function liquidityLadder(assets: readonly FixedAsset[]) {
  const total = sumMoney(assets.map((a) => a.currentValue));
  return LIQUIDITY_ORDER.map((liquidity) => {
    const value = sumMoney(assets.filter((a) => a.liquidity === liquidity).map((a) => a.currentValue));
    return { liquidity, value, share: total > 0 ? value / total : 0 };
  });
}
