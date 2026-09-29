import type { ReactNode } from "react";

export const CONTACT_EMAIL = "hello@crorpus.com";

export function DocPage({ eyebrow, title, intro, updated, children }: { eyebrow: string; title: string; intro?: string; updated?: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-[820px] px-4 pb-8 pt-12 sm:px-8 sm:pt-24">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="font-display mt-4 text-[clamp(40px,6vw,72px)] leading-[1.02]">{title}</h1>
      {intro ? <p className="mt-6 max-w-[58ch] text-[19px] leading-relaxed text-ink-2">{intro}</p> : null}
      {updated ? <p className="mt-4 text-sm text-ink-3">Last updated {updated}</p> : null}
      <div className="mt-14 border-t border-line">{children}</div>
    </article>
  );
}

export function DocSection({ n, title, children }: { n?: string; title: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 border-b border-line py-10 md:grid-cols-[64px_1fr] md:gap-8">
      <span className="num font-display text-[24px] text-brass">{n}</span>
      <div>
        <h2 className="font-display text-[28px] leading-tight">{title}</h2>
        <div className="mt-4 space-y-4 text-[16px] leading-relaxed text-ink-2 [&_a]:text-brass [&_a]:underline [&_a]:underline-offset-4 [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </div>
    </section>
  );
}
