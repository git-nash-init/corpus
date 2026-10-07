import type { Metadata } from "next";
import { CONTACT_EMAIL, DocPage, DocSection } from "@/components/marketing/Prose";

export const metadata: Metadata = { title: "Security" };

export default function SecurityPage() {
  return (
    <DocPage
      eyebrow="Trust"
      title="Security"
      intro="Financial records deserve careful handling. This page describes how your data is protected and what we do not ask for."
      updated="7 October 2026"
    >
      <DocSection n="01" title="How your account is protected">
        <ul>
          <li>You sign in with an email and password, and your email is confirmed before the account is used.</li>
          <li>The site loads over HTTPS and uses no advertising or tracking scripts.</li>
          <li>You can export your data, or delete all of it, from Settings.</li>
        </ul>
      </DocSection>

      <DocSection n="02" title="What we will never ask for">
        <p>Net banking, broker or demat passwords, one time passwords, PAN and Aadhaar. Crorpus works from what you enter yourself, so it never needs the keys to your accounts.</p>
      </DocSection>

      <DocSection n="03" title="How your data is kept separate">
        <ul>
          <li>
            <strong>Isolation.</strong> Every record is tied to your user and protected by row level security in the database, so one account cannot read another&rsquo;s data.
          </li>
          <li>
            <strong>Encryption.</strong> Data is encrypted in transit, and at rest in the hosted database.
          </li>
          <li>
            <strong>Private files.</strong> Documents and photos sit in private storage folders named for your account and open only through short-lived links.
          </li>
          <li>
            <strong>Control.</strong> Export and delete your data from Settings.
          </li>
        </ul>
      </DocSection>

      <DocSection n="04" title="Your part">
        <p>Use a strong, unique password, keep your device updated, and be careful on shared computers. If you use a shared device, log out when you are done.</p>
      </DocSection>

      <DocSection n="05" title="Reporting a problem">
        <p>
          If you think you have found a security issue, please email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with the details. Please give us a reasonable chance to fix it before sharing it publicly.
        </p>
      </DocSection>
    </DocPage>
  );
}
