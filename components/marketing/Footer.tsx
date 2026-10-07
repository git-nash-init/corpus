import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const COLS = [
  {
    title: "Product",
    links: [
      { href: "/signup", label: "Create an account" },
      { href: "/login", label: "Log in" },
      { href: "/#calculator", label: "Crore calculator" },
      { href: "/#xirr", label: "How XIRR works" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/security", label: "Security" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of service" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-32 border-t border-line">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-[36ch] text-[15px] text-ink-2">A single ledger for everything you own, with the arithmetic done properly.</p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLS.map((c) => (
              <nav key={c.title} aria-label={c.title}>
                <p className="eyebrow">{c.title}</p>
                <ul className="mt-4 space-y-3">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-[15px] text-ink-2 transition-colors duration-200 hover:text-ink">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="mt-16 border-t border-line pt-6 text-[13px] leading-relaxed text-ink-3">
          <p>
            Crorpus is a record keeping and calculation tool. It does not provide investment, tax or legal advice, and it is not a registered investment adviser. Projections are
            illustrations based on the inputs you provide and are not a promise of future returns. Investments in securities are subject to market risks.
          </p>
          <p className="mt-3">&copy; 2026 Crorpus. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
