import { NextResponse, type NextRequest } from "next/server";

export const revalidate = 300;

const SYMBOL = /^[A-Z0-9&\-]{1,20}$/;
const UA = "Mozilla/5.0 (compatible; Crorpus/1.0)";

async function quote(symbol: string): Promise<{ price: number; time: number; previousClose: number | null } | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}.NS?range=1d&interval=1d`;
  const res = await fetch(url, { headers: { "User-Agent": UA }, next: { revalidate: 300 }, signal: AbortSignal.timeout(10000) });
  if (!res.ok) return null;
  const body = (await res.json()) as { chart?: { result?: { meta?: { regularMarketPrice?: number; regularMarketTime?: number; chartPreviousClose?: number } }[] } };
  const meta = body.chart?.result?.[0]?.meta;
  if (!meta?.regularMarketPrice || !(meta.regularMarketPrice > 0)) return null;
  return { price: meta.regularMarketPrice, time: (meta.regularMarketTime ?? 0) * 1000, previousClose: meta.chartPreviousClose ?? null };
}

/** NSE prices for up to 25 tickers, from Yahoo Finance's public chart endpoint, cached for five minutes. */
export async function GET(request: NextRequest) {
  const symbols = [...new Set((request.nextUrl.searchParams.get("symbols") ?? "").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean))].slice(0, 25);
  if (symbols.some((s) => !SYMBOL.test(s))) return NextResponse.json({ error: "Invalid ticker." }, { status: 400 });

  const results = await Promise.allSettled(symbols.map((s) => quote(s)));
  const quotes: Record<string, { price: number; time: number; previousClose: number | null }> = {};
  const failed: string[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value) quotes[symbols[i]] = r.value;
    else failed.push(symbols[i]);
  });
  return NextResponse.json({ quotes, failed });
}
