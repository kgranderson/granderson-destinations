import Link from 'next/link';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { BRAND } from '@/lib/constants';

export const metadata = {
  title: 'Terms of Service',
  description:
    'Granderson Destinations terms of service, including the SMS / text-message program terms required by US carriers.',
};

export default function TermsPage() {
  const effectiveDate = 'May 14, 2026';
  return (
    <>
      <NavBar />
      <main className="animate-page-in bg-brand-cloud pt-32">
        <Container size="md" className="pb-24">
          <p className="text-xs uppercase tracking-[0.32em] text-brand-ink/75 font-medium">
            Legal · Effective {effectiveDate}
          </p>
          <h1 className="display mt-3 text-display-lg text-brand-ink">Terms of Service</h1>
          <p className="mt-4 max-w-2xl text-brand-slate">
            These terms govern your use of the {BRAND.name} website and services,
            including bookings and our SMS / text-message notification program.
          </p>

          <article className="prose prose-neutral mt-12 max-w-3xl text-brand-ink">
            <h2>1. About us</h2>
            <p>
              {BRAND.name} is operated by Kwame J. Granderson, a sole proprietorship
              based in California. References below to &ldquo;we,&rdquo;
              &ldquo;us,&rdquo; or &ldquo;our&rdquo; mean {BRAND.name}.
            </p>

            <h2>2. Use of the site</h2>
            <p>
              You may use this site to browse properties, make a reservation request,
              submit a maintenance report during a stay, and read informational
              content. You agree not to misuse the site, interfere with its operation,
              or attempt to access data that is not yours.
            </p>

            <h2>3. Bookings and stays</h2>
            <p>
              Booking terms — including deposits, the cancellation window, change
              fees, house rules, and check-in procedures — are presented at the time
              of reservation and constitute the booking agreement between you and us.
              These terms supplement rather than replace that agreement.
            </p>

            <hr />

            <h2 id="sms-program-terms">4. SMS / text-message program terms</h2>
            <p className="not-prose rounded-md bg-brand-sand px-4 py-3 text-sm text-brand-ink/80">
              <strong>Program name:</strong> {BRAND.name} Maintenance Dispatch &amp;
              Status Updates
            </p>

            <h3>4.1 Program description</h3>
            <p>
              When you submit a maintenance report through our website, sign a vendor
              service agreement, or otherwise provide a mobile phone number to us for
              that purpose, you consent to receive transactional SMS messages from{' '}
              {BRAND.name} related to your maintenance request or vendor dispatch.
              Messages may include the property name, ticket category and severity, a
              status update, or a link to the task tracking page.
            </p>

            <h3>4.2 Message frequency</h3>
            <p>
              Frequency varies by ticket. Typical volume is one to five messages per
              ticket. We do not send marketing or promotional SMS through this
              program.
            </p>

            <h3>4.3 Message and data rates</h3>
            <p>
              <strong>Message and data rates may apply.</strong> Check with your
              wireless carrier for details. We do not charge separately for these
              messages.
            </p>

            <h3>4.4 How to opt out</h3>
            <p>
              You can opt out of SMS messages at any time by replying{' '}
              <strong>STOP</strong> to any message you receive from us. After replying
              STOP, you will receive a confirmation and no further messages will be
              sent. If you accidentally opt out and want to re-subscribe, reply{' '}
              <strong>START</strong> or submit a new maintenance request to opt back
              in.
            </p>

            <h3>4.5 How to get help</h3>
            <p>
              Reply <strong>HELP</strong> to any message for assistance, or email us
              at <a href={`mailto:${BRAND.contactEmail}`}>{BRAND.contactEmail}</a>.
              We respond within one business day.
            </p>

            <h3>4.6 Supported carriers</h3>
            <p>
              We send SMS through Twilio. Supported carriers include AT&amp;T,
              T-Mobile, Verizon, US Cellular, and most other U.S. wireless carriers.
              Carriers are not liable for delayed or undelivered messages.
            </p>

            <h3>4.7 Privacy</h3>
            <p>
              See our <Link href="/legal/privacy">Privacy Policy</Link> for details on
              what data we collect and how we use it. We do not sell your phone
              number. We share it only with our SMS provider (Twilio) and the matched
              vendor for ticket coordination.
            </p>

            <hr />

            <h2>5. Email notifications</h2>
            <p>
              The same opt-in that authorizes SMS also authorizes us to send
              transactional email notifications about your maintenance request or
              stay. You can opt out of email at any time by replying to any message
              with the word UNSUBSCRIBE or by emailing{' '}
              <a href={`mailto:${BRAND.contactEmail}`}>{BRAND.contactEmail}</a>.
            </p>

            <h2>6. Intellectual property</h2>
            <p>
              All site content — photography, copy, logos, designs — is the property
              of {BRAND.name} or our licensors. You may not reproduce, redistribute,
              or use it commercially without written permission.
            </p>

            <h2>7. Disclaimers</h2>
            <p>
              The site and services are provided &ldquo;as is.&rdquo; We do our best
              to keep information accurate, but we make no warranty that the site
              will be uninterrupted or error-free. We are not liable for indirect or
              consequential damages arising from your use of the site to the maximum
              extent permitted by law.
            </p>

            <h2>8. Governing law</h2>
            <p>
              These terms are governed by the laws of the State of California, USA,
              without regard to conflict-of-law principles. Any dispute will be
              resolved in the state or federal courts of California, and you and we
              consent to the personal jurisdiction of those courts.
            </p>

            <h2>9. Changes to these terms</h2>
            <p>
              We may update these terms from time to time. Material changes will be
              announced on this page with a revised effective date. Continued use of
              the site after a change constitutes acceptance.
            </p>

            <h2>10. Contact</h2>
            <p>
              Questions or feedback:{' '}
              <a href={`mailto:${BRAND.contactEmail}`}>{BRAND.contactEmail}</a>.
            </p>
          </article>
        </Container>
      </main>
      <Footer />
    </>
  );
}
