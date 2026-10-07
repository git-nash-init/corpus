import { NextResponse, type NextRequest } from "next/server";
import { STOCK_DIRECTORY } from "@/lib/data/stock-directory";

export const revalidate = 3600;

interface YahooSearch {
  quotes?: { symbol?: string; shortname?: string; longname?: string; quoteType?: string; exchange?: string }[];
}

/** NSE equity search. Matches the built-in directory first (which carries sectors), then Yahoo's public search. */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 1 || q.length > 40) return NextResponse.json({ results: [] });
  const needle = q.toLowerCase();

  const local = STOCK_DIRECTORY.filter((e) => e.ticker.toLowerCase().includes(needle) || e.name.toLowerCase().includes(needle))
    .slice(0, 8)
    .map((e) => ({ ticker: e.ticker, name: e.name, sector: e.sector as string | null }));

  let remote: { ticker: string; name: string; sector: string | null }[] = [];
  try {
    const res = await fetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Crorpus/1.0)" },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const body = (await res.json()) as YahooSearch;
      remote = (body.quotes ?? [])
        .filter((x) => x.quoteType === "EQUITY" && x.symbol?.endsWith(".NS"))
        .map((x) => ({ ticker: x.symbol!.replace(/\.NS$/, ""), name: x.longname ?? x.shortname ?? x.symbol!, sector: null }));
    }
  } catch {
    // Directory results are still useful without the remote search.
  }

  const seen = new Set(local.map((l) => l.ticker));
  const merged = [...local, ...remote.filter((r) => !seen.has(r.ticker))].slice(0, 12);
  return NextResponse.json({ results: merged });
}
