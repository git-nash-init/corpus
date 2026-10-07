import { NextResponse, type NextRequest } from "next/server";

export const revalidate = 86400;

/** Mutual fund search, proxied from the public mfapi.in directory of AMFI schemes. */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2 || q.length > 80) return NextResponse.json({ results: [] });

  try {
    const url = `https://api.mfapi.in/mf/search?q=${encodeURIComponent(q)}`;
    // The public service is occasionally slow on a cold query, so allow a generous wait and one retry.
    let res = await fetch(url, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(15000) }).catch(() => null);
    if (!res?.ok) res = await fetch(url, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`mfapi ${res.status}`);
    const rows = (await res.json()) as { schemeCode: number; schemeName: string }[];
    return NextResponse.json({ results: rows.slice(0, 25).map((r) => ({ code: String(r.schemeCode), name: r.schemeName })) });
  } catch {
    return NextResponse.json({ results: [], error: "Fund search is unavailable right now." }, { status: 502 });
  }
}
