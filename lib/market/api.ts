import type { NavPoint } from "./nav";

export interface FundHit {
  code: string;
  name: string;
}

export interface FundInfo {
  code: string;
  name: string;
  house: string;
  schemeCategory: string;
  category: "Equity" | "Debt" | "Hybrid" | "Index" | "Other";
  latest: NavPoint;
  history?: [string, number][];
}

export interface StockHit {
  ticker: string;
  name: string;
  sector: string | null;
}

export interface LiveQuote {
  price: number;
  time: number;
  previousClose: number | null;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(res.status === 404 ? "Not found" : "The market data service is unavailable right now.");
  return (await res.json()) as T;
}

export async function searchFunds(q: string): Promise<FundHit[]> {
  const { results } = await getJson<{ results: FundHit[] }>(`/api/mf/search?q=${encodeURIComponent(q)}`);
  return results;
}

export const fundLatest = (code: string) => getJson<FundInfo>(`/api/mf/${code}`);

const historyCache = new Map<string, Promise<NavPoint[]>>();

/** Full NAV history for a scheme, fetched once per session. */
export function fundHistory(code: string): Promise<NavPoint[]> {
  let p = historyCache.get(code);
  if (!p) {
    p = getJson<FundInfo>(`/api/mf/${code}?history=1`).then((info) => (info.history ?? []).map(([date, nav]) => ({ date, nav })));
    p.catch(() => historyCache.delete(code));
    historyCache.set(code, p);
  }
  return p;
}

export async function searchStocks(q: string): Promise<StockHit[]> {
  const { results } = await getJson<{ results: StockHit[] }>(`/api/stocks/search?q=${encodeURIComponent(q)}`);
  return results;
}

export async function stockQuotes(symbols: string[]): Promise<Record<string, LiveQuote>> {
  if (!symbols.length) return {};
  const { quotes } = await getJson<{ quotes: Record<string, LiveQuote> }>(`/api/stocks/quote?symbols=${encodeURIComponent(symbols.join(","))}`);
  return quotes;
}
