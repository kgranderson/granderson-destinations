import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';

export const metadata = { title: 'Privacy' };

export default function PrivacyPage() {
  return (
    <>
      <NavBar />
      <main className="animate-page-in bg-brand-cloud pt-32">
        <Container size="md" className="pb-20 prose prose-neutral">
          <h1 className="display text-display-lg">Privacy</h1>
          <p>Full privacy notice lands ahead of the production cutover. Until then: we don&rsquo;t sell your data, period.</p>
        </Container>
      </main>
      <Footer />
    </>
  );
}
