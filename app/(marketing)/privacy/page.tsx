import type { Metadata } from "next";
import { CONTACT_EMAIL, DocPage, DocSection } from "@/components/marketing/Prose";

export const metadata: Metadata = { title: "Privacy policy" };

// Drafted for the product as it exists today. Have qualified counsel review before public launch.
export default function PrivacyPage() {
  return (
    <DocPage
      eyebrow="Legal"
      title="Privacy policy"
      intro="Crorpus keeps records of your investments and calculates figures from them. This page explains what data that involves, where it lives and what control you have."
      updated="7 October 2026"
    >
      <DocSection n="01" title="What this covers">
        <p>
          This policy applies to the Crorpus website and app (the &ldquo;Service&rdquo;). It explains what we collect when you create an account, why, and what control you have.
        </p>
      </DocSection>

      <DocSection n="02" title="What we collect when you use the Service">
        <p>
          <strong>Account details.</strong> Your email address, your name, your chosen avatar and, if you upload one, your profile photo.
        </p>
        <p>
          <strong>Your records.</strong> Funds, transactions, stocks, balances, loans, goals and notes you enter, and files you upload to your document vault or import.
        </p>
        <p>
          <strong>Preferences and diagnostics.</strong> Your theme choice, and basic technical logs such as errors and browser type so we can fix problems.
        </p>
        <p>We do not run advertising trackers. We do not use the data you enter for any purpose other than providing the Service to you.</p>
      </DocSection>

      <DocSection n="03" title="What we do not collect">
        <p>
          We <strong>never</strong> ask for your net banking, broker or demat passwords, one time passwords, PAN or Aadhaar. We do not connect to your bank or broker accounts.
        </p>
        <p>
          To show live prices, the names of the funds and stocks you look up or hold are sent to public market data services. Your identity, balances and quantities are not.
        </p>
      </DocSection>

      <DocSection n="04" title="How we use your data">
        <ul>
          <li>To provide the Service: calculate returns, net worth, projections and reports from your entries.</li>
          <li>To keep the Service secure, prevent abuse and fix faults.</li>
          <li>To contact you about your account, such as sign in emails or important changes.</li>
        </ul>
        <p>We do not sell your personal data, and we do not use your holdings to target you with advertising.</p>
      </DocSection>

      <DocSection n="05" title="Who else handles it">
        <p>
          We use Supabase to host the database, sign-in and file storage (servers in Mumbai, India) and Vercel to host the website. They process your data only to provide those services to us. Mutual fund NAVs come
          from the public AMFI data via mfapi.in, and share prices from a public market data feed. We may also disclose information where the law requires it.
        </p>
      </DocSection>

      <DocSection n="06" title="How long we keep it">
        <p>
          We keep your records while your account is open. You can delete all your records and files at any time from Settings. If you ask us to close your account, we delete your data within a reasonable period, except where
          the law requires us to keep something longer.
        </p>
      </DocSection>

      <DocSection n="07" title="Your choices and rights">
        <p>
          You can export everything you have entered, correct it, or delete it at any time from Settings. You can also ask us for access to, correction of, or erasure of your personal data, and withdraw consent, in line with
          applicable Indian law, including the Digital Personal Data Protection Act, 2023. You can reach us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </DocSection>

      <DocSection n="08" title="Security">
        <p>
          We protect financial records with encryption in transit and at rest, and database rules that keep each account&rsquo;s data separate. No system is perfectly secure, and you should protect your
          own device and sign in details. More detail is on the <a href="/security">security page</a>.
        </p>
      </DocSection>

      <DocSection n="09" title="Children">
        <p>The Service is meant for adults. It is not directed at anyone under 18, and we do not knowingly collect their data.</p>
      </DocSection>

      <DocSection n="10" title="Changes to this policy">
        <p>If we change this policy in a way that matters, we will update the date above and tell account holders before the change takes effect.</p>
      </DocSection>

      <DocSection n="11" title="Contact">
        <p>
          Questions about privacy can be sent to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </DocSection>
    </DocPage>
  );
}
