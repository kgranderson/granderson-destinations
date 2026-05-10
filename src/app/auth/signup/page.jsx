import Link from 'next/link';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';

export const metadata = {
  title: 'Create account',
  description: 'Create a Granderson Destinations account.',
};

export default function SignupPage() {
  return (
    <>
      <NavBar />
      <main className="animate-page-in pt-32">
        <Container size="sm" className="pb-20">
          <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">Become a member</p>
          <h1 className="display mt-3 text-display-lg text-brand-ink">Create account</h1>
          <p className="mt-3 text-brand-slate">
            Membership ships in Milestone 2 with 48-hour early access to new properties and member-only rates.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/auth/login" className="text-sm text-brand-ink underline">
              Already have an account? Sign in
            </Link>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
