import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';

export const metadata = { title: 'Terms' };

export default function TermsPage() {
  return (
    <>
      <NavBar />
      <main className="animate-page-in pt-32">
        <Container size="md" className="pb-20 prose prose-neutral">
          <h1 className="display text-display-lg">Terms</h1>
          <p>Booking and stay terms land with the booking flow in M2.</p>
        </Container>
      </main>
      <Footer />
    </>
  );
}
