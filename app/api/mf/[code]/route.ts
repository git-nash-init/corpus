import { NextResponse, type NextRequest } from "next/server";
import { categoryFromScheme, isoFromMfDate } from "@/lib/market/nav";

export const revalidate = 21600;

interface MfApi {
  meta: { fund_house: string; scheme_category: string; scheme_name: string; scheme_code: number };
  data: { date: string; nav: string }[];
  status: string;
}

/**
 * Latest NAV for an AMFI scheme, and with ?history=1 the full NAV history (ascending) so the app can look up the NAV
 * on any past date. Data comes from the public mfapi.in service and is cached for six hours.
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  if (!/^\d{3,8}$/.test(code)) return NextResponse.json({ error: "Invalid scheme code." }, { status: 400 });
  const wantHistory = request.nextUrl.searchParams.get("history") === "1";

  try {
    const res = await fetch(`https://api.mfapi.in/mf/${code}${wantHistory ? "" : "/latest"}`, { next: { revalidate: 21600 }, signal: AbortSignal.timeout(15000) });
    if (res.status === 404) return NextResponse.json({ error: "Scheme not found." }, { status: 404 });
    if (!res.ok) throw new Error(`mfapi ${res.status}`);
    const body = (await res.json()) as MfApi;
    if (body.status !== "SUCCESS" || !body.data?.length) return NextResponse.json({ error: "No NAV data for this scheme." }, { status: 404 });

    const points = body.data.map((d) => ({ date: isoFromMfDate(d.date), nav: Number(d.nav) })).filter((p) => p.nav > 0);
    points.sort((a, b) => a.date.localeCompare(b.date));
    const latest = points[points.length - 1];

    return NextResponse.json({
      code,
      name: body.meta.scheme_name,
      house: body.meta.fund_house,
      schemeCategory: body.meta.scheme_category,
      category: categoryFromScheme(body.meta.scheme_category, body.meta.scheme_name),
      latest,
      // [date, nav] pairs keep the payload small.
      history: wantHistory ? points.map((p) => [p.date, p.nav]) : undefined,
    });
  } catch {
    return NextResponse.json({ error: "NAV data is unavailable right now." }, { status: 502 });
  }
}
