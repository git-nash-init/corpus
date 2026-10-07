const ITEMS = [
  {
    q: "What is XIRR and why does it matter?",
    a: "XIRR is the yearly return that accounts for when each rupee went in. A SIP invests a little every month, so a simple percentage gain hides how long each instalment has been working. Crorpus shows the plain return for holdings under a year, then XIRR from one year on.",
  },
  {
    q: "Do you need my bank or demat login?",
    a: "No. Crorpus never asks for net banking, broker or demat credentials. You record your own transactions and balances, and everything is calculated from those entries.",
  },
  {
    q: "Where is my data stored?",
    a: "In a hosted database tied to your account, with row level security so only you can read it. Uploaded files sit in a private vault and open only through short-lived links. You can export everything or delete it from Settings.",
  },
  {
    q: "Which investments can I track?",
    a: "Mutual funds and SIPs, NSE listed stocks, PPF, EPF, NPS, bank deposits, sovereign gold bonds, digital gold and silver, plus property, vehicles, cash and every loan on your balance sheet.",
  },
  {
    q: "Can I bring my spreadsheet across?",
    a: "Yes. Upload the original Investment Tracker workbook as .xlsx during setup or from Settings. Crorpus matches your funds to live schemes, looks up the NAV on every transaction date, and shows a preview before importing anything.",
  },
  {
    q: "Are the prices live?",
    a: "Mutual fund NAVs come from the public AMFI data via mfapi.in, and NSE share prices from a public market data feed. They refresh when you open the app, and you can refresh by hand. If a source is down, Crorpus shows your last saved price and says so.",
  },
  {
    q: "Is this investment advice?",
    a: "No. Crorpus is a record keeping and calculation tool. It is not a registered investment adviser and does not recommend what to buy or sell. Projections are illustrations of the numbers you enter.",
  },
];

export function Faq() {
  return (
    <div className="divide-y divide-[var(--line)] border-y border-line">
      {ITEMS.map((i) => (
        <details key={i.q} className="group py-1">
          <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-6 py-4 text-[19px] [&::-webkit-details-marker]:hidden">
            <span className="font-display text-[22px]">{i.q}</span>
            <span aria-hidden="true" className="relative block h-4 w-4 shrink-0">
              <span className="absolute left-0 top-1/2 h-px w-4 -translate-y-1/2 bg-brass" />
              <span className="absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 bg-brass transition-transform duration-300 group-open:scale-y-0" />
            </span>
          </summary>
          <p className="max-w-[68ch] pb-6 text-[16px] leading-relaxed text-ink-2">{i.a}</p>
        </details>
      ))}
    </div>
  );
}
