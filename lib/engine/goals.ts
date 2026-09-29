import type { Goal, ISODate } from "@/lib/data/types";
import { addMonths, monthsBetween } from "./dates";
import { fv, nper, pmt } from "./tvm";
import { roundMoney } from "./money";

export type GoalStatus = "Achieved" | "On track" | "Behind target";

export interface GoalSummary {
  progress: number;
  remaining: number;
  monthsLeft: number;
  /** Monthly SIP needed to reach the target by the target date, given the corpus and expected return. 0 if none needed. */
  sipNeeded: number;
  projectedAtTarget: number;
  surplus: number;
  expectedCompletion: ISODate | null;
  onTrack: boolean;
  status: GoalStatus;
}

/**
 * All compounding is monthly at expectedReturn / 12 (the sheet mixed monthly and annual compounding, and used the
 * portfolio's absolute return as if it were an annual rate).
 */
export function goalSummary(goal: Goal, currentValue: number, asOf: ISODate): GoalSummary {
  const r = goal.expectedReturn / 12;
  const monthsLeft = Math.max(1, monthsBetween(asOf, goal.targetDate));
  const achieved = currentValue >= goal.target;

  const projectedAtTarget = roundMoney(fv(r, monthsLeft, -goal.monthlySip, -currentValue));
  const corpusAlone = fv(r, monthsLeft, 0, -currentValue);
  const sipNeeded = corpusAlone >= goal.target ? 0 : Math.max(0, roundMoney(-pmt(r, monthsLeft, -currentValue, goal.target)));

  let expectedCompletion: ISODate | null;
  if (achieved) {
    expectedCompletion = asOf;
  } else {
    const n = nper(r, -goal.monthlySip, -currentValue, goal.target);
    expectedCompletion = n === null ? null : addMonths(asOf, Math.ceil(n));
  }

  const onTrack = achieved || projectedAtTarget >= goal.target;
  return {
    progress: goal.target > 0 ? currentValue / goal.target : 0,
    remaining: Math.max(0, roundMoney(goal.target - currentValue)),
    monthsLeft,
    sipNeeded,
    projectedAtTarget,
    surplus: Math.max(0, roundMoney(projectedAtTarget - goal.target)),
    expectedCompletion,
    onTrack,
    status: achieved ? "Achieved" : onTrack ? "On track" : "Behind target",
  };
}

export function projectionSeries(goal: Goal, currentValue: number, startYear: number, years: number) {
  const r = goal.expectedReturn / 12;
  const rows: { year: number; value: number; target: number }[] = [];
  for (let k = 0; k <= years; k++) {
    rows.push({
      year: startYear + k,
      value: k === 0 ? currentValue : roundMoney(fv(r, 12 * k, -goal.monthlySip, -currentValue)),
      target: goal.target,
    });
  }
  return rows;
}
