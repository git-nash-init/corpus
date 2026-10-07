import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type {
  AppData,
  BalanceAsset,
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
} from "./types";
import * as M from "./mappers";

export type Sb = SupabaseClient<Database>;

function fail(context: string, error: { message: string } | null): asserts error is null {
  if (error) throw new Error(`${context}: ${error.message}`);
}

/** Loads everything the signed-in user owns, in parallel. Row level security scopes every query to them. */
export async function loadAll(sb: Sb): Promise<{ profile: Profile; data: AppData }> {
  // Read the session from the local cookie instead of a network call. Every query below is still checked by the
  // database against the signed token, so a stale or forged session simply returns nothing.
  const { data: auth } = await sb.auth.getSession();
  if (!auth.session) throw new Error("You are signed out. Please log in again.");
  const user = auth.session.user;

  const [profile, funds, fundTxns, stockTxns, quotes, fixed, balance, liabilities, goals, snapshots, items, notes, docs] = await Promise.all([
    sb.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    sb.from("funds").select("*").order("created_at"),
    sb.from("fund_txns").select("*").order("date"),
    sb.from("stock_txns").select("*").order("date"),
    sb.from("stock_quotes").select("*"),
    sb.from("fixed_assets").select("*").order("created_at"),
    sb.from("balance_assets").select("*").order("created_at"),
    sb.from("liabilities").select("*").order("created_at"),
    sb.from("goals").select("*").order("created_at"),
    sb.from("snapshots").select("*").order("month"),
    sb.from("review_items").select("*").order("position"),
    sb.from("review_notes").select("*").order("created_at"),
    sb.from("documents").select("*").order("created_at", { ascending: false }),
  ]);

  for (const [label, r] of [
    ["profile", profile], ["funds", funds], ["fund transactions", fundTxns], ["stock trades", stockTxns], ["prices", quotes],
    ["fixed assets", fixed], ["assets", balance], ["liabilities", liabilities], ["goals", goals], ["snapshots", snapshots],
    ["review items", items], ["review notes", notes], ["documents", docs],
  ] as const) {
    fail(`Could not load ${label}`, r.error);
  }
  if (!profile.data) throw new Error("Your profile is missing. Please sign out and sign in again.");

  return {
    profile: M.profileFromRow(profile.data, user.email ?? ""),
    data: {
      version: 1,
      userId: user.id,
      funds: (funds.data ?? []).map(M.fundFromRow),
      fundTxns: (fundTxns.data ?? []).map(M.fundTxnFromRow),
      stockTxns: (stockTxns.data ?? []).map(M.stockTxnFromRow),
      quotes: (quotes.data ?? []).map(M.quoteFromRow),
      fixedAssets: (fixed.data ?? []).map(M.fixedAssetFromRow),
      balanceAssets: (balance.data ?? []).map(M.balanceAssetFromRow),
      liabilities: (liabilities.data ?? []).map(M.liabilityFromRow),
      goals: (goals.data ?? []).map(M.goalFromRow),
      snapshots: (snapshots.data ?? []).map(M.snapshotFromRow),
      reviewItems: (items.data ?? []).map(M.reviewItemFromRow),
      reviewNotes: (notes.data ?? []).map(M.reviewNoteFromRow),
      documents: (docs.data ?? []).map(M.documentFromRow),
    },
  };
}

// Writes. user_id is filled by the column default (auth.uid()), and RLS rejects anything not owned by the caller.

export async function upsertFund(sb: Sb, f: Fund) {
  const { error } = await sb.from("funds").upsert(M.fundToRow(f));
  fail("Could not save the fund", error);
}
export async function patchFund(sb: Sb, f: Fund) {
  const { id, ...row } = M.fundToRow(f);
  const { error } = await sb.from("funds").update(row).eq("id", id!);
  fail("Could not update the fund", error);
}
export async function deleteFund(sb: Sb, id: string) {
  const { error } = await sb.from("funds").delete().eq("id", id);
  fail("Could not delete the fund", error);
}
export async function insertFundTxn(sb: Sb, t: FundTxn) {
  const { error } = await sb.from("fund_txns").insert(M.fundTxnToRow(t));
  fail("Could not save the transaction", error);
}
export async function deleteFundTxn(sb: Sb, id: string) {
  const { error } = await sb.from("fund_txns").delete().eq("id", id);
  fail("Could not delete the transaction", error);
}
export async function insertFundTxns(sb: Sb, rows: FundTxn[]) {
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await sb.from("fund_txns").insert(rows.slice(i, i + 200).map(M.fundTxnToRow));
    fail("Could not save the transactions", error);
  }
}

export async function insertStockTxn(sb: Sb, t: StockTxn) {
  const { error } = await sb.from("stock_txns").insert(M.stockTxnToRow(t));
  fail("Could not save the trade", error);
}
export async function insertStockTxns(sb: Sb, rows: StockTxn[]) {
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await sb.from("stock_txns").insert(rows.slice(i, i + 200).map(M.stockTxnToRow));
    fail("Could not save the trades", error);
  }
}
export async function deleteStockTxn(sb: Sb, id: string) {
  const { error } = await sb.from("stock_txns").delete().eq("id", id);
  fail("Could not delete the trade", error);
}
export async function upsertQuotes(sb: Sb, userId: string, quotes: StockQuote[]) {
  if (!quotes.length) return;
  const { error } = await sb.from("stock_quotes").upsert(quotes.map((q) => ({ ...M.quoteToRow(q), user_id: userId })), { onConflict: "user_id,ticker" });
  fail("Could not save prices", error);
}

export async function upsertFixedAsset(sb: Sb, a: FixedAsset) {
  const { error } = await sb.from("fixed_assets").upsert(M.fixedAssetToRow(a));
  fail("Could not save the asset", error);
}
export async function deleteFixedAsset(sb: Sb, id: string) {
  const { error } = await sb.from("fixed_assets").delete().eq("id", id);
  fail("Could not delete the asset", error);
}
export async function upsertBalanceAsset(sb: Sb, a: BalanceAsset) {
  const { error } = await sb.from("balance_assets").upsert(M.balanceAssetToRow(a));
  fail("Could not save the asset", error);
}
export async function upsertLiability(sb: Sb, l: Liability) {
  const { error } = await sb.from("liabilities").upsert(M.liabilityToRow(l));
  fail("Could not save the liability", error);
}
export async function deleteLiability(sb: Sb, id: string) {
  const { error } = await sb.from("liabilities").delete().eq("id", id);
  fail("Could not delete the liability", error);
}
export async function upsertGoal(sb: Sb, g: Goal) {
  const { error } = await sb.from("goals").upsert(M.goalToRow(g));
  fail("Could not save the goal", error);
}
export async function deleteGoal(sb: Sb, id: string) {
  const { error } = await sb.from("goals").delete().eq("id", id);
  fail("Could not delete the goal", error);
}
export async function upsertSnapshot(sb: Sb, userId: string, s: Snapshot) {
  const { error } = await sb.from("snapshots").upsert({ ...M.snapshotToRow(s), user_id: userId }, { onConflict: "user_id,month" });
  fail("Could not save the snapshot", error);
}

export async function setReviewDone(sb: Sb, id: string, done: boolean) {
  const { error } = await sb.from("review_items").update({ done }).eq("id", id);
  fail("Could not update the checklist", error);
}
export async function insertReviewNote(sb: Sb, n: ReviewNote) {
  const { error } = await sb.from("review_notes").insert(M.reviewNoteToRow(n));
  fail("Could not save the note", error);
}
export async function deleteReviewNote(sb: Sb, id: string) {
  const { error } = await sb.from("review_notes").delete().eq("id", id);
  fail("Could not delete the note", error);
}

export async function updateProfile(sb: Sb, id: string, patch: Partial<Pick<Profile, "displayName" | "avatar" | "theme" | "onboardedAt">>) {
  const row: Database["public"]["Tables"]["profiles"]["Update"] = {};
  if (patch.displayName !== undefined) row.display_name = patch.displayName;
  if (patch.avatar !== undefined) row.avatar = patch.avatar;
  if (patch.theme !== undefined) row.theme = patch.theme;
  if (patch.onboardedAt !== undefined) row.onboarded_at = patch.onboardedAt;
  const { error } = await sb.from("profiles").update(row).eq("id", id);
  fail("Could not update your profile", error);
}

/** Removes every record the user owns except the account and profile. Files are removed separately. */
export async function wipeData(sb: Sb) {
  // fund_txns cascade from funds; review items are kept so the checklist survives.
  for (const t of ["funds", "stock_txns", "stock_quotes", "fixed_assets", "balance_assets", "liabilities", "goals", "snapshots", "review_notes"] as const) {
    const { error } = await sb.from(t).delete().not("id", "is", null);
    fail(`Could not clear ${t}`, error);
  }
}

/** Inserts everything an import produced. Funds go first because transactions reference them. */
export async function insertImported(
  sb: Sb,
  userId: string,
  r: {
    funds: Fund[];
    fundTxns: FundTxn[];
    stockTxns: StockTxn[];
    quotes: StockQuote[];
    fixedAssets: FixedAsset[];
    balanceAssets: BalanceAsset[];
    liabilities: Liability[];
    goals: Goal[];
  },
) {
  if (r.funds.length) {
    const { error } = await sb.from("funds").insert(r.funds.map(M.fundToRow));
    fail("Could not import funds", error);
  }
  await insertFundTxns(sb, r.fundTxns);
  await insertStockTxns(sb, r.stockTxns);
  await upsertQuotes(sb, userId, r.quotes);
  if (r.fixedAssets.length) {
    const { error } = await sb.from("fixed_assets").insert(r.fixedAssets.map(M.fixedAssetToRow));
    fail("Could not import assets", error);
  }
  if (r.balanceAssets.length) {
    const { error } = await sb.from("balance_assets").insert(r.balanceAssets.map(M.balanceAssetToRow));
    fail("Could not import balances", error);
  }
  if (r.liabilities.length) {
    const { error } = await sb.from("liabilities").insert(r.liabilities.map(M.liabilityToRow));
    fail("Could not import liabilities", error);
  }
  if (r.goals.length) {
    const { error } = await sb.from("goals").insert(r.goals.map(M.goalToRow));
    fail("Could not import the goal", error);
  }
}
