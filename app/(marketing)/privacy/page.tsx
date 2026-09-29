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
      updated="29 September 2026"
    >
      <DocSection n="01" title="What this covers">
        <p>
          This policy applies to the Crorpus website and app (the &ldquo;Service&rdquo;). It describes two stages: the demo available today, and the account based service that follows. We will update this page before
          the second stage begins.
        </p>
      </DocSection>

      <DocSection n="02" title="What we collect today">
        <p>
          <strong>Your portfolio entries.</strong> Funds, stocks, balances, loans, goals and notes you enter in the demo are stored only in your own browser using local storage. They are not sent to our servers.
        </p>
        <p>
          <strong>Your theme choice.</strong> We remember light or dark mode in the same way.
        </p>
        <p>We do not run advertising trackers. We do not use the data you enter for any purpose other than showing it back to you.</p>
      </DocSection>

      <DocSection n="03" title="What we will collect with accounts">
        <ul>
          <li>Your email address and, optionally, your name, to identify your account and sign you in.</li>
          <li>The financial records you choose to enter, such as holdings, transactions, balances, goals and review notes.</li>
          <li>Basic technical diagnostics, such as error reports and the browser type, so we can fix problems.</li>
        </ul>
        <p>
          We will <strong>never</strong> ask for your net banking, broker or demat passwords, one time passwords, PAN or Aadhaar.
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
          When accounts launch, we expect to use service providers to host the application and database, and to send email. They may process your data only to provide those services to us, under contract. We will list
          them here. We may also disclose information where the law requires it.
        </p>
      </DocSection>

      <DocSection n="06" title="How long we keep it">
        <p>
          In the demo, data stays in your browser until you clear it or use Reset in Settings. With accounts, we will keep your records while your account is open and delete them within a reasonable period after you close it,
          except where the law requires us to keep something longer.
        </p>
      </DocSection>

      <DocSection n="07" title="Your choices and rights">
        <p>
          You can export everything you have entered, correct it, or delete it at any time from Settings. As accounts arrive, you will also be able to request access to, correction of, or erasure of your personal data, and
          to withdraw consent, in line with applicable Indian law, including the Digital Personal Data Protection Act, 2023. You can reach us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </DocSection>

      <DocSection n="08" title="Security">
        <p>
          We design for safe handling of financial records: encryption in transit, encryption at rest, and access rules that keep each account&rsquo;s data separate. No system is perfectly secure, and you should protect your
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
