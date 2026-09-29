"use client";

import { create } from "zustand";
import type { AppData, ReviewItem, ReviewNote } from "@/lib/data/demo-seed";
import type { BalanceAsset, FixedAsset, Fund, FundTxn, Goal, Liability, Snapshot, StockQuote, StockTxn } from "@/lib/data/types";
import { repository } from "@/lib/data/repository";
import { firstOfMonth, todayISO } from "@/lib/engine/dates";
import { derive } from "./derive";

type Status = "idle" | "loading" | "ready" | "error";

interface State {
  status: Status;
  data: AppData | null;
  error: string | null;
  load: () => Promise<void>;
  reset: () => Promise<void>;
  mutate: (fn: (d: AppData) => AppData) => Promise<void>;
  addFund: (f: Omit<Fund, "id" | "userId">) => string;
  updateFund: (id: string, patch: Partial<Fund>) => void;
  removeFund: (id: string) => void;
  addFundTxn: (t: Omit<FundTxn, "id" | "userId">) => void;
  removeFundTxn: (id: string) => void;
  addStockTxn: (t: Omit<StockTxn, "id" | "userId">) => string | null;
  removeStockTxn: (id: string) => void;
  upsertQuotes: (q: StockQuote[]) => void;
  upsertFixedAsset: (a: FixedAsset) => void;
  removeFixedAsset: (id: string) => void;
  upsertBalanceAsset: (a: BalanceAsset) => void;
  upsertLiability: (l: Liability) => void;
  removeLiability: (id: string) => void;
  upsertGoal: (g: Goal) => void;
  toggleReviewItem: (id: string) => void;
  addReviewNote: (n: Omit<ReviewNote, "id">) => void;
  removeReviewNote: (id: string) => void;
  takeSnapshot: () => void;
}

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;

export const useStore = create<State>((set, get) => ({
  status: "idle",
  data: null,
  error: null,

  load: async () => {
    if (get().status === "loading" || get().status === "ready") return;
    set({ status: "loading" });
    try {
      const data = await repository.load();
      set({ data, status: "ready", error: null });
    } catch (e) {
      set({ status: "error", error: e instanceof Error ? e.message : "Could not load your data." });
    }
  },

  reset: async () => {
    const data = await repository.reset();
    set({ data, status: "ready" });
  },

  mutate: async (fn) => {
    const cur = get().data;
    if (!cur) return;
    const next = fn(cur);
    set({ data: next });
    await repository.save(next);
  },

  addFund: (f) => {
    const id = uid("f");
    void get().mutate((d) => ({ ...d, funds: [...d.funds, { ...f, id, userId: d.userId }] }));
    return id;
  },
  updateFund: (id, patch) => void get().mutate((d) => ({ ...d, funds: d.funds.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),
  removeFund: (id) =>
    void get().mutate((d) => ({ ...d, funds: d.funds.filter((f) => f.id !== id), fundTxns: d.fundTxns.filter((t) => t.fundId !== id) })),
  addFundTxn: (t) => void get().mutate((d) => ({ ...d, fundTxns: [...d.fundTxns, { ...t, id: uid("ft"), userId: d.userId }] })),
  removeFundTxn: (id) => void get().mutate((d) => ({ ...d, fundTxns: d.fundTxns.filter((t) => t.id !== id) })),

  addStockTxn: (t) => {
    const d = get().data;
    if (!d) return null;
    const next = [...d.stockTxns, { ...t, id: uid("st"), userId: d.userId }];
    try {
      derive({ ...d, stockTxns: next }, todayISO());
    } catch (e) {
      return e instanceof Error ? e.message : "Invalid trade";
    }
    void get().mutate((cur) => ({ ...cur, stockTxns: next }));
    return null;
  },
  upsertQuotes: (qs) =>
    void get().mutate((d) => {
      const map = new Map(d.quotes.map((q) => [q.ticker, q]));
      for (const q of qs) map.set(q.ticker, q);
      return { ...d, quotes: [...map.values()] };
    }),
  removeStockTxn: (id) => void get().mutate((d) => ({ ...d, stockTxns: d.stockTxns.filter((t) => t.id !== id) })),

  upsertFixedAsset: (a) =>
    void get().mutate((d) => ({
      ...d,
      fixedAssets: d.fixedAssets.some((x) => x.id === a.id) ? d.fixedAssets.map((x) => (x.id === a.id ? a : x)) : [...d.fixedAssets, a],
    })),
  removeFixedAsset: (id) => void get().mutate((d) => ({ ...d, fixedAssets: d.fixedAssets.filter((x) => x.id !== id) })),
  upsertBalanceAsset: (a) =>
    void get().mutate((d) => ({
      ...d,
      balanceAssets: d.balanceAssets.some((x) => x.id === a.id) ? d.balanceAssets.map((x) => (x.id === a.id ? a : x)) : [...d.balanceAssets, a],
    })),
  upsertLiability: (l) =>
    void get().mutate((d) => ({
      ...d,
      liabilities: d.liabilities.some((x) => x.id === l.id) ? d.liabilities.map((x) => (x.id === l.id ? l : x)) : [...d.liabilities, l],
    })),
  removeLiability: (id) => void get().mutate((d) => ({ ...d, liabilities: d.liabilities.filter((x) => x.id !== id) })),
  upsertGoal: (g) =>
    void get().mutate((d) => ({
      ...d,
      goals: d.goals.some((x) => x.id === g.id) ? d.goals.map((x) => (x.id === g.id ? g : x)) : [...d.goals, g],
    })),

  toggleReviewItem: (id: string) =>
    void get().mutate((d) => ({
      ...d,
      reviewItems: d.reviewItems.map((i: ReviewItem) => (i.id === id ? { ...i, done: !i.done } : i)),
    })),
  addReviewNote: (n) => void get().mutate((d) => ({ ...d, reviewNotes: [...d.reviewNotes, { ...n, id: uid("n") }] })),
  removeReviewNote: (id) => void get().mutate((d) => ({ ...d, reviewNotes: d.reviewNotes.filter((n) => n.id !== id) })),

  takeSnapshot: () => {
    const d = get().data;
    if (!d) return;
    const today = todayISO();
    const month = firstOfMonth(today);
    const x = derive(d, today);
    const snap: Snapshot = {
      id: `snap-${month}`,
      userId: d.userId,
      month,
      totalAssets: x.netWorth.totalAssets,
      totalLiabilities: x.netWorth.totalLiabilities,
      netWorth: x.netWorth.netWorth,
      investmentValue: x.summary.currentValue,
    };
    void get().mutate((cur) => ({
      ...cur,
      snapshots: [...cur.snapshots.filter((s) => s.month !== month), snap].sort((a, b) => a.month.localeCompare(b.month)),
    }));
  },
}));

