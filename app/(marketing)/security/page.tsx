import type { Metadata } from "next";
import { CONTACT_EMAIL, DocPage, DocSection } from "@/components/marketing/Prose";

export const metadata: Metadata = { title: "Security" };

export default function SecurityPage() {
  return (
    <DocPage
      eyebrow="Trust"
      title="Security"
      intro="Financial records deserve careful handling. This page separates what is true of the demo today from what we are building for accounts, so you always know which is which."
      updated="29 September 2026"
    >
      <DocSection n="01" title="The demo today">
        <ul>
          <li>Everything you enter stays in your own browser. Nothing is uploaded to a server.</li>
          <li>There are no accounts, so there are no passwords to steal.</li>
          <li>The site loads over HTTPS and uses no advertising or tracking scripts.</li>
          <li>You can export your data, or wipe it with Reset, from Settings.</li>
        </ul>
      </DocSection>

      <DocSection n="02" title="What we will never ask for">
        <p>Net banking, broker or demat passwords, one time passwords, PAN and Aadhaar. Crorpus works from what you enter yourself, so it never needs the keys to your accounts.</p>
      </DocSection>

      <DocSection n="03" title="What we are building for accounts">
        <ul>
          <li>
            <strong>Isolation.</strong> Every record is tied to your user and protected by row level security in the database, so one account cannot read another&rsquo;s data.
          </li>
          <li>
            <strong>Encryption.</strong> Data is encrypted in transit, and at rest in the hosted database.
          </li>
          <li>
            <strong>Least access.</strong> Service keys stay on the server and never ship to the browser.
          </li>
          <li>
            <strong>Control.</strong> Export and delete your data from Settings.
          </li>
        </ul>
      </DocSection>

      <DocSection n="04" title="Your part">
        <p>Use a strong, unique password, keep your device updated, and be careful on shared computers. If you use the demo on a shared device, use Reset when you are done.</p>
      </DocSection>

      <DocSection n="05" title="Reporting a problem">
        <p>
          If you think you have found a security issue, please email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with the details. Please give us a reasonable chance to fix it before sharing it publicly.
        </p>
      </DocSection>
    </DocPage>
  );
}
