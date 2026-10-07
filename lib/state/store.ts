"use client";

import { create } from "zustand";
import type {
  AppData,
  BalanceAsset,
  DocumentRecord,
  FixedAsset,
  Fund,
  FundTxn,
  Goal,
  Liability,
  Profile,
  ReviewNote,
  Snapshot,
  StockQuote,
  StockTxn,
} from "@/lib/data/types";
import * as repo from "@/lib/data/supabaseRepository";
import { supabaseBrowser } from "@/lib/supabase/client";
import { firstOfMonth, todayISO } from "@/lib/engine/dates";
import { fundLatest, stockQuotes } from "@/lib/market/api";
import { STOCK_DIRECTORY } from "@/lib/data/stock-directory";
import { derive } from "./derive";

type Status = "idle" | "loading" | "ready" | "error";

interface State {
  status: Status;
  data: AppData | null;
  profile: Profile | null;
  error: string | null;
  /** A short message for the user after a failed save. Cleared by dismissNotice. */
  notice: string | null;
  prices: { state: "idle" | "loading" | "ok" | "partial" | "error"; at: string | null; missed: string[] };
  /** Fetches live fund NAVs and NSE prices, then saves any that changed. */
  refreshPrices: () => Promise<void>;
  dismissNotice: () => void;
  load: () => Promise<void>;
  reload: () => Promise<void>;
  clear: () => void;
  /** Applies a change locally right away, saves it, and restores the server's data if the save fails. */
  mutate: (fn: (d: AppData) => AppData, persist: (sb: repo.Sb, d: AppData) => Promise<void>) => Promise<void>;

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
  removeGoal: (id: string) => void;
  toggleReviewItem: (id: string) => void;
  addReviewNote: (n: Omit<ReviewNote, "id">) => void;
  removeReviewNote: (id: string) => void;
  takeSnapshot: () => void;
  updateProfile: (patch: Partial<Pick<Profile, "displayName" | "avatar" | "theme" | "onboardedAt">>) => Promise<void>;
  /** Replaces the document list after the documents page has uploaded or deleted files. */
  setDocuments: (fn: (docs: DocumentRecord[]) => DocumentRecord[]) => void;
  wipeData: () => Promise<void>;
}

const uid = () => crypto.randomUUID();
const sb = () => supabaseBrowser();

export const useStore = create<State>((set, get) => ({
  status: "idle",
  data: null,
  profile: null,
  error: null,
  notice: null,
  prices: { state: "idle", at: null, missed: [] },
  dismissNotice: () => set({ notice: null }),

  load: async () => {
    if (get().status === "loading" || get().status === "ready") return;
    set({ status: "loading" });
    try {
      let loaded;
      try {
        loaded = await repo.loadAll(sb());
      } catch (first) {
        // One retry covers a dropped connection or a token refresh in flight. A signed-out error is not retried.
        if (first instanceof Error && first.message.includes("signed out")) throw first;
        await new Promise((r) => setTimeout(r, 900));
        loaded = await repo.loadAll(sb());
      }
      set({ profile: loaded.profile, data: loaded.data, status: "ready", error: null });
    } catch (e) {
      set({ status: "error", error: e instanceof Error ? e.message : "Could not load your data." });
    }
  },

  reload: async () => {
    try {
      const { profile, data } = await repo.loadAll(sb());
      set({ profile, data, status: "ready", error: null });
    } catch (e) {
      set({ status: "error", error: e instanceof Error ? e.message : "Could not load your data." });
    }
  },

  clear: () => set({ status: "idle", data: null, profile: null, error: null, notice: null, prices: { state: "idle", at: null, missed: [] } }),

  refreshPrices: async () => {
    const d = get().data;
    if (!d || get().prices.state === "loading") return;
    set({ prices: { ...get().prices, state: "loading" } });

    const tickers = [...new Set(d.stockTxns.map((t) => t.ticker))];
    const liveFunds = d.funds.filter((f) => f.amfiCode);
    const missed: string[] = [];

    const [quotes, navs] = await Promise.all([
      stockQuotes(tickers).catch(() => null),
      Promise.all(liveFunds.map((f) => fundLatest(f.amfiCode!).then((i) => ({ id: f.id, latest: i.latest })).catch(() => null))),
    ]);

    const quoteUpdates: StockQuote[] = [];
    if (quotes) {
      for (const t of tickers) {
        const live = quotes[t];
        if (!live) {
          missed.push(t);
          continue;
        }
        const existing = d.quotes.find((q) => q.ticker === t);
        if (existing && Math.abs(existing.cmp - live.price) < 0.005) continue;
        const entry = STOCK_DIRECTORY.find((e) => e.ticker === t);
        quoteUpdates.push({ ticker: t, name: existing?.name ?? entry?.name ?? t, sector: existing?.sector ?? entry?.sector ?? "Other", cmp: live.price, asOf: new Date(live.time || Date.now()).toISOString() });
      }
    } else if (tickers.length) {
      missed.push(...tickers);
    }

    const fundUpdates: Fund[] = [];
    navs.forEach((n, i) => {
      const f = liveFunds[i];
      if (!n) return missed.push(f.name);
      if (Math.abs(f.latestNav - n.latest.nav) < 0.0005 && f.navDate === n.latest.date) return;
      fundUpdates.push({ ...f, latestNav: n.latest.nav, navDate: n.latest.date });
    });

    if (quoteUpdates.length || fundUpdates.length) {
      await get().mutate(
        (cur) => ({
          ...cur,
          funds: cur.funds.map((f) => fundUpdates.find((u) => u.id === f.id) ?? f),
          quotes: [...new Map([...cur.quotes, ...quoteUpdates].map((q) => [q.ticker, q])).values()],
        }),
        async (sb, cur) => {
          await repo.upsertQuotes(sb, cur.userId, quoteUpdates);
          for (const f of fundUpdates) await repo.patchFund(sb, f);
        },
      );
    }
    const asked = tickers.length + liveFunds.length;
    set({ prices: { state: asked === 0 ? "idle" : missed.length === 0 ? "ok" : missed.length < asked ? "partial" : "error", at: new Date().toISOString(), missed } });
  },

  mutate: async (fn, persist) => {
    const cur = get().data;
    if (!cur) return;
    const next = fn(cur);
    set({ data: next });
    try {
      await persist(sb(), next);
    } catch (e) {
      set({ notice: e instanceof Error ? e.message : "That change could not be saved." });
      await get().reload();
    }
  },

  addFund: (f) => {
    const id = uid();
    const d = get().data;
    if (!d) return id;
    const fund: Fund = { ...f, id, userId: d.userId };
    void get().mutate((cur) => ({ ...cur, funds: [...cur.funds, fund] }), (s) => repo.upsertFund(s, fund));
    return id;
  },
  updateFund: (id, patch) => {
    const d = get().data;
    const existing = d?.funds.find((f) => f.id === id);
    if (!existing) return;
    const fund = { ...existing, ...patch };
    void get().mutate((cur) => ({ ...cur, funds: cur.funds.map((f) => (f.id === id ? fund : f)) }), (s) => repo.patchFund(s, fund));
  },
  removeFund: (id) =>
    void get().mutate(
      (d) => ({ ...d, funds: d.funds.filter((f) => f.id !== id), fundTxns: d.fundTxns.filter((t) => t.fundId !== id) }),
      (s) => repo.deleteFund(s, id),
    ),
  addFundTxn: (t) => {
    const d = get().data;
    if (!d) return;
    const txn: FundTxn = { ...t, id: uid(), userId: d.userId };
    void get().mutate((cur) => ({ ...cur, fundTxns: [...cur.fundTxns, txn] }), (s) => repo.insertFundTxn(s, txn));
  },
  removeFundTxn: (id) => void get().mutate((d) => ({ ...d, fundTxns: d.fundTxns.filter((t) => t.id !== id) }), (s) => repo.deleteFundTxn(s, id)),

  addStockTxn: (t) => {
    const d = get().data;
    if (!d) return "Your data has not loaded yet.";
    const txn: StockTxn = { ...t, id: uid(), userId: d.userId };
    try {
      derive({ ...d, stockTxns: [...d.stockTxns, txn] }, todayISO());
    } catch (e) {
      return e instanceof Error ? e.message : "Invalid trade";
    }
    void get().mutate((cur) => ({ ...cur, stockTxns: [...cur.stockTxns, txn] }), (s) => repo.insertStockTxn(s, txn));
    return null;
  },
  removeStockTxn: (id) => void get().mutate((d) => ({ ...d, stockTxns: d.stockTxns.filter((t) => t.id !== id) }), (s) => repo.deleteStockTxn(s, id)),

  upsertQuotes: (qs) =>
    void get().mutate(
      (d) => {
        const map = new Map(d.quotes.map((q) => [q.ticker, q]));
        for (const q of qs) map.set(q.ticker, q);
        return { ...d, quotes: [...map.values()] };
      },
      (s, d) => repo.upsertQuotes(s, d.userId, qs),
    ),

  upsertFixedAsset: (a) =>
    void get().mutate(
      (d) => ({ ...d, fixedAssets: d.fixedAssets.some((x) => x.id === a.id) ? d.fixedAssets.map((x) => (x.id === a.id ? a : x)) : [...d.fixedAssets, a] }),
      (s) => repo.upsertFixedAsset(s, a),
    ),
  removeFixedAsset: (id) => void get().mutate((d) => ({ ...d, fixedAssets: d.fixedAssets.filter((x) => x.id !== id) }), (s) => repo.deleteFixedAsset(s, id)),
  upsertBalanceAsset: (a) =>
    void get().mutate(
      (d) => ({ ...d, balanceAssets: d.balanceAssets.some((x) => x.id === a.id) ? d.balanceAssets.map((x) => (x.id === a.id ? a : x)) : [...d.balanceAssets, a] }),
      (s) => repo.upsertBalanceAsset(s, a),
    ),
  upsertLiability: (l) =>
    void get().mutate(
      (d) => ({ ...d, liabilities: d.liabilities.some((x) => x.id === l.id) ? d.liabilities.map((x) => (x.id === l.id ? l : x)) : [...d.liabilities, l] }),
      (s) => repo.upsertLiability(s, l),
    ),
  removeLiability: (id) => void get().mutate((d) => ({ ...d, liabilities: d.liabilities.filter((x) => x.id !== id) }), (s) => repo.deleteLiability(s, id)),
  upsertGoal: (g) =>
    void get().mutate(
      (d) => ({ ...d, goals: d.goals.some((x) => x.id === g.id) ? d.goals.map((x) => (x.id === g.id ? g : x)) : [...d.goals, g] }),
      (s) => repo.upsertGoal(s, g),
    ),
  removeGoal: (id) => void get().mutate((d) => ({ ...d, goals: d.goals.filter((x) => x.id !== id) }), (s) => repo.deleteGoal(s, id)),

  toggleReviewItem: (id) => {
    const item = get().data?.reviewItems.find((i) => i.id === id);
    if (!item) return;
    const done = !item.done;
    void get().mutate((d) => ({ ...d, reviewItems: d.reviewItems.map((i) => (i.id === id ? { ...i, done } : i)) }), (s) => repo.setReviewDone(s, id, done));
  },
  addReviewNote: (n) => {
    const note: ReviewNote = { ...n, id: uid() };
    void get().mutate((d) => ({ ...d, reviewNotes: [...d.reviewNotes, note] }), (s) => repo.insertReviewNote(s, note));
  },
  removeReviewNote: (id) => void get().mutate((d) => ({ ...d, reviewNotes: d.reviewNotes.filter((n) => n.id !== id) }), (s) => repo.deleteReviewNote(s, id)),

  takeSnapshot: () => {
    const d = get().data;
    if (!d) return;
    const today = todayISO();
    const month = firstOfMonth(today);
    const x = derive(d, today);
    const snap: Snapshot = {
      id: uid(),
      userId: d.userId,
      month,
      totalAssets: x.netWorth.totalAssets,
      totalLiabilities: x.netWorth.totalLiabilities,
      netWorth: x.netWorth.netWorth,
      investmentValue: x.summary.currentValue,
    };
    void get().mutate(
      (cur) => ({ ...cur, snapshots: [...cur.snapshots.filter((s) => s.month !== month), snap].sort((a, b) => a.month.localeCompare(b.month)) }),
      (s) => repo.upsertSnapshot(s, d.userId, snap),
    );
  },

  updateProfile: async (patch) => {
    const p = get().profile;
    if (!p) return;
    set({ profile: { ...p, ...patch } });
    try {
      await repo.updateProfile(sb(), p.id, patch);
    } catch (e) {
      set({ profile: p, notice: e instanceof Error ? e.message : "Could not update your profile." });
    }
  },

  setDocuments: (fn) => {
    const d = get().data;
    if (d) set({ data: { ...d, documents: fn(d.documents) } });
  },

  wipeData: async () => {
    try {
      await repo.wipeData(sb());
    } catch (e) {
      set({ notice: e instanceof Error ? e.message : "Could not clear your data." });
    }
    await get().reload();
  },
}));
