import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/Button";
import { DocPage, DocSection } from "@/components/marketing/Prose";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <DocPage
      eyebrow="About"
      title="Built from a spreadsheet, checked line by line."
      intro="Crorpus started as an eight tab Google Sheet that tracked one household's mutual funds, stocks, PPF, EPF, NPS, gold, property and loans on the way to 1 crore."
    >
      <DocSection n="01" title="Why it exists">
        <p>
          A spreadsheet is a fine place to start, and a hard place to stay. Values are typed by hand, formulas break when a row is added, and a wrong assumption can sit in a cell for months without anyone noticing.
        </p>
        <p>We wanted one place where the arithmetic is done properly every time, and where anyone can see how each number was reached.</p>
      </DocSection>

      <DocSection n="02" title="What we checked">
        <p>
          Before writing the app, we went through every formula in the original sheet. Five did not hold up: a total return used as a yearly rate, two kinds of compounding in one tab, XIRR on holdings a few weeks old, an average cost
          that ignored sells, and a sector table that dropped holdings. Each is corrected and covered by automated tests that reproduce the sheet&rsquo;s own results.
        </p>
      </DocSection>

      <DocSection n="03" title="How we work">
        <ul>
          <li>Every figure comes from a transaction you entered. Nothing derived is stored, so nothing can drift.</li>
          <li>Money is calculated in whole paise, so rounding never creeps in.</li>
          <li>Where a number can mislead, such as a first year XIRR, we show the plainer one.</li>
          <li>We never ask for the keys to your bank or broker accounts.</li>
        </ul>
      </DocSection>

      <DocSection n="04" title="Where it is going">
        <p>Accounts, a hosted database, live NSE prices and AMFI NAVs, and import from the original spreadsheet are next. The demo you can open today runs on the same calculation engine.</p>
        <LinkButton href="/app" variant="primary" className="mt-2">
          Open the live demo
        </LinkButton>
      </DocSection>
    </DocPage>
  );
}
