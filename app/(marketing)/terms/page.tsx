import type { Metadata } from "next";
import { CONTACT_EMAIL, DocPage, DocSection } from "@/components/marketing/Prose";

export const metadata: Metadata = { title: "Terms of service" };

// Drafted for the product as it exists today. Have qualified counsel review before public launch.
export default function TermsPage() {
  return (
    <DocPage
      eyebrow="Legal"
      title="Terms of service"
      intro="These terms govern your use of Crorpus. They are written to be read, so please do."
      updated="29 September 2026"
    >
      <DocSection n="01" title="Accepting these terms">
        <p>By using the Crorpus website or app (the &ldquo;Service&rdquo;) you agree to these terms. If you do not agree, please do not use the Service.</p>
      </DocSection>

      <DocSection n="02" title="What Crorpus is">
        <p>
          Crorpus is a record keeping and calculation tool. You enter your own transactions and balances, and the Service calculates figures such as gains, XIRR, allocation, net worth and goal projections from them.
        </p>
        <p>
          <strong>Crorpus is not financial advice.</strong> We are not a registered investment adviser, research analyst, broker or tax professional. Nothing in the Service is a recommendation to buy, sell or hold any
          security. Projections are illustrations of the inputs you provide, not predictions or promises. Investments in securities are subject to market risks. Speak to a qualified professional before making decisions.
        </p>
      </DocSection>

      <DocSection n="03" title="The demo">
        <p>
          The current version is a demonstration running on sample data stored in your browser. Features and figures may change, and data may be lost if you clear your browser or use Reset. Export a copy if you want to keep
          it.
        </p>
      </DocSection>

      <DocSection n="04" title="Accounts">
        <p>
          When accounts are introduced, you are responsible for keeping your sign in details safe and for activity under your account. You must be at least 18 and provide accurate information.
        </p>
      </DocSection>

      <DocSection n="05" title="Your data">
        <p>
          You own the records you enter. You give us a limited licence to store and process them solely to provide the Service to you. You can export or delete your data at any time. How we handle personal data is described
          in the <a href="/privacy">privacy policy</a>.
        </p>
      </DocSection>

      <DocSection n="06" title="Accuracy of figures">
        <p>
          Results depend on what you enter and on any prices or NAVs you supply or that we later source from third parties. Check important numbers against your statements. Prices may be delayed, incomplete or wrong, and we do
          not guarantee their accuracy.
        </p>
      </DocSection>

      <DocSection n="07" title="Acceptable use">
        <ul>
          <li>Do not attempt to break, overload or gain unauthorised access to the Service or other people&rsquo;s data.</li>
          <li>Do not use the Service for anything unlawful, or to misrepresent your finances to others.</li>
          <li>Do not copy or resell the Service without our written permission.</li>
        </ul>
      </DocSection>

      <DocSection n="08" title="Availability and changes">
        <p>
          We work to keep the Service running but do not promise it will always be available or error free. We may change, suspend or discontinue features, and we will give notice of material changes to account holders where
          we reasonably can.
        </p>
      </DocSection>

      <DocSection n="09" title="Disclaimers and liability">
        <p>
          The Service is provided &ldquo;as is&rdquo; without warranties of any kind, to the extent the law allows. To the extent the law allows, Crorpus is not liable for losses arising from decisions you make using the
          Service, from inaccurate data, or from loss of data, and our total liability for any claim is limited to the amount you paid us for the Service in the twelve months before the claim, which for the free plan is
          zero. Nothing in these terms limits liability that cannot legally be limited.
        </p>
      </DocSection>

      <DocSection n="10" title="Ending your use">
        <p>You may stop using the Service at any time. We may suspend or end access if these terms are broken or if we must do so by law.</p>
      </DocSection>

      <DocSection n="11" title="Governing law">
        <p>These terms are governed by the laws of India, and the courts of India have jurisdiction over disputes, subject to any mandatory rights you have under law.</p>
      </DocSection>

      <DocSection n="12" title="Contact">
        <p>
          Questions about these terms can be sent to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </DocSection>
    </DocPage>
  );
}
