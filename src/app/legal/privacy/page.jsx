import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { BRAND } from '@/lib/constants';

export const metadata = {
  title: 'Privacy Policy',
  description:
    'How Granderson Destinations collects, uses, and protects your information — including SMS and email notifications.',
};

export default function PrivacyPage() {
  const effectiveDate = 'May 14, 2026';
  return (
    <>
      <NavBar />
      <main className="animate-page-in bg-brand-cloud pt-32">
        <Container size="md" className="pb-24">
          <p className="text-xs uppercase tracking-[0.32em] text-brand-ink/75 font-medium">
            Legal · Effective {effectiveDate}
          </p>
          <h1 className="display mt-3 text-display-lg text-brand-ink">Privacy Policy</h1>
          <p className="mt-4 max-w-2xl text-brand-slate">
            {BRAND.name} respects your privacy. This policy explains what information we
            collect, how we use it, and the rights you have over it.
          </p>

          <article className="prose prose-neutral mt-12 max-w-3xl text-brand-ink">
            <h2>Who we are</h2>
            <p>
              {BRAND.name} is operated by Kwame J. Granderson, a sole proprietorship
              based in California, providing curated short-term luxury rentals in Palm
              Springs, California and San Miguel de Allende, Mexico. References to
              &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo; mean {BRAND.name}.
              Questions about this policy can be sent to{' '}
              <a href={`mailto:${BRAND.contactEmail}`}>{BRAND.contactEmail}</a>.
            </p>

            <h2>Information we collect</h2>
            <p>
              We collect only the information needed to run the rental business and
              respond to your requests:
            </p>
            <ul>
              <li>
                <strong>Identity and contact information</strong> — your name, email
                address, and phone number when you book a stay, submit a maintenance
                report, or contact us.
              </li>
              <li>
                <strong>Maintenance request details</strong> — the property involved,
                the description you provide, any photos you upload, and the resulting
                ticket metadata (category, severity, vendor matched, status).
              </li>
              <li>
                <strong>Vendor information</strong> — for vendors on our service
                roster: business name, contact person, phone, email, specialties,
                service area, and a signed service agreement that includes consent to
                receive SMS dispatch notifications.
              </li>
              <li>
                <strong>Booking and payment details</strong> — when you reserve a
                stay, the dates, guest count, deposit, and rate. Payment card numbers
                are processed by Stripe and are never stored on our servers.
              </li>
              <li>
                <strong>Technical data</strong> — IP address, browser type, pages
                visited, and timestamps, collected through standard server logs and
                used to operate and secure the site.
              </li>
            </ul>

            <h2>How we use your information</h2>
            <ul>
              <li>To respond to maintenance requests and coordinate repairs.</li>
              <li>
                To send <strong>SMS and email notifications</strong> about your
                maintenance ticket or stay, including status updates and dispatch
                confirmations.
              </li>
              <li>To process bookings, deposits, and refunds.</li>
              <li>To communicate with you about your reservation or inquiry.</li>
              <li>
                To improve the site and our operations — for example, to spot
                recurring maintenance categories and budget capital improvements.
              </li>
              <li>To comply with legal obligations and protect against fraud.</li>
            </ul>

            <h2>SMS notifications and your consent</h2>
            <p>
              You consent to receive SMS messages from {BRAND.name} when you submit a
              maintenance request, sign a vendor service agreement, or otherwise
              provide your mobile phone number for that purpose. We send only{' '}
              <strong>transactional</strong> messages — dispatch notifications, status
              updates, and confirmations. We do not send marketing or promotional SMS.
              Typical frequency is one to five messages per ticket.{' '}
              <strong>Message and data rates may apply.</strong> You can opt out at
              any time by replying <strong>STOP</strong> to any message; reply{' '}
              <strong>HELP</strong> for assistance, or email{' '}
              <a href={`mailto:${BRAND.contactEmail}`}>{BRAND.contactEmail}</a>.
              Opting out of SMS does not stop us from contacting you by email or for
              operational matters unrelated to messaging.
            </p>

            <h2>How we share your information</h2>
            <p>
              We do not sell your personal information. We share it only with the
              following service providers, and only for the purposes listed:
            </p>
            <ul>
              <li>
                <strong>Twilio</strong> (United States) — to send SMS dispatch
                notifications. Twilio receives the recipient phone number and the
                message body.
              </li>
              <li>
                <strong>Google Workspace / Gmail</strong> — to send email dispatch
                notifications. Recipients of an email dispatch receive the ticket
                summary, property name, and a link to the task.
              </li>
              <li>
                <strong>ClickUp</strong> — to create and track maintenance tasks for
                our operations team and vendors. The ticket title, description, and
                priority are stored in ClickUp.
              </li>
              <li>
                <strong>Anthropic Claude</strong> — to perform AI-assisted triage of
                your maintenance description. The description is sent to Anthropic
                for processing and is not retained beyond the request.
              </li>
              <li>
                <strong>Supabase</strong> — our hosted database where bookings,
                tickets, and vendor records are stored encrypted at rest.
              </li>
              <li>
                <strong>Stripe</strong> — to process booking deposits. Stripe handles
                payment card data directly; we receive only confirmation and the last
                four digits of the card.
              </li>
              <li>
                <strong>Vendors on our service roster</strong> — when a ticket is
                matched to a vendor, we share the property name, ticket title and
                description, severity, and your name and contact details so the
                vendor can complete the repair.
              </li>
              <li>
                <strong>Legal disclosures</strong> — if compelled by valid legal
                process (subpoena, court order) or to protect rights, property, or
                safety.
              </li>
            </ul>

            <h2>Data retention</h2>
            <p>
              We retain your information for as long as needed to provide the service
              and to meet legal, tax, and accounting requirements. Maintenance ticket
              records are retained for at least seven years for warranty and capital
              expenditure history. Booking records are retained for at least seven
              years to satisfy California tax requirements. You may request earlier
              deletion subject to those obligations.
            </p>

            <h2>Your rights</h2>
            <p>
              Depending on where you live, you may have the right to access, correct,
              delete, or port your personal information, and to opt out of certain
              uses. To exercise any of these rights, email{' '}
              <a href={`mailto:${BRAND.contactEmail}`}>{BRAND.contactEmail}</a>. We
              will respond within thirty days. California residents have additional
              rights under the CCPA / CPRA, including the right to know what we
              collect and the right to delete; we do not sell personal information so
              the right-to-opt-out-of-sale does not apply.
            </p>

            <h2>Children</h2>
            <p>
              Our services are not directed to children under thirteen, and we do not
              knowingly collect information from them. If you believe a child has
              provided us information, contact us and we will delete it.
            </p>

            <h2>Security</h2>
            <p>
              We use industry-standard safeguards: encryption in transit (TLS),
              encryption at rest, scoped service-role access on our database, and
              least-privilege access to vendor data. No system is perfect; if we ever
              learn of a breach affecting your information, we will notify you in
              accordance with applicable law.
            </p>

            <h2>Changes to this policy</h2>
            <p>
              We may update this policy from time to time. Material changes will be
              announced on this page with a revised effective date. Continued use of
              the site after a change constitutes acceptance.
            </p>

            <h2>Contact</h2>
            <p>
              Privacy inquiries:{' '}
              <a href={`mailto:${BRAND.contactEmail}`}>{BRAND.contactEmail}</a>.
              Mailing address available on request.
            </p>
          </article>
        </Container>
      </main>
      <Footer />
    </>
  );
}
