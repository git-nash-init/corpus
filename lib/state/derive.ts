import type { AppData } from "@/lib/data/demo-seed";
import type { ISODate } from "@/lib/data/types";
import { categoryAllocation, fundPosition, sipCheck } from "@/lib/engine/mutualFunds";
import { portfolioXirr, sectorAllocation, stockPositions, stockTotals, tradeSummary } from "@/lib/engine/stocks";
import { fixedAssetSummary, liquidityLadder } from "@/lib/engine/fixedAssets";
import { dashboardSummary, investmentAllocation } from "@/lib/engine/allocation";
import { buildNetWorth } from "@/lib/engine/netWorth";
import { goalSummary, projectionSeries } from "@/lib/engine/goals";
import { checklistProgress, snapshotGrowth } from "@/lib/engine/review";
import { roundMoney, sumMoney } from "@/lib/engine/money";

/** Every derived number the screens show, computed from raw records. Nothing derived is ever stored. */
export function derive(data: AppData, asOf: ISODate) {
  const fundRows = data.funds.map((fund) => ({ fund, position: fundPosition(fund, data.fundTxns, asOf) }));
  const mf = {
    invested: sumMoney(fundRows.map((r) => r.position.invested)),
    currentValue: sumMoney(fundRows.map((r) => r.position.currentValue)),
    monthlySip: sumMoney(data.funds.filter((f) => f.sipStatus === "Active").map((f) => f.sipAmount)),
  };
  const mfGain = roundMoney(mf.currentValue - mf.invested);
  const sip = sipCheck(data.funds, data.fundTxns, asOf);
  const mfAllocation = categoryAllocation(fundRows.map((r) => ({ category: r.fund.category, currentValue: r.position.currentValue })));

  const positions = stockPositions(data.stockTxns, data.quotes, asOf);
  const stockSum = stockTotals(positions);
  const stockXirr = portfolioXirr(data.stockTxns, stockSum.currentValue, asOf);
  // Realised P&L needs closed positions too.
  const allPositions = stockPositions(data.stockTxns, data.quotes, asOf, { includeClosed: true });
  const realised = sumMoney(allPositions.map((p) => p.realisedGain));

  const fixed = fixedAssetSummary(data.fixedAssets);
  const summary = dashboardSummary({
    mf: { invested: mf.invested, currentValue: mf.currentValue },
    stocks: { invested: stockSum.invested, currentValue: stockSum.currentValue },
    fixed,
  });
  const allocation = investmentAllocation({ mfValue: mf.currentValue, stocksValue: stockSum.currentValue, fixed: data.fixedAssets });
  const netWorth = buildNetWorth({
    mfValue: mf.currentValue,
    stocksValue: stockSum.currentValue,
    fixed: data.fixedAssets,
    balanceAssets: data.balanceAssets,
    liabilities: data.liabilities,
  });

  const goals = data.goals.map((goal) => ({
    goal,
    summary: goalSummary(goal, summary.currentValue, asOf),
    series: projectionSeries(goal, summary.currentValue, Number(asOf.slice(0, 4)), Math.max(1, Number(goal.targetDate.slice(0, 4)) - Number(asOf.slice(0, 4)) + 1)),
  }));

  const growth = snapshotGrowth(data.snapshots);
  const lastSnapshot = growth.length ? growth[growth.length - 1] : null;

  return {
    asOf,
    fundRows,
    mf: { ...mf, gain: mfGain, absReturn: mf.invested > 0 ? mfGain / mf.invested : 0 },
    sip,
    mfAllocation,
    positions,
    stockSum: { ...stockSum, xirr: stockXirr, realised },
    stockSectors: sectorAllocation(positions),
    trades: tradeSummary(data.stockTxns),
    fixed,
    ladder: liquidityLadder(data.fixedAssets),
    summary,
    allocation,
    netWorth,
    goals,
    snapshots: growth,
    lastSnapshot,
    checklist: checklistProgress(data.reviewItems),
  };
}

export type Derived = ReturnType<typeof derive>;
