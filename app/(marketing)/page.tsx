import { AnimatedHeadline } from "@/components/marketing/AnimatedHeadline";
import { CroreCalculator } from "@/components/marketing/CroreCalculator";
import { Faq } from "@/components/marketing/Faq";
import { HeroDemo } from "@/components/marketing/HeroDemo";
import { Scrubber } from "@/components/marketing/Scrubber";
import { XirrExplainer } from "@/components/marketing/XirrExplainer";
import { Reveal } from "@/components/motion/Reveal";
import { LinkButton } from "@/components/ui/Button";

const wrap = "mx-auto max-w-[1200px] px-4 sm:px-8";
const h2 = "font-display text-[clamp(34px,5vw,58px)] leading-[1.04]";

const FACTS = [
  ["Indian formats", "Lakh and crore grouping throughout."],
  ["XIRR as Excel defines it", "Matched to the spreadsheet function it replaces."],
  ["Traceable figures", "Every number comes from a transaction you entered."],
  ["Private by default", "The demo sends nothing to a server."],
];

const FIXES = [
  {
    title: "A six week gain was used as a yearly growth rate",
    body: "The goal tab took the portfolio's total return, 27.9 percent, and treated it as the annual return for every projection. Crorpus asks for the return you expect, defaults to 12 percent, and shows your actual XIRR next to it for reference.",
  },
  {
    title: "Two different kinds of compounding in one tab",
    body: "The SIP needed and projected value compounded monthly while the year by year table compounded annually, so the numbers disagreed. Everything now compounds monthly.",
  },
  {
    title: "XIRR on a holding bought weeks ago",
    body: "Infosys showed a 198,866 percent return. Under a year, Crorpus shows the plain return. From one year on, it switches to XIRR.",
  },
  {
    title: "An average cost that ignored your sells",
    body: "Cost was total bought divided by shares bought, so selling part of a position left the cost wrong. Crorpus keeps a moving average and books the profit on sold shares separately.",
  },
  {
    title: "Sectors that quietly disappeared",
    body: "The sector table listed eight sectors while the ticker directory used twenty labels, so holdings could vanish from the chart. Crorpus groups them into twelve sectors and always shows all of them.",
  },
];

const PRODUCT = [
  ["Mutual funds and SIPs", "Units come from amount divided by NAV. Gain, XIRR, category mix, and a monthly check that every SIP actually debited."],
  ["Direct stocks", "Buys and sells build a moving average cost. Unrealised and realised gains stay separate. Sector mix covers every sector you hold."],
  ["PPF, EPF and NPS", "Enter the latest balance and yearly contribution. See what is locked, what is semi-liquid and what you can reach today."],
  ["Deposits, gold and silver", "Fixed deposits with maturity reminders, sovereign gold bonds, digital gold and silver in one list."],
  ["Property and loans", "Cash, the flat and the vehicle on one side, every loan on the other. Net worth, and a debt to asset meter with a 30 percent guide line."],
  ["Goals", "Set a target and a date. Get the SIP you need, the date you will really get there, and a what-if panel for both."],
  ["Monthly review", "A seven step checklist, a comparison with last month, and a snapshot that builds your wealth history without effort."],
];

const RITUAL = [
  ["1st to 5th", "Confirm every SIP debited"],
  ["10th to 15th", "Refresh NAVs and share prices"],
  ["15th to 20th", "Log EPF, PPF and NPS balances"],
  ["20th to 25th", "Review EMIs and debt"],
  ["25th", "Pay the credit card statement in full"],
  ["28th", "Check progress on the goal"],
  ["Last day", "Take the month-end snapshot"],
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className={`${wrap} pb-12 pt-10 sm:pt-20`}>
        <p className="eyebrow">Wealth tracking for Indian investors</p>
        <AnimatedHeadline text="Every rupee you own, in one honest ledger." className="font-display mt-6 max-w-[16ch] text-[clamp(46px,8.4vw,116px)] leading-[0.98] tracking-[-0.03em]" />
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <Reveal delay={0.5}>
            <p className="max-w-[54ch] text-[19px] leading-relaxed text-ink-2">
              Crorpus keeps your mutual funds, SIPs, stocks, PPF, EPF, NPS, deposits, gold, property and loans in one place. It works out returns, XIRR, net worth and your path to 1 crore from your own
              records.
            </p>
          </Reveal>
          <Reveal delay={0.65}>
            <div className="flex flex-wrap gap-3">
              <LinkButton href="/app" variant="primary" size="lg">
                Open the live demo
              </LinkButton>
              <LinkButton href="/#spreadsheet" size="lg">
                See what it replaces
              </LinkButton>
            </div>
            <p className="mt-4 text-sm text-ink-3">No bank login and no card. The demo runs entirely in your browser.</p>
          </Reveal>
        </div>
        <Reveal delay={0.3} y={40} className="mt-14">
          <HeroDemo />
        </Reveal>
      </section>

      {/* Facts */}
      <section className={`${wrap} py-8`} aria-label="Principles">
        <dl className="grid border-y border-line sm:grid-cols-2 lg:grid-cols-4">
          {FACTS.map(([t, b], i) => (
            <Reveal key={t} delay={i * 0.06} className={`px-1 py-7 sm:px-6 ${i > 0 ? "lg:border-l lg:border-line" : ""} ${i % 2 === 1 ? "sm:border-l sm:border-line lg:border-l" : ""}`}>
              <dt className="font-display text-[22px]">{t}</dt>
              <dd className="mt-2 text-[15px] text-ink-2">{b}</dd>
            </Reveal>
          ))}
        </dl>
      </section>

      {/* Spreadsheet comparison */}
      <section id="spreadsheet" className={`${wrap} scroll-mt-24 pt-24`}>
        <Reveal>
          <p className="eyebrow">From spreadsheet to Crorpus</p>
          <h2 className={`${h2} mt-4 max-w-[20ch]`}>The sheet did the job. It also got a few things quietly wrong.</h2>
          <p className="mt-6 max-w-[62ch] text-[18px] leading-relaxed text-ink-2">
            Crorpus began as a Google Sheet with eight tabs, hand typed values and a stack of array formulas. Rebuilding it meant checking every calculation, and five of them did not hold up.
          </p>
        </Reveal>
        <Reveal className="mt-12">
          <Scrubber />
        </Reveal>
        <ol className="mt-16 divide-y divide-[var(--line)] border-y border-line">
          {FIXES.map((f, i) => (
            <Reveal as="li" key={f.title} className="grid gap-3 py-8 md:grid-cols-[80px_1fr_1.4fr] md:gap-10">
              <span className="font-display num text-[34px] text-brass">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="font-display text-[24px] leading-tight">{f.title}</h3>
              <p className="text-[16px] leading-relaxed text-ink-2">{f.body}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Product */}
      <section id="product" className={`${wrap} scroll-mt-24 pt-32`}>
        <Reveal>
          <p className="eyebrow">What it covers</p>
          <h2 className={`${h2} mt-4 max-w-[18ch]`}>One ledger for the whole balance sheet.</h2>
        </Reveal>
        <ol className="mt-14 border-t border-line">
          {PRODUCT.map(([t, b], i) => (
            <Reveal as="li" key={t} delay={0.02} className="group grid gap-3 border-b border-line py-8 transition-colors duration-300 hover:bg-[var(--glass-fill)] md:grid-cols-[80px_1fr_1.6fr] md:gap-10 md:px-4">
              <span className="num text-[15px] text-ink-3">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="font-display text-[28px] leading-tight">{t}</h3>
              <p className="text-[16px] leading-relaxed text-ink-2">{b}</p>
            </Reveal>
          ))}
        </ol>
        <Reveal className="mt-10">
          <LinkButton href="/app" variant="primary">
            Explore every screen in the demo
          </LinkButton>
        </Reveal>
      </section>

      {/* Calculator */}
      <section id="calculator" className={`${wrap} scroll-mt-24 pt-32`}>
        <Reveal>
          <p className="eyebrow">Try it</p>
          <h2 className={`${h2} mt-4 max-w-[16ch]`}>The crore calculator.</h2>
          <p className="mt-6 max-w-[60ch] text-[18px] leading-relaxed text-ink-2">The same maths that runs the goals screen. Move a slider and watch the path to 1 crore change.</p>
        </Reveal>
        <div className="panel mt-12 p-5 sm:p-10">
          <CroreCalculator />
        </div>
      </section>

      {/* XIRR */}
      <section id="xirr" className={`${wrap} scroll-mt-24 pt-32`}>
        <Reveal>
          <p className="eyebrow">Returns, explained</p>
          <h2 className={`${h2} mt-4 max-w-[16ch]`}>Same SIP, two numbers.</h2>
          <p className="mt-6 max-w-[60ch] text-[18px] leading-relaxed text-ink-2">
            Percentage gain and XIRR answer different questions. Change the inputs and see why a young SIP can look very different depending on which one you read.
          </p>
        </Reveal>
        <div className="panel mt-12 p-5 sm:p-10">
          <XirrExplainer />
        </div>
      </section>

      {/* Ritual */}
      <section className={`${wrap} pt-32`}>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <p className="eyebrow">The monthly ritual</p>
            <h2 className={`${h2} mt-4`}>Ten minutes a month keeps the picture true.</h2>
            <p className="mt-6 max-w-[46ch] text-[18px] leading-relaxed text-ink-2">
              The review screen walks you through the same seven checks every month, compares against last month and saves a snapshot, so your wealth history builds itself.
            </p>
          </Reveal>
          <ol className="border-t border-line">
            {RITUAL.map(([when, what], i) => (
              <Reveal as="li" key={when} delay={i * 0.03} className="grid grid-cols-[120px_1fr] items-baseline gap-4 border-b border-line py-5 sm:grid-cols-[150px_1fr]">
                <span className="num text-[15px] text-brass">{when}</span>
                <span className="text-[18px]">{what}</span>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Security */}
      <section id="security" className={`${wrap} scroll-mt-24 pt-32`}>
        <Reveal>
          <p className="eyebrow">Security and privacy</p>
          <h2 className={`${h2} mt-4 max-w-[16ch]`}>Your numbers stay yours.</h2>
        </Reveal>
        <dl className="mt-12 divide-y divide-[var(--line)] border-y border-line">
          {[
            ["Today", "The demo keeps everything in your own browser. Nothing is uploaded. Clear your site data and it is gone, so export a copy from Settings whenever you like."],
            ["What we never ask for", "Net banking, broker or demat passwords, OTPs, PAN and Aadhaar. You enter your own transactions and balances."],
            ["With accounts", "Each record will belong to you alone, enforced by row level security in the database, encrypted in transit and at rest, with export and delete in Settings."],
            ["Your data", "We do not sell your data or use your holdings to target you with ads."],
          ].map(([t, b]) => (
            <Reveal key={t} className="grid gap-3 py-7 md:grid-cols-[240px_1fr] md:gap-10">
              <dt className="font-display text-[24px]">{t}</dt>
              <dd className="max-w-[64ch] text-[16px] leading-relaxed text-ink-2">{b}</dd>
            </Reveal>
          ))}
        </dl>
        <Reveal className="mt-8 flex flex-wrap gap-3">
          <LinkButton href="/security">Read about security</LinkButton>
          <LinkButton href="/privacy" variant="ghost">
            Privacy policy
          </LinkButton>
        </Reveal>
      </section>

      {/* Plans */}
      <section className={`${wrap} pt-32`}>
        <Reveal>
          <p className="eyebrow">Plans</p>
          <h2 className={`${h2} mt-4 max-w-[16ch]`}>Free to start. Pro when you want live data.</h2>
        </Reveal>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="panel h-full p-8">
              <p className="eyebrow">Free</p>
              <p className="font-display mt-3 text-[40px] leading-none">Everything in the demo</p>
              <ol className="mt-8 divide-y divide-[var(--line)] border-t border-line text-[16px]">
                {["Unlimited funds, stocks and assets", "XIRR, allocation and net worth", "Goal planner with what-if panel", "Monthly review and wealth history", "Export your data any time"].map((t) => (
                  <li key={t} className="py-4 text-ink-2">
                    {t}
                  </li>
                ))}
              </ol>
              <LinkButton href="/app" variant="primary" className="mt-8">
                Open the demo
              </LinkButton>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="panel h-full p-8">
              <p className="eyebrow">Pro</p>
              <p className="font-display mt-3 text-[40px] leading-none">Live data and more, price announced at launch</p>
              <ol className="mt-8 divide-y divide-[var(--line)] border-t border-line text-[16px]">
                {["Live NSE prices and AMFI NAVs", "Import from your spreadsheet", "Multiple portfolios and a family view", "Alerts for missed SIPs and maturities", "Sync across every device"].map((t) => (
                  <li key={t} className="py-4 text-ink-2">
                    {t}
                  </li>
                ))}
              </ol>
              <p className="mt-8 text-sm text-ink-3">Arrives with accounts and the hosted database.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className={`${wrap} scroll-mt-24 pt-32`}>
        <Reveal>
          <p className="eyebrow">Questions</p>
          <h2 className={`${h2} mt-4`}>Before you begin.</h2>
        </Reveal>
        <Reveal className="mt-12">
          <Faq />
        </Reveal>
      </section>

      {/* Closing */}
      <section className={`${wrap} pt-32`}>
        <Reveal>
          <div className="panel p-8 sm:p-16">
            <h2 className={`${h2} max-w-[18ch]`}>Bring your whole picture together.</h2>
            <p className="mt-6 max-w-[52ch] text-[18px] text-ink-2">Open the demo, change a number, and watch every screen follow. It takes about a minute to see how it works.</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <LinkButton href="/app" variant="primary" size="lg">
                Open the live demo
              </LinkButton>
              <LinkButton href="/#calculator" size="lg">
                Try the calculator
              </LinkButton>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
